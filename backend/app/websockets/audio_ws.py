"""
Optimized Audio WebSocket with Speechmatics-only metrics calculation
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import asyncio
import json
import numpy as np
import time
import logging
from typing import Dict, Any, Optional
import concurrent.futures

# Import the improved transcriber and new metrics calculator
from app.services.speechmatics_transcriber import SpeechmaticsTranscriber
from app.services.audio_metrics_calculator import AudioMetricsCalculator
from app.services.vowelized_live import LiveVowelizer
from app.services import live_transcriber

router = APIRouter()
audio_ws_router = router

logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Optimized processor that uses Speechmatics for both transcription and metrics
    """
    
    def __init__(self, language: str = "ar", transcriber: str = "speechmatics"):
        self.language = language
        # "speechmatics" (streams words) or "asr" (the vowelized ASR hands over one sentence per pause,
        # through add_asr_transcript – see LIVE_TRANSCRIBER in app/services/live_transcriber.py)
        self.transcriber = transcriber
        self._asr_pending = []
        self._asr_text = ""
        
        print(f"🔧 Creating Audio Processor - language: {language}")
        
        # Initialize Speechmatics for transcription
        self.speechmatics = None
        
        # Initialize metrics calculator
        self.metrics_calculator = AudioMetricsCalculator(language=language)
        
        # Track session state
        self.session_start_time = time.time()
        self.audio_processed_duration = 0.0
        self.total_audio_samples = 0
        self.sample_rate = 16000
        
        # Metrics cache for periodic updates
        self.last_metrics_time = 0
        self.metrics_update_interval = 1.0  # Send metrics every second
        
        # Error tracking
        self.error_count = 0
        self.max_errors = 10
        
    async def initialize(self):
        """Initialize Speechmatics connection (nothing to connect when the vowelized ASR transcribes)"""
        if self.transcriber == "asr":
            self.metrics_calculator.reset()
            self.session_start_time = time.time()
            self.audio_processed_duration = 0.0
            self.total_audio_samples = 0
            self.error_count = 0
            print("✅ Audio Processor initialized – live transcript from the vowelized ASR (one sentence per pause)")
            return True
        try:
            print(f"🔧 Initializing Speechmatics for real-time transcription and metrics...")
            self.speechmatics = SpeechmaticsTranscriber()
            
            # Connect to Speechmatics
            connected = await self.speechmatics.connect(language=self.language)
            
            if not connected:
                print("❌ Speechmatics connection failed")
                return False
            
            print("✅ Speechmatics initialized successfully")
            
            # Reset metrics calculator
            self.metrics_calculator.reset()
            
            # Reset session tracking
            self.session_start_time = time.time()
            self.audio_processed_duration = 0.0
            self.total_audio_samples = 0
            self.error_count = 0
            
            print(f"✅ Audio Processor initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Initialization error: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def process_audio_chunk(self, audio_chunk: np.ndarray) -> Dict[str, Any]:
        """Process audio chunk through Speechmatics pipeline"""
        results = {
            'transcription': None,
            'metrics': None,
            'errors': []
        }
        
        # Update audio tracking
        chunk_duration = len(audio_chunk) / self.sample_rate
        self.audio_processed_duration += chunk_duration
        self.total_audio_samples += len(audio_chunk)
        
        # 1. Send to Speechmatics for transcription
        if self.speechmatics and self.speechmatics.is_connected:
            try:
                # Send audio
                send_success = await self.speechmatics.send_audio(audio_chunk)
                if not send_success:
                    results['errors'].append("Failed to send audio to Speechmatics")
                    self.error_count += 1
                
            except Exception as e:
                error_msg = f"Speechmatics audio send error: {str(e)}"
                results['errors'].append(error_msg)
                print(f"⚠️ {error_msg}")
                self.error_count += 1
        
        # 2. Check for transcriptions
        transcription_result = await self._get_speechmatics_transcription()
        if transcription_result:
            results['transcription'] = transcription_result
            
            # Process transcription for metrics (updates internal calculator state)
            metrics = await self._process_transcription_for_metrics(transcription_result)
            if metrics:
                results['metrics'] = metrics
                self.last_metrics_time = time.time()
        
        # 3. Check if we should send periodic metrics (even without new transcription)
        # FIX: We now regenerate metrics instead of sending stale 'last_metrics'
        current_time = time.time()
        if current_time - self.last_metrics_time > self.metrics_update_interval:
            fresh_metrics = self._get_fresh_metrics_snapshot()
            if fresh_metrics:
                results['metrics'] = fresh_metrics
                self.last_metrics_time = current_time
        
        # 4. Check error threshold
        if self.error_count >= self.max_errors:
            results['errors'].append(f"Too many errors ({self.error_count}), consider reconnecting")
        
        if results['metrics']:
            # Only log occasionally to reduce noise
            if int(current_time) % 5 == 0 and transcription_result: 
                print(f"📊 DEBUG: Sending metrics - "
                    f"WPM: {results['metrics'].get('wpm', 0):.1f}, "
                    f"Words: {results['metrics'].get('total_words', 0)}")
        
        return results

    @property
    def service_name(self) -> str:
        return "vowelized_asr" if self.transcriber == "asr" else "speechmatics"

    def _get_fresh_metrics_snapshot(self) -> Dict[str, Any]:
        """
        Generates a fresh snapshot of current metrics for real-time display.
        Uses rolling window WPM.
        """
        try:
            # 1. Get recalculated metrics from calculator (rolling WPM)
            metrics = self.metrics_calculator.get_current_metrics()  # ← ROLLING WPM
            
            # 2. Augment with session-level data
            metrics['session_duration'] = self.audio_processed_duration
            metrics['error_count'] = self.error_count
            metrics['transcription_service'] = self.service_name
            metrics['is_partial'] = False
            
            return metrics
        except Exception as e:
            print(f"⚠️ Error generating fresh metrics snapshot: {e}")
            return {}

    def add_asr_transcript(self, text: str, start: float, end: float) -> None:
        """One sentence from the vowelized ASR (LIVE_TRANSCRIBER=asr); delivered like a Speechmatics final."""
        text = (text or "").strip()
        if not text:
            return
        self._asr_text = f"{self._asr_text} {text}".strip()
        self._asr_pending.append({
            'text': self._asr_text,
            'segment_text': text,
            'segment_start_time': start,
            'segment_end_time': end,
            'is_final': True,
            'is_partial': False,
            'segment_duration': max(0.0, end - start),
            'word_count': len(text.split()),
        })

    async def _get_speechmatics_transcription(self) -> Optional[Dict[str, Any]]:
        """Get latest transcription from Speechmatics with timestamps (or the next ASR sentence)"""
        if self.transcriber == "asr":
            return self._asr_pending.pop(0) if self._asr_pending else None
        if not self.speechmatics or not self.speechmatics.is_connected:
            return None
        
        try:
            transcription = await self.speechmatics.get_latest_transcription_with_timestamps(timeout=0.05)
            
            if transcription and transcription.get('text') and transcription.get('text').strip():
                return {
                    'text': transcription['text'],
                    'segment_text': transcription.get('segment_text', ''),
                    'segment_start_time': transcription.get('segment_start_time', 0.0),
                    'segment_end_time': transcription.get('segment_end_time', 0.0),
                    'is_final': transcription.get('chunk_metrics', {}).get('is_final', True),
                    'is_partial': transcription.get('chunk_metrics', {}).get('is_partial', False),
                    'segment_duration': transcription.get('chunk_metrics', {}).get('segment_duration', 0.0),
                    'word_count': transcription.get('chunk_metrics', {}).get('word_count', 0)
                }
            
        except Exception as e:
            print(f"⚠️ Error getting Speechmatics transcription: {e}")
            self.error_count += 1
        
        return None
    
    async def _process_transcription_for_metrics(self, transcription: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process transcription to calculate metrics"""
        try:
            # Extract transcription data
            text = transcription.get('segment_text', transcription.get('text', ''))
            start_time = transcription.get('segment_start_time', 0.0)
            end_time = transcription.get('segment_end_time', 0.0)
            is_final = transcription.get('is_final', True)
            
            if not text or not text.strip():
                return None
            
            # Process through metrics calculator
            metrics = self.metrics_calculator.process_transcript(
                text=text,
                start_time=start_time,
                end_time=end_time,
                is_final=is_final
            )
            
            # Add additional session info
            metrics['session_duration'] = self.audio_processed_duration
            metrics['error_count'] = self.error_count
            metrics['transcription_service'] = self.service_name
            
            # Add segment-specific info if available
            if not is_final:
                metrics['is_partial'] = True
                metrics['confidence'] = 0.7  # Lower confidence for partials
            
            return metrics
            
        except Exception as e:
            print(f"⚠️ Error processing transcription for metrics: {e}")
            self.error_count += 1
            return None
    
    async def check_pending_transcriptions(self) -> Optional[Dict[str, Any]]:
        """Check for pending transcriptions without sending audio"""
        if self.transcriber != "asr" and (not self.speechmatics or not self.speechmatics.is_connected):
            return None
        
        try:
            transcription = await self._get_speechmatics_transcription()
            if transcription:
                # Process for metrics
                metrics = await self._process_transcription_for_metrics(transcription)
                return {
                    'transcription': transcription,
                    'metrics': metrics
                }
        except Exception as e:
            print(f"⚠️ Error checking pending transcriptions: {e}")
        
        return None
    
    async def get_final_summary(self) -> Dict[str, Any]:
        """Get final session summary with overall metrics"""
        try:
            # Get comprehensive session summary from metrics calculator
            session_summary = self.metrics_calculator.get_session_summary()
            
            if not session_summary:
                print("⚠️ Empty session summary returned")
                session_summary = {}
            
            # Add audio processing stats with safe defaults
            summary = {
                **session_summary,  # Spread session summary first
                'audio_processed_duration': self.audio_processed_duration,
                'total_audio_samples': self.total_audio_samples,
                'sample_rate': self.sample_rate,
                'error_count': self.error_count,
                'session_start_time': self.session_start_time,
                'session_end_time': time.time(),
                'total_session_duration': time.time() - self.session_start_time,
                'language': self.language,
                'transcription_service': self.service_name
            }
            
            # Calculate additional metrics with safe access
            try:
                # Get speaking duration with fallback
                speaking_duration = summary.get('speaking_duration', 
                                            session_summary.get('speaking_duration', 0))
                
                # Calculate speaking percentage if we have audio duration
                if speaking_duration > 0 and self.audio_processed_duration > 0:
                    summary['speaking_percentage'] = (speaking_duration / 
                                                    self.audio_processed_duration) * 100
                else:
                    summary['speaking_percentage'] = 0
                
                # Average segment length
                segment_count = summary.get('segment_count', 0)
                if segment_count > 0:
                    summary['avg_segment_duration'] = speaking_duration / segment_count
                    total_words = summary.get('total_words', 0)
                    summary['avg_segment_words'] = total_words / segment_count
                else:
                    summary['avg_segment_duration'] = 0
                    summary['avg_segment_words'] = 0
                    
            except (ZeroDivisionError, KeyError) as e:
                print(f"⚠️ Error in summary calculations: {e}")
                summary['speaking_percentage'] = 0
                summary['avg_segment_duration'] = 0
                summary['avg_segment_words'] = 0
            
            # Add WPM label for categorization with fallback
            wpm = summary.get('overall_wpm', summary.get('wpm', 0))
            if wpm < 80:
                summary['wpm_category'] = 'slow'
            elif wpm < 120:
                summary['wpm_category'] = 'good'
            elif wpm < 180:
                summary['wpm_category'] = 'fast'
            else:
                summary['wpm_category'] = 'very_fast'
            
            # Add filler word categorization with fallback
            filler_ratio = summary.get('filler_ratio', 0)
            if filler_ratio > 0.1:  # >10% filler words
                summary['filler_category'] = 'high'
            elif filler_ratio > 0.05:  # >5% filler words
                summary['filler_category'] = 'moderate'
            else:
                summary['filler_category'] = 'low'
            
            # Ensure required fields exist
            required_fields = ['total_words', 'total_fillers', 'vocab_diversity', 
                            'sentiment', 'sentiment_score', 'language']
            for field in required_fields:
                if field not in summary:
                    summary[field] = session_summary.get(field, 0 if 'score' in field or 'diversity' in field else '')
            
            print(f"✅ Generated final summary with {summary.get('total_words', 0)} words, "
                f"{summary.get('overall_wpm', summary.get('wpm', 0)):.1f} WPM, "
                f"{summary.get('total_fillers', 0)} fillers")
            
            return summary
            
        except Exception as e:
            print(f"❌ Error getting final summary: {e}")
            import traceback
            traceback.print_exc()
            
            # Return minimal summary on error
            return {
                'total_words': getattr(self.metrics_calculator, 'total_words', 0),
                'total_fillers': getattr(self.metrics_calculator, 'total_fillers', 0),
                'overall_wpm': 0,
                'wpm': 0,
                'speaking_duration': self.audio_processed_duration,
                'vocab_diversity': 0,
                'sentiment': 'neutral',
                'sentiment_score': 0,
                'error': str(e),
                'language': self.language,
                'transcription_service': 'speechmatics',
                'session_duration': time.time() - self.session_start_time
            }
    
    async def cleanup(self):
        """Cleanup resources"""
        print("🧹 Cleaning up Audio Processor...")
        
        if self.speechmatics:
            await self.speechmatics.close()
        
        print("✅ Cleanup complete")

@router.websocket("/ws/audio")
async def audio_websocket(
    websocket: WebSocket,
    language: str = Query(default="ar", regex="^(ar|en)$"),
    topic: str = Query(default="lecture", regex="^[a-z_]{1,40}$")  # any guidance-config topic (lecture, khutba, speaking sectors)
):
    """
    Optimized audio WebSocket endpoint
    Uses Speechmatics for both transcription and metrics
    """
    print(f"🎯 Audio WebSocket - language: {language}, topic: {topic}")
    
    await websocket.accept()
    
    processor = None
    # Live vowel check (Tashkeel ASR per spoken sentence) – only when ASR_BASE_URL is set.
    # Its messages wait in an outbox that this loop sends, so the socket is written from one task only.
    outbox = []

    async def _queue_message(msg):
        outbox.append(msg)

    async def flush_outbox():
        while outbox:
            await websocket.send_json(outbox.pop(0))

    vowelizer = LiveVowelizer(_queue_message, language=language)

    def note_speechmatics(transcription):
        if transcription and transcription.get('is_final') and transcription.get('segment_text'):
            vowelizer.add_speechmatics_final(transcription['segment_text'],
                                             transcription.get('segment_start_time', 0.0),
                                             transcription.get('segment_end_time', 0.0))
    
    try:
        # Which engine writes the live transcript (LIVE_TRANSCRIBER: auto | speechmatics | asr)
        engine, problem = live_transcriber.choose(language)
        if engine is None:
            print(f"❌ No live transcriber: {problem}")
            await websocket.send_json({'status': 'error', 'error': problem})
            await websocket.close()
            return

        processor = AudioProcessor(language=language, transcriber=engine)
        if engine == "asr":
            # the vowelized ASR hands each sentence to the processor (transcript + speaking metrics)
            vowelizer.set_primary(processor.add_asr_transcript)
        
        # Initialize
        initialized = await processor.initialize()
        if not initialized:
            await websocket.send_json({
                'status': 'error',
                'error': 'Failed to initialize Speechmatics processor (check SPEECHMATICS_API_KEY and the backend log)'
            })
            await websocket.close()
            return
        
        # Send connection confirmation
        await websocket.send_json({
            'status': 'connected',
            'message': ('Live transcript from the vowelized ASR – one sentence after each pause' if engine == "asr"
                        else 'Speechmatics audio processing ready'),
            'language': language,
            'service': processor.service_name,
            'transcriber': engine,
            'topic': topic,
            'speechmatics_available': engine == "speechmatics",
            'vowel_check': vowelizer.enabled
        })
        vowelizer.start()
        
        # Track last metrics time for periodic updates
        last_metrics_time = time.time()
        metrics_interval = 1.0  # Send metrics every second
        
        # Track last transcription for duplicate prevention
        last_transcription_text = ""
        
        # Main processing loop
        while True:
            try:
                # Receive message with timeout
                message = await asyncio.wait_for(
                    websocket.receive(),
                    timeout=1.0
                )
                
                if "bytes" in message:
                    # Process audio data
                    data = message["bytes"]
                    
                    if len(data) % 4 == 0:
                        audio_chunk = np.frombuffer(data, dtype=np.float32)
                        vowelizer.feed(audio_chunk)
                        
                        # Process through processor
                        results = await processor.process_audio_chunk(audio_chunk)
                        note_speechmatics(results['transcription'])
                        
                        # Send transcription if available and not duplicate
                        if (results['transcription'] and 
                            results['transcription']['text'] != last_transcription_text):
                            
                            transcription = results['transcription']
                            last_transcription_text = transcription['text']
                            
                            await websocket.send_json({
                                'status': 'transcription',
                                'transcription': transcription['text'],
                                'segment_text': transcription.get('segment_text', ''),
                                'is_final': transcription.get('is_final', True),
                                'is_partial': transcription.get('is_partial', False),
                                'service': processor.service_name,
                                'segment_start': transcription.get('segment_start_time', 0.0),
                                'segment_end': transcription.get('segment_end_time', 0.0)
                            })
                        
                        # Send metrics if available
                        if results['metrics']:
                            await websocket.send_json({
                                'status': 'metrics',
                                'metrics': results['metrics'],
                                'timestamp': time.time()
                            })
                            last_metrics_time = time.time()
                        
                        # Send errors if any
                        if results['errors']:
                            for error in results['errors']:
                                await websocket.send_json({
                                    'status': 'warning',
                                    'warning': error,
                                    'timestamp': time.time()
                                })
                
                    await flush_outbox()
                
                elif "text" in message:
                    # Handle control messages
                    try:
                        data = json.loads(message["text"])
                        if data.get("action") == "stop":
                            print("🛑 Stop requested by client")
                            break
                        if data.get("action") == "script":
                            # optional prepared text: each spoken sentence is checked against it
                            await websocket.send_json(vowelizer.set_script(str(data.get("text") or "")[:20000]))
                    except json.JSONDecodeError:
                        pass
                        
            except asyncio.TimeoutError:
                # No data received, check for pending transcriptions
                pending = await processor.check_pending_transcriptions()
                if pending:
                    transcription = pending['transcription']
                    note_speechmatics(transcription)
                    
                    # Send if not duplicate
                    if transcription['text'] != last_transcription_text:
                        last_transcription_text = transcription['text']
                        
                        await websocket.send_json({
                            'status': 'transcription',
                            'transcription': transcription['text'],
                            'segment_text': transcription.get('segment_text', ''),
                            'is_final': transcription.get('is_final', True),
                            'is_partial': transcription.get('is_partial', False),
                            'service': processor.service_name,
                            'segment_start': transcription.get('segment_start_time', 0.0),
                            'segment_end': transcription.get('segment_end_time', 0.0)
                        })
                    
                    # Send metrics if available
                    if pending['metrics']:
                        await websocket.send_json({
                            'status': 'metrics',
                            'metrics': pending['metrics'],
                            'timestamp': time.time()
                        })
                        last_metrics_time = time.time()
                
                # Send periodic metrics if needed
                # FIX: Use _get_fresh_metrics_snapshot() to ensure WPM decay happens
                elif time.time() - last_metrics_time > metrics_interval:
                    fresh_metrics = processor._get_fresh_metrics_snapshot()
                    if fresh_metrics:
                        await websocket.send_json({
                            'status': 'metrics',
                            'metrics': fresh_metrics,
                            'timestamp': time.time()
                        })
                        last_metrics_time = time.time()
                
                await flush_outbox()
                continue
                
    except WebSocketDisconnect:
        print("Client disconnected from audio WebSocket")
    except Exception as e:
        print(f"❌ Error in audio WebSocket: {e}")
        import traceback
        traceback.print_exc()
        
        try:
            await websocket.send_json({
                'status': 'error',
                'error': str(e)
            })
        except:
            pass
    finally:
        # Cleanup
        print("🧹 Cleaning up audio WebSocket...")
        
        if processor:
            # Finish the live vowel check (last sentence + pending reviews), then send its results
            try:
                await vowelizer.close(timeout=15.0 if not vowelizer.primary else 30.0)
                await flush_outbox()
            except Exception as e:
                print(f"⚠️ Live vowel check did not finish cleanly: {e}")
            # With the vowelized ASR as transcriber the last sentences arrive after "stop": count them
            # in the metrics and send them, so the transcript and the summary are complete
            try:
                while processor.transcriber == "asr":
                    pending = await processor.check_pending_transcriptions()
                    if not pending:
                        break
                    t = pending['transcription']
                    await websocket.send_json({
                        'status': 'transcription', 'transcription': t['text'], 'segment_text': t['segment_text'],
                        'is_final': True, 'is_partial': False, 'service': processor.service_name,
                        'segment_start': t['segment_start_time'], 'segment_end': t['segment_end_time'],
                    })
                    if pending['metrics']:
                        await websocket.send_json({'status': 'metrics', 'metrics': pending['metrics'],
                                                   'timestamp': time.time()})
            except Exception as e:
                print(f"⚠️ Could not send the last sentences: {e}")
            # Get final summary
            try:
                summary = await processor.get_final_summary()
                if summary and vowelizer.enabled:
                    summary['vowel_analysis'] = vowelizer.summary()
                if summary:
                    await websocket.send_json({
                        'status': 'session_complete',
                        'summary': summary
                    })
            except Exception as e:
                print(f"❌ Error sending final summary: {e}")
            
            # Cleanup processor
            await processor.cleanup()
        
        print("✅ Audio WebSocket cleanup complete")
        
        try:
            await websocket.close()
        except:
            pass
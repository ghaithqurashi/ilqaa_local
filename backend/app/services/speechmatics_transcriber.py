"""
Improved Speechmatics Transcriber with proper merging logic and timestamp extraction
"""
import os
import asyncio
import aiohttp
import json
import numpy as np
import logging
from typing import Dict, Any, Optional, List, Tuple
import time

logger = logging.getLogger(__name__)

def merge_text(base_text: str, new_text: str) -> str:
    """
    Smartly merges new_text into base_text by checking for overlaps.
    Example: Base="Hello World", New="World Today" -> "Hello World Today"
    """
    if not base_text:
        return new_text
    if not new_text:
        return base_text
        
    # Normalize for comparison (ignore punctuation differences for overlap check)
    base_words = base_text.split()
    new_words = new_text.split()

    # Look for overlap in the last 5 words (optimization)
    max_overlap_check = min(len(base_words), len(new_words), 8)

    best_overlap = 0

    # Check overlaps from largest to smallest
    for i in range(max_overlap_check, 0, -1):
        # Get suffix of base and prefix of new
        base_suffix = base_words[-i:]
        new_prefix = new_words[:i]
        
        # Simple word-by-word comparison
        # We strip punctuation for the comparison to handle "Word" vs "Word."
        match = True
        for b, n in zip(base_suffix, new_prefix):
            if b.strip('.,;:!?') != n.strip('.,;:!?'):
                match = False
                break
        
        if match:
            best_overlap = i
            break
                
    # If overlap found, return base + unique part of new
    if best_overlap > 0:
        # Reconstruct the non-overlapping part of new_text
        # We use the original new_words to preserve punctuation of the new text
        unique_new = " ".join(new_words[best_overlap:])
        if unique_new:
            return f"{base_text} {unique_new}"
        else:
            return base_text # New text is completely contained in base
                
    # No overlap, simple append
    return f"{base_text} {new_text}"


class SpeechmaticsTranscriber:
    """
    Speechmatics transcriber with proper merging for partial/final transcriptions
    """
    
    def __init__(self):
        self.api_key = os.getenv('SPEECHMATICS_API_KEY')
        if not self.api_key:
            raise ValueError("SPEECHMATICS_API_KEY not set")
        
        self.ws_url = "wss://eu2.rt.speechmatics.com/v2"
        self.session = None
        self.ws = None
        self.language = 'en'
        self.is_connected = False
        
        # State for merging (same as original)
        self.finalized_text = ""  # Committed final text
        self.current_partial = ""  # Current partial (unstable) text
        self.last_sent_text = ""   # Last text we sent to client
        
        # Timestamp tracking
        self.segment_start_time = 0.0
        self.segment_end_time = 0.0
        self.last_timestamp = 0.0
        
        # Queue for incoming messages
        self.message_queue = asyncio.Queue()
        self.processing_task = None
        
    async def connect(self, language: str = 'en'):
        """Connect to Speechmatics"""
        try:
            self.language = language
            self.session = aiohttp.ClientSession()
            
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            
            print(f"🔗 Connecting to Speechmatics ({language})...")
            self.ws = await self.session.ws_connect(
                self.ws_url,
                headers=headers,
                heartbeat=30,
                receive_timeout=30
            )
            
            # Send configuration
            config = {
                "message": "StartRecognition",
                "transcription_config": {
                    "language": self.language,
                    "operating_point": "enhanced",
                    "enable_partials": True,
                    "max_delay": 2
                },
                "audio_format": {
                    "type": "raw",
                    "encoding": "pcm_f32le",
                    "sample_rate": 16000
                }
            }
            
            await self.ws.send_str(json.dumps(config))
            self.is_connected = True
            
            # Start message processing task
            self.processing_task = asyncio.create_task(self._process_messages())
            
            print("✅ Connected to Speechmatics")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to Speechmatics: {e}")
            self.is_connected = False
            return False

    async def _process_messages(self):
        """Process incoming WebSocket messages"""
        try:
            async for msg in self.ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    await self.message_queue.put(data)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print(f"❌ Speechmatics error: {msg.data}")
                    self.is_connected = False
                    break
                elif msg.type == aiohttp.WSMsgType.CLOSED:
                    print("🔌 Speechmatics connection closed")
                    self.is_connected = False
                    break
                    
        except asyncio.CancelledError:
            print("📨 Message processing cancelled")
        except Exception as e:
            print(f"❌ Error processing messages: {e}")
            self.is_connected = False

    async def send_audio(self, audio_data: np.ndarray):
        """Send audio to Speechmatics"""
        if not self.is_connected or not self.ws:
            return False
        
        try:
            # Convert to bytes and send
            audio_bytes = audio_data.astype(np.float32).tobytes()
            await self.ws.send_bytes(audio_bytes)
            return True
        except Exception as e:
            print(f"❌ Error sending audio: {e}")
            return False

    async def get_latest_transcription_with_timestamps(self, timeout: float = 0.1) -> Optional[Dict]:
        """
        Get latest transcription with proper merging and timestamps
        Returns dict with text, timestamps, and is_final flag
        """
        if not self.is_connected:
            return None
        
        # Track what happened in this batch
        batch_final_segments = [] # List to collect all finals in this batch
        batch_partial_text = ""   # To hold the latest partial
        
        latest_start_time = 0.0
        latest_end_time = 0.0
        
        # Process all available messages
        while True:
            try:
                # Get message without blocking for too long
                data = await asyncio.wait_for(
                    self.message_queue.get(),
                    timeout=0.01  # Short timeout to avoid blocking
                )
                
                message_type = data.get('message')
                
                if message_type == 'AddTranscript':
                    # Final transcription - merge with finalized text
                    metadata = data.get('metadata', {})
                    transcript = metadata.get('transcript', '').strip()
                    start_time = metadata.get('start_time', 0.0)
                    end_time = metadata.get('end_time', 0.0)
                    
                    if transcript:
                        self.finalized_text = merge_text(self.finalized_text, transcript)
                        self.current_partial = ""  # Clear partial when we get final
                        
                        # Accumulate this final segment for the metrics calculator
                        batch_final_segments.append(transcript)
                        
                        # Update timestamps
                        latest_start_time = start_time
                        latest_end_time = end_time
                        self.last_timestamp = end_time
                        
                        print(f"🎯 Final [{start_time:.2f}-{end_time:.2f}s]: {transcript}")
                    
                elif message_type == 'AddPartialTranscript':
                    # Partial transcription - update current partial
                    metadata = data.get('metadata', {})
                    transcript = metadata.get('transcript', '').strip()
                    start_time = metadata.get('start_time', 0.0)
                    end_time = metadata.get('end_time', 0.0)
                    
                    if transcript:
                        self.current_partial = transcript
                        batch_partial_text = transcript
                        
                        # Update timestamps
                        latest_start_time = start_time
                        latest_end_time = end_time
                        self.last_timestamp = end_time
                        
                        print(f"📝 Partial [{start_time:.2f}-{end_time:.2f}s]: {transcript}")
                    
                elif message_type == 'AudioAdded':
                    # Audio was added, we can use this to track time
                    audio_time = data.get('audio_time', 0.0)
                    self.last_timestamp = audio_time
                    
            except asyncio.TimeoutError:
                break  # No more messages
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"❌ Error processing message: {e}")
                break
        
        # Build display text by merging finalized and partial
        display_text = self.finalized_text
        if self.current_partial:
            display_text = merge_text(self.finalized_text, self.current_partial)
        
        # Clean up whitespace
        display_text = ' '.join(display_text.split())
        
        # DECISION LOGIC: What to return to the calculator?
        # If we have ANY finals in this batch, return them combined.
        # This prevents Partial text from overwriting Final text in the return value,
        # which causes double-counting in the calculator.
        
        segment_text_to_return = ""
        is_final_flag = False
        
        if batch_final_segments:
            # We have new committed text. Return ONLY this so calculator adds it exactly once.
            segment_text_to_return = " ".join(batch_final_segments)
            is_final_flag = True
        elif batch_partial_text:
            # We only have unstable text.
            segment_text_to_return = batch_partial_text
            is_final_flag = False
            
        # Only return if we have something new to report
        if segment_text_to_return or (display_text != self.last_sent_text):
            self.last_sent_text = display_text
            word_count = len(display_text.split())
            
            return {
                'text': display_text,           # Full text for UI
                'segment_text': segment_text_to_return, # Specific chunk for Metrics
                'segment_start_time': latest_start_time,
                'segment_end_time': latest_end_time,
                'confidence': 0.8,
                'language': self.language,
                'error': None,
                'is_streaming': True,
                'transcription_service': 'speechmatics',
                'chunk_metrics': {
                    'word_count': word_count,
                    'is_final': is_final_flag,
                    'is_partial': not is_final_flag and bool(self.current_partial),
                    'segment_duration': max(0, latest_end_time - latest_start_time)
                }
            }
        else:
            # Text hasn't changed, return empty
            return None

    async def close(self):
        """Close connection"""
        print("🔌 Closing Speechmatics connection...")
        
        # Cancel processing task
        if self.processing_task:
            self.processing_task.cancel()
            try:
                await self.processing_task
            except asyncio.CancelledError:
                pass
        
        # Close WebSocket
        if self.ws:
            await self.ws.close()
        
        # Close session
        if self.session:
            await self.session.close()
        
        self.is_connected = False
        print("✅ Speechmatics connection closed")

    def get_accumulated_text(self) -> str:
        return self.finalized_text
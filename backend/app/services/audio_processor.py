from typing import List, Dict, Optional
import numpy as np
import threading
import time
from collections import deque
from textblob import TextBlob
import librosa
import warnings

warnings.filterwarnings('ignore')

class AudioProcessor:
    """
    Audio Processor with Transcription Service Support
    """

    def __init__(self, model_size: str = 'tiny', sample_rate: int = 16000):
        self.model_size = model_size
        self.sample_rate = sample_rate
        
        # Transcription service
        self.transcription_service = 'speechmatics'  # Default service
        
        # ✅ KEEP original data structures from your working version
        self.cumulative_text = ""
        self.cumulative_segments = []
        self.cumulative_audio = np.empty((0,), dtype='float32')
        self.session_start_time = None
        self.total_session_duration = 0.0
        self.detected_language = None

        # Live metrics - KEEP original structure
        self.live_word_count = 0
        self.live_unique_words = set()
        self.live_filler_count = 0
        self.live_pause_count = 0
        self.sentiment_scores = deque(maxlen=10)
        self.chunk_timestamps = deque()
        self.chunk_word_counts = deque()
        self.all_transcriptions_text = []
        
        # Filler words - KEEP original
        self.filler_words_english = [
            "um", "uh", "like", "you know", "so", "actually", "basically",
            "literally", "right", "okay", "well", "i mean", "sort of", "kind of"
        ]
        self.filler_words_arabic = [
            "يعني", "اه", "اممم", "مثلا", "طيب", "تمام", "شوف", "بص",
            "والله", "يعني هو", "كده", "هيك", "مش عارف", "خلينا نقول",
            "كيف يعني", "فاهم", "أوكي"
        ]
        self.filler_word_counts = {}
        
        # Analysis parameters - KEEP original
        self.pause_threshold = 1.0
        self.long_pause_threshold = 3.0

    def start_session(self, language: str = None, transcription_service: str = 'speechmatics'):
        """Start audio session with specified transcription service"""
        print(f"🎤 Starting audio session - Language: {language}, Service: {transcription_service}")
        
        # Store service preference
        self.transcription_service = transcription_service
        
        # Initialize transcription service
        if not self.transcription_manager.initialize(transcription_service, language):
            print(f"❌ Failed to initialize {transcription_service}")
            return
        
        # ✅ ONLY reset session-specific data
        self.session_start_time = time.time()
        self.cumulative_text = ""
        self.cumulative_segments = []
        self.cumulative_audio = np.empty((0,), dtype='float32')
        self.detected_language = language
        self.live_word_count = 0
        self.live_unique_words = set()
        self.live_filler_count = 0
        self.live_pause_count = 0
        self.sentiment_scores.clear()
        self.chunk_timestamps.clear()
        self.chunk_word_counts.clear()
        self.all_transcriptions_text = []
        self.filler_word_counts = {}
        self.total_session_duration = 0.0
        
        print(f"✅ Session started with {self.transcription_manager.get_current_service_name()}")

    def analyze_audio_chunk(self, audio_chunk: np.ndarray) -> Dict:
        """
        Analyze audio chunk using transcription service
        """
        # Convert to mono if needed (simple preprocessing)
        if len(audio_chunk.shape) > 1 and audio_chunk.shape[1] > 1:
            audio_chunk = audio_chunk.mean(axis=1)
        else:
            audio_chunk = audio_chunk.flatten()
        
        audio_chunk = audio_chunk.astype(np.float32)
        
        # Update session duration
        chunk_duration = len(audio_chunk) / self.sample_rate
        self.total_session_duration += chunk_duration
        
        # Analyze pauses (KEEP original)
        pauses_in_this_chunk = self._analyze_pauses_vad(audio_chunk)
        self.live_pause_count += pauses_in_this_chunk

        try:
            # Use transcription service
            start_time = time.time()
            transcription_result = self.transcription_manager.transcribe_audio_chunk(
                audio_chunk, self.sample_rate
            )
            processing_time = time.time() - start_time
            
            text = transcription_result.get('text', '').strip()
            transcription_error = transcription_result.get('error')
            
            # ✅ IMPROVED: Handle streaming initialization delays more patiently
            if transcription_error:
                error_lower = transcription_error.lower()
                if any(keyword in error_lower for keyword in ['initializing', 'waiting', 'not ready', 'session initializing']):
                    # Don't log these as errors, just skip the chunk
                    return None
                elif 'failed' in error_lower or 'error' in error_lower:
                    print(f"❌ Transcription error: {transcription_error}")
                else:
                    # Other initialization messages
                    print(f"⏳ {transcription_error}")
                    return None
            
            # Log processing time and result
            if text:
                print(f"⏱️  Processing took {processing_time:.1f}s - Text: '{text}'")
            else:
                print(f"⏱️  Processing took {processing_time:.1f}s - No text")
            
            # Update cumulative data
            current_duration_offset = self.total_session_duration - chunk_duration
            self.cumulative_audio = np.concatenate((self.cumulative_audio, audio_chunk.astype(np.float32)))
            self.cumulative_text += " " + text
            
            # For segments, we'll create simple segments since we don't have detailed timing from services
            if text:
                segment = {
                    'start': current_duration_offset,
                    'end': current_duration_offset + chunk_duration,
                    'text': text
                }
                self.cumulative_segments.append(segment)

            if not text:
                return None

            # Update metrics (ORIGINAL LOGIC - unchanged)
            words = text.split()
            word_count = len(words)
            self.live_word_count += word_count
            self.live_unique_words.update(words)
            self.all_transcriptions_text.append(text)
            
            # Filler word analysis
            filler_analysis = self.analyze_filler_words_chunk(text)
            filler_count = filler_analysis['total']
            self.live_filler_count += filler_count
            
            # Sentiment analysis
            sentiment = self.analyze_sentiment_chunk(text)
            self.sentiment_scores.append(sentiment['polarity'])
            
            # WPM calculation
            current_time = time.time()
            self.chunk_timestamps.append(current_time)
            self.chunk_word_counts.append(word_count)
            
            wpm = self.calculate_wpm_rolling()
            
            # Additional metrics
            speaking_ratio = self.estimate_speaking_ratio(text)
            vocab_diversity = self.calculate_vocabulary_diversity()
            
            return {
                'text': text,
                'word_count': word_count,
                'filler_count': filler_count,
                'sentiment': sentiment,
                'wpm': wpm,
                'speaking_ratio': speaking_ratio,
                'vocab_diversity': vocab_diversity,
                'total_words': self.live_word_count,
                'total_fillers': self.live_filler_count,
                'unique_words': len(self.live_unique_words),
                'total_pauses': self.live_pause_count,
                'chunk_pauses': pauses_in_this_chunk,
                'cumulative_breakdown': filler_analysis['cumulative_breakdown'],
                'transcription_service': self.transcription_manager.get_current_service_name()
            }
            
        except Exception as e:
            print(f"❌ Audio processing error: {e}")
            import traceback
            traceback.print_exc()
            return {'error': str(e)}

    # ========== ORIGINAL METHODS - NO CHANGES ==========
    
    def _analyze_pauses_vad(self, audio_chunk: np.ndarray) -> int:
        """ORIGINAL VAD analysis"""
        try:
            if audio_chunk is None or len(audio_chunk) == 0:
                return 0
            
            chunk_duration_s = len(audio_chunk) / self.sample_rate
            
            non_silent = librosa.effects.split(
                audio_chunk,
                top_db=40,
                frame_length=2048,
                hop_length=512
            )
            
            if len(non_silent) == 0:
                pause_duration = chunk_duration_s
                return 1 if pause_duration >= self.pause_threshold else 0
            
            pauses_found = 0
            
            first_start_s = non_silent[0][0] / self.sample_rate
            if first_start_s >= self.pause_threshold:
                pauses_found += 1
            
            for i in range(1, len(non_silent)):
                prev_end_s = non_silent[i-1][1] / self.sample_rate
                curr_start_s = non_silent[i][0] / self.sample_rate
                gap = curr_start_s - prev_end_s
                if gap >= self.pause_threshold:
                    pauses_found += 1
            
            last_end_s = non_silent[-1][1] / self.sample_rate
            tail_gap = chunk_duration_s - last_end_s
            if tail_gap >= self.pause_threshold:
                pauses_found += 1
            
            return pauses_found
            
        except Exception as e:
            print(f"⚠ VAD pause detection error: {e}")
            return 0

    def analyze_filler_words_chunk(self, text: str) -> Dict:
        """ORIGINAL filler word analysis"""
        text_lower = text.lower()
        total_count = 0
        chunk_counts = {}
        
        for word in self.filler_words_english:
            count = text_lower.count(word.lower())
            if count > 0:
                chunk_counts[word] = count
                total_count += count
        
        for word in self.filler_words_arabic:
            count = text_lower.count(word)
            if count > 0:
                chunk_counts[word] = count
                total_count += count
        
        for word, count in chunk_counts.items():
            self.filler_word_counts[word] = self.filler_word_counts.get(word, 0) + count
        
        sorted_fillers = sorted(
            self.filler_word_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:8]
        
        top_fillers_dict = dict(sorted_fillers)
        
        return {
            'total': total_count,
            'breakdown': chunk_counts,
            'cumulative_breakdown': top_fillers_dict
        }

    def analyze_sentiment_chunk(self, text: str) -> Dict:
        """ORIGINAL sentiment analysis"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1: 
                label = "Positive"
            elif polarity < -0.1: 
                label = "Negative"
            else: 
                label = "Neutral"
            
            return {'polarity': polarity, 'label': label}
        except:
            return {'polarity': 0, 'label': 'Neutral'}

    def calculate_wpm_rolling(self, window_seconds: int = 30) -> float:
        """ORIGINAL WPM calculation"""
        if len(self.chunk_timestamps) < 2:
            return 0
        
        current_time = time.time()
        window_start = current_time - window_seconds
        
        while (self.chunk_timestamps and 
               self.chunk_timestamps[0] < window_start):
            self.chunk_timestamps.popleft()
            if self.chunk_word_counts:
                self.chunk_word_counts.popleft()
        
        if len(self.chunk_timestamps) < 2:
            return 0
        
        total_words = sum(self.chunk_word_counts)
        time_span = self.chunk_timestamps[-1] - self.chunk_timestamps[0]
        
        return (total_words / time_span) * 60 if time_span > 0 else 0

    def estimate_speaking_ratio(self, text: str) -> float:
        """ORIGINAL speaking ratio"""
        words = text.split()
        if not words:
            return 0.0
        word_density = len(words) / max(1, len(text))
        return min(1.0, word_density * 3)

    def calculate_vocabulary_diversity(self) -> float:
        """ORIGINAL vocabulary diversity"""
        if self.live_word_count == 0:
            return 0.0
        return len(self.live_unique_words) / self.live_word_count

    def get_cumulative_data(self) -> Dict:
        """ORIGINAL cumulative data"""
        return {
            'text': self.cumulative_text.strip(),
            'segments': self.cumulative_segments,
            'audio': self.cumulative_audio,
            'duration': self.total_session_duration,
            'language': self.detected_language if self.detected_language else 'unknown',
            'transcription_service': self.transcription_manager.get_current_service_name(),
            'metrics': self._get_current_metrics()
        }

    def _get_current_metrics(self) -> Dict:
        """ORIGINAL metrics calculation"""
        avg_sentiment = float(np.mean(self.sentiment_scores)) if self.sentiment_scores else 0
        sentiment_label = "Positive" if avg_sentiment > 0.1 else "Negative" if avg_sentiment < -0.1 else "Neutral"
        
        vocab_diversity = len(self.live_unique_words) / self.live_word_count if self.live_word_count > 0 else 0
        
        return {
            'total_words': self.live_word_count,
            'unique_words': len(self.live_unique_words),
            'vocab_diversity': vocab_diversity,
            'total_fillers': self.live_filler_count,
            'total_pauses': self.live_pause_count,
            'avg_sentiment': avg_sentiment,
            'sentiment_label': sentiment_label,
            'session_duration': self.total_session_duration,
            'language': self.detected_language if self.detected_language else '...'
        }
        
    def cleanup(self):
        """Clean up transcription services"""
        print("🧹 Cleaning up audio processor...")
        if hasattr(self, 'transcription_manager'):
            self.transcription_manager.cleanup()
        print("✅ Audio processor cleaned up")
"""
Speechmatics-based metrics calculator for real-time audio analysis
"""
import json
import os
import re
import time
from typing import Dict, List, Set, Tuple, Optional, Any
from collections import deque
import numpy as np
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TranscriptSegment:
    """Represents a segment of transcribed text with timing"""
    text: str
    start_time: float
    end_time: float
    language: str
    is_final: bool
    word_count: int
    
    @property
    def duration(self) -> float:
        return max(0.1, self.end_time - self.start_time)  # Minimum 0.1 seconds
    
    @property
    def wpm(self) -> float:
        """Words per minute for this segment"""
        minutes = self.duration / 60.0
        if minutes > 0:
            return self.word_count / minutes
        return 0


class AudioMetricsCalculator:
    """
    Calculates speech metrics in real-time from Speechmatics transcriptions
    """
    
    def __init__(self, language: str = None):
        self.language = language  # Will be auto-detected if None
        self.session_start_time = time.time()
        
        # Load resources with error handling
        self.filler_words_en = self._load_filler_words('en')
        self.filler_words_ar = self._load_filler_words('ar')
        
        # Metrics storage
        self.segments: List[TranscriptSegment] = []
        self.all_words: List[str] = []
        self.unique_words: Set[str] = set()
        
        # FIXED: Rolling window for WPM based on TIME, not segments
        # Stores tuples of (timestamp, word_count)
        self.word_timestamps = deque() 
        self.wpm_window_seconds = 30.0  # Look at last 30 seconds for live WPM
        
        # Cumulative metrics
        self.total_words = 0
        self.total_fillers = 0
        self.filler_counts = {}  # word -> count
        
        # Sentiment tracking
        self.sentiment_scores = deque(maxlen=20)  # Store last 20 sentiment scores
        
        # Language detection
        self.detected_language = language
        
        # Session-level metrics for final summary
        self.session_words = 0
        self.session_speaking_time = 0.0
    
    def _load_resource_file(self, filename: str, default_data: Dict) -> Dict:
        """Load a JSON resource file with error handling"""
        filepath = os.path.join("app", "data", filename)
        
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    print(f"✅ Loaded resource file: {filename}")
                    return data
            else:
                print(f"⚠️  Resource file not found: {filepath}, using defaults")
                return default_data
        except json.JSONDecodeError as e:
            print(f"❌ Error decoding JSON from {filename}: {e}")
            return default_data
        except Exception as e:
            print(f"❌ Error loading {filename}: {e}")
            return default_data

    def _load_filler_words(self, lang_code: str) -> Set[str]:
        """Load filler words from JSON file"""
        default_fillers = {
            'en': {
                "um", "uh", "like", "you know", "so", "actually", "basically",
                "literally", "right", "okay", "well", "i mean", "sort of", "kind of",
                "you see", "i guess", "i suppose", "or something", "whatever",
                "anyway", "anyhow", "honestly", "frankly", "seriously"
            },
            'ar': {
                "يعني", "اه", "اممم", "مثلا", "طيب", "تمام", "شوف", "بص",
                "والله", "يعني هو", "كده", "هيك", "مش عارف", "خلينا نقول",
                "كيف يعني", "فاهم", "أوكي", "يا سلام", "يا عم", "يا ريت",
                "بالظبط", "طبعا", "أكيد", "ماشي", "خلاص", "تمام"
            }
        }
        
        data = self._load_resource_file(
            f"filler_words_{lang_code}.json",
            {"filler_words": list(default_fillers.get(lang_code, set()))}
        )
        
        return set(data.get('filler_words', default_fillers.get(lang_code, set())))

    def _detect_language(self, text: str) -> str:
        """Detect if text is Arabic or English"""
        if not text.strip():
            return self.detected_language or 'en'
        
        try:
            # Simple detection: check for Arabic characters
            arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+')
            has_arabic = bool(arabic_pattern.search(text))
            
            # Also check for common Arabic words
            common_arabic_words = ['ال', 'في', 'من', 'على', 'أن', 'إن', 'هذا', 'هذه']
            has_common_arabic = any(word in text for word in common_arabic_words)
            
            if has_arabic or has_common_arabic:
                return 'ar'
            else:
                return 'en'
        except Exception as e:
            print(f"⚠️ Language detection error: {e}")
            return self.detected_language or 'en'

    def _analyze_sentiment(self, text: str, language: str) -> Dict[str, any]:
        """Sentiment is now analyzed via the dedicated /ws/sentiments WebSocket with LM."""
        return {'polarity': 0, 'label': 'neutral', 'score': 0}

    def _count_filler_words(self, text: str, language: str) -> Tuple[int, Dict[str, int]]:
        """Count filler words in text for given language"""
        try:
            text_lower = text.lower()
            filler_words = self.filler_words_en if language == 'en' else self.filler_words_ar
            
            chunk_counts = {}
            total_count = 0
            
            for word in filler_words:
                # Simple word boundary matching
                pattern = r'\b' + re.escape(word.lower()) + r'\b'
                try:
                    count = len(re.findall(pattern, text_lower))
                    if count > 0:
                        chunk_counts[word] = count
                        total_count += count
                except re.error as e:
                    print(f"⚠️ Regex error for filler word '{word}': {e}")
                    continue
            
            return total_count, chunk_counts
            
        except Exception as e:
            print(f"⚠️ Filler word counting error: {e}")
            return 0, {}
        
    def _clean_word_for_diversity(self, word: str) -> str:
        """Strips common punctuation and lowercases the word for diversity calculation."""
        # Strips periods, commas, colons, semicolons, question marks, exclamation points, and various quotes/brackets
        return word.strip('.,;:!?"\'()[]{}').lower()

    def process_transcript(self, text: str, start_time: float, end_time: float, is_final: bool = True) -> Dict[str, any]:
        """
        Process a transcript segment and return updated metrics
        """
        if not text or not text.strip():
            return self.get_current_metrics()
        
        try:
            # Detect language if not set
            if not self.detected_language:
                self.detected_language = self._detect_language(text)
            elif self.language:  # Use forced language if set
                self.detected_language = self.language
            else:
                # Re-detect on each segment to handle code-switching
                segment_lang = self._detect_language(text)
                if len(text.split()) > 2:
                    self.detected_language = segment_lang
            
            # Clean and process text
            clean_text = ' '.join(text.split())  # Normalize whitespace
            words = clean_text.split()
            word_count = len(words)
            
            # Ensure timestamps are valid numbers
            try:
                start_time_float = float(start_time)
                end_time_float = float(end_time)
                # Ensure end_time is after start_time
                if end_time_float <= start_time_float:
                    end_time_float = start_time_float + 0.1
            except (ValueError, TypeError):
                start_time_float = 0.0
                end_time_float = 0.1

            # Only process final segments for cumulative metrics
            if is_final:
                segment = TranscriptSegment(
                    text=clean_text,
                    start_time=start_time_float,
                    end_time=end_time_float,
                    language=self.detected_language,
                    is_final=is_final,
                    word_count=word_count
                )
                
                self.segments.append(segment)
                self.all_words.extend(words)
                # FIXED: Clean words before adding to unique set for better diversity score
                self.unique_words.update(self._clean_word_for_diversity(word) for word in words)
                self.total_words += word_count
                self.session_words += word_count
                self.session_speaking_time += segment.duration
                
                # Update word timestamp log for Real-Time WPM
                current_time = time.time()
                self.word_timestamps.append((current_time, word_count))
                
                # Count filler words
                filler_count, filler_breakdown = self._count_filler_words(clean_text, self.detected_language)
                self.total_fillers += filler_count
                
                # Update filler counts
                for word, count in filler_breakdown.items():
                    self.filler_counts[word] = self.filler_counts.get(word, 0) + count
                
                # Analyze sentiment
                sentiment = self._analyze_sentiment(clean_text, self.detected_language)
                self.sentiment_scores.append(sentiment['score'])
            
            return self.get_current_metrics()
            
        except Exception as e:
            print(f"❌ Error processing transcript: {e}")
            import traceback
            traceback.print_exc()
            return self.get_current_metrics()

    def get_current_metrics(self) -> Dict[str, any]:
        """Get current metrics state"""
        try:
            # Calculate WPM using rolling window
            rolling_wpm = self._calculate_current_wpm()
            
            # Calculate vocabulary diversity
            vocab_diversity = 0
            if self.total_words > 0:
                vocab_diversity = len(self.unique_words) / self.total_words
            
            # Calculate average sentiment
            avg_sentiment = 0
            sentiment_label = 'neutral'
            if self.sentiment_scores:
                avg_sentiment = float(np.mean(list(self.sentiment_scores)))
                if avg_sentiment > 0.15:
                    sentiment_label = 'positive'
                elif avg_sentiment < -0.15:
                    sentiment_label = 'negative'

            # Calculate filler word ratio and category
            filler_ratio = 0
            if self.total_words > 0:
                filler_ratio = self.total_fillers / self.total_words
            
            filler_category = 'low'
            if filler_ratio > 0.1:
                filler_category = 'high'
            elif filler_ratio > 0.05:
                filler_category = 'moderate'
            
            # Get top filler words
            top_fillers = dict(sorted(
                self.filler_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:8])
            
            return {
                'wpm': rolling_wpm,  # ← ROLLING WPM for real-time
                'total_words': self.total_words,
                'unique_words': len(self.unique_words),
                'vocab_diversity': vocab_diversity,
                'total_fillers': self.total_fillers,
                'filler_breakdown': top_fillers,
                'filler_ratio': filler_ratio,
                'filler_category': filler_category,  # ← ADDED
                'sentiment': sentiment_label,
                'sentiment_score': avg_sentiment,
                'language': self.detected_language or self.language or 'en',
                'segment_count': len(self.segments),
                'speaking_duration': self.session_speaking_time
            }
            
        except Exception as e:
            print(f"❌ Error calculating metrics: {e}")
            return {
                'wpm': 0,
                'total_words': self.total_words,
                'unique_words': len(self.unique_words),
                'vocab_diversity': 0,
                'total_fillers': self.total_fillers,
                'filler_breakdown': {},
                'sentiment': 'neutral',
                'sentiment_score': 0,
                'language': self.detected_language or self.language or 'en',
                'segment_count': len(self.segments),
                'speaking_duration': self.session_speaking_time
            }
        
    def _calculate_current_wpm(self) -> float:
        """Calculate current WPM using a sliding time window (30 seconds)"""
        try:
            current_time = time.time()
            cutoff_time = current_time - self.wpm_window_seconds
            
            # Remove old entries from deque
            while self.word_timestamps and self.word_timestamps[0][0] < cutoff_time:
                self.word_timestamps.popleft()
            
            # If no words in window, WPM is 0
            if not self.word_timestamps:
                return 0.0
                
            # Sum words in the current window
            words_in_window = sum(count for _, count in self.word_timestamps)
            
            # Calculate actual time span in window
            # If we just started 5 seconds ago, divide by 5s, not 30s (to avoid ramping up slowly)
            # But cap it at window size
            oldest_timestamp = self.word_timestamps[0][0]
            time_span_seconds = max(1.0, current_time - oldest_timestamp)
            
            # If the window is "full" (spanning ~30s), use exactly 30s to keep it smooth
            # Otherwise use actual elapsed time
            if time_span_seconds > (self.wpm_window_seconds - 1):
                time_span_minutes = self.wpm_window_seconds / 60.0
            else:
                time_span_minutes = time_span_seconds / 60.0
            
            return words_in_window / time_span_minutes
            
        except Exception as e:
            print(f"❌ Error calculating WPM: {e}")
            return 0.0

    def get_session_summary(self) -> Dict[str, any]:
        """Get comprehensive session summary for final results and real-time display"""
        try:
            # First get current metrics (rolling WPM for real-time)
            current_metrics = self.get_current_metrics()
            
            # Calculate total session time (Elapsed Time)
            total_session_time = time.time() - self.session_start_time
            
            # ===== FIX: Calculate speaking_duration correctly =====
            # Sum of all segment durations
            speaking_duration = sum(segment.duration for segment in self.segments)
            
            # Update the instance variable to be correct
            self.session_speaking_time = speaking_duration
            
            # Calculate speaking ratio (speaking time / total time)
            speaking_ratio = speaking_duration / total_session_time if total_session_time > 0 else 0
            
            # Calculate speaking percentage (0-100%)
            speaking_percentage = min(100, speaking_ratio * 100)  # Cap at 100%
            
            # ===== END FIX =====
            
            total_minutes = total_session_time / 60.0
            
            # Overall WPM = Total Words / Total Session Time (Elapsed Time)
            overall_wpm = 0
            if total_minutes > 0:
                overall_wpm = self.session_words / total_minutes
            
            # Calculate filler word ratio
            filler_ratio = self.total_fillers / self.session_words if self.session_words > 0 else 0
            
            # WPM categorization
            if overall_wpm < 80:
                wpm_category = 'slow'
            elif overall_wpm < 120:
                wpm_category = 'good'
            elif overall_wpm < 180:
                wpm_category = 'fast'
            else:
                wpm_category = 'very_fast'
            
            # Filler word categorization
            if filler_ratio > 0.1:  # >10% filler words
                filler_category = 'high'
            elif filler_ratio > 0.05:  # >5% filler words
                filler_category = 'moderate'
            else:
                filler_category = 'low'
            
            # Sentiment analysis
            sentiment_label = 'neutral'
            sentiment_score = 0
            if self.sentiment_scores:
                sentiment_score = float(np.mean(list(self.sentiment_scores)))
                if sentiment_score > 0.15:
                    sentiment_label = 'positive'
                elif sentiment_score < -0.15:
                    sentiment_label = 'negative'
            
            # Get top filler words
            top_fillers = dict(sorted(
                self.filler_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:8])
            
            # Vocabulary diversity
            vocab_diversity = 0
            if self.total_words > 0:
                vocab_diversity = len(self.unique_words) / self.total_words
            
            # Build comprehensive summary
            summary = {
                # ===== PRIMARY METRICS =====
                'overall_wpm': overall_wpm,
                'session_wpm': overall_wpm,
                'total_words': self.total_words,
                'total_fillers': self.total_fillers,
                'vocab_diversity': vocab_diversity,
                'sentiment': sentiment_label,
                'sentiment_score': sentiment_score,
                'sentiment_label': sentiment_label,
                
                # ===== CORRECTED DURATION METRICS =====
                'speaking_duration': speaking_duration,  # Corrected
                'total_duration': total_session_time,
                'speaking_ratio': speaking_ratio,  # Should be 0-1
                'speaking_percentage': speaking_percentage,  # Should be 0-100
                
                # ===== SUPPORTING METRICS =====
                'filler_breakdown': top_fillers,
                'filler_ratio': filler_ratio,
                'filler_category': filler_category,
                'wpm_category': wpm_category,
                'segment_count': len(self.segments),
                'unique_words': len(self.unique_words),
                'language': self.detected_language or self.language or 'en',
                
                # ===== REAL-TIME METRICS =====
                'wpm': current_metrics.get('wpm', 0),
                'current_wpm': current_metrics.get('wpm', 0),
                
                # ===== METADATA =====
                'timestamp': datetime.now().isoformat(),
                'transcription_service': 'speechmatics'
            }
            
            # Log summary for debugging
            print(f"✅ Generated session summary: "
                f"Speaking: {speaking_duration:.1f}s / {total_session_time:.1f}s ({speaking_percentage:.1f}%), "
                f"WPM: {overall_wpm:.1f} overall, {current_metrics.get('wpm', 0):.1f} current")
            
            return summary
            
        except Exception as e:
            print(f"❌ Error generating session summary: {e}")
            import traceback
            traceback.print_exc()
            
            # Return safe default summary with all expected fields
            return {
                # Primary metrics with defaults
                'overall_wpm': 0,
                'session_wpm': 0,
                'total_words': self.total_words,
                'total_fillers': self.total_fillers,
                'vocab_diversity': 0,
                'sentiment': 'neutral',
                'sentiment_score': 0,
                'sentiment_label': 'neutral',
                
                # Supporting metrics
                'filler_breakdown': {},
                'filler_ratio': 0,
                'filler_category': 'unknown',
                'wpm_category': 'unknown',
                'speaking_duration': self.session_speaking_time,
                'total_duration': time.time() - self.session_start_time,
                'speaking_ratio': 0,
                'segment_count': len(self.segments),
                'unique_words': len(self.unique_words),
                'language': self.detected_language or self.language or 'en',
                
                # Real-time metrics
                'wpm': 0,
                'current_wpm': 0,
                
                # Metadata
                'timestamp': datetime.now().isoformat(),
                'transcription_service': 'speechmatics',
                'error': str(e)
            }

    def reset(self):
        """Reset all metrics for a new session"""
        self.__init__(language=self.language)
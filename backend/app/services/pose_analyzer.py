"""
Real-Time Video Analysis Service
Simplified and optimized for WebSocket streaming
"""

import cv2
import mediapipe as mp
import numpy as np
import time
from collections import deque
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

# --- CONFIGURATION ---

class FeedbackLevel(Enum):
    """Severity levels for feedback"""
    EXCELLENT = 0
    GOOD = 1
    WARNING = 2
    CRITICAL = 3

@dataclass
class VideoConfig:
    """Configuration for the presentation coach"""
    # Posture thresholds
    slouch_angle_threshold: float = 160.0
    slouch_duration_threshold: float = 3.0
    
    # Movement thresholds
    sway_threshold: float = 0.035  # Increased from 0.025
    frozen_threshold: float = 0.005
    frozen_duration_threshold: float = 5.0
    
    # Hand thresholds
    hands_in_pockets_duration: float = 2.0
    hand_face_distance_threshold: float = 0.1
    
    # Head/shoulder thresholds
    shoulder_level_threshold: float = 0.045  # Increased from 0.035
    head_tilt_threshold: float = 20.0  # Increased from 15.0
    
    # Windowing for feedback alerts (5 seconds with 1 second overlap)
    feedback_window_seconds: float = 5.0
    feedback_window_overlap: float = 1.0
    
    # Buffer sizes
    movement_window_size: int = 30
    posture_window_size: int = 20

@dataclass
class VideoMetrics:
    """Video-specific metrics for tracking"""
    total_frames: int = 0
    frames_with_pose: int = 0
    frames_with_hands: int = 0
    
    # Time-based metrics
    slouch_time: float = 0.0
    frozen_time: float = 0.0
    hands_hidden_time: float = 0.0
    
    # Quality metrics
    avg_confidence: float = 0.0
    
    # Live percentage metrics
    eye_contact_score: float = 0.0  # Percentage looking at camera
    hand_gesture_count: int = 0     # Number of hand gestures detected
    posture_score: float = 100.0    # Overall posture quality (100 = perfect)

# --- UTILITY FUNCTIONS ---

def calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """Calculate angle between three 3D points"""
    ba = a - b
    bc = c - b
    
    dot_product = np.dot(ba, bc)
    magnitude_ba = np.linalg.norm(ba)
    magnitude_bc = np.linalg.norm(bc)
    
    if magnitude_ba == 0 or magnitude_bc == 0:
        return 0.0
    
    cosine_angle = dot_product / (magnitude_ba * magnitude_bc)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.degrees(np.arccos(cosine_angle))
    
    return angle

def calculate_distance(p1: np.ndarray, p2: np.ndarray) -> float:
    """Calculate Euclidean distance"""
    return np.linalg.norm(p1 - p2)

def smooth_values(values: deque, method: str = 'mean') -> float:
    """Smooth values using mean or median"""
    if len(values) == 0:
        return 0.0
    return float(np.median(values)) if method == 'median' else float(np.mean(values))

# --- VIDEO ANALYZER ---

class PoseAnalyzer:
    """Advanced real-time pose analysis for presentations"""
    
    def __init__(self, config: Optional[VideoConfig] = None):
        self.config = config or VideoConfig()
        
        # Initialize MediaPipe
        self.mp_pose = mp.solutions.pose
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=1
        )
        self.hands = self.mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Overlay toggle
        self.show_overlay = False
        
        # Metrics tracking
        self.metrics = VideoMetrics()
        
        # State tracking
        self.slouch_start_time: Optional[float] = None
        self.hands_in_pockets_start_time: Optional[float] = None
        self.frozen_start_time: Optional[float] = None
        
        # Buffers for smoothing
        self.nose_x_buffer = deque(maxlen=self.config.movement_window_size)
        self.nose_y_buffer = deque(maxlen=self.config.movement_window_size)
        self.posture_angle_buffer = deque(maxlen=self.config.posture_window_size)
        self.shoulder_level_buffer = deque(maxlen=self.config.posture_window_size)
        
        # Buffers for live metrics (5 seconds at ~30 fps = 150 frames)
        self.eye_contact_buffer = deque(maxlen=150)  # 5 seconds
        self.hand_movement_buffer = deque(maxlen=150)  # 5 seconds
        self.posture_quality_buffer = deque(maxlen=150)  # 5 seconds
        
        # Metric update throttling (update display every 1 second)
        self.last_metric_update_time = 0
        self.metric_update_interval = 1.0  # Update metrics display every 1 second
        self.cached_metrics = {
            'eye_contact_score': 0.0,
            'hand_gesture_count': 0,
            'posture_score': 100.0
        }
        
        # Previous frame data
        self.left_hip_y = 0.0
        self.right_hip_y = 0.0
        
        # Previous hand positions for gesture detection
        self.prev_left_hand_pos = None
        self.prev_right_hand_pos = None
        
        # Feedback windowing (5-second windows with 1-second overlap)
        # Track last time each type of feedback was triggered
        self.last_feedback_time = {
            'slouch': 0,
            'head_tilt': 0,
            'shoulder_balance': 0,
            'swaying': 0,
            'frozen': 0,
            'hands_pockets': 0,
            'hands_fig_leaf': 0,
            'hands_face': 0,
            'eye_contact': 0,
        }
        self.feedback_cooldown = self.config.feedback_window_seconds - self.config.feedback_window_overlap
        
        # Session start time
        self.session_start = time.time()
    
    def update(self, pose_results, hand_results) -> List[str]:
        """Main update function - simplified to return string feedback list"""
        self.metrics.total_frames += 1
        
        # Get landmark dictionaries
        pose_landmarks = self._extract_pose_landmarks(pose_results)
        
        # Default feedback list
        feedback = []
        
        if not pose_landmarks:
            return ["لم يتم رصد الوضعية - ادخل في الإطار"]
        
        self.metrics.frames_with_pose += 1
        if hand_results and hand_results.multi_hand_landmarks:
            self.metrics.frames_with_hands += 1
        
        # Store hip 'y' for hand checks - ONLY update if landmarks exist
        if pose_landmarks.get("LEFT_HIP"):
            self.left_hip_y = pose_landmarks["LEFT_HIP"][1]
        if pose_landmarks.get("RIGHT_HIP"):
            self.right_hip_y = pose_landmarks["RIGHT_HIP"][1]
        
        # print(f"👐 DEBUG Hip positions: left_hip_y={self.left_hip_y:.3f}, right_hip_y={self.right_hip_y:.3f}")
        
        # --- Run all checks ---
        self._check_posture(pose_landmarks, feedback)
        self._check_head_tilt(pose_landmarks, feedback)
        self._check_shoulder_balance(pose_landmarks, feedback)
        self._check_frozen(pose_landmarks, feedback)
        self._check_hands_in_pockets(pose_landmarks, feedback)
        self._check_hands(hand_results, pose_landmarks, feedback)
        self._check_eye_contact(pose_landmarks, feedback)
        
        # --- Update live metrics ---
        self._update_eye_contact(pose_landmarks)
        self._update_hand_gestures(hand_results)
        self._update_posture_score(pose_landmarks)
        
        # Update cached metrics only once per second
        current_time = time.time()
        if current_time - self.last_metric_update_time >= self.metric_update_interval:
            self.last_metric_update_time = current_time
            self.cached_metrics['eye_contact_score'] = self.metrics.eye_contact_score
            self.cached_metrics['hand_gesture_count'] = self.metrics.hand_gesture_count
            self.cached_metrics['posture_score'] = self.metrics.posture_score
        
        # Return feedback (don't add positive feedback when no issues)
        return feedback
    
    def _can_show_feedback(self, feedback_type: str) -> bool:
        """Check if enough time has passed to show this type of feedback again"""
        current_time = time.time()
        if current_time - self.last_feedback_time.get(feedback_type, 0) >= self.feedback_cooldown:
            self.last_feedback_time[feedback_type] = current_time
            return True
        return False
    
    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """
        Analyze a single video frame
        Returns comprehensive feedback and metrics
        """
        # Convert to RGB for MediaPipe
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image_rgb.flags.writeable = False
        
        # Process with MediaPipe
        pose_results = self.pose.process(image_rgb)
        hand_results = self.hands.process(image_rgb)
        
        # Get feedback from update
        feedback_strings = self.update(pose_results, hand_results)
        
        # Convert to structured format
        feedback_list = []
        for msg in feedback_strings:
            # Determine level and category from message
            if "✓" in msg or "Excellent" in msg:
                level = "excellent"
                category = "Overall"
            elif "⚠" in msg:
                level = "warning"
                if "Posture" in msg or "Slouch" in msg or "Head" in msg or "Shoulder" in msg:
                    category = "Posture"
                elif "Movement" in msg or "Sway" in msg or "STATIC" in msg:
                    category = "Movement"
                elif "Hand" in msg or "Fig leaf" in msg:
                    category = "Hands"
                else:
                    category = "Stance"
            else:
                level = "good"
                category = "Overall"
            
            feedback_list.append({
                'message': msg,
                'level': level,
                'category': category,
                'confidence': 0.8
            })
        
        result = {
            'status': 'success',
            'feedback': feedback_list,
            'metrics': self._get_metrics_dict(),
            'video_quality': self._get_video_quality(),
            'has_pose': pose_results.pose_landmarks is not None,
            'has_hands': hand_results.multi_hand_landmarks is not None if hand_results else False
        }
        
        # Draw overlay if enabled
        if self.show_overlay:
            annotated_frame = frame.copy()
            
            # Draw pose landmarks
            if pose_results.pose_landmarks:
                self.mp_drawing.draw_landmarks(
                    annotated_frame,
                    pose_results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
                )
            
            # Draw hand landmarks
            if hand_results and hand_results.multi_hand_landmarks:
                for hand_landmarks in hand_results.multi_hand_landmarks:
                    self.mp_drawing.draw_landmarks(
                        annotated_frame,
                        hand_landmarks,
                        self.mp_hands.HAND_CONNECTIONS,
                        self.mp_drawing_styles.get_default_hand_landmarks_style(),
                        self.mp_drawing_styles.get_default_hand_connections_style()
                    )
            
            # Convert annotated frame to JPEG and encode as base64
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            import base64
            result['overlay_frame'] = base64.b64encode(buffer).decode('utf-8')
        
        return result
    
    def _extract_pose_landmarks(self, results) -> Optional[Dict]:
        """Extract pose landmarks with visibility filtering"""
        if not results.pose_landmarks:
            return None
        
        landmarks = results.pose_landmarks.landmark
        
        def get_coord(landmark_name: str) -> Optional[List]:
            try:
                lm = landmarks[self.mp_pose.PoseLandmark[landmark_name].value]
                if lm.visibility > 0.5:
                    return [lm.x, lm.y, lm.z, lm.visibility]
                return None
            except:
                return None
        
        return {
            "LEFT_SHOULDER": get_coord("LEFT_SHOULDER"),
            "RIGHT_SHOULDER": get_coord("RIGHT_SHOULDER"),
            "LEFT_HIP": get_coord("LEFT_HIP"),
            "RIGHT_HIP": get_coord("RIGHT_HIP"),
            "LEFT_EAR": get_coord("LEFT_EAR"),
            "RIGHT_EAR": get_coord("RIGHT_EAR"),
            "NOSE": get_coord("NOSE"),
            "LEFT_WRIST": get_coord("LEFT_WRIST"),
            "RIGHT_WRIST": get_coord("RIGHT_WRIST"),
            "LEFT_ELBOW": get_coord("LEFT_ELBOW"),
            "RIGHT_ELBOW": get_coord("RIGHT_ELBOW"),
            "LEFT_EYE": get_coord("LEFT_EYE"),
            "RIGHT_EYE": get_coord("RIGHT_EYE"),
            "LEFT_EYE_INNER": get_coord("LEFT_EYE_INNER"),
            "LEFT_EYE_OUTER": get_coord("LEFT_EYE_OUTER"),
            "RIGHT_EYE_INNER": get_coord("RIGHT_EYE_INNER"),
            "RIGHT_EYE_OUTER": get_coord("RIGHT_EYE_OUTER"),
        }
    
    def _check_posture(self, landmarks: Dict, feedback: List[str]):
        """Checks for slouching posture"""
        if not (landmarks.get("LEFT_EAR") and landmarks.get("LEFT_SHOULDER") and landmarks.get("LEFT_HIP")):
            return
        
        posture_angle = calculate_angle(
            np.array(landmarks["LEFT_EAR"][:3]),
            np.array(landmarks["LEFT_SHOULDER"][:3]),
            np.array(landmarks["LEFT_HIP"][:3])
        )
        
        self.posture_angle_buffer.append(posture_angle)
        smoothed_angle = smooth_values(self.posture_angle_buffer)
        
        # print(f"🧍 DEBUG Posture: smoothed_angle={smoothed_angle:.1f}, threshold={self.config.slouch_angle_threshold}")
        
        if smoothed_angle < self.config.slouch_angle_threshold:
            if self.slouch_start_time is None:
                self.slouch_start_time = time.time()
                # print(f"🧍 DEBUG: Started slouching at {self.slouch_start_time}")
            
            # Always accumulate slouch time while slouching
            duration = time.time() - self.slouch_start_time
            self.metrics.slouch_time = duration
            # print(f"🧍 DEBUG: Slouching duration={duration:.2f}s, total_slouch_time={self.metrics.slouch_time:.2f}s")
            
            if duration > self.config.slouch_duration_threshold and self._can_show_feedback('slouch'):
                feedback.append("⚠ منحني - قف مستقيماً!")
            elif self._can_show_feedback('slouch'):
                feedback.append("⚠ الوقفة: منحني قليلاً")
        else:
            # When not slouching, preserve the accumulated time
            # if self.slouch_start_time is not None:
                # print(f"🧍 DEBUG: Stopped slouching, preserved time={self.metrics.slouch_time:.2f}s")
            self.slouch_start_time = None
    
    def _check_head_tilt(self, landmarks: Dict, feedback: List[str]):
        """Check for head tilt"""
        left_ear = landmarks.get("LEFT_EAR")
        right_ear = landmarks.get("RIGHT_EAR")
        
        if not (left_ear and right_ear):
            return
        
        ear_diff_y = abs(left_ear[1] - right_ear[1])
        
        if ear_diff_y > self.config.head_tilt_threshold / 100 and self._can_show_feedback('head_tilt'):
            feedback.append("⚠ الرأس مائل - حافظ على استقامة الرأس")
    
    def _check_shoulder_balance(self, landmarks: Dict, feedback: List[str]):
        """Check if shoulders are level"""
        left_shoulder = landmarks.get("LEFT_SHOULDER")
        right_shoulder = landmarks.get("RIGHT_SHOULDER")
        
        if not (left_shoulder and right_shoulder):
            return
        
        shoulder_diff = abs(left_shoulder[1] - right_shoulder[1])
        self.shoulder_level_buffer.append(shoulder_diff)
        smoothed_diff = smooth_values(self.shoulder_level_buffer)
        
        if smoothed_diff > self.config.shoulder_level_threshold and self._can_show_feedback('shoulder_balance'):
            # When left shoulder is higher (lower y-value), person is leaning RIGHT
            # When right shoulder is higher (lower y-value), person is leaning LEFT
            side = "اليمين" if left_shoulder[1] < right_shoulder[1] else "اليسار"
            feedback.append(f"⚠ الوقفة مائلة إلى {side}")
    
    def _check_frozen(self, landmarks: Dict, feedback: List[str]):
        """Check for frozen (no movement)"""
        nose = landmarks.get("NOSE")
        if not nose:
            return
        
        self.nose_y_buffer.append(nose[1])
        
        if len(self.nose_x_buffer) < self.config.movement_window_size:
            return
        
        x_std = np.std(self.nose_x_buffer)
        y_std = np.std(self.nose_y_buffer)
        total_movement = np.sqrt(x_std**2 + y_std**2)
        
        # print(f"🧊 DEBUG Frozen: total_movement={total_movement:.6f}, threshold={self.config.frozen_threshold}")
        
        if total_movement < self.config.frozen_threshold:
            if self.frozen_start_time is None:
                self.frozen_start_time = time.time()
                # print(f"🧊 DEBUG: Started frozen at {self.frozen_start_time}")
            
            # Always accumulate frozen time while frozen
            duration = time.time() - self.frozen_start_time
            self.metrics.frozen_time = duration
            # print(f"🧊 DEBUG: Frozen duration={duration:.2f}s, total_frozen_time={self.metrics.frozen_time:.2f}s")
            
            if duration > self.config.frozen_duration_threshold and self._can_show_feedback('frozen'):
                feedback.append("⚠ ثابت جداً - أضف حركة طبيعية!")
        else:
            # When moving, preserve the accumulated time
            # if self.frozen_start_time is not None:
                # print(f"🧊 DEBUG: Stopped frozen, preserved time={self.metrics.frozen_time:.2f}s")
            self.frozen_start_time = None
    
    def _check_hands_in_pockets(self, landmarks: Dict, feedback: List[str]):
        """Checks if hands are in pockets"""
        left_wrist = landmarks.get("LEFT_WRIST")
        right_wrist = landmarks.get("RIGHT_WRIST")
        
        if not (left_wrist and right_wrist):
            # print(f"👐 DEBUG: Missing wrist landmarks - skipping hands check")
            return
        
        # Only check if we have valid hip positions (not initial 0.0)
        if self.left_hip_y == 0.0 or self.right_hip_y == 0.0:
            # print(f"👐 DEBUG: Hip positions not initialized yet - skipping hands check")
            return
        
        hands_hidden = ((left_wrist[1] > self.left_hip_y and left_wrist[3] < 0.3) or
                        (right_wrist[1] > self.right_hip_y and right_wrist[3] < 0.3))
        
        # print(f"👐 DEBUG Hands: hands_hidden={hands_hidden}, left_wrist_y={left_wrist[1]:.3f}, left_hip_y={self.left_hip_y:.3f}, left_wrist_visibility={left_wrist[3]:.3f}")
        
        if hands_hidden:
            if self.hands_in_pockets_start_time is None:
                self.hands_in_pockets_start_time = time.time()
                # print(f"👐 DEBUG: Hands hidden started at {self.hands_in_pockets_start_time}")
            
            # Always accumulate hands hidden time while hidden
            duration = time.time() - self.hands_in_pockets_start_time
            self.metrics.hands_hidden_time = duration
            # print(f"👐 DEBUG: Hands hidden duration={duration:.2f}s, total_hands_hidden_time={self.metrics.hands_hidden_time:.2f}s")
            
            if duration > self.config.hands_in_pockets_duration and self._can_show_feedback('hands_pockets'):
                feedback.append("⚠ اليدين مخفيتان - أظهرهما!")
        else:
            # When hands visible, preserve the accumulated time
            # if self.hands_in_pockets_start_time is not None:
                # print(f"👐 DEBUG: Hands visible, preserved time={self.metrics.hands_hidden_time:.2f}s")
            self.hands_in_pockets_start_time = None
    
    def _check_hands(self, hand_results, pose_landmarks: Dict, feedback: List[str]):
        """Comprehensive hand gesture checks"""
        if not hand_results or not hand_results.multi_hand_landmarks:
            return
        
        # Check hand-to-face touching
        nose = pose_landmarks.get("NOSE")
        if not nose:
            return
        
        nose_pos = np.array(nose[:2])
        
        for hand_landmarks in hand_results.multi_hand_landmarks:
            for landmark_id in [self.mp_hands.HandLandmark.THUMB_TIP,
                                self.mp_hands.HandLandmark.INDEX_FINGER_TIP,
                                self.mp_hands.HandLandmark.MIDDLE_FINGER_TIP]:
                
                finger = hand_landmarks.landmark[landmark_id]
                finger_pos = np.array([finger.x, finger.y])
                distance = calculate_distance(nose_pos, finger_pos)
                
                if distance < self.config.hand_face_distance_threshold and self._can_show_feedback('hands_face'):
                    feedback.append("⚠ اليدان بالقرب من الوجه - تجنب لمس الوجه")
                    return
    
    def _check_eye_contact(self, landmarks: Dict, feedback: List[str]):
        """Check if user is looking away (left or right)"""
        left_eye_inner = landmarks.get("LEFT_EYE_INNER")
        left_eye_outer = landmarks.get("LEFT_EYE_OUTER")
        right_eye_inner = landmarks.get("RIGHT_EYE_INNER")
        right_eye_outer = landmarks.get("RIGHT_EYE_OUTER")
        
        if not (left_eye_inner and left_eye_outer and right_eye_inner and right_eye_outer):
            return
        
        # Calculate horizontal width of each eye
        left_eye_width = abs(left_eye_outer[0] - left_eye_inner[0])
        right_eye_width = abs(right_eye_outer[0] - right_eye_inner[0])
        
        if left_eye_width <= 0 or right_eye_width <= 0:
            return
        
        # Calculate which eye is wider to determine direction
        eye_ratio = min(left_eye_width, right_eye_width) / max(left_eye_width, right_eye_width)
        
        # If ratio is low, user is turning their head
        if eye_ratio < 0.40:  # Slightly more sensitive than 0.35
            # Determine direction
            if self._can_show_feedback('eye_contact'):
                if left_eye_width > right_eye_width:
                    # Left eye wider = turning RIGHT (head rotated to user's right)
                    feedback.append("⚠ انظر للأمام - تجنب النظر لليمين")
                else:
                    # Right eye wider = turning LEFT (head rotated to user's left)
                    feedback.append("⚠ انظر للأمام - تجنب النظر لليسار")
    
    def _update_eye_contact(self, landmarks: Dict):
        """Track eye contact by detecting head turn using eye aspect ratio"""
        left_eye_inner = landmarks.get("LEFT_EYE_INNER")
        left_eye_outer = landmarks.get("LEFT_EYE_OUTER")
        right_eye_inner = landmarks.get("RIGHT_EYE_INNER")
        right_eye_outer = landmarks.get("RIGHT_EYE_OUTER")
        
        if not (left_eye_inner and left_eye_outer and right_eye_inner and right_eye_outer):
            print(f"👁️ DEBUG Eye Contact: Missing eye corner landmarks")
            return
        
        # Calculate horizontal width of each eye
        left_eye_width = abs(left_eye_outer[0] - left_eye_inner[0])
        right_eye_width = abs(right_eye_outer[0] - right_eye_inner[0])
        
        # When facing camera: both eyes have similar width
        # When turned left: right eye wider, left eye narrower
        # When turned right: left eye wider, right eye narrower
        
        # Calculate eye width ratio (should be close to 1.0 when facing camera)
        if left_eye_width > 0 and right_eye_width > 0:
            eye_ratio = min(left_eye_width, right_eye_width) / max(left_eye_width, right_eye_width)
        else:
            return
        
        # Good eye contact if eyes are relatively balanced (ratio > 0.40)
        # When head turns significantly, one eye appears much narrower
        is_facing_forward = eye_ratio > 0.40  # Slightly more sensitive
        
        # Good eye contact = facing forward only (head tilt ignored)
        looking = 1 if is_facing_forward else 0
        self.eye_contact_buffer.append(looking)
        
        # Calculate rolling average
        if len(self.eye_contact_buffer) > 0:
            self.metrics.eye_contact_score = (sum(self.eye_contact_buffer) / len(self.eye_contact_buffer)) * 100
        
        # Debug every 30 frames
        # if self.metrics.total_frames % 30 == 0:
        #     print(f"👁️ Eye Contact: L_width={left_eye_width:.3f}, R_width={right_eye_width:.3f}, ratio={eye_ratio:.3f}, facing={is_facing_forward}, score={self.metrics.eye_contact_score:.1f}%")
    
    def _update_hand_gestures(self, hand_results):
        """Count hand gestures (movement-based)"""
        if not hand_results or not hand_results.multi_hand_landmarks:
            return
        
        # Track hand movement
        for i, hand_landmarks in enumerate(hand_results.multi_hand_landmarks):
            wrist = hand_landmarks.landmark[self.mp_hands.HandLandmark.WRIST]
            curr_pos = np.array([wrist.x, wrist.y])
            
            if i == 0:  # Left hand
                if self.prev_left_hand_pos is not None:
                    movement = np.linalg.norm(curr_pos - self.prev_left_hand_pos)
                    if movement > 0.02:  # Threshold for gesture
                        self.metrics.hand_gesture_count += 1
                self.prev_left_hand_pos = curr_pos
            else:  # Right hand
                if self.prev_right_hand_pos is not None:
                    movement = np.linalg.norm(curr_pos - self.prev_right_hand_pos)
                    if movement > 0.02:
                        self.metrics.hand_gesture_count += 1
                self.prev_right_hand_pos = curr_pos
    
    def _update_posture_score(self, landmarks: Dict):
        """Calculate posture quality based on left/right shoulder lean only"""
        if not (landmarks.get("LEFT_SHOULDER") and landmarks.get("RIGHT_SHOULDER")):
            return
        
        quality = 100.0  # Start with perfect score
        
        # Track shoulder balance (left/right lean)
        left_shoulder = landmarks["LEFT_SHOULDER"]
        right_shoulder = landmarks["RIGHT_SHOULDER"]
        shoulder_diff = abs(left_shoulder[1] - right_shoulder[1])
        
        # Penalize based on shoulder height difference (more tolerant thresholds)
        shoulder_penalty = 0
        if shoulder_diff > 0.15:  # Increased from 0.12
            shoulder_penalty = 60  # Severe lean
        elif shoulder_diff > 0.12:  # Increased from 0.09
            shoulder_penalty = 45  # Significant lean
        elif shoulder_diff > 0.08:  # Increased from 0.06
            shoulder_penalty = 30  # Moderate lean
        elif shoulder_diff > 0.05:  # Increased from 0.04
            shoulder_penalty = 15  # Slight lean
        
        quality -= shoulder_penalty
        
        # Ensure quality doesn't go below 0
        quality = max(0.0, quality)
        
        self.posture_quality_buffer.append(quality)
        
        # Calculate rolling average
        if len(self.posture_quality_buffer) > 0:
            self.metrics.posture_score = sum(self.posture_quality_buffer) / len(self.posture_quality_buffer)
        
        # Debug every 30 frames
        # if self.metrics.total_frames % 30 == 0:
        #     print(f"🧍 Posture: shoulder_diff={shoulder_diff:.3f} (-{shoulder_penalty}), quality={quality:.1f}, avg={self.metrics.posture_score:.1f}")
    
    def _get_metrics_dict(self) -> Dict:
        """Get current metrics as dictionary"""
        total_time = (time.time() - self.session_start)
        
        slouch_pct = (self.metrics.slouch_time / total_time * 100) if total_time > 0 else 0
        frozen_pct = (self.metrics.frozen_time / total_time * 100) if total_time > 0 else 0
        hands_pct = (self.metrics.hands_hidden_time / total_time * 100) if total_time > 0 else 0
        
        # print(f"📊 METRICS: slouch_time={self.metrics.slouch_time:.2f}s ({slouch_pct:.1f}%), frozen_time={self.metrics.frozen_time:.2f}s ({frozen_pct:.1f}%), hands_hidden_time={self.metrics.hands_hidden_time:.2f}s ({hands_pct:.1f}%), total_time={total_time:.2f}s")
        
        return {
            'total_frames': self.metrics.total_frames,
            'total_time': total_time,
            'fps': self.metrics.total_frames / total_time if total_time > 0 else 0,
            
            # Detection rates
            'pose_detection_rate': (self.metrics.frames_with_pose / self.metrics.total_frames * 100) 
                                   if self.metrics.total_frames > 0 else 0,
            'hand_detection_rate': (self.metrics.frames_with_hands / self.metrics.total_frames * 100) 
                                   if self.metrics.total_frames > 0 else 0,
            
            # Time percentages
            'slouch_percentage': slouch_pct,
            'frozen_percentage': frozen_pct,
            'hands_hidden_percentage': hands_pct,
            
            # Live metrics (throttled - updated every 1 second)
            'eye_contact_percentage': round(self.cached_metrics['eye_contact_score'], 1),
            'hand_gesture_count': self.cached_metrics['hand_gesture_count'],
            'posture_quality': round(self.cached_metrics['posture_score'], 1),
            
            # Quality
            'avg_confidence': self.metrics.avg_confidence,
        }
    
    def _get_video_quality(self) -> Dict:
        """Get video quality indicators"""
        pose_rate = (self.metrics.frames_with_pose / self.metrics.total_frames * 100) if self.metrics.total_frames > 0 else 0
        return {
            'pose_visible': self.metrics.frames_with_pose > 0,
            'hands_visible': self.metrics.frames_with_hands > 0,
            'detection_quality': 'good' if pose_rate > 70 else 
                                'fair' if pose_rate > 40 else 'poor',
            'frame_rate': self.metrics.total_frames / (time.time() - self.session_start) 
                         if (time.time() - self.session_start) > 0 else 0
        }
    
    def toggle_overlay(self, show: bool = None) -> bool:
        """Toggle or set overlay visualization"""
        if show is None:
            self.show_overlay = not self.show_overlay
        else:
            self.show_overlay = show
        return self.show_overlay
    
    def reset_stats(self):
        """Reset statistics"""
        self.metrics = VideoMetrics()
        self.slouch_start_time = None
        self.hands_in_pockets_start_time = None
        self.frozen_start_time = None
        self.session_start = time.time()
    
    def cleanup(self):
        """Cleanup MediaPipe resources"""
        self.pose.close()
        self.hands.close()
    
    def get_statistics(self) -> Dict:
        """Get accumulated statistics"""
        total_time = self.metrics.total_frames / 30.0
        
        return {
            "total_time": total_time,
            "frame_count": self.metrics.total_frames,
            "slouch_percentage": (self.metrics.slouch_time / total_time * 100) if total_time > 0 else 0,
            "frozen_percentage": (self.metrics.frozen_time / total_time * 100) if total_time > 0 else 0,
            "hands_hidden_percentage": (self.metrics.hands_hidden_time / total_time * 100) if total_time > 0 else 0,
        }

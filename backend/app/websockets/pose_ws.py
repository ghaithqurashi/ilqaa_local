from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.pose_analyzer import PoseAnalyzer
import cv2
import numpy as np
import json

router = APIRouter()


@router.websocket("/ws/video")
async def video_analysis_endpoint(websocket: WebSocket):
    """
    Real-time video analysis WebSocket endpoint
    Analyzes body language, posture, gestures, and presentation skills using MediaPipe
    """
    print("🎥 DEBUG - WebSocket connection attempt")
    await websocket.accept()
    print("🎥 DEBUG - WebSocket accepted")
    
    # Create pose analyzer instance
    analyzer = PoseAnalyzer()
    print("🎥 DEBUG - PoseAnalyzer initialized")
    
    print("🎥 Video Analysis WebSocket connected")
    
    try:
        # Send initial connection confirmation
        print("🎥 DEBUG - Sending initial connection message")
        await websocket.send_json({
            'status': 'connected',
            'message': 'Video Analysis ready. Start your webcam!'
        })
        print("🎥 DEBUG - Initial message sent successfully")
        
        frame_count = 0
        while True:
            try:
                # Receive frame data
                message = await websocket.receive()
                
                # Check for disconnect message
                if message.get('type') == 'websocket.disconnect':
                    print("🛑 WebSocket disconnect message received")
                    break
                
                # Handle text messages (control commands)
                if 'text' in message:
                    print(f"🎥 DEBUG - Received text message: {message['text'][:100]}")
                    data = json.loads(message['text'])
                    
                    if data.get('action') == 'stop':
                        print("🛑 Video analysis session stopped by client")
                        
                        # Send final statistics
                        metrics = analyzer._get_metrics_dict()
                        await websocket.send_json({
                            'status': 'session_complete',
                            'metrics': metrics
                        })
                        break
                    
                    elif data.get('action') == 'reset':
                        analyzer.reset_stats()
                        await websocket.send_json({
                            'status': 'reset',
                            'message': 'Statistics reset'
                        })
                    
                    elif data.get('action') == 'toggle_overlay':
                        show = data.get('show')
                        new_state = analyzer.toggle_overlay(show)
                        await websocket.send_json({
                            'status': 'overlay_toggled',
                            'overlay_enabled': new_state
                        })
                        print(f"🎨 Overlay visualization: {'ON' if new_state else 'OFF'}")
                    
                    continue
                
                # Handle binary data (video frame)
                if 'bytes' in message:
                    frame_count += 1
                    frame_data = message['bytes']
                    
                    if frame_count == 1:
                        print(f"🎥 DEBUG - First frame received, size: {len(frame_data)} bytes")
                    
                    # Decode frame
                    nparr = np.frombuffer(frame_data, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is None:
                        print(f"⚠️ Failed to decode frame {frame_count}")
                        await websocket.send_json({
                            'status': 'error',
                            'message': 'Failed to decode frame'
                        })
                        continue
                    
                    if frame_count == 1:
                        print(f"🎥 DEBUG - Frame decoded successfully, shape: {frame.shape}")
                    
                    # Analyze frame
                    result = analyzer.analyze_frame(frame)
                    
                    if frame_count == 1:
                        print(f"🎥 DEBUG - Analysis complete, feedback count: {len(result.get('feedback', []))}")
                    
                    # Send results
                    await websocket.send_json(result)
                    
                    if frame_count == 1:
                        print(f"🎥 DEBUG - First result sent successfully")
                    
                    # Debug: print frame count every 30 frames
                    if analyzer.metrics.total_frames % 30 == 0:
                        print(f"📹 Processed {analyzer.metrics.total_frames} frames, FPS: {result['metrics']['fps']:.1f}")
                
            except WebSocketDisconnect:
                print("✓ Client disconnected from video analysis")
                break
            except RuntimeError as e:
                if "disconnect message has been received" in str(e):
                    print("✓ WebSocket already disconnected")
                    break
                else:
                    print(f"Runtime error: {e}")
                    break
            except Exception as e:
                print(f"Frame processing error: {e}")
                import traceback
                traceback.print_exc()
                break  # Exit loop on any error to prevent infinite loops
    
    except WebSocketDisconnect:
        print("✓ Client disconnected gracefully")
    except Exception as e:
        print(f"❌ Video analysis WebSocket error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        analyzer.cleanup()
        
        # Print final statistics
        metrics = analyzer._get_metrics_dict()
        print("\n" + "═" * 60)
        print("🎥 VIDEO ANALYSIS SESSION COMPLETE")
        print("═" * 60)
        print(f"Total Time: {metrics['total_time']:.1f}s")
        print(f"Total Frames: {metrics['total_frames']}")
        print(f"Average FPS: {metrics['fps']:.1f}")
        print(f"Pose Detection: {metrics['pose_detection_rate']:.1f}%")
        print(f"Hand Detection: {metrics['hand_detection_rate']:.1f}%")
        print("\n--- Behavior Analysis ---")
        print(f"Slouching: {metrics['slouch_percentage']:.1f}%")
        print(f"Frozen: {metrics['frozen_percentage']:.1f}%")
        print(f"Hands Hidden: {metrics['hands_hidden_percentage']:.1f}%")
        print("═" * 60 + "\n")
        
        try:
            await websocket.close()
        except:
            pass

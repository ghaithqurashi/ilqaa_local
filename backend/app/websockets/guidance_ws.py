from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.clients.llm_client import LLMClient
import json
import asyncio
import time
import logging
from concurrent.futures import ThreadPoolExecutor
import queue
import threading

router = APIRouter()
logger = logging.getLogger(__name__)

# Thread pool for LLM calls to avoid blocking
llm_executor = ThreadPoolExecutor(max_workers=2)

# Load guidance configuration - NO FALLBACK
try:
    with open('app/data/guidance-config.json', 'r', encoding='utf-8') as f:
        CONFIG = json.load(f)
    print("✅ Successfully loaded guidance configuration")
except FileNotFoundError:
    logger.error("❌ guidance-config.json not found - service cannot start")
    CONFIG = None
except json.JSONDecodeError as e:
    logger.error(f"❌ Error parsing guidance-config.json: {e}")
    CONFIG = None
except Exception as e:
    logger.error(f"❌ Error loading guidance-config.json: {e}")
    CONFIG = None


@router.websocket("/ws/guidance")
async def guidance_websocket_endpoint(
    websocket: WebSocket,
    language: str = Query(default="ar", regex="^(ar|en)$"),
    topic: str = Query(default="lecture")
):
    """
    Real-time AI guidance WebSocket endpoint
    Uses threaded processing to prevent LLM from blocking the event loop
    """
    
    # Get language from parameter (already validated)
    session_language = language

    try:
        with open('app/data/guidance-config.json', 'r', encoding='utf-8') as f:
            CONFIG = json.load(f)
        print("✅ Successfully loaded guidance configuration for new session")
    except FileNotFoundError:
        logger.error("❌ guidance-config.json not found - service cannot start")
        await websocket.accept()
        await websocket.send_json({
            'status': 'error', 
            'message': 'Configuration file not found'
        })
        await websocket.close()
        return
    except Exception as e:
        logger.error(f"❌ Error loading guidance-config.json: {e}")
        await websocket.accept()
        await websocket.send_json({
            'status': 'error',
            'message': f'Configuration error: {str(e)}'
        })
        await websocket.close()
        return
    
    await websocket.accept()
    websocket.connection_time = time.time()
    
    # Get topic configuration
    topic_config = CONFIG["topics"].get(topic, CONFIG["topics"][CONFIG["default_topic"]])
    
    # Get topic-specific configurations
    feedback_refresh_interval = topic_config.get("feedback_refresh_interval", 15000) / 1000
    guidance_refresh_interval = topic_config.get("guidance_refresh_interval", 15000) / 1000
    transcription_chunk_size = topic_config.get("transcription_chunk_size", 4)
    llm_context_max_words = topic_config.get("llm_context_max_words", 1000)
    
    print(f"🧠 Guidance WebSocket connected - Language: {language}, Topic: {topic}")
    print(f"   Feedback refresh: {feedback_refresh_interval}s, Guidance refresh: {guidance_refresh_interval}s")
    print(f"   Transcription chunk size: {transcription_chunk_size}")
    print(f"   LLM Context Max Words: {llm_context_max_words}")
    
    # Send initial connection confirmation with chunk size
    await websocket.send_json({
        'status': 'connected',
        'message': 'AI guidance service ready',
        'feedback_refresh_interval': feedback_refresh_interval,
        'guidance_refresh_interval': guidance_refresh_interval,
        'transcription_chunk_size': transcription_chunk_size
    })
    
    # Initialize state with thread-safe queues
    client = LLMClient()
    last_transcription = ""
    is_active = True
    
    # Queues for thread communication
    feedback_queue = queue.Queue(maxsize=2)
    guidance_queue = queue.Queue(maxsize=2)
    stop_event = threading.Event()
    
    print(f"🧠 Guidance WebSocket connected - Language: {language}, Topic: {topic}")
    print(f"   Feedback refresh: {feedback_refresh_interval}s, Guidance refresh: {guidance_refresh_interval}s")
    print(f"   Using topic config: {topic}")
    
    def process_feedback_worker():
        """Background worker for feedback generation"""
        while not stop_event.is_set():
            try:
                # Get transcription from queue with timeout
                transcription = feedback_queue.get(timeout=0.5)
                
                if transcription and len(transcription.strip()) > 10:
                    try:
                        # ⭐ APPLY TRUNCATION
                        limited_transcription = truncate_transcription(transcription, topic_config["llm_context_max_words"])
                        
                        # ✅ ADD: Log the actual text being sent to LLM for feedback
                        word_count = len(limited_transcription.split()) # Use limited count
                        print(f"🧠 FEEDBACK LLM INPUT ({word_count} words): '{limited_transcription[:100]}{'...' if len(limited_transcription) > 100 else ''}'")
                        
                        # Time the processing
                        start_time = time.time()
                        
                        # Generate feedback using LLM with the selected topic config
                        # ⭐ PASS LIMITED TRANSCRIPTION
                        feedback = generate_feedback_sync(client, limited_transcription, topic_config["feedback_prompt"], language)
                        
                        process_time = time.time() - start_time
                        if process_time > 5.0:
                            print(f"⏱️  Feedback LLM took {process_time:.1f}s")
                        
                        # Send result back via queue (we'll handle sending in main thread)
                        result = {
                            'type': 'feedback',
                            'content': feedback,
                            'timestamp': time.time(),
                            'topic': topic
                        }
                        
                        # Put result in a way that main thread can pick it up
                        if hasattr(websocket, '_last_feedback'):
                            websocket._last_feedback = result
                            
                    except Exception as e:
                        logger.error(f"Feedback worker error: {e}")
                        if hasattr(websocket, '_last_feedback'):
                            websocket._last_feedback = {
                                'type': 'feedback',
                                'content': "جاري تحليل المحتوى...",
                                'error': True,
                                'topic': topic
                            }
                
                feedback_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Feedback worker thread error: {e}")
    
    def process_guidance_worker():
        """Background worker for guidance generation"""
        while not stop_event.is_set():
            try:
                # Get transcription from queue with timeout
                transcription = guidance_queue.get(timeout=0.5)
                
                if transcription and len(transcription.strip()) > 10:
                    try:
                        # ⭐ APPLY TRUNCATION
                        limited_transcription = truncate_transcription(transcription, topic_config["llm_context_max_words"])
                        
                        # ✅ ADD: Log the actual text being sent to LLM for guidance
                        word_count = len(limited_transcription.split()) # Use limited count
                        print(f"🧠 GUIDANCE LLM INPUT ({word_count} words): '{limited_transcription[:100]}{'...' if len(limited_transcription) > 100 else ''}'")
                        
                        # Time the processing
                        start_time = time.time()
                        
                        # Generate guidance using LLM with the selected topic config
                        # ⭐ PASS LIMITED TRANSCRIPTION
                        guidance = generate_guidance_sync(client, limited_transcription, topic_config["guidance_prompt"], language)
                        
                        process_time = time.time() - start_time
                        if process_time > 5.0:
                            print(f"⏱️  Guidance LLM took {process_time:.1f}s")
                        
                        # Send result back via queue (we'll handle sending in main thread)
                        result = {
                            'type': 'guidance',
                            'content': guidance,
                            'timestamp': time.time(),
                            'topic': topic
                        }
                        
                        # Put result in a way that main thread can pick it up
                        if hasattr(websocket, '_last_guidance'):
                            websocket._last_guidance = result
                            
                    except Exception as e:
                        logger.error(f"Guidance worker error: {e}")
                        if hasattr(websocket, '_last_guidance'):
                            websocket._last_guidance = {
                                'type': 'guidance',
                                'content': "جاري إعداد التوجيهات...",
                                'error': True,
                                'topic': topic
                            }
                
                guidance_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Guidance worker thread error: {e}")
    
    # Start worker threads
    feedback_thread = threading.Thread(target=process_feedback_worker, daemon=True)
    guidance_thread = threading.Thread(target=process_guidance_worker, daemon=True)
    feedback_thread.start()
    guidance_thread.start()
    
    # Initialize result storage
    websocket._last_feedback = None
    websocket._last_guidance = None
    websocket._last_feedback_time = 0
    websocket._last_guidance_time = 0
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            'status': 'connected',
            'message': 'AI guidance service ready',
            'feedback_refresh_interval': feedback_refresh_interval,
            'guidance_refresh_interval': guidance_refresh_interval,
            'topic': topic
        })
        
        async def receive_messages():
            """Receive transcription updates from client"""
            nonlocal last_transcription, is_active
            
            while is_active:
                try:
                    # Receive text messages with timeout
                    message = await asyncio.wait_for(
                        websocket.receive_text(), 
                        timeout=0.1
                    )
                    
                    data = json.loads(message)
                    
                    if data.get('action') == 'update_transcription':
                        new_transcription = data.get('transcription', '')
                        if new_transcription != last_transcription:
                            last_transcription = new_transcription
                            
                            # Send to worker threads if they're not busy
                            try:
                                feedback_queue.put_nowait(new_transcription)
                            except queue.Full:
                                pass
                                
                            try:
                                guidance_queue.put_nowait(new_transcription)
                            except queue.Full:
                                pass
                    
                    elif data.get('action') == 'stop':
                        print("🛑 Guidance session stopped by client")
                        is_active = False
                        break
                        
                except asyncio.TimeoutError:
                    continue
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON received")
                except Exception as e:
                    logger.error(f"Receive error: {e}")
                    break
        
        async def send_results():
            """Send results back to client from worker threads"""
            nonlocal is_active

            while is_active:
                current_time = time.time()

                # Feedback: send if first result and enough time passed since connection,
                # or if subsequent result and enough time passed since last send
                if websocket._last_feedback:
                    if websocket._last_feedback_time == 0:
                        # First feedback: wait until interval from connection start
                        if current_time - websocket.connection_time >= feedback_refresh_interval:
                            try:
                                await websocket.send_json(websocket._last_feedback)
                                websocket._last_feedback_time = current_time
                                websocket._last_feedback = None
                                print("✅ Sent feedback update")
                            except Exception as e:
                                logger.error(f"Error sending feedback: {e}")
                    else:
                        # Subsequent feedback: normal interval check
                        if current_time - websocket._last_feedback_time >= feedback_refresh_interval:
                            try:
                                await websocket.send_json(websocket._last_feedback)
                                websocket._last_feedback_time = current_time
                                websocket._last_feedback = None
                                print("✅ Sent feedback update")
                            except Exception as e:
                                logger.error(f"Error sending feedback: {e}")

                # Guidance: same logic
                if websocket._last_guidance:
                    if websocket._last_guidance_time == 0:
                        if current_time - websocket.connection_time >= guidance_refresh_interval:
                            try:
                                await websocket.send_json(websocket._last_guidance)
                                websocket._last_guidance_time = current_time
                                websocket._last_guidance = None
                                print("✅ Sent guidance update")
                            except Exception as e:
                                logger.error(f"Error sending guidance: {e}")
                    else:
                        if current_time - websocket._last_guidance_time >= guidance_refresh_interval:
                            try:
                                await websocket.send_json(websocket._last_guidance)
                                websocket._last_guidance_time = current_time
                                websocket._last_guidance = None
                                print("✅ Sent guidance update")
                            except Exception as e:
                                logger.error(f"Error sending guidance: {e}")

                await asyncio.sleep(0.1)
        
        # Run both coroutines concurrently
        await asyncio.gather(
            receive_messages(),
            send_results(),
            return_exceptions=True
        )
        
    except WebSocketDisconnect:
        print("✓ Client disconnected from guidance service")
    except Exception as e:
        logger.error(f"Guidance WebSocket error: {e}")
    finally:
        is_active = False
        stop_event.set()
        
        # Wait for threads to finish
        feedback_thread.join(timeout=1.0)
        guidance_thread.join(timeout=1.0)
        
        try:
            await websocket.close()
        except:
            pass
        print("🧠 Guidance WebSocket closed")

def truncate_transcription(transcription: str, max_words: int) -> str:
    """Truncate the transcription to the last N words."""
    words = transcription.split()
    if len(words) > max_words:
        # Keep only the last max_words
        return " ".join(words[-max_words:])
    return transcription

def generate_feedback_sync(client: LLMClient, transcription: str, prompt: str, language: str) -> str:
    """Generate content feedback using LLM (synchronous for thread)"""
    language_instruction = "Arabic" if language == "ar" else "English"
    
    user_prompt = f"""
    {prompt}
    
    IMPORTANT: The speech content is in {language_instruction}. You MUST respond in {language_instruction}.
    
    TRANSCRIPTION: {transcription}
    
    Provide only the most important factual feedback that would help the speaker improve content accuracy.
    Keep it very brief (1-2 sentences).
    """
    
    # Errors propagate to the worker, which sends the result with 'error': True
    response = client.generate_response(prompt, user_prompt)
    result = json.loads(client._extract_and_repair_json(response))
    text = result.get('feedback') if isinstance(result, dict) else None
    if not text:
        raise ValueError("LLM reply has no 'feedback' field")
    return text


def generate_guidance_sync(client: LLMClient, transcription: str, prompt: str, language: str) -> str:
    """Generate speaking guidance using LLM (synchronous for thread)"""
    language_instruction = "Arabic" if language == "ar" else "English"
    
    user_prompt = f"""
    {prompt}
    
    IMPORTANT: The speech content is in {language_instruction}. You MUST respond in {language_instruction}.
    
    RECENT CONTENT: {transcription}
    
    Suggest the most valuable next points or improvements to make.
    Keep it very brief (1-2 sentences).
    """
    
    # Errors propagate to the worker, which sends the result with 'error': True
    response = client.generate_response(prompt, user_prompt)
    result = json.loads(client._extract_and_repair_json(response))
    text = result.get('guidance') if isinstance(result, dict) else None
    if not text:
        raise ValueError("LLM reply has no 'guidance' field")
    return text
    
def detect_language_from_transcription(transcription: str) -> str:
    """Simple language detection based on Arabic characters"""
    # Count Arabic characters
    arabic_chars = sum(1 for char in transcription if '\u0600' <= char <= '\u06FF')
    total_chars = len([char for char in transcription if char.isalpha()])
    
    if total_chars > 0 and (arabic_chars / total_chars) > 0.3:
        return 'ar'
    return 'en'
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.clients.llm_client import LLMClient
import json
import asyncio
import time
import logging
import queue
import threading

router = APIRouter()
logger = logging.getLogger(__name__)

SENTIMENT_SYSTEM_PROMPT = """You are a speech sentiment analyzer. Analyze the emotional tone of the speaker's words.
Consider the overall context, phrasing, and intent — not individual keywords.
Respond in valid JSON only."""

SENTIMENT_USER_PROMPT_TEMPLATE = """Analyze the sentiment of this speech transcript.
Language: {language_name}
Transcript: "{transcription}"

Return ONLY valid JSON in this exact format (no other text):
{{
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": <float between -1.0 and 1.0>,
  "confidence": <float between 0.0 and 1.0>,
  "reason": "<short 1-sentence explanation>",
  "intent": "إقناع" | "إعلام" | "تحفيز" | "توجيه" | "غير محدد",
  "intensity": "منخفض" | "متوسط" | "عالٍ",
  "urgency": "منخفض" | "متوسط" | "عالٍ"
}}"""


@router.websocket("/ws/sentiments")
async def sentiments_websocket_endpoint(
    websocket: WebSocket,
    language: str = Query(default="ar", regex="^(ar|en)$"),
    topic: str = Query(default="lecture")
):
    session_language = language

    await websocket.accept()

    print(f"💬 Sentiments WebSocket connected - Language: {language}, Topic: {topic}")

    await websocket.send_json({
        'status': 'connected',
        'message': 'Sentiment analysis service ready'
    })

    client = LLMClient()
    last_transcription = ""
    is_active = True

    sentiment_queue = queue.Queue(maxsize=2)
    stop_event = threading.Event()

    def process_sentiment_worker():
        while not stop_event.is_set():
            try:
                transcription = sentiment_queue.get(timeout=0.5)

                if transcription and len(transcription.strip()) > 10:
                    try:
                        language_name = "Arabic" if session_language == "ar" else "English"

                        user_prompt = SENTIMENT_USER_PROMPT_TEMPLATE.format(
                            language_name=language_name,
                            transcription=transcription
                        )

                        word_count = len(transcription.split())
                        print(f"💬 SENTIMENT LLM INPUT ({word_count} words): '{transcription[:100]}{'...' if len(transcription) > 100 else ''}'")

                        start_time = time.time()
                        response = client.generate_response(SENTIMENT_SYSTEM_PROMPT, user_prompt)
                        process_time = time.time() - start_time

                        try:
                            result = json.loads(client._extract_and_repair_json(response))
                        except json.JSONDecodeError:
                            logger.warning(f"LM returned invalid JSON: {response[:200]}")
                            result = {
                                "error": True,
                                "sentiment": "neutral",
                                "sentiment_score": 0.0,
                                "confidence": 0.0,
                                "reason": "Failed to parse LM response",
                                "intent": "غير محدد",
                                "intensity": "متوسط",
                                "urgency": "متوسط"
                            }

                        if process_time > 3.0:
                            print(f"⏱️  Sentiment LLM took {process_time:.1f}s")

                        payload = {
                            'type': 'sentiment',
                            'error': bool(result.get('error')),
                            'content': {
                                'sentiment': result.get('sentiment', 'neutral'),
                                'sentiment_score': float(result.get('sentiment_score', 0.0)),
                                'confidence': float(result.get('confidence', 0.0)),
                                'reason': result.get('reason', ''),
                                'language': session_language,
                                'intent': result.get('intent', 'غير محدد'),
                                'intensity': result.get('intensity', 'متوسط'),
                                'urgency': result.get('urgency', 'متوسط')
                            }
                        }

                        if hasattr(websocket, '_last_sentiment'):
                            websocket._last_sentiment = payload

                    except Exception as e:
                        logger.error(f"Sentiment worker error: {e}")
                        if hasattr(websocket, '_last_sentiment'):
                            websocket._last_sentiment = {
                                'type': 'sentiment',
                                'error': True,
                                'content': {
                                    'sentiment': 'neutral',
                                    'sentiment_score': 0.0,
                                    'confidence': 0.0,
                                    'reason': '',
                                    'language': session_language,
                                    'intent': 'غير محدد',
                                    'intensity': 'متوسط',
                                    'urgency': 'متوسط'
                                }
                            }

                sentiment_queue.task_done()

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Sentiment worker thread error: {e}")

    sentiment_thread = threading.Thread(target=process_sentiment_worker, daemon=True)
    sentiment_thread.start()

    websocket._last_sentiment = None
    websocket._last_sentiment_time = 0

    try:
        async def receive_messages():
            nonlocal last_transcription, is_active

            while is_active:
                try:
                    message = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=0.1
                    )

                    data = json.loads(message)

                    if data.get('action') == 'update_transcription':
                        new_transcription = data.get('transcription', '')
                        if new_transcription != last_transcription and len(new_transcription.strip()) > 10:
                            last_transcription = new_transcription
                            try:
                                sentiment_queue.put_nowait(new_transcription)
                            except queue.Full:
                                pass

                    elif data.get('action') == 'stop':
                        print("🛑 Sentiments session stopped by client")
                        is_active = False
                        break

                except asyncio.TimeoutError:
                    continue
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON received on sentiments WS")
                except Exception as e:
                    logger.error(f"Sentiments receive error: {e}")
                    break

        async def send_results():
            nonlocal is_active
            cooldown = 3.0

            while is_active:
                current_time = time.time()

                if (websocket._last_sentiment is not None and
                    current_time - websocket._last_sentiment_time >= cooldown):

                    try:
                        await websocket.send_json(websocket._last_sentiment)
                        websocket._last_sentiment_time = current_time
                        websocket._last_sentiment = None
                    except Exception as e:
                        logger.error(f"Error sending sentiment: {e}")

                await asyncio.sleep(0.1)

        await asyncio.gather(
            receive_messages(),
            send_results(),
            return_exceptions=True
        )

    except WebSocketDisconnect:
        print("✓ Client disconnected from sentiments service")
    except Exception as e:
        logger.error(f"Sentiments WebSocket error: {e}")
    finally:
        is_active = False
        stop_event.set()
        sentiment_thread.join(timeout=1.0)
        try:
            await websocket.close()
        except:
            pass
        print("💬 Sentiments WebSocket closed")

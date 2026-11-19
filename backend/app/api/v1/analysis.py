from fastapi import APIRouter, HTTPException
from app.clients.llm_client import LLMClient
import json
import logging

# Set up logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


@router.post("/audio-summary")
async def analyze_audio_summary(analysis_request: dict):
    """Generate brief audio summary for score card"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert speech coach. Provide a VERY concise one-sentence analysis for display under an audio score gauge.
        Respond in {language_instruction} ONLY.
        Respond ONLY with valid JSON in this format:
        {{"audio_description": "Your one-sentence analysis here"}}
        
        IMPORTANT JSON RULES:
        - Escape ALL double quotes inside string values using backslash: \\"
        - Do not use unescaped quotation marks inside JSON strings
        - Ensure the JSON is properly formatted and valid"""
        
        user_prompt = f"""
        Based on these audio metrics, provide a single concise sentence in {language_instruction} summarizing the performance:
        
        - Speaking Pace: {analysis_request.get('wpm', 0)} WPM
        - Filler Words: {analysis_request.get('total_fillers', 0)} total
        - Vocabulary Diversity: {analysis_request.get('vocab_diversity', 0) * 100:.1f}%
        - Sentiment: {analysis_request.get('sentiment_label', 'neutral')}
        - Score: {analysis_request.get('score', 0)}%
        
        Make it brief and suitable for display under a progress gauge.
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Audio summary failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        return {
            "audio_description": "أداء صوتي جيد مع مجال للتحسين." if language == 'ar' 
            else "Good audio performance with room for improvement."
        }


@router.post("/visual-summary")
async def analyze_visual_summary(analysis_request: dict):
    """Generate brief visual summary for score card"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert presentation coach. Provide a VERY concise one-sentence analysis for display under a visual score gauge.
        Respond in {language_instruction} ONLY.
        Respond ONLY with valid JSON in this format:
        {{"visual_description": "Your one-sentence analysis here"}}
        
        IMPORTANT JSON RULES:
        - Escape ALL double quotes inside string values using backslash: \\"
        - Do not use unescaped quotation marks inside JSON strings
        - Ensure the JSON is properly formatted and valid"""
        
        user_prompt = f"""
        Based on these visual metrics, provide a single concise sentence in {language_instruction} summarizing the performance:
        
        - Eye Contact: {analysis_request.get('eye_contact', 0):.1f}%
        - Posture Quality: {analysis_request.get('posture_quality', 0):.1f}%
        - Hand Gestures: {analysis_request.get('hand_gestures', 0):.1f}
        - Facial Expression: {analysis_request.get('facial_expression', 0):.1f}%
        - Score: {analysis_request.get('score', 0)}%
        
        Make it brief and suitable for display under a progress gauge.
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Visual summary failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        return {
            "visual_description": "لغة جسد مناسبة مع بعض المجالات للتحسين." if language == 'ar'
            else "Appropriate body language with some areas for improvement."
        }


@router.post("/audio")
async def analyze_audio(analysis_request: dict):
    """Generate detailed audio analysis using LLM"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert speech coach analyzing presentation audio metrics. 
        Provide a detailed, professional analysis in {language_instruction} (3-4 sentences). 
        Respond ONLY with valid JSON in this format:
        {{"audio_description": "Your detailed analysis here"}}
        
        IMPORTANT JSON RULES:
        - Escape ALL double quotes inside string values using backslash: \\"
        - Do not use unescaped quotation marks inside JSON strings
        - Ensure the JSON is properly formatted and valid"""
        
        user_prompt = f"""
        Analyze these audio metrics and provide a detailed analysis in {language_instruction} (3-4 sentences):
        
        SPEAKING PERFORMANCE:
        - Speaking Pace: {analysis_request.get('wpm', 0)} WPM (ideal range: 120-160 WPM)
        - Filler Words: {analysis_request.get('total_fillers', 0)} total fillers used
        - Vocabulary Diversity: {analysis_request.get('vocab_diversity', 0) * 100:.1f}% unique words
        - Sentiment: {analysis_request.get('sentiment_label', 'neutral')} overall tone
        - Total Words: {analysis_request.get('total_words', 0)} words spoken
        - Session Duration: {analysis_request.get('duration', 0)} seconds
        
        Provide detailed feedback on:
        1. Speaking pace and clarity
        2. Use of filler words and speech flow
        3. Vocabulary richness and expression
        4. Overall vocal delivery strengths and areas for improvement
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Audio analysis failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        return {
            "audio_description": generate_static_audio_analysis(language)
        }


@router.post("/visual")
async def analyze_visual(analysis_request: dict):
    """Generate detailed visual analysis using LLM"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert presentation coach analyzing body language metrics. 
        Provide a detailed, professional analysis in {language_instruction} (3-4 sentences).
        Respond ONLY with valid JSON in this format:
        {{"visual_description": "Your detailed analysis here"}}
        
        IMPORTANT JSON RULES:
        - Escape ALL double quotes inside string values using backslash: \\"
        - Do not use unescaped quotation marks inside JSON strings
        - Ensure the JSON is properly formatted and valid"""
        
        user_prompt = f"""
        Analyze these visual presentation metrics and provide a detailed analysis in {language_instruction} (3-4 sentences):
        
        BODY LANGUAGE PERFORMANCE:
        - Eye Contact: {analysis_request.get('eye_contact', 0):.1f}% time maintaining eye contact
        - Posture Quality: {analysis_request.get('posture_quality', 0):.1f}% good posture maintenance
        - Hand Gestures: {analysis_request.get('hand_gestures', 0):.1f} gesture frequency score
        - Facial Expression: {analysis_request.get('facial_expression', 0):.1f}% positive facial expressions
        
        Provide detailed feedback on:
        1. Eye contact effectiveness and engagement
        2. Posture and physical presence
        3. Use of hand gestures and body movement
        4. Facial expressions and non-verbal communication
        5. Overall body language strengths and areas for improvement
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Visual analysis failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        return {
            "visual_description": generate_static_visual_analysis(language)
        }


@router.post("/comprehensive")
async def analyze_comprehensive(analysis_request: dict):
    """Generate comprehensive AI analysis using LLM"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert presentation and public speaking coach. 
        Provide a comprehensive analysis in {language_instruction}. Respond ONLY with valid JSON in this exact format:
        {{
            "summary": "Overall performance summary...",
            "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
            "action_items": ["Action item 1", "Action item 2", "Action item 3"]
        }}
        
        IMPORTANT JSON RULES:
        - Escape ALL double quotes inside string values using backslash: \\"
        - Do not use unescaped quotation marks inside JSON strings
        - Ensure the JSON is properly formatted and valid
        - Use double quotes for all JSON strings and property names
        - Write ALL content in {language_instruction}"""
        
        user_prompt = f"""
        Analyze this complete presentation session and provide comprehensive feedback in {language_instruction}:
        
        AUDIO METRICS:
        - Speaking Pace: {analysis_request.get('audio', {}).get('wpm', 0)} WPM
        - Filler Words: {analysis_request.get('audio', {}).get('total_fillers', 0)} total
        - Vocabulary Diversity: {analysis_request.get('audio', {}).get('vocab_diversity', 0) * 100:.1f}%
        - Sentiment: {analysis_request.get('audio', {}).get('sentiment_label', 'neutral')}
        
        VISUAL METRICS:
        - Eye Contact: {analysis_request.get('visual', {}).get('eye_contact', 0):.1f}%
        - Posture Quality: {analysis_request.get('visual', {}).get('posture_quality', 0):.1f}%
        - Hand Gestures: {analysis_request.get('visual', {}).get('hand_gestures', 0):.1f}
        - Facial Expression: {analysis_request.get('visual', {}).get('facial_expression', 0):.1f}%
        
        SESSION INFO:
        - Duration: {analysis_request.get('duration', 0)} seconds
        - Total Words: {analysis_request.get('audio', {}).get('total_words', 0)}
        
        Provide:
        1. A comprehensive summary of overall performance in {language_instruction}
        2. 3 specific recommendations for improvement in {language_instruction}
        3. 3 actionable practice exercises in {language_instruction}
        
        Remember to escape all double quotes in your JSON response and write everything in {language_instruction}.
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        if language == 'ar':
            return {
                "summary": "التقييم الشامل غير متوفر حالياً.",
                "recommendations": ["جرّب تحسين سرعة الكلام", "ركز على تقليل الكلمات الحشوية", "حسّن التواصل البصري"],
                "action_items": ["سجل نفسك وتدرب على السرعة المناسبة", "استبدل الكلمات الحشوية بوقفات هادفة", "تدرب على التواصل البصري مع المرآة"]
            }
        else:
            return {
                "summary": "Comprehensive evaluation is not currently available.",
                "recommendations": ["Try improving speaking pace", "Focus on reducing filler words", "Enhance eye contact"],
                "action_items": ["Record yourself and practice appropriate speed", "Replace filler words with purposeful pauses", "Practice eye contact with a mirror"]
            }


@router.post("/summary")
async def analyze_summary(analysis_request: dict):
    """Generate overall performance summary"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert presentation and public speaking coach. 
        Provide a comprehensive performance summary in {language_instruction} (2-3 sentences).
        Respond ONLY with valid JSON in this exact format:
        {{
            "summary": "Overall performance summary..."
        }}
        
        IMPORTANT JSON RULES:
        - Escape ALL double quotes inside string values using backslash: \\"
        - Do not use unescaped quotation marks inside JSON strings
        - Ensure the JSON is properly formatted and valid
        - Use double quotes for all JSON strings and property names
        - Write the summary in {language_instruction}"""
        
        user_prompt = f"""
        Analyze this presentation session and provide a comprehensive summary in {language_instruction} (2-3 sentences):
        
        AUDIO METRICS:
        - Speaking Pace: {analysis_request.get('audio', {}).get('wpm', 0)} WPM
        - Filler Words: {analysis_request.get('audio', {}).get('total_fillers', 0)} total
        - Vocabulary Diversity: {analysis_request.get('audio', {}).get('vocab_diversity', 0) * 100:.1f}%
        - Sentiment: {analysis_request.get('audio', {}).get('sentiment_label', 'neutral')}
        
        VISUAL METRICS:
        - Eye Contact: {analysis_request.get('visual', {}).get('eye_contact', 0):.1f}%
        - Posture Quality: {analysis_request.get('visual', {}).get('posture_quality', 0):.1f}%
        - Hand Gestures: {analysis_request.get('visual', {}).get('hand_gestures', 0):.1f}
        - Facial Expression: {analysis_request.get('visual', {}).get('facial_expression', 0):.1f}%
        
        SESSION INFO:
        - Duration: {analysis_request.get('duration', 0)} seconds
        - Total Words: {analysis_request.get('audio', {}).get('total_words', 0)}
        
        Provide a balanced summary that highlights both strengths and areas for improvement.
        Focus on the overall performance and key takeaways.
        Write in {language_instruction}.
        
        Remember to escape all double quotes in your JSON response.
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Summary analysis failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        return {
            "summary": "التقييم الشامل غير متوفر حالياً." if language == 'ar'
            else "Comprehensive evaluation is not currently available."
        }


@router.post("/recommendations")
async def analyze_recommendations(analysis_request: dict):
    """Generate specific recommendations for improvement"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert presentation and public speaking coach. 
        Provide 3 specific, actionable recommendations for improvement in {language_instruction}.
        Respond ONLY with valid JSON in this exact format:
        {{
            "recommendations": ["Recommendation 1 text", "Recommendation 2 text", "Recommendation 3 text"]
        }}
        
        CRITICAL RULES:
        - Return ONLY a simple array of strings, NOT objects with nested properties
        - Each recommendation should be a single string in {language_instruction}
        - Do NOT include English translations or additional metadata
        - Each string should be a complete, actionable recommendation
        - Escape ALL double quotes inside string values using backslash: \\"
        - Ensure the JSON is properly formatted and valid
        - Use double quotes for all JSON strings and property names
        - Write ALL content in {language_instruction}"""
        
        user_prompt = f"""
        Based on these presentation metrics, provide 3 specific, actionable recommendations for improvement in {language_instruction}:
        
        AUDIO METRICS:
        - Speaking Pace: {analysis_request.get('audio', {}).get('wpm', 0)} WPM
        - Filler Words: {analysis_request.get('audio', {}).get('total_fillers', 0)} total
        - Vocabulary Diversity: {analysis_request.get('audio', {}).get('vocab_diversity', 0) * 100:.1f}%
        - Sentiment: {analysis_request.get('audio', {}).get('sentiment_label', 'neutral')}
        
        VISUAL METRICS:
        - Eye Contact: {analysis_request.get('visual', {}).get('eye_contact', 0):.1f}%
        - Posture Quality: {analysis_request.get('visual', {}).get('posture_quality', 0):.1f}%
        - Hand Gestures: {analysis_request.get('visual', {}).get('hand_gestures', 0):.1f}
        - Facial Expression: {analysis_request.get('visual', {}).get('facial_expression', 0):.1f}%
        
        Focus on the most impactful areas for improvement. Make each recommendation:
        - Specific and actionable
        - Based on the metrics provided
        - Practical and easy to implement
        - Written in clear, concise {language_instruction} as a single string
        
        Provide exactly 3 recommendations as simple strings in an array.
        
        Example of correct format (in {language_instruction}):
        {{
            "recommendations": [
                "Try to reduce speaking speed to 120-160 words per minute",
                "Focus on reducing filler words like 'um' and 'uh'", 
                "Improve eye contact with the audience by at least 70%"
            ]
        }}
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Recommendations analysis failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        if language == 'ar':
            return {
                "recommendations": [
                    "جرّب تحسين سرعة الكلام", 
                    "ركز على تقليل الكلمات الحشوية", 
                    "حسّن التواصل البصري"
                ]
            }
        else:
            return {
                "recommendations": [
                    "Try improving speaking pace", 
                    "Focus on reducing filler words", 
                    "Enhance eye contact"
                ]
            }


@router.post("/action-items")
async def analyze_action_items(analysis_request: dict):
    """Generate actionable practice exercises"""
    try:
        client = LLMClient()
        
        # Get language from request, default to Arabic
        language = analysis_request.get('language', 'ar')
        language_instruction = "Arabic" if language == "ar" else "English"
        
        system_prompt = f"""You are an expert presentation and public speaking coach. 
        Provide 3 actionable practice exercises in {language_instruction}.
        Respond ONLY with valid JSON in this exact format:
        {{
            "action_items": ["Action item 1 text", "Action item 2 text", "Action item 3 text"]
        }}
        
        CRITICAL RULES:
        - Return ONLY a simple array of strings, NOT objects with nested properties
        - Each action item should be a single string in {language_instruction} describing the exercise
        - Do NOT include English translations, titles, or additional metadata
        - Each string should be a complete, actionable exercise description
        - Escape ALL double quotes inside string values using backslash: \\"
        - Ensure the JSON is properly formatted and valid
        - Use double quotes for all JSON strings and property names
        - Write ALL content in {language_instruction}"""
        
        user_prompt = f"""
        Based on these presentation metrics, provide 3 actionable practice exercises in {language_instruction}:
        
        AUDIO METRICS:
        - Speaking Pace: {analysis_request.get('audio', {}).get('wpm', 0)} WPM
        - Filler Words: {analysis_request.get('audio', {}).get('total_fillers', 0)} total
        - Vocabulary Diversity: {analysis_request.get('audio', {}).get('vocab_diversity', 0) * 100:.1f}%
        - Sentiment: {analysis_request.get('audio', {}).get('sentiment_label', 'neutral')}
        
        VISUAL METRICS:
        - Eye Contact: {analysis_request.get('visual', {}).get('eye_contact', 0):.1f}%
        - Posture Quality: {analysis_request.get('visual', {}).get('posture_quality', 0):.1f}%
        - Hand Gestures: {analysis_request.get('visual', {}).get('hand_gestures', 0):.1f}
        - Facial Expression: {analysis_request.get('visual', {}).get('facial_expression', 0):.1f}%
        
        Create practical exercises that:
        - Address specific weaknesses identified in the metrics
        - Can be practiced independently
        - Have clear steps or instructions within the single string
        - Will lead to measurable improvement
        - Are written in clear, instructional {language_instruction}
        
        Provide exactly 3 action items as simple strings in an array.
        
        Example of correct format (in {language_instruction}):
        {{
            "action_items": [
                "Record yourself speaking for 2 minutes then listen to the recording focusing on reducing filler words",
                "Practice eye contact by speaking in front of a mirror for 5 minutes daily",
                "Read a text aloud focusing on varying your vocal tone every 30 seconds"
            ]
        }}
        """
        
        response = client.generate_response(system_prompt, user_prompt)
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Action items analysis failed: {str(e)}")
        language = analysis_request.get('language', 'ar')
        if language == 'ar':
            return {
                "action_items": [
                    "سجل نفسك وتدرب على السرعة المناسبة", 
                    "استبدل الكلمات الحشوية بوقفات هادفة", 
                    "تدرب على التواصل البصري مع المرآة"
                ]
            }
        else:
            return {
                "action_items": [
                    "Record yourself and practice appropriate speed", 
                    "Replace filler words with purposeful pauses", 
                    "Practice eye contact with a mirror"
                ]
            }


def generate_static_audio_analysis(language="ar"):
    if language == 'ar':
        return "أداء صوتي متوازن مع سرعة كلام مناسبة. هناك مجال لتحسين تنوع النبرة الصوتية وتقليل استخدام الكلمات الحشوية. المفردات المستخدمة جيدة ولكن يمكن تنويعها أكثر لإضافة تأثير أقوى على المستمع."
    else:
        return "Balanced audio performance with appropriate speaking pace. There is room for improving vocal tone variety and reducing filler word usage. The vocabulary used is good but could be diversified more to add stronger impact on the listener."


def generate_static_visual_analysis(language="ar"):
    if language == 'ar':
        return "لغة جسد واثقة مع تواصل بصري فعال. الوضعية العامة جيدة ولكن يمكن تحسين استمرارية التواصل البصري. الإيماءات اليدين مناسبة وتساعد في توصيل الرسالة بشكل أفضل."
    else:
        return "Confident body language with effective eye contact. General posture is good but eye contact continuity could be improved. Hand gestures are appropriate and help in delivering the message better."
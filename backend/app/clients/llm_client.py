# file name: llm_client.py
"""
Generic LLM client that works with multiple LLM providers.
Configuration is managed via environment variables following 12-factor app principles.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, Optional, Generator
from enum import Enum
import re

logger = logging.getLogger(__name__)

class LLMProvider(Enum):
    """Supported LLM providers"""
    LM_STUDIO = "lm_studio"
    OPENAI = "openai"
    OLLAMA = "ollama"
    HUGGINGFACE = "huggingface"
    CUSTOM = "custom"

class LLMClient:
    """
    Generic LLM client configured via environment variables.
    
    Environment Variables:
        LLM_PROVIDER: One of: lm_studio, openai, ollama, huggingface, custom (default: lm_studio)
        LLM_BASE_URL: API base URL (provider-specific default)
        LLM_API_KEY: API key (provider-specific default)
        LLM_MODEL: Model name (provider-specific default)
        LLM_TEMPERATURE: Temperature for generation (default: 0.1)
        LLM_MAX_TOKENS: Maximum tokens to generate (default: 2000)
        LLM_TIMEOUT: Request timeout in seconds (default: 120)
        LLM_MAX_RETRIES: Maximum retry attempts (default: 3)
    
    Example .env file:
        LLM_PROVIDER=openai
        LLM_BASE_URL=https://api.openai.com/v1
        LLM_API_KEY=sk-your-key-here
        LLM_MODEL=gpt-4
        LLM_TEMPERATURE=0.1
        LLM_MAX_TOKENS=2000
    """
    
    def __init__(self, **kwargs):
        """
        Initialize LLM client with configuration.
        
        Args:
            **kwargs: Optional parameter overrides that take precedence over env vars.
                     Supported: provider, base_url, api_key, model, temperature,
                               max_tokens, timeout, max_retries
        """
        # Determine provider
        provider_name = kwargs.get('provider') or os.getenv('LLM_PROVIDER', 'lm_studio')
        try:
            self.provider = LLMProvider(provider_name.lower())
        except ValueError:
            logger.warning(f"Unknown provider '{provider_name}', defaulting to 'lm_studio'")
            self.provider = LLMProvider.LM_STUDIO
        
        # Get configuration with precedence: kwargs > env vars > defaults
        self.base_url = self._get_config_value('base_url', kwargs, self._get_default_base_url())
        self.api_key = self._get_config_value('api_key', kwargs, self._get_default_api_key())
        self.model_name = self._get_config_value('model', kwargs, self._get_default_model())
        
        # Get common settings
        self.temperature = float(self._get_config_value('temperature', kwargs, '0.1'))
        self.max_tokens = int(self._get_config_value('max_tokens', kwargs, '2000'))
        self.timeout = int(self._get_config_value('timeout', kwargs, '120'))
        self.max_retries = int(self._get_config_value('max_retries', kwargs, '3'))
        
        # Setup headers
        self.headers = {
            "Content-Type": "application/json"
        }
        
        # Add authorization if API key is provided and not "none"
        if self.api_key and self.api_key.lower() != "none":
            self.headers["Authorization"] = f"Bearer {self.api_key}"
        
        # Log initialization
        logger.info(f"✅ Initialized LLMClient: provider={self.provider.value}, model={self.model_name}")
        logger.debug(f"Configuration: base_url={self.base_url}, timeout={self.timeout}s")
    
    def _get_config_value(self, key: str, kwargs: Dict[str, Any], default: str) -> str:
        """
        Get configuration value with precedence: kwargs > env var > default.
        
        Args:
            key: Configuration key
            kwargs: Keyword arguments passed to constructor
            default: Default value if not found
        
        Returns:
            Configuration value as string
        """
        # Check kwargs first
        if key in kwargs and kwargs[key] is not None:
            return str(kwargs[key])
        
        # Check environment variable
        env_key = f"LLM_{key.upper()}"
        env_value = os.getenv(env_key)
        if env_value is not None:
            return env_value
        
        # Return default
        return default
    
    def _get_default_base_url(self) -> str:
        """Get default base URL based on provider."""
        defaults = {
            LLMProvider.LM_STUDIO: "http://127.0.0.1:1234/v1",
            LLMProvider.OPENAI: "https://api.openai.com/v1",
            LLMProvider.OLLAMA: "http://localhost:11434/v1",
            LLMProvider.HUGGINGFACE: "https://api-inference.huggingface.co/v1",
            LLMProvider.CUSTOM: ""
        }
        return defaults.get(self.provider, defaults[LLMProvider.LM_STUDIO])
    
    def _get_default_api_key(self) -> str:
        """Get default API key based on provider."""
        defaults = {
            LLMProvider.LM_STUDIO: "lm-studio",
            LLMProvider.OPENAI: "",
            LLMProvider.OLLAMA: "ollama",
            LLMProvider.HUGGINGFACE: "",
            LLMProvider.CUSTOM: ""
        }
        return defaults.get(self.provider, defaults[LLMProvider.LM_STUDIO])
    
    def _get_default_model(self) -> str:
        """Get default model based on provider."""
        defaults = {
            LLMProvider.LM_STUDIO: "google/gemma-3-4b",
            LLMProvider.OPENAI: "gpt-3.5-turbo",
            LLMProvider.OLLAMA: "llama2",
            LLMProvider.HUGGINGFACE: "",
            LLMProvider.CUSTOM: ""
        }
        return defaults.get(self.provider, defaults[LLMProvider.LM_STUDIO])
    
    def generate_response(self, system_prompt: str, user_prompt: str, **kwargs) -> str:
        """
        Generate response from LLM.
        
        Args:
            system_prompt: System prompt for the LLM
            user_prompt: User prompt for the LLM
            **kwargs: Additional parameters overriding defaults:
                     temperature, max_tokens, stream, top_p, frequency_penalty, presence_penalty
        
        Returns:
            str: Generated response text
        
        Raises:
            Exception: If all retry attempts fail
        """
        url = f"{self.base_url}/chat/completions"
        
        # Use kwargs or instance defaults
        temperature = kwargs.get('temperature', self.temperature)
        max_tokens = kwargs.get('max_tokens', self.max_tokens)
        stream = kwargs.get('stream', False)
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})
        
        # Build payload
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        # Add provider-specific parameters
        if self.provider == LLMProvider.OPENAI:
            payload.update({
                "top_p": kwargs.get('top_p', 1.0),
                "frequency_penalty": kwargs.get('frequency_penalty', 0.0),
                "presence_penalty": kwargs.get('presence_penalty', 0.0)
            })
        
        logger.info(f"🔄 Generating response with {self.provider.value} model: {self.model_name}")
        logger.debug(f"System prompt (first 100 chars): {system_prompt[:100]}...")
        logger.debug(f"User prompt (first 100 chars): {user_prompt[:100]}...")
        
        # Retry logic
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    url,
                    json=payload,
                    headers=self.headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    content = self._extract_content(response.json())
                    
                    # Apply JSON repair for LM Studio if needed
                    if self.provider == LLMProvider.LM_STUDIO:
                        content = self._extract_and_repair_json(content)
                    
                    logger.info(f"✅ Response generated (length: {len(content)} chars)")
                    if logger.isEnabledFor(logging.DEBUG):
                        logger.debug(f"Response preview: {content[:200]}...")
                    
                    return content
                
                elif response.status_code in [429, 503]:  # Rate limit or service unavailable
                    retry_after = int(response.headers.get('Retry-After', 2 ** attempt))
                    logger.warning(f"⏸️ Rate limited (attempt {attempt + 1}/{self.max_retries}). "
                                 f"Retrying after {retry_after}s...")
                    import time
                    time.sleep(retry_after)
                    continue
                    
                else:
                    # Log error details
                    error_detail = response.text[:500] if response.text else "No error details"
                    logger.error(f"❌ API error {response.status_code}: {error_detail}")
                    response.raise_for_status()
                    
            except requests.exceptions.Timeout:
                logger.warning(f"⏱️ Request timeout (attempt {attempt + 1}/{self.max_retries})")
                last_exception = Exception(f"LLM request timed out after {self.timeout}s")
                if attempt == self.max_retries - 1:
                    break
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"🔌 Request failed: {str(e)}")
                last_exception = e
                if attempt == self.max_retries - 1:
                    break
        
        # All retries failed
        error_msg = f"Failed to generate response after {self.max_retries} attempts"
        if last_exception:
            error_msg += f": {str(last_exception)}"
        
        logger.error(f"❌ {error_msg}")
        raise Exception(error_msg)
    
    def _extract_content(self, response_json: Dict[str, Any]) -> str:
        """
        Extract content from provider response.
        
        Args:
            response_json: JSON response from LLM API
        
        Returns:
            Extracted content as string
        
        Raises:
            Exception: If response format is invalid
        """
        try:
            if self.provider == LLMProvider.OLLAMA:
                return response_json.get("message", {}).get("content", "")
            elif self.provider == LLMProvider.HUGGINGFACE:
                return response_json.get("generated_text", "")
            else:
                # OpenAI-compatible format (LM Studio, OpenAI, etc.)
                return response_json["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"Failed to extract content from response: {response_json}")
            raise Exception(f"Invalid response format from {self.provider.value}: {str(e)}")
    
    def _extract_and_repair_json(self, text: str) -> str:
        """
        Extract JSON from text and repair common issues (mainly for LM Studio).
        
        Args:
            text: Raw text response from LLM
        
        Returns:
            str: Cleaned JSON string or original text if no JSON found
        """
        if not text or not isinstance(text, str):
            return text
        
        logger.debug(f"Processing response for JSON extraction (length: {len(text)})")
        
        # Remove <think> tags and their content
        text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        
        # Remove markdown code blocks
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        
        # Try to find a JSON object
        json_str = self._find_json_object(text)
        if not json_str:
            logger.debug("No JSON object found in response, returning as-is")
            return text.strip()
        
        logger.debug(f"Found potential JSON object (first 200 chars): {json_str[:200]}...")
        
        # Try to parse directly
        try:
            parsed = json.loads(json_str)
            logger.debug("✅ JSON parsed successfully without repair")
            return json.dumps(parsed, ensure_ascii=False)
        except json.JSONDecodeError as e:
            logger.debug(f"JSON needs repair: {e}")
            
            # Try to repair
            repaired = self._repair_json(json_str)
            try:
                json.loads(repaired)
                logger.debug("✅ JSON repaired successfully")
                return repaired
            except json.JSONDecodeError as e2:
                logger.warning(f"Failed to repair JSON: {e2}")
                # Return original cleaned text
                return text.strip()
    
    def _find_json_object(self, text: str) -> Optional[str]:
        """
        Find the first complete JSON object in text.
        
        Args:
            text: Text to search
        
        Returns:
            str: JSON object string or None if not found
        """
        stack = []
        start_index = -1
        
        for i, char in enumerate(text):
            if char == '{':
                if not stack:
                    start_index = i
                stack.append('{')
            elif char == '}':
                if stack:
                    stack.pop()
                    if not stack and start_index != -1:
                        # Found complete JSON object
                        return text[start_index:i+1]
        
        return None
    
    def _repair_json(self, json_str: str) -> str:
        """
        Repair JSON string with common issues.
        
        Args:
            json_str: JSON string to repair
        
        Returns:
            str: Repaired JSON string
        """
        try:
            # Try lenient parsing first
            decoder = json.JSONDecoder(strict=False)
            obj, _ = decoder.raw_decode(json_str)
            return json.dumps(obj, ensure_ascii=False)
        except:
            pass
        
        # Manual repair for common issues
        repaired = []
        i = 0
        n = len(json_str)
        
        while i < n:
            char = json_str[i]
            
            if char == '\\' and i + 1 < n:
                # Preserve valid escape sequences
                next_char = json_str[i + 1]
                if next_char in ['"', '\\', '/', 'b', 'f', 'n', 'r', 't']:
                    repaired.append(json_str[i:i+2])
                    i += 2
                    continue
                elif next_char == 'u' and i + 5 < n:
                    repaired.append(json_str[i:i+6])
                    i += 6
                    continue
            
            if char == '"':
                # Handle string boundaries
                start = i
                i += 1
                while i < n:
                    if json_str[i] == '\\' and i + 1 < n:
                        i += 2  # Skip escape sequence
                        continue
                    if json_str[i] == '"':
                        repaired.append(json_str[start:i+1])
                        i += 1
                        break
                    i += 1
                else:
                    # No closing quote, add one
                    repaired.append(json_str[start:] + '"')
                    break
            else:
                repaired.append(char)
                i += 1
        
        result = ''.join(repaired)
        
        # Fix trailing commas
        result = re.sub(r',\s*}', '}', result)
        result = re.sub(r',\s*]', ']', result)
        
        # Fix missing quotes around keys
        result = re.sub(r'(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', result)
        
        return result
    
    def stream_response(self, system_prompt: str, user_prompt: str, **kwargs) -> Generator[str, None, None]:
        """
        Stream response from LLM (for providers that support streaming).
        
        Args:
            system_prompt: System prompt for the LLM
            user_prompt: User prompt for the LLM
            **kwargs: Additional parameters
        
        Yields:
            str: Chunks of the response
        
        Raises:
            Exception: If streaming fails
        """
        if not kwargs.get('stream', True):
            kwargs['stream'] = True
        
        url = f"{self.base_url}/chat/completions"
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})
        
        # Build payload
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": kwargs.get('temperature', self.temperature),
            "max_tokens": kwargs.get('max_tokens', self.max_tokens),
            "stream": True
        }
        
        logger.info(f"🌊 Starting stream response with {self.provider.value}")
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers=self.headers,
                timeout=self.timeout,
                stream=True
            )
            
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            break
                        
                        try:
                            chunk = json.loads(data)
                            content = self._extract_stream_content(chunk)
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
                            
        except requests.exceptions.RequestException as e:
            logger.error(f"Streaming failed: {str(e)}")
            raise Exception(f"LLM streaming failed: {str(e)}")
    
    def _extract_stream_content(self, chunk: Dict[str, Any]) -> str:
        """
        Extract content from streaming response chunk.
        
        Args:
            chunk: Streaming chunk
        
        Returns:
            str: Content from chunk
        """
        try:
            if self.provider == LLMProvider.OPENAI:
                delta = chunk.get("choices", [{}])[0].get("delta", {})
                return delta.get("content", "")
            elif self.provider == LLMProvider.OLLAMA:
                return chunk.get("message", {}).get("content", "")
            else:
                # OpenAI-compatible format
                return chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
        except (KeyError, IndexError, TypeError):
            return ""
    
    def test_connection(self) -> bool:
        """
        Test connection to LLM API.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            # Simple test request
            test_prompt = "Respond with 'OK' only."
            response = self.generate_response(
                system_prompt="You are a test assistant.",
                user_prompt=test_prompt,
                max_tokens=10
            )
            
            if response and len(response) > 0:
                logger.info(f"✅ Connection test successful for {self.provider.value}")
                return True
            else:
                logger.warning(f"⚠️ Connection test received empty response from {self.provider.value}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Connection test failed for {self.provider.value}: {str(e)}")
            return False


# Factory function for convenience
def create_llm_client(**kwargs) -> LLMClient:
    """
    Create an LLMClient instance.
    
    Args:
        **kwargs: Same as LLMClient.__init__
    
    Returns:
        LLMClient: Configured LLM client instance
    """
    return LLMClient(**kwargs)
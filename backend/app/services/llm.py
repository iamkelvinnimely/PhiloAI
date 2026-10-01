import json
import logging
import os
from collections.abc import AsyncIterator
from pathlib import Path

import httpx
from dotenv import load_dotenv

from app.schemas.chat import ChatMessage

logger = logging.getLogger(__name__)

LLM_UNAVAILABLE = "The AI service is temporarily unavailable.\nPlease try again."
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
SYSTEM_PROMPT = (
    "You are PhiloAi, a helpful AI assistant in the PhiloAi chat app. "
    "Your name is PhiloAi. Never identify as ChatGPT, GPT, Claude, Gemini, Grok, "
    "or any other branded product. If asked your name, who you are, what model you are, "
    "or who made you, say you are PhiloAi. "
    "Do not claim to be made by OpenAI, Anthropic, Google, or xAI."
)


class LLMError(Exception):
    """Raised when the LLM provider cannot produce a response."""

    def __init__(self, message: str = LLM_UNAVAILABLE) -> None:
        super().__init__(message)
        self.user_message = message


def _settings() -> tuple[str, str, str]:
    load_dotenv(ENV_PATH, override=True)
    api_key = os.getenv("LLM_API_KEY", "").strip()
    model = os.getenv("LLM_MODEL", "openai/gpt-oss-20b").strip()
    base_url = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    if not api_key:
        raise LLMError(LLM_UNAVAILABLE)
    return api_key, model, base_url


def _with_identity(messages: list[ChatMessage]) -> list[dict]:
    converted = [{"role": message.role, "content": message.content} for message in messages]
    if converted and converted[0]["role"] == "system":
        converted[0]["content"] = f"{SYSTEM_PROMPT}\n\n{converted[0]['content']}"
        return converted
    return [{"role": "system", "content": SYSTEM_PROMPT}, *converted]


def _payload(messages: list[ChatMessage], *, stream: bool) -> dict:
    _, model, _ = _settings()
    return {
        "model": model,
        "messages": _with_identity(messages),
        "stream": stream,
        "temperature": 0.7,
    }


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _extract_content(data: dict) -> str:
    choices = data.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message") or {}
    return message.get("content") or ""


def _extract_delta(data: dict) -> str:
    choices = data.get("choices") or []
    if not choices:
        return ""
    delta = choices[0].get("delta") or {}
    return delta.get("content") or ""


async def generate_response(messages: list[ChatMessage]) -> str:
    api_key, _, base_url = _settings()
    url = f"{base_url}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers=_headers(api_key),
                json=_payload(messages, stream=False),
            )
    except httpx.HTTPError as exc:
        raise LLMError(LLM_UNAVAILABLE) from exc

    if response.status_code >= 400:
        logger.error("LLM request failed: %s %s", response.status_code, response.text[:500])
        raise LLMError(LLM_UNAVAILABLE)

    try:
        data = response.json()
    except ValueError as exc:
        raise LLMError(LLM_UNAVAILABLE) from exc

    content = _extract_content(data)
    if not content:
        raise LLMError(LLM_UNAVAILABLE)
    return content


async def stream_response(messages: list[ChatMessage]) -> AsyncIterator[str]:
    api_key, _, base_url = _settings()
    url = f"{base_url}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                url,
                headers=_headers(api_key),
                json=_payload(messages, stream=True),
            ) as response:
                if response.status_code >= 400:
                    body = (await response.aread()).decode("utf-8", errors="replace")
                    logger.error("LLM stream failed: %s %s", response.status_code, body[:500])
                    raise LLMError(LLM_UNAVAILABLE)

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if not line.startswith("data:"):
                        continue
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        data = json.loads(payload)
                    except json.JSONDecodeError:
                        continue
                    chunk = _extract_delta(data)
                    if chunk:
                        yield chunk
    except LLMError:
        raise
    except httpx.HTTPError as exc:
        raise LLMError(LLM_UNAVAILABLE) from exc

import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse
from app.services.llm import LLMError, generate_response, stream_response

logger = logging.getLogger(__name__)
router = APIRouter()

LLM_UNAVAILABLE = "The AI service is temporarily unavailable.\nPlease try again."


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        content = await generate_response(request.messages)
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=exc.user_message) from exc

    return ChatResponse(message=ChatMessage(role="assistant", content=content))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    async def event_stream():
        try:
            async for chunk in stream_response(request.messages):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except LLMError as exc:
            logger.error("LLM stream error: %s", exc)
            yield f"event: error\ndata: {json.dumps({'message': exc.user_message})}\n\n"
        except Exception:
            logger.exception("Unexpected chat stream failure")
            yield f"event: error\ndata: {json.dumps({'message': LLM_UNAVAILABLE})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

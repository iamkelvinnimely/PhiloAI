from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)

    @field_validator("messages")
    @classmethod
    def last_message_must_be_user(cls, messages: list[ChatMessage]) -> list[ChatMessage]:
        last = messages[-1]
        if last.role != "user" or not last.content:
            raise ValueError("The last message must be a non-empty user message.")
        return messages


class ChatResponse(BaseModel):
    message: ChatMessage

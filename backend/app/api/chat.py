"""SKINSIGHT v2 — Chat API"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.services.chatbot import get_bot_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/message")
async def chat(data: ChatRequest):
    if not data.message.strip():
        return JSONResponse({"response": "Please type a message! 😊", "category": "general"})
    result = get_bot_response(data.message.strip())
    return JSONResponse(result)

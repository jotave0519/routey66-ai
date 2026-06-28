"""FastAPI webhook server for the WhatsApp Business API."""

import os
from fastapi import FastAPI, Request, HTTPException
from dotenv import load_dotenv

from database import get_conversation_history, save_message
from claude_chat import get_reply
from whatsapp_send import send_text

load_dotenv()

app = FastAPI()

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "meu_token_secreto")


@app.get("/webhook")
async def verify(request: Request):
    """Meta webhook verification handshake."""
    params = request.query_params
    if params.get("hub.verify_token") == VERIFY_TOKEN and params.get("hub.mode") == "subscribe":
        return int(params["hub.challenge"])
    raise HTTPException(status_code=403, detail="Verification failed")


@app.post("/webhook")
async def receive(request: Request):
    """Handle incoming WhatsApp messages."""
    body = await request.json()

    try:
        entry = body["entry"][0]["changes"][0]["value"]
        message = entry["messages"][0]
        phone = message["from"]
        text = message["text"]["body"]
    except (KeyError, IndexError):
        return {"status": "ignored"}

    save_message(phone, "user", text)

    history = get_conversation_history(phone)
    reply = get_reply(history)

    save_message(phone, "assistant", reply)
    send_text(phone, reply)

    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

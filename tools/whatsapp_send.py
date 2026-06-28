"""Send a WhatsApp message via the Meta Cloud API."""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
TOKEN = os.getenv("WHATSAPP_TOKEN")
API_URL = f"https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages"


def send_text(to: str, body: str) -> dict:
    """Send a plain-text message. `to` is the recipient's phone number with country code (e.g. 5511999999999)."""
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body},
    }
    response = httpx.post(API_URL, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python whatsapp_send.py <phone_number> <message>")
        sys.exit(1)
    result = send_text(sys.argv[1], sys.argv[2])
    print(result)

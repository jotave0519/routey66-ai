"""Call the Claude API to generate a response given a conversation history."""

import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """Você é um assistente de atendimento ao cliente de uma oficina mecânica.
Seja cordial, objetivo e sempre tente resolver o problema do cliente.
Se não souber a resposta, diga que vai verificar com a equipe.
Responda sempre em português."""


def get_reply(messages: list[dict]) -> str:
    """
    messages: list of {"role": "user"|"assistant", "content": str}
    Returns the assistant's reply as a string.
    """
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


if __name__ == "__main__":
    history = [{"role": "user", "content": "Olá, quero agendar uma revisão."}]
    print(get_reply(history))

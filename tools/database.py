"""PostgreSQL helpers for Neon Database."""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def get_conversation_history(phone: str, limit: int = 20) -> list[dict]:
    """Return the last `limit` messages for a given phone number."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT role, content FROM messages
                WHERE phone = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (phone, limit),
            )
            rows = cur.fetchall()
    return [{"role": r, "content": c} for r, c in reversed(rows)]


def save_message(phone: str, role: str, content: str) -> None:
    """Persist a message to the database."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO messages (phone, role, content)
                VALUES (%s, %s, %s)
                """,
                (phone, role, content),
            )
        conn.commit()


def init_schema() -> None:
    """Create tables if they don't exist yet."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    phone TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
                """
            )
        conn.commit()
    print("Schema initialized.")


if __name__ == "__main__":
    init_schema()

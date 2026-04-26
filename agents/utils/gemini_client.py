"""
Groq code generation client.
Model: llama-3.3-70b-versatile — 100% FREE, no billing, 30K context, 6000 req/day.
Sign up at: https://console.groq.com → API Keys → Create Key (free, no card needed)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load env from all known locations
repo_root = Path(__file__).parent.parent.parent
for p in [repo_root / "backend" / ".env", repo_root / ".env", repo_root / "agents" / ".env"]:
    if p.exists():
        load_dotenv(dotenv_path=p, override=False)

from tenacity import retry, stop_after_attempt, wait_exponential


class GroqClient:
    """Thin wrapper around Groq for code generation — free tier, fast, great at code."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client
        key = os.getenv("GROQ_API_KEY", "").strip()
        if not key:
            return None
        from groq import Groq
        self._client = Groq(api_key=key)
        return self._client

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=6))
    def generate_code(self, system_prompt: str, user_message: str) -> dict:
        client = self._get_client()

        if client is None:
            print("⚠️ [Groq] GROQ_API_KEY not set — returning mock output")
            return {
                "text": (
                    "// FILE: src/index.ts\n"
                    "// ⚠️  GROQ_API_KEY not configured.\n"
                    "// Get a free key at: https://console.groq.com\n"
                    "// Add GROQ_API_KEY=gsk_... to your backend/.env\n"
                    "export const hello = () => 'CraftaStudio — Add your Groq API key!';\n"
                ),
                "input_tokens": 0,
                "output_tokens": 0,
            }

        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.2,
                max_tokens=8000,
            )

            text = response.choices[0].message.content or ""
            print(f"✅ [Groq] Generated {len(text)} chars | model: {model}")

            return {
                "text": text,
                "input_tokens": getattr(response.usage, "prompt_tokens", 0),
                "output_tokens": getattr(response.usage, "completion_tokens", 0),
            }

        except Exception as e:
            print(f"❌ [Groq] Error: {e}")
            raise


# Global singleton — also works as Gemini fallback
groq_client = GroqClient()

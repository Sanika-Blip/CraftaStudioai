"""
Gemini code generation client.
Used for the "Implement This" pipeline — Sarvam is for planning only.
Gemini 2.0 Flash: FREE, 1500 req/day, 128K context, excellent at code.
"""

import os
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

# Lazy init — only configure if key is present
_gemini_ready = False

def _init_gemini():
    global _gemini_ready
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if key and not _gemini_ready:
        genai.configure(api_key=key)
        _gemini_ready = True
    return _gemini_ready


class GeminiClient:
    """Thin wrapper around Gemini 2.0 Flash for code generation."""

    def __init__(self):
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=8))
    def generate_code(self, system_prompt: str, user_message: str) -> dict:
        if not _init_gemini():
            print("⚠️ [Gemini] GEMINI_API_KEY not set — using mock output")
            return {
                "text": (
                    "// FILE: src/index.ts\n"
                    "// ⚠️  GEMINI_API_KEY not configured.\n"
                    "// Add GEMINI_API_KEY to your .env to enable real code generation.\n"
                    "export const hello = () => 'world';\n"
                ),
                "input_tokens": 0,
                "output_tokens": 0,
            }

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,          # Low temp = deterministic, precise code
                    max_output_tokens=8192,   # Gemini Flash supports 8K output free
                ),
            )
            response = model.generate_content(user_message)
            text = response.text or ""
            # Rough token count estimate (1 token ≈ 4 chars)
            return {
                "text": text,
                "input_tokens": len(system_prompt) // 4,
                "output_tokens": len(text) // 4,
            }
        except Exception as e:
            print(f"[Gemini] Error: {e}")
            raise


# Global singleton
gemini = GeminiClient()

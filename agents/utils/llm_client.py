"""
LLM Client — Groq-first (free, fast, 6000 req/day).
Sarvam is kept as fallback if key is present and Groq fails.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

repo_root = Path(__file__).parent.parent.parent
for env_path in [repo_root / 'backend' / '.env', repo_root / 'agents' / '.env', repo_root / '.env']:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)

from tenacity import retry, stop_after_attempt, wait_exponential

try:
    from langfuse import Langfuse
except ModuleNotFoundError:
    Langfuse = None

# ── Langfuse monitoring (optional) ───────────────────────────
pk = os.getenv("LANGFUSE_PUBLIC_KEY", "").strip()
sk = os.getenv("LANGFUSE_SECRET_KEY", "").strip()
host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com").strip()

class MockLangfuse:
    def trace(self, *args, **kwargs): return self
    def span(self, *args, **kwargs): return self
    def end(self, *args, **kwargs): pass

if not pk:
    print("⚠️  DEBUG: Langfuse keys not found. Switching to Mock Tracing.")
    langfuse = MockLangfuse()
elif Langfuse is None:
    print("⚠️  DEBUG: Langfuse package not installed. Switching to Mock Tracing.")
    langfuse = MockLangfuse()
else:
    print(f"✅ DEBUG: Langfuse initialized with {pk[:8]}...")
    langfuse = Langfuse(public_key=pk, secret_key=sk, host=host)


# ── Groq Client (primary — free, 6000 req/day) ───────────────
class GroqLLMClient:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client:
            return self._client
        key = os.getenv("GROQ_API_KEY", "").strip()
        if not key:
            return None
        from groq import Groq
        self._client = Groq(api_key=key)
        return self._client

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=8))
    def call(self, system_prompt: str, user_message: str, **kwargs) -> dict:
        client = self._get_client()

        if client is None:
            print("⚠️  [Groq] No GROQ_API_KEY — using mock output")
            return {
                "text": '{"title":"Mock Plan","summary":"No API key","markdown":"","blocks":[],"is_chat":false}',
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
                max_tokens=4096,
            )
            text = response.choices[0].message.content or ""
            print(f"✅ [Groq/plan] {len(text)} chars")
            return {
                "text": text,
                "input_tokens": getattr(response.usage, "prompt_tokens", 0),
                "output_tokens": getattr(response.usage, "completion_tokens", 0),
            }
        except Exception as e:
            print(f"❌ [Groq/plan] Error: {e}")
            raise


# ── Sarvam fallback (optional, kept for compatibility) ────────
class SarvamClient:
    def __init__(self):
        self.api_key = os.getenv("SARVAM_API_KEY", "").strip()
        self.model = os.getenv("SARVAM_MODEL", "sarvam-30b")
        self.max_tokens = int(os.getenv("MAX_TOKENS", 4096))

    def call(self, system_prompt: str, user_message: str, **kwargs) -> dict:
        if not self.api_key or self.api_key.startswith("sk-ant-"):
            raise Exception("Sarvam API key not configured")
        import openai
        client = openai.OpenAI(api_key=self.api_key, base_url="https://api.sarvam.ai/v1")
        try:
            response = client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
            return {
                "text": response.choices[0].message.content or "",
                "input_tokens": response.usage.prompt_tokens if response.usage else 0,
                "output_tokens": response.usage.completion_tokens if response.usage else 0,
            }
        except Exception as e:
            print(f"❌ [Sarvam] Error: {e}")
            raise


# ── Global singleton: Groq-first ─────────────────────────────
ai = GroqLLMClient()

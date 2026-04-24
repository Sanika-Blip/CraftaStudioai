import os
from pathlib import Path
from dotenv import load_dotenv

# Force find the .env file in multiple possible locations
repo_root = Path(__file__).parent.parent.parent
env_locations = [
    repo_root / '.env',
    repo_root / 'agents' / '.env',
    repo_root / 'backend' / '.env'
]

for env_path in env_locations:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)

import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

try:
    from langfuse import Langfuse
except ModuleNotFoundError:
    Langfuse = None

# ── AI-11: FAILSAFE MONITORING INITIALIZATION ────────────────
pk = os.getenv("LANGFUSE_PUBLIC_KEY", "").strip()
sk = os.getenv("LANGFUSE_SECRET_KEY", "").strip()
host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com").strip()

# Mock Class to prevent AttributeError when keys are missing
class MockLangfuse:
    def trace(self, *args, **kwargs):
        return self
    def span(self, *args, **kwargs):
        return self
    def end(self, *args, **kwargs):
        pass

if not pk:
    print(f"⚠️  DEBUG: Langfuse keys not found. Switching to Mock Tracing.")
    langfuse = MockLangfuse()
elif Langfuse is None:
    print("⚠️  DEBUG: Langfuse package not installed. Switching to Mock Tracing.")
    langfuse = MockLangfuse()
else:
    print(f"✅ DEBUG: Langfuse initialized with {pk[:8]}...")
    langfuse = Langfuse(public_key=pk, secret_key=sk, host=host)

import openai

class SarvamClient:
    def __init__(self):
        self.api_key = os.getenv("SARVAM_API_KEY")
        self.client = openai.OpenAI(
            api_key=self.api_key or "mock-key",
            base_url="https://api.sarvam.ai/v1"
        )
        self.model = os.getenv("SARVAM_MODEL", "sarvam-30b")
        self.max_tokens = int(os.getenv("MAX_TOKENS", 4096))
        self.budget_cap = int(os.getenv("BUDGET_CAP", 100000))

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def call(self, system_prompt: str, user_message: str, current_usage: int = 0):
        if current_usage >= self.budget_cap:
            raise Exception(f"Budget Exceeded: {current_usage}")

        # MOCK FALLBACK
        if not self.api_key or self.api_key == "sk-ant-temporary-mock-key":
            print("🛠️ [MOCK] No Sarvam Key. Generating test output...")
            return {
                "text": "// filename: test_output/app.py\nprint('Hello World')", 
                "input_tokens": 50, 
                "output_tokens": 150
            }

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            return {
                "text": response.choices[0].message.content,
                "input_tokens": response.usage.prompt_tokens if response.usage else 0,
                "output_tokens": response.usage.completion_tokens if response.usage else 0
            }
        except Exception as e:
            print(f"LLM Client Error: {e}")
            raise e

# Global Singleton
ai = SarvamClient()

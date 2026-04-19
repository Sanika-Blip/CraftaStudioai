import os
from pathlib import Path
from dotenv import load_dotenv

# Force find the .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

import anthropic
from langfuse import Langfuse 
from tenacity import retry, stop_after_attempt, wait_exponential

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
else:
    print(f"✅ DEBUG: Langfuse initialized with {pk[:8]}...")
    langfuse = Langfuse(public_key=pk, secret_key=sk, host=host)

class ClaudeClient:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.client = anthropic.Anthropic(api_key=self.api_key) if self.api_key else None
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620")
        self.max_tokens = int(os.getenv("MAX_TOKENS", 4096))
        self.budget_cap = int(os.getenv("BUDGET_CAP", 100000))

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def call(self, system_prompt: str, user_message: str, current_usage: int = 0):
        if current_usage >= self.budget_cap:
            raise Exception(f"Budget Exceeded: {current_usage}")

        # MOCK FALLBACK
        if not self.api_key or self.api_key == "sk-ant-temporary-mock-key":
            print("🛠️ [MOCK] No Anthropic Key. Generating test output...")
            return {
                "text": "// filename: test_output/app.py\nprint('Hello World')", 
                "input_tokens": 50, 
                "output_tokens": 150
            }

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            return {
                "text": response.content[0].text,
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        except Exception as e:
            print(f"LLM Client Error: {e}")
            raise e

# Global Singleton
ai = ClaudeClient()
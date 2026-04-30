import os
import logging

logger = logging.getLogger(__name__)

BASE_DIR = "generated_code"

class CodeGenAgent:
    def generate_code(self, block_id: str) -> str:
        """
        Generates simple python module code based on block naming conventions.
        """
        # Optional: Block Type Mapping
        if "api" in block_id.lower():
            return f'''# Auto-generated API module: {block_id}

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_root():
    return {{"message": "Running {block_id} API"}}
'''
        elif "db" in block_id.lower():
            return f'''# Auto-generated DB Schema module: {block_id}

from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class {block_id.replace("-", "_").capitalize()}(Base):
    __tablename__ = "{block_id.replace("-", "_")}"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

print("DB Schema ready for {block_id}")
'''
        
        # Default Fallback
        return f'''# Auto-generated module: {block_id}

def main():
    print("Running {block_id}")

if __name__ == "__main__":
    main()
'''

    def run(self, block_id: str, affected_blocks: list) -> dict:
        # ensure directory exists
        os.makedirs(BASE_DIR, exist_ok=True)

        filename = f"{block_id}.py"
        filepath = os.path.join(BASE_DIR, filename)

        # Prevent Overwrite
        if os.path.exists(filepath):
            filename = f"{block_id}_v2.py"
            filepath = os.path.join(BASE_DIR, filename)

        code = self.generate_code(block_id)

        try:
            with open(filepath, "w") as f:
                f.write(code)
            logger.info(f"Code successfully written to {filepath}")
        except Exception as e:
            logger.error(f"Failed to write code to {filepath}: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

        return {
            "status": "success",
            "file": filepath
        }

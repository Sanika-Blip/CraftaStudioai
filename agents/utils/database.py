import os
import json
import psycopg2
from psycopg2.extras import Json
from typing import Optional

def get_db_connection():
    """Establishes connection to the Durable Store (PostgreSQL)[cite: 195]."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "craftastudio"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
        port=os.getenv("DB_PORT", "5432")
    )

def update_db_and_status(run_id: str, status: str, context: Optional[any] = None):
    """
    Section 4.8: State Engine Persistence Strategy.
    Implements durable audit logging for resumable workflows[cite: 180, 195]. 
    """
    from agents.types_.context import SharedContext 
    
    print(f"[SYSTEM] Run {run_id} is now {status.upper()}")

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        if context:
            # Convert SharedContext to a JSONB-compatible dictionary
            shared_context_data = context.model_dump()
            
            # 🔥 Alignment Mapping for Backend Team
            # Section 4.8: Explicit mapping for project isolation and observability [cite: 181, 401]
            shared_context_data["outputCode"] = shared_context_data.get("generated_code")
            shared_context_data["severity"] = shared_context_data.get("risk_level", "low")
            shared_context_data["editRequest"] = shared_context_data.get("user_edit_request")

            # Section 8.1: Requirement for versioning column [cite: 371]
            version = shared_context_data.get("version", 1)

            # SQL Update targeting workflow_runs (Durable Audit Log) [cite: 371, 382]
            sql = """
                UPDATE workflow_runs 
                SET status = %s, 
                    "sharedContextJson" = %s, 
                    version = %s,
                    "updatedAt" = NOW()
                WHERE projectid = %s;
            """
            
            cur.execute(sql, (status, Json(shared_context_data), version, run_id))
            print(f"[DATABASE] Memory Persisted (JSONB) with Mapped Fields for project: {run_id}")
        
        else:
            cur.execute(
                'UPDATE workflow_runs SET status = %s, "updatedAt" = NOW() WHERE projectid = %s;',
                (status, run_id)
            )

        conn.commit()
        cur.close()

    except Exception as e:
        print(f"[DATABASE] ❌ Error updating PostgreSQL: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

def load_project_context(project_id: str) -> Optional[dict]:
    """
    AI-12: Retrieves the existing SharedContext to enable inter-turn memory[cite: 96, 100]. 
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Section 8.2: Fetching the audit log for current project_id [cite: 382, 393]
        cur.execute(
            'SELECT "sharedContextJson" FROM workflow_runs WHERE projectid = %s;',
            (project_id,)
        )
        result = cur.fetchone()
        
        cur.close()
        return result[0] if result else None

    except Exception as e:
        print(f"[DATABASE] ❌ Error loading memory: {str(e)}")
        return None
    finally:
        if conn:
            conn.close()
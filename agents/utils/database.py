import os
import json
import psycopg2
from psycopg2.extras import Json
from typing import Optional

# 🔥 Removed top-level import to prevent circular dependency
# from agents.types_.context import SharedContext 

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "craftastudio"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
        port=os.getenv("DB_PORT", "5432")
    )

def update_db_and_status(run_id: str, status: str, context: Optional[any] = None):
    """
    Finalizes AI-12 (Agent Memory) & AI-07 (Status Reporting).
    Implements the DB-05 Schema for SharedContext persistence in PostgreSQL. 
    """
    # 🔥 Local import to fix "cannot import name 'get_db_connection'"
    from agents.types_.context import SharedContext 
    
    print(f"[SYSTEM] Run {run_id} is now {status.upper()}")

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        if context:
            # DB-05: Convert SharedContext to a JSONB-compatible dictionary
            shared_context_data = context.model_dump()
            
            # DB-05: Requirement for versioning column
            version = shared_context_data.get("version", 1)

            # DB-05: SQL Update targeting workflow_runs table
            sql = """
                UPDATE workflow_runs 
                SET status = %s, 
                    "sharedContextJson" = %s, 
                    version = %s,
                    "updatedAt" = NOW()
                WHERE projectid = %s;
            """
            
            # psycopg2.extras.Json handles the conversion to Postgres JSONB
            cur.execute(sql, (status, Json(shared_context_data), version, run_id))
            
            print(f"[DATABASE] Memory Persisted (JSONB) for project: {run_id}")
        
        else:
            # Minimal update if context isn't provided
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
    AI-12: Retrieves the existing SharedContext from PostgreSQL to enable inter-turn memory. 
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # DB-05: Fetching the single source of truth for the workflow
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
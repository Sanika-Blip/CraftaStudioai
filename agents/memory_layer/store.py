from agents.utils.database import get_db_connection
import json

def store_memory(trace_id: str, memory_state: dict):
    """
    Saves the Tri-Layer Memory into the PostgreSQL sharedContextJson field.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Convert Pydantic/Dict to JSON string for Postgres
    memory_json = json.dumps(memory_state)
    
    try:
        # We update the workflow_runs table based on the trace_id (workflowRunId)
        query = """
            UPDATE workflow_runs 
            SET "sharedContextJson" = jsonb_set(
                COALESCE("sharedContextJson", '{}'::jsonb), 
                '{memory}', 
                %s::jsonb
            ),
            version = version + 1
            WHERE id = %s
        """
        cur.execute(query, (memory_json, trace_id))
        conn.commit()
        print(f"[MEMORY STORE] ✅ Memory persisted for {trace_id}")
    except Exception as e:
        print(f"[MEMORY STORE] ❌ Failed to store memory: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()
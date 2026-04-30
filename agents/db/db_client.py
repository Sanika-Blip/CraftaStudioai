import logging
import json
from prisma import Prisma

logger = logging.getLogger(__name__)

db = Prisma()

async def connect_db():
    if not db.is_connected():
        await db.connect()
        logger.info("Connected to Prisma Database.")

async def create_workflow_run(project_id: str, user_id: str, prompt: str) -> str:
    await connect_db()
    
    run = await db.workflowrun.create(
        data={
            "projectId": project_id,
            "triggeredByUserId": user_id,
            "prompt": prompt,
            "status": "running",
            "sharedContextJson": "{}"
        }
    )
    return run.id

async def save_reasoning(project_id: str, block_id: str, mode: str, result: dict):
    await connect_db()
    
    await db.reasoningresult.create(
        data={
            "projectId": project_id,
            "blockId": block_id,
            "mode": mode,
            "inputHash": "static_or_hash",
            "result": json.dumps(result),
            "confidence": result.get("confidence", 0.5),
            "tokensUsed": 0,
            "model": "gpt",
            "expiresAt": None
        }
    )

async def save_job_run(run_id: str, block_id: str, step: str):
    await connect_db()
    
    await db.jobrun.create(
        data={
            "workflowRunId": run_id,
            "blockId": block_id,
            "jobType": step,
            "status": "done"
        }
    )

async def log_event(project_id: str, event_type: str, payload: dict):
    await connect_db()
    await db.eventlog.create(
        data={
            "projectId": project_id,
            "type": event_type,
            "payload": json.dumps(payload),
            "processed": False
        }
    )

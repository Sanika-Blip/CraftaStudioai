import asyncio
import logging
import time
from agents.db.db_client import db, connect_db
from agents.orchestrator.router import orchestrate_flow
from agents.orchestrator.safety import safety_layer

logger = logging.getLogger(__name__)

async def handle_event(event):
    """
    Processes a single DB event automatically.
    """
    event_type = event.type
    project_id = event.projectId

    logger.info(f"Handling event: {event_type} for project: {project_id}")

    if event_type == "BLOCK_UPDATED":
        # Extract blockId safely from Prisma Json wrapper
        payload = event.payload
        block_id = payload.get("blockId") if isinstance(payload, dict) else None
        
        if block_id:
            # Event Safety: Rate Limit Check
            current_time = time.time()
            event_key = f"{project_id}_{block_id}"
            
            if not safety_layer.allow_event(event_key, current_time):
                logger.warning(f"Event dropped due to rate limit: {event_key}")
                # Mark as processed to not block the queue
                await db.eventlog.update(
                    where={"id": event.id},
                    data={"processed": True}
                )
                return

            logger.info(f"Triggering orchestrator for auto-update on {block_id}")
            # Trigger orchestrator autonomously
            await orchestrate_flow(
                project_id=project_id,
                user_input=f"Auto update for {block_id}",
                system_trigger=True
            )

    # Mark as processed
    await db.eventlog.update(
        where={"id": event.id},
        data={"processed": True}
    )
    logger.info(f"Event {event.id} marked as processed.")

async def listen_events():
    """
    Continuous loop that listens to EventLog table.
    """
    logger.info("Starting autonomous Event Listener loop...")
    await connect_db()

    while True:
        try:
            events = await db.eventlog.find_many(
                where={"processed": False},
                take=5
            )

            for event in events:
                await handle_event(event)

        except Exception as e:
            logger.error(f"Event listener encountered an error: {e}")

        await asyncio.sleep(2)

from agents.routes.plan import parse_blocks_from_markdown

sample = '''# Project: Test

## Blocks
| Block ID | Name | Type | Responsibility |
|----------|------|------|----------------|
| blk-frontend | Landing Page UI | frontend | React components and routing |
| blk-backend | Main API | backend | Fastify endpoints and logic |
| blk-database | PostgreSQL DB | database | Data persistence |
'''

print(parse_blocks_from_markdown(sample))

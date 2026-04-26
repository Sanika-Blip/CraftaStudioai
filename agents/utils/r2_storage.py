import boto3
import os
import json
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("CLOUDFLARE_R2_ENDPOINT"),
    aws_access_key_id=os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

BUCKET = os.getenv("CLOUDFLARE_R2_BUCKET_NAME")

def upload_block(block_id: str, content: dict) -> str:
    key = f"blocks/{block_id}.json"
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(content),
        ContentType="application/json",
    )
    return key

def get_block(block_id: str) -> dict:
    key = f"blocks/{block_id}.json"
    response = s3.get_object(Bucket=BUCKET, Key=key)
    return json.loads(response["Body"].read())

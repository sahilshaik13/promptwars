"""
Image signing API endpoint for secure GCloud Storage URLs
Generates signed URLs to hide bucket URLs from public access
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from google.cloud import storage
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/images", tags=["images"])


class SignImageRequest(BaseModel):
    object_path: str
    expiry_minutes: int = 60


class SignImageResponse(BaseModel):
    signed_url: str
    expires_at: str


# Initialize GCS client (will use default credentials in production)
_gcs_client = None


def get_gcs_client() -> storage.Client:
    global _gcs_client
    if _gcs_client is None:
        # In production, use service account credentials
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if credentials_path:
            _gcs_client = storage.Client.from_service_account_json(credentials_path)
        else:
            # Use default credentials (workload identity in GKE)
            _gcs_client = storage.Client()
    return _gcs_client


@router.post("/sign", response_model=SignImageResponse)
async def sign_image(request: SignImageRequest, req: Request):
    """
    Generate a signed URL for a GCS object.
    
    This endpoint:
    1. Validates the object path (prevents path traversal)
    2. Generates a signed URL with expiration
    3. Returns the URL (which can be used to access the private object)
    """
    try:
        # Validate and sanitize object path
        object_path = request.object_path.lstrip('/')
        
        # Prevent path traversal attacks
        if '..' in object_path or object_path.startswith('/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid object path"
            )
        
        # Get bucket name from environment
        bucket_name = os.getenv('GCS_BUCKET_NAME')
        if not bucket_name:
            raise HTTPException(
                status_code=500,
                detail="GCS bucket not configured"
            )
        
        # Create GCS client and generate signed URL
        client = get_gcs_client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_path)
        
        # Generate signed URL
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=request.expiry_minutes),
            method="GET",
            content_type=None,
            response_disposition=None,
            access_token=None,
            headers=None,
            query_parameters=None,
            client=None,
            virtual_versioned=True,
        )
        
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(minutes=request.expiry_minutes)
        
        return SignImageResponse(
            signed_url=url,
            expires_at=expires_at.isoformat() + "Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate signed URL"
        )


@router.get("/info/{object_path:path}")
async def get_image_info(object_path: str, req: Request):
    """
    Get metadata about an image object (without generating a signed URL).
    Useful for preloading images and checking existence.
    """
    try:
        # Validate and sanitize object path
        object_path = object_path.lstrip('/')
        
        if '..' in object_path:
            raise HTTPException(
                status_code=400,
                detail="Invalid object path"
            )
        
        bucket_name = os.getenv('GCS_BUCKET_NAME')
        if not bucket_name:
            raise HTTPException(
                status_code=500,
                detail="GCS bucket not configured"
            )
        
        client = get_gcs_client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_path)
        
        # Check if blob exists
        if not blob.exists():
            raise HTTPException(
                status_code=404,
                detail="Image not found"
            )
        
        # Get metadata
        metadata = {
            "name": blob.name,
            "size": blob.size,
            "content_type": blob.content_type,
            "updated": blob.updated.isoformat() if blob.updated else None,
            "created": blob.time_created.isoformat() if blob.time_created else None,
            "cache_control": blob.cache_control,
            "content_encoding": blob.content_encoding,
        }
        
        return metadata
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting image info: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get image info"
        )

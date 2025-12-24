import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

from agents.comply.retriever_agent import list_policy_files, BASE_PATH as POLICIES_BASE_PATH

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/comply", tags=["Policies"])

# Category name mapping
CATEGORY_NAMES = {
    "kyc": "KYC (Know Your Customer)",
    "lending": "Retail & Corporate Lending",
    "payments": "Payments & UPI",
    "cybersecurity": "Cyber Security",
    "consumer_protection": "Consumer Protection"
}

VALID_CATEGORIES = list(CATEGORY_NAMES.keys())


@router.get("/policies")
async def list_all_policies():
    """List all bank policies organized by category."""
    result = {}
    
    for category in VALID_CATEGORIES:
        policies = list_policy_files(category)
        result[category] = {
            "name": CATEGORY_NAMES.get(category, category),
            "policies": [
                {
                    "file_name": p["file_name"],
                    "file_size": Path(p["file_path"]).stat().st_size if Path(p["file_path"]).exists() else 0
                }
                for p in policies
            ]
        }
    
    return result


@router.post("/policies/{category}")
async def upload_policy(category: str, file: UploadFile = File(...)):
    """Upload a new policy PDF to a category."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {VALID_CATEGORIES}")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    category_path = POLICIES_BASE_PATH / category
    category_path.mkdir(parents=True, exist_ok=True)
    
    file_path = category_path / file.filename
    
    if file_path.exists():
        raise HTTPException(status_code=400, detail=f"Policy '{file.filename}' already exists in {category}")
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    logger.info(f"[POLICY] Uploaded {file.filename} to {category}")
    
    return {
        "success": True,
        "message": f"Policy '{file.filename}' uploaded to {category}",
        "file_name": file.filename,
        "category": category
    }


@router.delete("/policies/{category}/{filename}")
async def delete_policy(category: str, filename: str):
    """Delete a policy from a category."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {VALID_CATEGORIES}")
    
    file_path = POLICIES_BASE_PATH / category / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Policy '{filename}' not found in {category}")
    
    file_path.unlink()
    logger.info(f"[POLICY] Deleted {filename} from {category}")
    
    return {
        "success": True,
        "message": f"Policy '{filename}' deleted from {category}"
    }

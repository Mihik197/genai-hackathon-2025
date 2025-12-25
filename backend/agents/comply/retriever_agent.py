from pathlib import Path
import logging
from google.adk.agents import LlmAgent
from schemas.agent_outputs import RetrieverOutput

logger = logging.getLogger(__name__)

# Use absolute path - this file is at backend/agents/comply/retriever_agent.py
# So we go up 3 levels to get to backend/, then into data/bank_policies/
BASE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "bank_policies"
logger.info(f"[RETRIEVER] BASE_PATH resolved to: {BASE_PATH}")


def list_policy_files(category: str) -> list[dict]:
    """Lists all policy PDF files in a given category folder.
    
    Args:
        category: The policy category (e.g., 'kyc', 'lending')
        
    Returns:
        List of dicts with file_name and file_path for each policy document
    """
    category_path = BASE_PATH / category
    logger.info(f"[RETRIEVER] Looking for policies in: {category_path}")
    logger.info(f"[RETRIEVER] Path exists: {category_path.exists()}")
    
    if not category_path.exists():
        logger.warning(f"[RETRIEVER] Category path does not exist: {category_path}")
        return []
    
    policies = []
    for pdf_file in category_path.glob("*.pdf"):
        logger.info(f"[RETRIEVER] Found policy file: {pdf_file.name}")
        policies.append({
            "file_name": pdf_file.name,
            "file_path": str(pdf_file.absolute()),
            "category": category
        })
    
    logger.info(f"[RETRIEVER] Total policies found in {category}: {len(policies)}")
    return policies


def get_policies_for_categories(categories: list[str]) -> list[dict]:
    """Retrieves all policy files for multiple categories.
    
    Args:
        categories: List of category names
        
    Returns:
        List of all policy file dicts across all requested categories
    """
    logger.info(f"[RETRIEVER] get_policies_for_categories called with: {categories}")
    all_policies = []
    for category in categories:
        policies = list_policy_files(category)
        all_policies.extend(policies)
    
    logger.info(f"[RETRIEVER] Total policies across all categories: {len(all_policies)}")
    return all_policies


retriever_agent = LlmAgent(
    name="RetrieverAgent",
    model="gemini-3-flash",
    description="Retrieves relevant HDFC Bank policy documents based on categories.",
    instruction="""You are a policy document retriever.

Your task: Based on the categories identified in the previous step, retrieve the relevant HDFC Bank policy documents.

You have access to the following tool:
- get_policies_for_categories(categories: list[str]) -> list[dict]

Steps:
1. Read the categories from the previous agent's output (available in state as 'categories_result')
2. Use the tool to fetch policy file paths for those categories
3. Return the list of policies that need to be analyzed

Return the categories analyzed, the policies found, and the total count.
""",
    tools=[get_policies_for_categories],
    output_schema=RetrieverOutput,
    output_key="policies_result",
)

from google.adk.agents import LlmAgent
from schemas.agent_outputs import RouterOutput

# Categories matching our bank policy folder structure
POLICY_CATEGORIES = [
    "kyc",
    "lending", 
    "payments",
    "cybersecurity",
    "consumer_protection",
]

router_agent = LlmAgent(
    name="RouterAgent",
    model="gemini-2.5-flash-lite",
    description="Categorizes incoming RBI regulations into policy domains.",
    instruction=f"""You are a regulatory classification specialist for Indian banking.

Your task: Read the provided RBI regulation/circular PDF and determine which policy categories it affects.

Available categories: {POLICY_CATEGORIES}

Instructions:
1. Carefully read the entire regulation document
2. Identify the primary subject matter (KYC, lending, payments, cybersecurity, consumer protection)
3. A regulation may affect MULTIPLE categories (e.g., a data protection circular might affect both kyc and cybersecurity)
4. Return ONLY the categories that are directly impacted
5. Extract the regulation title, reference number, summary, and effective date if mentioned

Be precise. Only include categories where the regulation has specific requirements that would affect bank policies in that area.
""",
    output_schema=RouterOutput,
    output_key="categories_result",
)

import json
from google import genai
from google.genai import types
from pydantic import BaseModel
from schemas.fraud import AIAnalysisResult


FRAUD_ANALYSIS_PROMPT = """You are a fraud detection expert analyzing a flagged financial transaction.

Given the transaction data, rule engine flags, and ML anomaly score, provide a detailed fraud analysis.

## Transaction Data
{transaction_data}

## Rule Engine Flags
{rule_flags}

## ML Anomaly Score
{ml_score}/100 (higher = more suspicious)

## Your Task
Analyze this transaction and determine:
1. The most likely fraud type (if fraudulent)
2. Your confidence level (0-100)
3. Detailed reasoning explaining your assessment
4. Key risk factors you identified
5. Recommended action

Fraud types to consider:
- SYNTHETIC_IDENTITY: Fake identity created to commit fraud
- MONEY_LAUNDERING: Attempting to disguise illegal funds
- ACCOUNT_TAKEOVER: Unauthorized access to legitimate account
- STRUCTURING: Breaking up transactions to avoid reporting thresholds
- BUST_OUT: Maxing credit before abandoning account
- PHISHING_SCAM: Social engineering attack
- MULE_ACCOUNT: Account used to move illicit funds
- LEGITIMATE: Transaction appears genuine despite flags

Be thorough in your reasoning."""


client = genai.Client()


def analyze_transaction(
    txn_data: dict,
    rule_flags: list[str],
    ml_score: float
) -> AIAnalysisResult:
    prompt = FRAUD_ANALYSIS_PROMPT.format(
        transaction_data=json.dumps(txn_data, indent=2, default=str),
        rule_flags=", ".join(rule_flags) if rule_flags else "None",
        ml_score=ml_score
    )

    response = client.models.generate_content(
        model="gemini-flash-lite-latest",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AIAnalysisResult
        )
    )

    return AIAnalysisResult.model_validate_json(response.text)

# FinGuard AI Backend

AI-powered banking compliance and financial services platform.

## Setup

```bash
# Install dependencies
uv sync

# Run dev server
uv run uvicorn main:app --reload
```

## Structure

```
backend/
├── main.py              # FastAPI app entry
├── routers/             # API route handlers
│   └── comply.py        # /api/v1/comply/*
├── agents/              # Google ADK agents
│   └── comply/          # RegTech compliance agent
├── tools/               # Agent tools
├── schemas/             # Pydantic models
└── data/
    └── bank_policies/   # HDFC policy PDFs by category
        ├── kyc/
        ├── lending/
        ├── payments/
        ├── cybersecurity/
        └── consumer_protection/
```

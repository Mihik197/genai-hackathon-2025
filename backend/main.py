import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from routers import comply

app = FastAPI(
    title="FinGuard AI",
    description="AI-powered banking compliance and financial services platform",
    version="0.1.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(comply.router)


@app.get("/")
async def root():
    return {"message": "FinGuard AI API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

from fastapi import FastAPI
from app.api.credit import router

app = FastAPI(title="Hybrid Credit Risk Engine")
app.include_router(router)

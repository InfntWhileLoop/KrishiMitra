#!/usr/bin/env python3
"""
FastAPI backend for Seed Variety Recommender System
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

<<<<<<< HEAD
from routers import seedrec, cluster
=======
from app.routers import seedrec, cluster

>>>>>>> a4a1021 (Initial commit with changes)

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Seed Variety Recommender API",
    description="API for recommending seed varieties based on local conditions and traits",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(seedrec.router, prefix="/api/seed", tags=["seed"])
app.include_router(cluster.router, prefix="/api/cluster", tags=["cluster"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Seed Variety Recommender API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

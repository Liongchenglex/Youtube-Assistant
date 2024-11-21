from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.transcript_service import TranscriptService
from services.gpt_service import GPTService
from utils.exceptions import TranscriptError
from dotenv import load_dotenv
from typing import Optional, List
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    logger.error("OPENAI_API_KEY not found in environment variables!")
else:
    logger.info("OPENAI_API_KEY found in environment")

app = FastAPI()
gpt_service = GPTService()
transcript_service = TranscriptService()

# Configure CORS for extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscriptRequest(BaseModel):
    video_id: str
    timestamp: float = None

@app.post("/api/transcript")
async def get_transcript(request: TranscriptRequest):
    try:
        transcript_service = TranscriptService()
        result = await transcript_service.get_transcript(
            request.video_id, 
            request.timestamp
        )
        return result
    except TranscriptError as e:
        raise HTTPException(status_code=404, detail=str(e))
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))
    

class QuestionRequest(BaseModel):
    video_id: str
    question: str
    transcript: Optional[List[dict]]  # Will be None for first request
    metadata: dict

@app.post("/api/chat")
async def process_question(request: QuestionRequest):
    try:
        logger.info(f"Received chat request for video: {request.video_id}")
        # If no transcript provided, fetch it
        transcript = request.transcript
        if not transcript:
            logger.info("No transcript provided, fetching from service")
            transcript = await transcript_service.get_transcript(request.video_id)

        response = gpt_service.process_question(
            video_id=request.video_id,
            question=request.question,
            transcript=transcript,
            metadata=request.metadata
        )
        logger.info(f"Got response from GPT: {response[:100]}...") 
        return {"response": response}

    except Exception as e:
        logger.error(f"Error in process_question endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
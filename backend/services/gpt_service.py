# backend/services/gpt_service.py
from openai import OpenAI
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GPTService:
    def __init__(self):
        try:
            self.client = OpenAI()  # Make sure you have OPENAI_API_KEY in environment
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {str(e)}")
            raise
        self.sessions: Dict[str, List[dict]] = {}        

    def create_system_prompt(self, transcript, video_metadata):
        return f"""You are an AI assistant analyzing a YouTube video.
        Video Title: {video_metadata.get('title')}
        Video Description: {video_metadata.get('description')}
        
        You have access to the video's transcript and can answer questions about its content.
        Base your answers only on the provided transcript and metadata.
        If asked about timestamps, refer to the transcript segments.
        
         Important Instructions for Timestamp Format:
    1. For videos under 1 hour:
       - Use format: [MM:SS]
       - Example: [05:35] for 5 minutes 35 seconds
       - Example: [14:02] for 14 minutes 2 seconds
    
    2. For videos over 1 hour:
       - Use format: [HH:MM:SS]
       - Example: [1:05:35] for 1 hour 5 minutes 35 seconds
       - Example: [2:14:02] for 2 hours 14 minutes 2 seconds"""

    def get_or_create_session(self, video_id: str) -> List[dict]:
        if video_id not in self.sessions:
            self.sessions[video_id] = []
        return self.sessions[video_id]

    def process_question(self, 
                        video_id: str, 
                        question: str, 
                        transcript: List[dict], 
                        metadata: dict) -> str:
        try:
            logger.info(f"Processing question for video {video_id}")
            messages = self.get_or_create_session(video_id)
            
            # If this is the first question for this video, add system and context
            if not messages:
                messages.append({
                    "role": "system",
                    "content": self.create_system_prompt(transcript, metadata)
                })
                
                # Add transcript as context
                transcript_text = self.format_transcript(transcript)
                messages.append({
                    "role": "system",
                    "content": f"Here's the video transcript:\n{transcript_text}"
                })

            # Add user question
            messages.append({
                "role": "user",
                "content": question
            })

            # Remove await since it's synchronous
            response = self.client.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            answer = response.choices[0].message.content
            
            # Save the assistant's response to the session
            messages.append({
                "role": "assistant",
                "content": answer
            })
            
            return answer

        except Exception as e:
            logger.error(f"Error in GPT processing: {str(e)}")
            return f"Error processing question: {str(e)}"

    def format_transcript(self, transcript: List[dict]) -> str:
        # Also update how we format the transcript for better context
        formatted_segments = []
        for entry in transcript:
            # # Convert seconds to MM:SS format for reference
            # seconds = entry['start']
            # minutes = int(seconds // 60)
            # remaining_seconds = int(seconds % 60)
            # timestamp_mmss = f"{minutes}:{remaining_seconds:02d}"
            
            # formatted_segments.append(
            #     # f"[{entry['start']}s | {timestamp_mmss}] {entry['text']}"
            #     f"[{timestamp_mmss}] {entry['text']}"
            # )
        # Convert seconds to HH:MM:SS or MM:SS format
            total_seconds = entry['start']
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            seconds = int(total_seconds % 60)
            
            # Format timestamp based on whether hours are needed
            if hours > 0:
                timestamp = f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                timestamp = f"{minutes}:{seconds:02d}"
            
            formatted_segments.append(
                f"[{timestamp}] {entry['text']}"
            )
        return "\n".join(formatted_segments)
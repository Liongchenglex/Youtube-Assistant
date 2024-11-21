from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import JSONFormatter
from utils.exceptions import TranscriptError

class TranscriptService:
    def __init__(self):
        self.formatter = JSONFormatter()

    async def get_transcript(self, video_id: str, timestamp: float = None):
        try:
            # Try getting manual transcripts first
            transcript = self._get_manual_transcript(video_id)
            
            # If no manual transcript, try auto-generated
            if not transcript:
                transcript = self._get_auto_transcript(video_id)
            
            # If still no transcript, raise error
            if not transcript:
                raise TranscriptError("No transcript available for this video")

            # Convert transcript to list if it's not already
            transcript_list = transcript if isinstance(transcript, list) else []
            
            if timestamp is not None:
                return self._get_context_window(transcript_list, timestamp)
            
            return transcript_list

        except Exception as e:
            raise TranscriptError(f"Failed to get transcript: {str(e)}")

    def _get_manual_transcript(self, video_id: str):
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_manually_created_transcript()
            return transcript.fetch()  # Return raw transcript data
        except:
            return None

    def _get_auto_transcript(self, video_id: str):
        try:
            return YouTubeTranscriptApi.get_transcript(video_id)  # Direct method for auto transcripts
        except:
            return None

    def _get_context_window(self, transcript, timestamp, window_size=30):
        """Get transcript context around timestamp"""
        if not transcript:
            return []
            
        context = []
        for entry in transcript:
            if abs(entry['start'] - timestamp) <= window_size:
                context.append(entry)
        
        return context if context else transcript[:5] 
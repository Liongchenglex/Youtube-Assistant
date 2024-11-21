import pytest
from services.transcript_service import TranscriptService
from utils.exceptions import TranscriptError

@pytest.fixture
def transcript_service():
    return TranscriptService()

@pytest.mark.asyncio
async def test_get_transcript_success(transcript_service):
    # Use a known YouTube video ID with transcripts
    video_id = "dQw4w9WgXcQ"  # Never Gonna Give You Up
    result = await transcript_service.get_transcript(video_id)
    assert result is not None
    assert len(result) > 0

@pytest.mark.asyncio
async def test_get_transcript_with_timestamp(transcript_service):
    video_id = "dQw4w9WgXcQ"
    timestamp = 30.0
    result = await transcript_service.get_transcript(video_id, timestamp)
    assert result is not None
    assert all(abs(entry['start'] - timestamp) <= 30 for entry in result)

@pytest.mark.asyncio
async def test_get_transcript_invalid_video(transcript_service):
    video_id = "invalid_id"
    with pytest.raises(TranscriptError):
        await transcript_service.get_transcript(video_id)
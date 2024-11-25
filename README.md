# YouTube Video Assistant

A Chrome extension that enables interactive AI-powered conversations about YouTube videos. Users can ask questions, get summaries, and interact with video content through a chat interface powered by GPT-4.

## Features

- 🎥 Real-time YouTube video analysis
- 💬 Interactive chat interface
- 🤖 GPT-4 powered responses
- ⏰ Timestamp-aware responses
- 📝 Video transcript analysis
- 🎯 Context-aware responses
- 🔄 Seamless video navigation support
- 🎨 Clean, minimalistic UI

## Tech Stack

### Frontend (Chrome Extension)
- JavaScript 
- HTML5
- CSS3
- Chrome Extension Manifest V3

### Backend
- Python 
- FastAPI
- OpenAI GPT-4
- youtube-transcript-api
- uvicorn

### Development Tools
- Git
- Visual Studio Code
- Chrome DevTools

## Installation
### Backend Setup
1. Clone the repository
git clone https://github.com/Liongchenglex/youtube-assistant.git
cd youtube-assistant

2. Create and activate virtual env
python -m venv venv
For Windows: 
venv\Scripts\activate
For Mac:
source venv/bin/activate

3. Install dependencies
cd backend
pip install -r requirements.txt

4. Set up environment variables
cp .env.example .env
Add your OpenAI API key to .env file
OPENAI_API_KEY=your_api_key_here

5. Run the Backedn Server
uvicorn app:app --reload

### Extension Setup
1. Open Google Chrome
2. Go to chrome://extensions/
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked"
5. Select the extension directory from the cloned repository

### Usage
1. Visit any YouTube video
2. The chat interface will appear on the right side
3. Ask questions about the video content
4. Get AI-powered responses with relevant timestamps

Example questions:
-Can you summarize this video?
-What are the main points discussed?
-What was mentioned at 2:30?
-Tell me about the part where they discuss X


## Development
### Backend Development

-Backend runs on http://localhost:8000
-API documentation available at http://localhost:8000/docs
-Transcript fetching and GPT processing happen asynchronously
-Context management implemented for efficient token usage

### Extension Development

-Content script injected on YouTube pages
-Minimizable chat interface
-Automatic video detection
-Transcript caching for efficiency
-Real-time context updates

## API Endpoints

### POST /api/transcript

Get video transcript
Request body: { "video_id": "string" }


### POST /api/chat

Process user questions
Request body: { "video_id": "string", "question": "string", "transcript": [], "metadata": {} }

## Future Improvements

1) Support for multiple languages
2) Rate Limiting and better rate control
3) Better fallback for videos with no transcript
4) Custom model fine-tuning
5) Improved Prompting

## Acknowledgments

OpenAI for GPT-4 API
YouTube Data API
youtube-transcript-api creators

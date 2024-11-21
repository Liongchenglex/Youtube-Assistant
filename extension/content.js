// content.js

// Constants for DOM selectors and configuration
const SELECTORS = {
  video: 'video',
  chatHeader: '.chat-header',
  minimizeBtn: '.minimize-button',
  chatContent: '.chat-content',
  input: 'input',
  sendButton: '.chat-input button',
  messagesContainer: '.chat-messages'
};

const CLASSES = {
  container: 'video-chat-container',
  minimized: 'minimized',
  hidden: 'hidden',
  message: 'message',
  userMessage: 'user-message',
  aiMessage: 'ai-message'
};

class ChatUI {
  constructor() {
    this.container = null;
    this.iconUrl = this.getIconUrl();
  }

  getIconUrl() {
    try {
      return chrome.runtime.getURL('icons/icon48.png');
    } catch (error) {
      console.error('Error getting icon URL:', error);
      // Return a fallback empty string or default icon
      return '';
    }
  }


  createContainer(isMinimized) {
    this.container = document.createElement('div');
    this.container.className = CLASSES.container;
    if (isMinimized) this.container.classList.add(CLASSES.minimized);
    return this.container;
  }

  generateHTML(isMinimized) {
    return `
      <div class="chat-header ${isMinimized ? CLASSES.minimized : ''}">
        <div class="header-content">
          ${this.iconUrl ? 
            `<img src="${this.iconUrl}" class="chat-icon" alt="Chat Icon"/>` : 
            `<span class="chat-icon-fallback">AI</span>`
          }
          <span class="header-text">Video App</span>
        </div>
        <button class="minimize-button">${isMinimized ? '+' : '−'}</button>
      </div>
      <div class="chat-content ${isMinimized ? CLASSES.hidden : ''}">
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Ask about the video...">
          <button>Send</button>
        </div>
      </div>
    `;
  }


  addMessage(type, content) {
    const messagesContainer = this.container.querySelector(SELECTORS.messagesContainer);
    const messageElement = document.createElement('div');
    messageElement.className = `${CLASSES.message} ${type}-message`;
    messageElement.textContent = content;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  removeLastMessage() {
    const messagesContainer = this.container.querySelector(SELECTORS.messagesContainer);
    messagesContainer.removeChild(messagesContainer.lastChild);
  }
}

class ChatState {
  constructor() {
    this.isMinimized = false;
  }

  loadState() {
    const wasMinimized = localStorage.getItem('chatMinimized');
    this.isMinimized = wasMinimized === 'true';
    return this.isMinimized;
  }

  saveState(isMinimized) {
    localStorage.setItem('chatMinimized', isMinimized);
    this.isMinimized = isMinimized;
  }
}

class VideoDetector {
  static isVideoPage() {
    return window.location.pathname === '/watch' && 
           new URLSearchParams(window.location.search).has('v');
  }

  static getCurrentTimestamp() {
    const video = document.querySelector(SELECTORS.video);
    const seconds = Math.floor(video?.currentTime || 0);
    return {
      raw: seconds,
      formatted: this.formatTimestamp(seconds)
    };
  }

  static formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

class MessageHandler {
  static async processMessage(message, timestamp) {
    // Simulate API delay - replace with real API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `I understand you're asking about "${message}" at timestamp ${timestamp}. This is a placeholder response - integrate with your AI backend for real responses.`;
  }
}

class VideoChatAI {
  resetChat() {
    if (this.ui.container) {
      const messagesContainer = this.ui.container.querySelector(SELECTORS.messagesContainer);
      messagesContainer.innerHTML = ''; // Clear all messages
      this.ui.addMessage('ai', 'Hello! I can help you understand this video better. Ask me anything!');
    }
  }

  constructor() {
    this.ui = new ChatUI();
    this.state = new ChatState();
    this.currentVideoId = null;
    this.videoContext = null;  
    this.backendContext = null; 
    this.setupUrlObserver();
  }
//   async loadVideoContext() {
//     const videoId = new URLSearchParams(window.location.search).get('v');
//     try {
//         console.log('Loading context for video:', videoId);
//         const response = await fetch('http://localhost:8000/api/transcript', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 video_id: videoId
//             })
//         });

//         if (!response.ok) {
//             throw new Error('Failed to get video context');
//         }

//         this.videoContext = {
//             transcript: await response.json(),
//             metadata: {
//                 title: document.title,
//                 description: this.getVideoDescription(),
//                 videoId: videoId
//             }
//         };
        
//         console.log('Video context loaded successfully');
//     } catch (error) {
//         console.error('Error loading video context:', error);
//         this.videoContext = null;
//     }
// }
debugShowTranscript() {
  if (this.backendContext) {
      console.log('=== Cached Transcript ===');
      console.log('First 5 segments:');
      const first5 = this.backendContext.slice(0, 5);
      first5.forEach((segment, i) => {
          console.log(`[${i}] ${segment.start} - ${segment.text}`);
      });
      console.log(`Total segments: ${this.backendContext.length}`);
      console.log('=====================');
  } else {
      console.log('No transcript cached');
  }
}

async loadVideoContext() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  try {
      console.log('Loading context for video:', videoId);
      
      // Only fetch from backend if we don't have it cached or if video changed
      if (!this.backendContext || this.currentVideoId !== videoId) {
          const response = await fetch('http://localhost:8000/api/transcript', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  video_id: videoId
              })
          });

          if (!response.ok) {
              throw new Error('Failed to get video context');
          }

          // Store the backend response
          this.backendContext = await response.json();
          console.log('New context loaded and cached for video:', videoId);
          console.log('Transcript segments example:');
          console.log('First 3 segments:', this.backendContext.slice(0, 20));
          console.log('Total segments:', this.backendContext.length);
          this.debugShowTranscript();
      } else {
          console.log('Using cached context for video:', videoId);
          this.debugShowTranscript();
      }

      // Update current context with latest metadata
      this.videoContext = {
          transcript: this.backendContext, // Using cached transcript
          metadata: {
              title: document.title,
              description: this.getVideoDescription(),
              videoId: videoId
          }
      };
      
  } catch (error) {
      console.error('Error loading video context:', error);
      this.videoContext = null;
      this.backendContext = null;
  }
}



getVideoDescription() {
  const descriptionElement = document.querySelector('#description-inner');
  return descriptionElement ? descriptionElement.textContent.trim() : '';
}

async init() {
    if (VideoDetector.isVideoPage()) {
      await this.loadVideoContext();
      this.createInterface();
    }
  }



  setupUrlObserver() {
    let lastUrl = window.location.href;
    new MutationObserver(() => {
      if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        this.handleUrlChange();
      }
    }).observe(document.body, { subtree: true, childList: true });
  }


  createInterface() {
    const isMinimized = this.state.loadState();
    this.ui.createContainer(isMinimized);
    this.ui.container.innerHTML = this.ui.generateHTML(isMinimized);
    document.body.appendChild(this.ui.container);
    
    this.setupEventListeners();
    // if (!isMinimized) {
    this.ui.addMessage('ai', 'Hello! I can help you understand this video better. Ask me anything!');
    // }
    
    // Set initial videoId
    this.currentVideoId = new URLSearchParams(window.location.search).get('v');
  }


  

  removeInterface() {
    if (this.ui.container) {
      this.ui.container.remove();
      this.ui.container = null;
    }
  }

  setupEventListeners() {
    this.setupMinimizeListeners();
    this.setupMessageListeners();
  }


  setupMinimizeListeners() {
    const header = this.ui.container.querySelector(SELECTORS.chatHeader);
    const minimizeBtn = this.ui.container.querySelector(SELECTORS.minimizeBtn);
    const chatContent = this.ui.container.querySelector(SELECTORS.chatContent);
    const icon = this.ui.container.querySelector('.chat-icon');

    const toggleMinimize = (event) => {
        // Only proceed if clicking the icon when minimized
        // or clicking the minimize button when expanded
        if (
            (this.ui.container.classList.contains(CLASSES.minimized) && event.target === icon) ||
            (!this.ui.container.classList.contains(CLASSES.minimized) && event.target === minimizeBtn)
        ) {
            const isMinimized = this.ui.container.classList.contains(CLASSES.minimized);
            
            this.ui.container.classList.toggle(CLASSES.minimized);
            header.classList.toggle(CLASSES.minimized);
            chatContent.classList.toggle(CLASSES.hidden);
            minimizeBtn.textContent = isMinimized ? '−' : '+';
            
            this.state.saveState(!isMinimized);
        }
    }

        // Add click handlers
        icon.addEventListener('click', toggleMinimize);
        minimizeBtn.addEventListener('click', toggleMinimize);
  
  }

  setupMessageListeners() {
    const input = this.ui.container.querySelector(SELECTORS.input);
    const sendButton = this.ui.container.querySelector(SELECTORS.sendButton);

    const sendMessage = async () => {
      const message = input.value.trim();
      if (message) {
        this.ui.addMessage('user', message);
        input.value = '';
        await this.handleMessage(message);
      }
    };

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

//   async handleUrlChange() {
//     const currentVideoId = new URLSearchParams(window.location.search).get('v');
    
//     if (VideoDetector.isVideoPage()) {
//         if (!this.ui.container) {
//             await this.loadVideoContext();
//             this.createInterface();
//         } else if (currentVideoId !== this.currentVideoId) {
//             await this.loadVideoContext();  // Load new video context
//             this.resetChat();
//             this.currentVideoId = currentVideoId;
//         }
//     } else {
//         this.removeInterface();
//     }
// }

    // Modify handleUrlChange to clear cache when video changes
    async handleUrlChange() {
      const currentVideoId = new URLSearchParams(window.location.search).get('v');
      
      if (VideoDetector.isVideoPage()) {
          if (!this.ui.container) {
              await this.loadVideoContext();
              this.createInterface();
          } else if (currentVideoId !== this.currentVideoId) {
              this.backendContext = null;  // Clear cache for new video
              await this.loadVideoContext();
              this.resetChat();
              this.currentVideoId = currentVideoId;
          }
      } else {
          this.removeInterface();
          this.backendContext = null;  // Clear cache when leaving video page
      }
  }


      // Modify handleMessage to use cached context
    //   async handleMessage(message) {
    //     this.ui.addMessage('ai', 'Loading...');
        
    //     try {
    //         // Use cached context
    //         const context = {
    //             message: message,
    //             videoContext: this.videoContext,
    //             currentTime: VideoDetector.getCurrentTimestamp().formatted,
    //             cachedTranscript: !!this.backendContext  // Flag to show if using cached data
    //         };

    //         console.log('Using cached context:', {
    //             message,
    //             hasCache: !!this.backendContext,
    //             videoId: this.currentVideoId,
    //             timestamp: context.currentTime
    //         });

    //         // For testing, return a formatted response
    //         const response = `
    //             Processing: "${message}"
    //             Video Title: ${this.videoContext?.metadata?.title || 'N/A'}
    //             Using Cached Transcript: ${context.cachedTranscript ? 'Yes' : 'No'}
    //             Current Time: ${context.currentTime}
    //         `;

    //         this.ui.removeLastMessage();
    //         this.ui.addMessage('ai', response);

    //     } catch (error) {
    //         console.error('Error processing message:', error);
    //         this.ui.removeLastMessage();
    //         this.ui.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
    //     }
    // }

    async handleMessage(message) {
      this.ui.addMessage('ai', 'Loading...');
      
      try {
          const response = await fetch('http://localhost:8000/api/chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  video_id: this.currentVideoId,
                  question: message,
                  transcript: this.backendContext,  // Cached transcript
                  metadata: this.videoContext.metadata
              })
          });
  
          if (!response.ok) {
              throw new Error('Failed to get response');
          }
  
          const data = await response.json();
          this.ui.removeLastMessage();
          this.ui.addMessage('ai', data.response);
  
      } catch (error) {
          console.error('Error processing message:', error);
          this.ui.removeLastMessage();
          this.ui.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
      }
  }



}

// Initialize the extension
new VideoChatAI().init();
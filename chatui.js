class NavauraChatbot {
  constructor(config = {}) {
    this.apiBase = config.apiBase || 'https://server1001.navaura.in';
    this.autoTriggerDelay = config.autoTriggerDelay || 5000;
    this.sessionId = this.getSessionId();
    this.isOpen = false;
    this.isMinimized = false;
    this.messages = [];
    this.isTyping = false;
    this.hasAutoTriggered = sessionStorage.getItem('navaura_auto_triggered') === 'true';
    this.isInitialized = false;
    
    this.suggestions = [
      "Tell me about your services",
      "I need technical support",
      "Request a demo",
      "Pricing information",
      "Contact your team"
    ];
    
    this.init();
  }

  init() {
    if (window.navauraChatbotInstance) {
      console.warn('Navaura Chatbot already initialized');
      return;
    }
    window.navauraChatbotInstance = this;
    
    this.injectStyles();
    this.createChatWidget();
    this.attachEventListeners();
    this.loadWelcomeMessage();
    this.setupAutoTrigger();
    this.isInitialized = true;
    
    this.bindChatUIButtons();
  }

  bindChatUIButtons() {
    const bindButtons = () => {
      document.querySelectorAll('.chatui').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.open();
        });
      });
    };

    bindButtons();
    setTimeout(bindButtons, 500);
    setTimeout(bindButtons, 1000);
  }

  setupAutoTrigger() {
    if (!this.hasAutoTriggered) {
      setTimeout(() => {
        this.open();
        sessionStorage.setItem('navaura_auto_triggered', 'true');
        this.hasAutoTriggered = true;
      }, this.autoTriggerDelay);
    }
  }

  getSessionId() {
    let sid = localStorage.getItem('navaura_session_id');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('navaura_session_id', sid);
    }
    return sid;
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Reset */
      .navaura-chat * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Main Container */
      .navaura-chat {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999999;
        font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      /* Chat Window */
      .navaura-chat-window {
        width: 480px;
        height: 720px;
        background: #030303;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: none;
        flex-direction: column;
        transform: translateX(520px) translateY(20px) scale(0.95);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .navaura-chat-window.open {
        display: flex;
        transform: translateX(0) translateY(0) scale(1);
        opacity: 1;
      }

      .navaura-chat-window.minimized {
        height: 72px;
        overflow: hidden;
      }

      /* Header */
      .navaura-chat-header {
        background: #0a0a0a;
        color: #ffffff;
        padding: 1.5rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        user-select: none;
      }

      .navaura-chat-header-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .navaura-chat-logo {
        width: 40px;
        height: 40px;
        background: #ffffff;
        color: #000000;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        letter-spacing: -0.05em;
        position: relative;
      }

      .navaura-chat-status {
        width: 8px;
        height: 8px;
        background: #00ff00;
        border-radius: 50%;
        position: absolute;
        bottom: 2px;
        right: 2px;
        border: 2px solid #0a0a0a;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { 
          transform: scale(1);
          opacity: 1; 
        }
        50% { 
          transform: scale(1.2);
          opacity: 0.8; 
        }
      }

      .navaura-chat-header-text h3 {
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 2px;
        letter-spacing: -0.03em;
      }

      .navaura-chat-header-text p {
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        opacity: 0.5;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .navaura-chat-controls {
        display: flex;
        gap: 8px;
      }

      .navaura-chat-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      .navaura-chat-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .navaura-chat-btn:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.1);
      }

      /* Messages Container */
      .navaura-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        background: #030303;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .navaura-chat-messages::-webkit-scrollbar {
        width: 4px;
      }

      .navaura-chat-messages::-webkit-scrollbar-track {
        background: #0a0a0a;
      }

      .navaura-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
      }

      .navaura-chat-messages::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Message Bubble */
      .navaura-message {
        display: flex;
        gap: 12px;
        animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .navaura-message.user {
        flex-direction: row-reverse;
      }

      .navaura-message-avatar {
        width: 36px;
        height: 36px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 800;
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .navaura-message.user .navaura-message-avatar {
        background: #ffffff;
        color: #000000;
        border-color: #ffffff;
      }

      .navaura-message-content {
        max-width: 75%;
        padding: 12px 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.02);
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        line-height: 1.6;
        word-wrap: break-word;
        word-break: break-word;
        white-space: pre-wrap;
      }

      .navaura-message.user .navaura-message-content {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.15);
      }

      /* Links */
      .navaura-message-content a {
        color: rgba(255, 255, 255, 0.6);
        text-decoration: underline;
        transition: color 0.2s;
        cursor: pointer;
        word-break: break-all;
      }

      .navaura-message-content a:hover {
        color: #ffffff;
      }

      .navaura-message.user .navaura-message-content a {
        color: rgba(255, 255, 255, 0.7);
      }

      .navaura-message.user .navaura-message-content a:hover {
        color: #ffffff;
      }

      /* Phone Links */
      .navaura-message-content .phone-link {
        color: rgba(255, 255, 255, 0.6);
        text-decoration: underline;
        cursor: pointer;
        transition: color 0.2s;
      }

      .navaura-message-content .phone-link:hover {
        color: #ffffff;
      }

      .navaura-message-time {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        opacity: 0.4;
        margin-top: 4px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      /* Suggestions */
      .navaura-suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
        animation: fadeIn 0.5s ease-out 0.3s both;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .navaura-suggestion-pill {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        padding: 8px 14px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        user-select: none;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .navaura-suggestion-pill:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.3);
        color: #ffffff;
        transform: translateY(-2px);
      }

      .navaura-suggestion-pill:active {
        transform: translateY(0);
      }

      /* Typing Indicator */
      .navaura-typing {
        display: flex;
        gap: 6px;
        padding: 12px 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.02);
        width: fit-content;
      }

      .navaura-typing span {
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }

      .navaura-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .navaura-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.3;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }

      /* Input Area */
      .navaura-chat-input-area {
        padding: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: #0a0a0a;
        display: flex;
        gap: 12px;
      }

      .navaura-chat-input {
        flex: 1;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 16px;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        background: rgba(255, 255, 255, 0.02);
        color: #ffffff;
        resize: none;
        max-height: 120px;
        min-height: 44px;
        transition: all 0.2s;
      }

      .navaura-chat-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      .navaura-chat-input:focus {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.04);
      }

      .navaura-chat-send {
        width: 44px;
        height: 44px;
        background: #ffffff;
        color: #000000;
        border: none;
        cursor: pointer;
        font-size: 18px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      .navaura-chat-send:hover:not(:disabled) {
        background: #cccccc;
        transform: scale(1.05);
      }

      .navaura-chat-send:active:not(:disabled) {
        transform: scale(0.95);
        background: #999999;
      }

      .navaura-chat-send:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      /* Powered By */
      .navaura-powered {
        text-align: center;
        padding: 12px;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: #030303;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .navaura-powered a {
        color: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        font-weight: 700;
      }

      .navaura-powered a:hover {
        color: #ffffff;
        text-decoration: underline;
      }

      /* Mobile Responsive */
@media (max-width: 768px) {
  .navaura-chat {
    bottom: 0;
    right: 0;
    left: 0;
    z-index: 9999999;
  }

  .navaura-chat-window {
    width: 100%;
    height: 75vh;
    height: 75dvh;
    max-height: 600px;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px 16px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(100%) !important;
    opacity: 1;
  }

  .navaura-chat-window.open {
    transform: translateY(0) !important;
    display: flex;
  }
        .navaura-chat-header {
          padding: max(1.5rem, env(safe-area-inset-top) + 1rem) 1.5rem 1.5rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
          background: rgba(10, 10, 10, 0.95);
        }

        .navaura-chat-messages {
          padding: 1rem;
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        
        .navaura-chat-input-area {
          padding: 1rem;
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }

        .navaura-message-content {
          max-width: 85%;
        }

        .navaura-suggestion-pill {
          font-size: 11px;
          padding: 8px 14px;
        }
      }
      
      /* Extra small screens */
      @media (max-width: 414px) {
        .navaura-chat-header {
          padding: max(1rem, env(safe-area-inset-top) + 0.75rem) 1rem 1rem 1rem;
        }
        
        .navaura-chat-header-text h3 {
          font-size: 14px;
        }
        
        .navaura-chat-header-text p {
          font-size: 10px;
        }
        
        .navaura-chat-logo {
          width: 36px;
          height: 36px;
          font-size: 16px;
        }
        
        .navaura-message-content {
          font-size: 13px;
          padding: 10px 14px;
        }
        
        .navaura-suggestion-pill {
          font-size: 10px;
          padding: 6px 12px;
        }
      }

      /* Welcome Animation */
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-8px);
        }
      }

      .navaura-chat-window.open .navaura-chat-logo {
        animation: bounce 0.6s ease-out 0.2s;
      }
    `;
    document.head.appendChild(style);
  }

  createChatWidget() {
    const container = document.createElement('div');
    container.className = 'navaura-chat';
    container.innerHTML = `
      <div class="navaura-chat-window" id="navauraChatWindow">
        <div class="navaura-chat-header" id="navauraChatHeader">
          <div class="navaura-chat-header-title">
            <div class="navaura-chat-logo">
              K
              <div class="navaura-chat-status"></div>
            </div>
            <div class="navaura-chat-header-text">
              <h3>KRITTIM AI</h3>
              <p>Navaura Support • Online</p>
            </div>
          </div>
          <div class="navaura-chat-controls">
            <button class="navaura-chat-btn" id="navauraChatMinimize" title="Minimize">−</button>
            <button class="navaura-chat-btn" id="navauraChatClose" title="Close">✕</button>
          </div>
        </div>
        
        <div class="navaura-chat-messages" id="navauraChatMessages"></div>
        
        <div class="navaura-chat-input-area">
          <textarea 
            class="navaura-chat-input" 
            id="navauraChatInput" 
            placeholder="Type your message..."
            rows="1"
          ></textarea>
          <button class="navaura-chat-send" id="navauraChatSend">
            →
          </button>
        </div>
        
        <div class="navaura-powered">
          Powered by <a href="https://navaura.in" target="_blank">Navaura Arctiq</a>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    this.container = container;
  }

  attachEventListeners() {
    document.getElementById('navauraChatClose').addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    document.getElementById('navauraChatMinimize').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMinimize();
    });

    document.getElementById('navauraChatHeader').addEventListener('click', () => {
      if (this.isMinimized) {
        this.toggleMinimize();
      }
    });

    document.getElementById('navauraChatSend').addEventListener('click', () => {
      this.sendMessage();
    });

    const input = document.getElementById('navauraChatInput');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    
    // Prevent zoom on iOS when focusing input
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      input.addEventListener('focus', () => {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      });
      
      input.addEventListener('blur', () => {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      });
    }
  }

  open() {
    this.isOpen = true;
    const chatWindow = document.getElementById('navauraChatWindow');
    chatWindow.classList.add('open');
    
    // Prevent body scroll on mobile when chat is open
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    
    setTimeout(() => {
      document.getElementById('navauraChatInput').focus();
    }, 400);
  }

  close() {
    this.isOpen = false;
    document.getElementById('navauraChatWindow').classList.remove('open');
    
    // Restore body scroll on mobile
    if (window.innerWidth <= 768) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    const window = document.getElementById('navauraChatWindow');
    if (this.isMinimized) {
      window.classList.add('minimized');
    } else {
      window.classList.remove('minimized');
    }
  }

  loadWelcomeMessage() {
    this.addMessage('bot', 'Hey there! 👋 I\'m KRITTIM, your AI assistant from Navaura Arctiq. I\'m here to help you with anything you need!');
    this.showSuggestions();
  }

  showSuggestions() {
    const messagesContainer = document.getElementById('navauraChatMessages');
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'navaura-suggestions';
    suggestionsDiv.id = 'navauraSuggestions';
    
    this.suggestions.forEach(suggestion => {
      const pill = document.createElement('button');
      pill.className = 'navaura-suggestion-pill';
      pill.textContent = suggestion;
      pill.addEventListener('click', () => {
        this.handleSuggestionClick(suggestion);
      });
      suggestionsDiv.appendChild(pill);
    });
    
    messagesContainer.appendChild(suggestionsDiv);
    this.scrollToBottom();
  }

  hideSuggestions() {
    const suggestions = document.getElementById('navauraSuggestions');
    if (suggestions) {
      suggestions.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => suggestions.remove(), 300);
    }
  }

  handleSuggestionClick(suggestion) {
    this.hideSuggestions();
    const input = document.getElementById('navauraChatInput');
    input.value = suggestion;
    this.sendMessage();
  }

  cleanMarkdownAndMakeClickable(text) {
    let cleaned = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^#+\s/gm, '')
      .replace(/^>\s/gm, '')
      .replace(/^[-*+]\s/gm, '• ');
    
    const linkMap = new Map();
    let linkCounter = 0;
    cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const placeholder = `__LINK_${linkCounter}__`;
      linkMap.set(placeholder, { text, url });
      linkCounter++;
      return placeholder;
    });
    
    const escapeDiv = document.createElement('div');
    escapeDiv.textContent = cleaned;
    let escaped = escapeDiv.innerHTML;
    
    linkMap.forEach((link, placeholder) => {
      escaped = escaped.replace(
        placeholder,
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.text}</a>`
      );
    });
    
    escaped = escaped.replace(
      /(?<!href=["'])(?<!>)(https?:\/\/[^\s<]+)(?![^<]*<\/a>)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    escaped = escaped.replace(
      /(?<![a-zA-Z0-9])(\+?\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4})(?![a-zA-Z0-9])/g,
      (match) => {
        const cleanPhone = match.replace(/[\s\-]/g, '');
        return `<span class="phone-link" onclick="window.location.href='tel:${cleanPhone}'">${match}</span>`;
      }
    );
    
    escaped = escaped.replace(
      /(?<!href=["'])(?<!>)([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)(?![^<]*<\/a>)/g,
      '<a href="mailto:$1">$1</a>'
    );
    
    return escaped;
  }

  addMessage(sender, text) {
    const messagesContainer = document.getElementById('navauraChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `navaura-message ${sender}`;
    
    const time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const avatar = sender === 'user' ? 'U' : 'K';
    
    const processedText = sender === 'bot' 
      ? this.cleanMarkdownAndMakeClickable(text)
      : this.escapeHtml(text);
    
    messageDiv.innerHTML = `
      <div class="navaura-message-avatar">${avatar}</div>
      <div>
        <div class="navaura-message-content">${processedText}</div>
        <div class="navaura-message-time">${time}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    this.messages.push({ sender, text, time });
  }

  showTyping() {
    if (this.isTyping) return;
    this.isTyping = true;
    
    const messagesContainer = document.getElementById('navauraChatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'navaura-message bot';
    typingDiv.id = 'navuraTypingIndicator';
    typingDiv.innerHTML = `
      <div class="navaura-message-avatar">K</div>
      <div class="navaura-typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTyping() {
    this.isTyping = false;
    const typingIndicator = document.getElementById('navuraTypingIndicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async sendMessage() {
    const input = document.getElementById('navauraChatInput');
    const sendBtn = document.getElementById('navauraChatSend');
    const message = input.value.trim();
    
    if (!message || this.isTyping) return;
    
    this.hideSuggestions();
    this.addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';
    
    sendBtn.disabled = true;
    input.disabled = true;
    
    this.showTyping();
    
    try {
      const response = await fetch(`${this.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: this.sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.session_id) {
        this.sessionId = data.session_id;
        localStorage.setItem('navaura_session_id', this.sessionId);
      }
      
      this.hideTyping();
      this.addMessage('bot', data.response);
      
    } catch (error) {
      console.error('Chat error:', error);
      this.hideTyping();
      this.addMessage('bot', 'Sorry, I encountered an error. Please try again or contact us at namaskar@navaura.in');
    } finally {
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('navauraChatMessages');
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.navauraChatbotInstance) {
      window.navauraChatbot = new NavauraChatbot();
    }
  });
} else {
  if (!window.navauraChatbotInstance) {
    window.navauraChatbot = new NavauraChatbot();
  }
}

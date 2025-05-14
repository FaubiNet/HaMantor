class Hamentor {
  constructor() {
    this.API_URL = '/api/gemini';
    this.aiInput = document.querySelector('.ai-input');
    this.markdownPreview = document.querySelector('.markdown-preview');
    this.notificationSound = new Audio('notification.mp3');
    this.typingAnimation = null;
    this.init();
  }

  init() {
    this.loadTheme();
    this.loadHistory();
    this.setupEventListeners();
    this.enableAutoResize();
    this.enableMarkdownPreview();
    this.initAnimations();
    this.initServiceWorker();
  }

  // Initialisation des événements
  setupEventListeners() {
    document.querySelector('.message-form').addEventListener('submit', (e) => this.handleSubmit(e));
    document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    document.querySelector('.clear-chat').addEventListener('click', () => this.clearChat());
    this.aiInput.addEventListener('input', () => this.autoResize(this.aiInput));
  }

  // Gestion du redimensionnement automatique
  enableAutoResize() {
    this.autoResize(this.aiInput);
    this.aiInput.addEventListener('input', () => this.autoResize(this.aiInput));
  }

  autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  // Gestion du thème
  toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  }

  loadTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light-mode', theme === 'light');
  }

  // Gestion de l'historique
  saveHistory() {
    const history = document.querySelector('.message-history').innerHTML;
    localStorage.setItem('chatHistory', history);
  }

  loadHistory() {
    const history = localStorage.getItem('chatHistory');
    if (history) document.querySelector('.message-history').innerHTML = history;
  }

  clearChat() {
    const history = document.querySelector('.message-history');
    history.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty-chat';
    empty.innerHTML = `<p>💬 Comment puis-je vous aider aujourd’hui ?</p>`;
    history.appendChild(empty);
    localStorage.removeItem('chatHistory');
  }

  // Animations
  initAnimations() {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-quad'
    });

    gsap.from('.branding', {
      duration: 1.2,
      y: 80,
      opacity: 0,
      ease: 'expo.out',
      delay: 0.3
    });

    gsap.from('.assistant-status', {
      duration: 0.8,
      x: -50,
      opacity: 0,
      delay: 0.6,
      ease: 'elastic.out(1, 0.5)'
    });
  }

  // Prévisualisation Markdown
  enableMarkdownPreview() {
    let previewTimeout;
    this.aiInput.addEventListener('input', () => {
      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(() => {
        const markdownContent = marked.parse(this.aiInput.value);
        this.animatePreviewUpdate(markdownContent);
      }, 300);
    });
  }

  animatePreviewUpdate(content) {
    gsap.to(this.markdownPreview, {
      duration: 0.2,
      opacity: 0,
      y: -5,
      onComplete: () => {
        this.markdownPreview.innerHTML = content;
        gsap.to(this.markdownPreview, {
          duration: 0.3,
          opacity: 1,
          y: 0,
          ease: 'power2.out'
        });
      }
    });
  }

  // Soumission du formulaire
  async handleSubmit(e) {
    e.preventDefault();
    const message = this.aiInput.value.trim();

    if (!message) {
      this.animateInputError();
      return;
    }

    this.addMessage(message, 'user');
    this.resetInput();
    
    try {
      const response = await this.fetchAIResponse(message);
      this.displayAIResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  animateInputError() {
    gsap.timeline()
      .to(this.aiInput, {
        x: [-5, 5, -5, 0],
        duration: 0.4,
        ease: 'power1.out'
      })
      .to(this.aiInput, {
        borderColor: ['#ff0000', '#f87171', '#0F172A'],
        duration: 0.8,
        ease: 'power2.out'
      }, 0);
  }

  // Communication API
  async fetchAIResponse(prompt) {
    const loadingEl = this.createLoadingElement();
    document.querySelector('.message-history').appendChild(loadingEl);
    
    gsap.from(loadingEl, {
      opacity: 0,
      y: 30,
      duration: 0.4,
      ease: 'back.out(1.2)'
    });

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      return this.formatResponse(data);
    } finally {
      gsap.to(loadingEl, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => loadingEl.remove()
      });
    }
  }

  // Formatage de la réponse
  formatResponse(data) {
    return data.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[🔐]/g, '🔐 <strong>Conseil Sécurité :</strong>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<div class="code-terminal"><code>${code.trim()}</code></div>`;
      });
  }

  // Affichage des réponses
  displayAIResponse(response) {
    this.addMessage(response, 'ai');
    this.animateResponseEffects();
  }

  animateResponseEffects() {
    gsap.to('.status-indicator', {
      scale: 1.2,
      duration: 0.3,
      repeat: 1,
      yoyo: true,
      ease: 'power2.out'
    });
  }

  // Gestion des messages
  addMessage(content, sender) {
    this.notificationSound.volume = 0.2;
    this.notificationSound.play();

    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.innerHTML = content;

    document.querySelector('.empty-chat')?.remove();
    const history = document.querySelector('.message-history');
    history.appendChild(messageEl);

    this.animateMessageEntry(messageEl, sender);
    this.saveHistory();
    this.scrollToBottom();
  }

  animateMessageEntry(element, sender) {
    gsap.from(element, {
      duration: 0.6,
      y: 40,
      opacity: 0,
      ease: 'back.out(1.2)',
      rotationX: sender === 'ai' ? -15 : 15,
      transformOrigin: sender === 'ai' ? 'left center' : 'right center'
    });
  }

  // Gestion des erreurs
  handleError(error) {
    const errorEl = document.createElement('div');
    errorEl.className = 'message error';
    errorEl.innerHTML = `
      <span class="material-symbols-rounded">error</span>
      <div>
        <h4>⛔ Problème détecté avec HaMentor</h4>
        <p>${this.translateError(error.message)}</p>
      </div>
    `;
    document.querySelector('.message-history').appendChild(errorEl);
    this.scrollToBottom();
  }

  translateError(error) {
    const errors = {
      'API key not valid': 'Erreur système : Contactez Hackers Academy',
      '503': 'Service temporairement indisponible',
      'quota': 'Quota d’utilisation dépassé',
      'API Error': 'Erreur de communication avec le serveur'
    };
    return errors[error] || 'Erreur inconnue';
  }

  // Méthodes utilitaires
  resetInput() {
    this.aiInput.value = '';
    this.markdownPreview.innerHTML = '';
    this.autoResize(this.aiInput);
  }

  createLoadingElement() {
    const loader = document.createElement('div');
    loader.className = 'message ai loading';
    loader.innerHTML = `
      <div class="loading-spinner"></div>
      <span>HaMentor réfléchit...</span>
    `;
    return loader;
  }

  scrollToBottom() {
    const container = document.querySelector('.message-history');
    gsap.to(container, {
      scrollTo: { y: container.scrollHeight, autoKill: false },
      duration: 0.8,
      ease: 'power3.out'
    });
  }

  // Service Worker
  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW enregistré:', registration);
        })
        .catch(error => {
          console.log('Échec d\'enregistrement:', error);
        });
    }
  }
}

new Hamentor();
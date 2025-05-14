class Hamentor {
  constructor() {
    this.API_ENDPOINT = '/api/gemini';
    this.form = document.querySelector('.message-form');
    this.input = document.querySelector('.ai-input');
    this.history = document.querySelector('.message-history');
    this.themeToggle = document.querySelector('.theme-toggle');
    this.clearButton = document.querySelector('.clear-chat');
    

    this.init();
  }

  init() {
    this.loadTheme();
    this.loadHistory();
    this.setupEventListeners();
    this.setupAutoResize();
  }

  setupEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.clearButton.addEventListener('click', () => this.clearChat());
  }

  setupAutoResize() {
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = `${this.input.scrollHeight}px`;
    });
  }

async handleSubmit(e) {
  e.preventDefault();
  const message = this.input.value.trim();

  if (!message) {
    this.input.classList.add('shake');
    setTimeout(() => this.input.classList.remove('shake'), 500);
    return;
  }

  this.addMessage(message, 'user');
  this.input.value = '';
  this.input.style.height = 'auto'; // ✅ Réinitialise la zone de saisie

  const loading = this.createLoadingElement();
  this.history.appendChild(loading);
  loading.scrollIntoView({ behavior: 'smooth' });

  try {
    const response = await this.fetchAIResponse(message);
    this.addMessage(response, 'ai');
  } catch (error) {
    this.showError(error.message);
  } finally {
    loading.remove();
  }
}



  async fetchAIResponse(prompt) {
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error('Erreur de réseau');
    
    const data = await response.json();
    return this.formatResponse(data);
  }

  formatResponse(data) {
    return data.response
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
.replace(/\*(\w+.*?)\*/g, '<strong>$1</strong>')

      .replace(/\[🔐]/g, '🔐 <strong>Conseil Sécurité :</strong>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => 
        `<div class="code-terminal"><code>${code.trim()}</code></div>`
      );
  }

  addMessage(content, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = content;
    
    if (document.querySelector('.empty-chat')) {
      document.querySelector('.empty-chat').remove();
    }

    this.history.appendChild(message);
    this.saveHistory();
    message.scrollIntoView({ behavior: 'smooth' });
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

  showError(message) {
    const error = document.createElement('div');
    error.className = 'message error';
    error.innerHTML = `
      <span class="material-symbols-rounded">error</span>
      <div>
        <h4>⛔ Erreur système</h4>
        <p>${this.translateError(message)}</p>
      </div>
    `;
    this.history.appendChild(error);
    error.scrollIntoView({ behavior: 'smooth' });
  }

  translateError(error) {
    const errors = {
      'network': 'Problème de connexion internet',
      'quota': 'Limite d\'utilisation atteinte',
      'default': 'Erreur inconnue - Contactez le support'
    };
    return errors[error.toLowerCase()] || errors.default;
  }

  toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', 
      document.body.classList.contains('light-mode') ? 'light' : 'dark'
    );
  }

  clearChat() {
    this.history.innerHTML = `
      <div class="empty-chat">
        <p>💬 Comment puis-je vous aider aujourd’hui ?</p>
      </div>
    `;
    localStorage.removeItem('chatHistory');
  }

  loadTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light-mode', theme === 'light');
  }

 saveHistory() {
  // Supprimer tous les messages de chargement avant de sauvegarder
  const loaders = this.history.querySelectorAll('.message.loading');
  loaders.forEach(loader => loader.remove());

  localStorage.setItem('chatHistory', this.history.innerHTML);
}


  loadHistory() {
    const history = localStorage.getItem('chatHistory');
    if (history) this.history.innerHTML = history;
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => new Hamentor());
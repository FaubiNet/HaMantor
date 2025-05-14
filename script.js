class Hamentor {
  constructor() {
    this.API_URL = '/.netlify/functions/gemini';
    this.aiInput = document.querySelector('.ai-input');

    this.init();
  }

  init() {
    this.loadTheme();
    this.loadHistory();
    this.setupEventListeners();
    this.enableAutoResize(); 


  }
enableAutoResize() {
  const textarea = document.querySelector('.ai-input');
  textarea.addEventListener('input', () => {
    this.autoResize(textarea);
  });

  if (textarea.value.trim() !== '') {
    this.autoResize(textarea);
  }
}

autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}


  setupEventListeners() {
    document.querySelector('.message-form').addEventListener('submit', (e) => this.handleSubmit(e));
    document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    document.querySelector('.clear-chat').addEventListener('click', () => this.clearChat());
    document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => this.handleSuggestionClick(card));
  });
    this.aiInput.addEventListener('input', () => this.autoResize(this.aiInput));

  }
async handleSubmit(e) {
  e.preventDefault();
  const input = document.querySelector('.ai-input');
  const message = input.value.trim();

  if (!message) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
    return;
  }

  this.addMessage(message, 'user');
  input.value = '';

  const loadingEl = this.createLoadingElement();
  document.querySelector('.message-history').appendChild(loadingEl);
  
  // Défilement après ajout du loading
  requestAnimationFrame(() => {
    loadingEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
  });

  try {
    const response = await this.fetchAIResponse(message);
    loadingEl.remove();
    this.addMessage(response, 'ai');
  } catch (error) {
    loadingEl.remove();
    this.showError(error);
  }
}

handleSuggestionClick(card) {
  const suggestionText = card.querySelector('h4').textContent;
  this.aiInput.value = suggestionText;
  this.aiInput.focus(); // Ajout du focus
  document.querySelector('.message-form').requestSubmit(); // Soumission propre
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
   

// Remplacer toute la méthode fetchAIResponse par :
async fetchAIResponse(prompt) {
  try {
    const response = await fetch('/api/gemini', { // Modifier l'URL ici
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error('Erreur API');
    
    const data = await response.json();
    // Adapter au nouveau format de réponse
    return this.formatResponse({ text: data.response });
  } catch (error) {
    throw new Error(this.translateError(error.message));
  }
}

// Modifier formatResponse :
formatResponse(data) {
  return data.text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[🔐]/g, '🔐 <strong>Conseil Sécurité :</strong>')
    .replace(/```(\w+)?/g, '<div class="code-block">')
    .replace(/```/g, '</div>') 
     .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<div class="code-terminal"><code>${code.trim()}</code></div>`;
      });
}

translateError(error) {
  const errors = {
    'API key not valid': 'Erreur système : Veuillez contacter l’équipe Hackers Academy pour assistance.',
    '503': 'Service momentanément indisponible. Réessayez plus tard.',
    'quota': 'Quota d’utilisation de l’IA dépassé. Essayez plus tard ou contactez l’équipe Hackers Academy.'
  };

  // Vérifie si une erreur correspond exactement
  if (errors[error]) return errors[error];

  // Recherche dans les messages d'erreur partiels (par exemple "quota exceeded")
  if (error.toLowerCase().includes('quota')) {
    return 'Quota d’utilisation de l’IA dépassé. Contactez l’équipe Hackers Academy si le problème persiste.';
  }

  return 'Erreur inconnue : veuillez contacter l’équipe Hackers Academy.';
}



addMessage(content, sender) {
  // Masquer le message vide s'il existe
  const emptyMessage = document.querySelector('.empty-chat');
  if (emptyMessage) emptyMessage.style.display = 'none';

  const messageEl = document.createElement('div');
  messageEl.className = `message ${sender}`;
  messageEl.innerHTML = content;

  const history = document.querySelector('.message-history');
  history.appendChild(messageEl);

  // Défilement optimisé avec RAF
 requestAnimationFrame(() => {
  const lastMessage = document.querySelector('.message-history').lastElementChild;
  lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
});


  this.saveHistory();
}

showError(error) {
  const errorEl = document.createElement('div');
  errorEl.className = 'message error';
  errorEl.innerHTML = `
    <span class="material-symbols-rounded">error</span>
    <div>
      <h4>⛔ Problème détecté avec HaMentor</h4>
      <p>${this.translateError(error.message)}</p>
    </div>
  `;
  const history = document.querySelector('.message-history');
  history.appendChild(errorEl);

  // Scroll vers l'erreur
  history.scrollTo({
    top: history.scrollHeight,
    behavior: 'smooth'
  });
}


  toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  }

  loadTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') document.body.classList.add('light-mode');
  }

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

  // Supprime tous les messages sauf le message vide
  history.innerHTML = '';

  // Réajoute le message vide
  const empty = document.createElement('div');
  empty.className = 'empty-chat';
  empty.innerHTML = `<p>💬 Comment puis-je vous aider aujourd’hui ?</p>`;
  history.appendChild(empty);

  // Réinitialise le stockage local (si tu enregistres l'historique)
  localStorage.removeItem('chatHistory');
}
}
// Initialisation
new Hamentor();
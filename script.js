// --- Initialisation du thème ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
initTheme();

// --- Éléments DOM ---
const apiSetup = document.getElementById('api-setup');
const chatContainer = document.getElementById('chat-container');
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const resetBtn = document.getElementById('reset-btn');

// --- Chargement initial ---
const savedKey = localStorage.getItem('gemini_api_key');
if (savedKey) {
  initChat();
} else {
  apiSetup.classList.remove('hidden');
}

// --- Gestion de la clé API ---
saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    alert('Veuillez entrer une clé API.');
    return;
  }
  if (!key.startsWith('AIzaSy')) {
    alert('⚠️ La clé API Gemini commence par "AIzaSy".');
    return;
  }
  localStorage.setItem('gemini_api_key', key);
  initChat();
});

resetBtn.addEventListener('click', () => {
  localStorage.removeItem('gemini_api_key');
  chatContainer.classList.add('hidden');
  apiSetup.classList.remove('hidden');
  apiKeyInput.value = '';
  chatMessages.innerHTML = '';
});

// --- Initialisation du chat ---
function initChat() {
  apiSetup.classList.add('hidden');
  chatContainer.classList.remove('hidden');
  addMessage("Bonjour, je suis PulsarAI. Comment puis-je vous aider ?", "bot", true);
}

// --- Saisie utilisateur ---
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// --- Envoi du message ---
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, 'user', false);
  userInput.value = '';
  userInput.style.height = '44px';

  const messageEl = addMessage('', 'bot', false);
  const typingEl = createTypingIndicator();
  messageEl.appendChild(typingEl);

  const API_KEY = localStorage.getItem('gemini_api_key');
  if (!API_KEY) {
    typingEl.remove();
    messageEl.textContent = '❌ Clé API manquante. Veuillez réinitialiser.';
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();
    typingEl.remove();

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Erreur inconnue';
      messageEl.textContent = `❌ ${errorMsg}`;
      return;
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      messageEl.textContent = '⚠️ Aucune réponse générée.';
      return;
    }

    const botReply = data.candidates[0].content.parts[0].text;
    messageEl.textContent = botReply;
    addCopyButton(messageEl);

  } catch (error) {
    console.error('Erreur réseau :', error);
    typingEl.remove();
    messageEl.textContent = '⚠️ Impossible de joindre l’IA. Vérifiez votre connexion.';
  }
}

// --- Utilitaires UI ---
function createTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'typing';
  div.innerHTML = '<span>.</span><span>.</span><span>.</span>';
  const style = document.createElement('style');
  style.textContent = `
    .typing {
      display: inline-block;
      color: var(--text-secondary);
    }
    .typing span {
      opacity: 0;
      animation: blink 1.2s infinite;
      animation-fill-mode: forwards;
      margin: 0 2px;
    }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink {
      0%, 40% { opacity: 0; }
      50%, 100% { opacity: 1; }
    }
  `;
  div.appendChild(style);
  return div;
}

function addMessage(text, sender, addCopy = false) {
  const div = document.createElement('div');
  div.classList.add('message', sender);
  if (text) div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (addCopy && sender === 'bot') {
    addCopyButton(div);
  }
  return div;
}

function addCopyButton(messageEl) {
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = 'Copier';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(messageEl.textContent.trim()).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = '✓ Copié !';
      setTimeout(() => copyBtn.textContent = original, 2000);
    });
  };
  messageEl.appendChild(copyBtn);
}

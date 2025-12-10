import { GoogleGenAI } from "https://cdn.jsdelivr.net/npm/@google/genai@0.2.1/dist/index.min.js";

// --- Sélection des éléments du DOM ---
const apiKeyInput = document.getElementById('api-key-input');
const setApiKeyBtn = document.getElementById('set-api-key-btn');
const chatContainer = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const loadingIndicator = document.getElementById('loading-indicator');

// --- Variables d'état ---
let ai = null;
let chat = null;
const model = "gemini-2.5-flash"; // Modèle rapide et efficace

// --- Fonctions Utilitaires ---

// Fonction pour ajouter un message à l'écran
function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    // Conversion des sauts de ligne (\n) en balises HTML <br>
    const formattedText = text.replace(/\n/g, '<br>');
    messageDiv.innerHTML = `<p>${formattedText}</p>`;
    
    chatContainer.appendChild(messageDiv);
    
    // Défilement automatique vers le bas pour voir le dernier message
    chatContainer.scrollTop = chatContainer.scrollHeight; 
}

// Fonction pour activer/désactiver l'interface de chat
function toggleChat(enable) {
    userInput.disabled = !enable;
    sendButton.disabled = !enable;
    
    // On désactive la configuration de la clé une fois validée pour éviter les changements en cours de route
    if (enable) {
        apiKeyInput.disabled = true;
        setApiKeyBtn.disabled = true;
        setApiKeyBtn.textContent = "Connecté";
        setApiKeyBtn.style.backgroundColor = "#4CAF50"; // Vert pour indiquer le succès
        userInput.focus();
    }
}

// --- Événements et Logique ---

// 1. Initialisation de la clé API
setApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key === '') {
        alert("Veuillez entrer une clé API Gemini valide.");
        return;
    }

    try {
        // Initialisation du SDK Google GenAI
        ai = new GoogleGenAI({ apiKey: key });
        
        // Création de la session de chat
        chat = ai.chats.create({ model });

        // Si aucune erreur immédiate, on active le chat
        toggleChat(true);
        
        // Petit message système discret pour confirmer
        appendMessage('ai', "Système initialisé. Je suis prêt à discuter.");

    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        alert("Impossible d'initialiser l'IA avec cette clé. Vérifiez la console (F12) pour plus de détails.");
    }
});

// 2. Envoi du message
async function sendMessage() {
    const prompt = userInput.value.trim();
    
    // Vérifications de base
    if (prompt === '') return;
    if (!chat) {
        alert("Veuillez d'abord valider votre clé API.");
        return;
    }

    // Affichage immédiat du message utilisateur
    appendMessage('user', prompt);
    userInput.value = ''; // Vider le champ
    
    // État de chargement
    userInput.disabled = true;
    sendButton.disabled = true;
    loadingIndicator.style.display = 'block';

    try {
        // Appel à l'API Gemini
        const response = await chat.sendMessage({ message: prompt });
        const responseText = response.text;

        // Affichage de la réponse
        appendMessage('ai', responseText);
        
    } catch (error) {
        console.error("Erreur Gemini API:", error);
        appendMessage('ai', "⚠️ Erreur de transmission. Vérifiez votre connexion ou votre clé API.");
    } finally {
        // Restauration de l'état normal
        userInput.disabled = false;
        sendButton.disabled = false;
        loadingIndicator.style.display = 'none';
        userInput.focus();
    }
}

// Écouteurs d'événements pour l'envoi
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
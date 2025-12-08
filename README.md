# Yoyo406.github.io
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Settings, X } from 'lucide-react';

export default function GeminiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    if (!apiKey.trim()) {
      setShowSettings(true);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage.content }] }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur API');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse';
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: `Erreur: ${err.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-neutral-900 overflow-hidden">
      {/* Bouton paramètres avec animation */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 p-3 bg-green-800 hover:bg-green-700 active:scale-95 text-green-50 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-900/50"
        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
      >
        <div className={`transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`}>
          {showSettings ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Settings className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
      </button>

      {/* Panneau de configuration avec animations */}
      {showSettings && (
        <>
          {/* Overlay avec fade-in */}
          <div 
            className="fixed inset-0 bg-black z-20 md:hidden animate-fade-in"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setShowSettings(false)}
          />
          
          {/* Panel avec slide-in */}
          <div 
            className="fixed inset-x-0 bottom-0 md:absolute md:top-20 md:right-6 md:inset-x-auto z-30 bg-neutral-800 border-t md:border border-neutral-700 rounded-t-3xl md:rounded-3xl p-6 md:w-96 shadow-2xl max-h-[80vh] md:max-h-none overflow-y-auto animate-slide-up md:animate-scale-in"
          >
            <h3 className="text-green-400 text-xl font-semibold mb-5">Configuration API</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-green-300 text-sm font-medium mb-2">Clé API Gemini</label>
                <input
                  type="password"
                  placeholder="Entrez votre clé API"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-700 text-white border-2 border-neutral-600 focus:border-green-500 rounded-2xl focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-green-500/20"
                />
              </div>
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center px-6 py-3 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-green-500/30"
              >
                Obtenir une clé API gratuite
              </a>
              <button
                onClick={() => setShowSettings(false)}
                className="block w-full text-center px-6 py-3 bg-neutral-700 hover:bg-neutral-600 active:scale-95 text-white font-medium rounded-full transition-all duration-300 md:hidden"
              >
                Fermer
              </button>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Votre clé API est stockée uniquement dans votre navigateur et n'est jamais envoyée ailleurs que vers l'API Google Gemini.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Zone de messages */}
      <div className="relative flex-1 overflow-y-auto px-3 sm:px-6 py-6 sm:py-12 z-10">
        {messages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center px-4 animate-fade-in">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-400 mb-3 tracking-tight animate-slide-down">
                Ask me anything...
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base animate-fade-in-delayed">
                Cliquez sur <Settings className="inline w-4 h-4" /> pour configurer votre clé API
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-slide-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-2xl px-5 sm:px-6 py-4 transition-all duration-300 hover:scale-[1.02] ${
                    msg.role === 'user'
                      ? 'bg-green-700 text-white rounded-3xl rounded-br-md shadow-lg hover:shadow-xl hover:shadow-green-700/30'
                      : msg.role === 'error'
                      ? 'bg-red-900 text-red-100 rounded-3xl rounded-bl-md shadow-lg hover:shadow-xl hover:shadow-red-900/30'
                      : 'bg-neutral-800 text-neutral-100 rounded-3xl rounded-bl-md shadow-lg border border-neutral-700 hover:shadow-xl hover:border-neutral-600'
                  }`}
                  style={{ boxShadow: msg.role === 'user' ? '0 2px 8px rgba(21, 128, 61, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)' }}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-message-slide-in">
                <div className="bg-neutral-800 border border-neutral-700 px-5 sm:px-6 py-4 rounded-3xl rounded-bl-md shadow-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Champ de saisie */}
      <div className="relative z-10 px-3 sm:px-6 pb-4 sm:pb-6 bg-gradient-to-t from-neutral-900 via-neutral-900 to-transparent pt-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-neutral-800 rounded-full border-2 border-neutral-700 focus-within:border-green-500 transition-all duration-300 shadow-lg focus-within:shadow-xl focus-within:shadow-green-500/20"
               style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="w-full px-5 sm:px-7 py-4 sm:py-5 pr-16 sm:pr-20 bg-transparent text-white text-base sm:text-lg placeholder-neutral-500 focus:outline-none disabled:opacity-50 transition-opacity duration-300"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 sm:right-2 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 bg-green-600 hover:bg-green-500 active:scale-95 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-green-500/40 disabled:hover:shadow-none"
              style={{ boxShadow: !isLoading && input.trim() ? '0 2px 8px rgba(22, 163, 74, 0.4)' : 'none' }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>
          
          <p className="text-center text-neutral-500 text-xs sm:text-sm mt-3 px-2 font-medium">
            L'IA peut faire des erreurs, vérifiez les réponses.
          </p>
        </div>
      </div>

      {/* Styles CSS pour les animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes messageSlideIn {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fadeIn 0.8s ease-out 0.2s both;
        }

        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-slide-down {
          animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-message-slide-in {
          animation: messageSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Scrollbar personnalisée */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #171717;
        }

        ::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }

        /* Support touch pour mobile */
        @media (hover: none) and (pointer: coarse) {
          button:active {
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}

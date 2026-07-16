import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { chatWithGemini } from "../lib/gemini";
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  Loader2, 
  User, 
  Trash2, 
  Stethoscope, 
  Activity, 
  Compass, 
  HeartHandshake,
  X,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe
} from "lucide-react";

// The path of the generated DermAI avatar image
const AVATAR_IMAGE = "/src/assets/images/dermai_avatar_1782845031441.jpg";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  {
    icon: Stethoscope,
    label: "Symptoms & Causes",
    text: "What are the key symptoms of Psoriasis and Eczema, and how do they differ in clinical appearance?"
  },
  {
    icon: Activity,
    label: "Meds & Tablets Guide",
    text: "What standard medications or tablets (such as antihistamines, antibiotics, or retinoids) are commonly prescribed for severe skin conditions, and what are their typical side effects?"
  },
  {
    icon: AlertTriangle,
    label: "Emergency Signs",
    text: "What are the critical symptoms of a severe skin infection or drug allergic reaction that require immediate medical care?"
  },
  {
    icon: Compass,
    label: "Recovery Protocols",
    text: "What are the standard protocols, over-the-counter treatments, and dietary tips for managing chronic hives or dermatitis?"
  }
];

export default function MedicalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State to track which message summaries are expanded to show full details
  const [expandedMessageIds, setExpandedMessageIds] = useState<Record<string, boolean>>({});

  // Parse [SUMMARY]...[/SUMMARY] and [DETAILS]...[/DETAILS] tags or auto-summarize
  const parseMessageText = (text: string) => {
    // Return early if it's the welcome-message or simple text
    if (!text) return { summary: "", details: "", hasDetails: false };

    const summaryMatch = text.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/i);
    const detailsMatch = text.match(/\[DETAILS\]([\s\S]*?)\[\/DETAILS\]/i);

    // Helper to strip any markdown-styled "Summary: " or "Summary - " prefixes
    const cleanSummaryText = (rawText: string) => {
      return rawText
        .trim()
        .replace(/^(\*?\*?summary\*?\*?\s*[:\-]\s*)/i, '');
    };

    if (summaryMatch) {
      const summary = cleanSummaryText(summaryMatch[1]);
      const details = detailsMatch ? detailsMatch[1].trim() : text.replace(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/gi, "").replace(/\[DETAILS\]|\[\/DETAILS\]/gi, "").trim();
      return { summary, details, hasDetails: !!details && details !== summary };
    }

    // Fallback: If no tags are found, automatically create a summary from the first 2 sentences.
    const sentences = text.split(/(?<=[.!?])\s+/);
    if (sentences.length > 2) {
      const summary = cleanSummaryText(sentences.slice(0, 2).join(" "));
      const details = text;
      return { summary, details, hasDetails: true };
    }

    return { summary: cleanSummaryText(text), details: text, hasDetails: false };
  };

  const toggleExpandMessage = (id: string) => {
    setExpandedMessageIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Language, voice recognition, and voice speech synthesis states
  const [currentLanguage, setCurrentLanguage] = useState<string>("en-US");
  const [languageNotification, setLanguageNotification] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [autoReadResponse, setAutoReadResponse] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Helper to map code to human-friendly name for Gemini context injection
  const getLanguageName = (code: string) => {
    switch (code) {
      case "es-ES": return "Spanish";
      case "fr-FR": return "French";
      case "hi-IN": return "Hindi";
      case "te-IN": return "Telugu";
      case "zh-CN": return "Chinese";
      case "de-DE": return "German";
      case "en-US":
      default:
        return "English";
    }
  };

  // Initialize and update Speech Recognition engine based on selected language
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = currentLanguage;

      rec.onstart = () => {
        setIsListening(true);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setSpeakingMessageId(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(prev => (prev ? prev + " " + transcript : transcript));
          setAutoReadResponse(true); // Automatically speak the next incoming bot reply
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
        if (e.error === "not-allowed") {
          setError("Microphone access is blocked or not permitted. Please click 'Open in new tab' if the preview iframe restricts permissions, or allow microphone access in your browser settings.");
        } else if (e.error === "no-speech") {
          // Silent timeout, no need to show intrusive message
        } else if (e.error === "network") {
          setError("A network error occurred during speech recognition. Please check your internet connection.");
        } else {
          setError(`Speech recognition issue: ${e.error || "unknown"}. Please try again or type your message.`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [currentLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Try Google Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      try {
        setError(null); // Clear old errors when starting to listen
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Text-To-Speech reader
  const speakText = (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support read aloud features (Text-To-Speech).");
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any currently speaking voice
    
    // Clean markdown characters from output text for better pronunciation
    let cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/-\s/g, '')
      .replace(/`([^`]+)`/g, '$1');

    // Strip leading "Summary:" or "Summary - " prefix
    cleanText = cleanText.trim().replace(/^(summary\s*[:\-]\s*)/i, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentLanguage;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        console.log("Speech synthesis interrupted or stopped as expected.");
      } else {
        console.warn("Speech Synthesis warning or blocked by browser:", e.error, e);
      }
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Auto cancel TTS when chat closes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Initialize with a welcoming introductory greeting from the Bot
  useEffect(() => {
    const savedMessages = localStorage.getItem("medical_bot_history");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        loadDefaultGreeting();
      }
    } else {
      loadDefaultGreeting();
    }
  }, []);

  const loadDefaultGreeting = () => {
    const greeting: Message = {
      id: "welcome-message",
      role: "model",
      text: "Hello! I am **DermAI Medical Assistant**, your compassionate AI wellness companion. \n\nI can answer your questions about dermatological conditions, pathology, symptoms, general medicine, commonly prescribed medications or tablets, drug mechanisms, side effects, and clinical care guidelines.\n\n*Disclaimer: I provide educational guidance. Always consult a healthcare specialist or physician for professional medical treatment.*",
      timestamp: new Date().toISOString()
    };
    setMessages([greeting]);
    localStorage.setItem("medical_bot_history", JSON.stringify([greeting]));
  };

  // Scroll to bottom on message change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const saveAndSetMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem("medical_bot_history", JSON.stringify(newMessages));
  };

  const handleSendMessage = async (textToSubmit: string) => {
    if (!textToSubmit.trim() || loading) return;

    setError(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSubmit,
      timestamp: new Date().toISOString()
    };

    const currentHistory = [...messages, userMsg];
    saveAndSetMessages(currentHistory);
    setInputValue("");
    setLoading(true);

    try {
      // Format history into structure expected by the server
      const chatHistory = currentHistory
        .filter(m => m.id !== "welcome-message") // exclude initial greeting for API context optimization
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      let replyText = await chatWithGemini(textToSubmit, chatHistory.slice(0, -1), getLanguageName(currentLanguage));
      const langMatch = replyText.match(/\[SET_LANGUAGE\](.*?)\[\/SET_LANGUAGE\]/i);
      if (langMatch) {
        const newLangCode = langMatch[1].trim();
        const supportedCodes = ["en-US", "te-IN", "hi-IN", "es-ES", "fr-FR", "zh-CN", "de-DE"];
        if (supportedCodes.includes(newLangCode)) {
          setCurrentLanguage(newLangCode);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          const langName = getLanguageName(newLangCode);
          setLanguageNotification(`Switched chat & speech to ${langName}`);
          setTimeout(() => {
            setLanguageNotification(null);
          }, 4000);
        }
        replyText = replyText.replace(/\[SET_LANGUAGE\][\s\S]*?\[\/SET_LANGUAGE\]/gi, "").trim();
      }

      const botReplyMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "model",
        text: replyText,
        timestamp: new Date().toISOString()
      };

      saveAndSetMessages([...currentHistory, botReplyMsg]);

      // Automatically read out loud if enabled (e.g. following voice inputs)
      if (autoReadResponse) {
        speakText(replyText, botReplyMsg.id);
      }
    } catch (err: any) {
      console.error("Chat message delivery failed:", err);
      setError(err.message || "Unable to retrieve clinical reply. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setError(null);
    setConfirmClear(false);
    loadDefaultGreeting();
  };

  return (
    <div id="persistent-floating-chatbot-root" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. FLOATING CHAT PANEL */}
      {isOpen && (
        <div 
          id="floating-chat-panel" 
          className="w-[410px] max-w-[calc(100vw-32px)] h-[590px] max-h-[80vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-scale-in"
        >
          {/* Header section */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                <img 
                  src={AVATAR_IMAGE} 
                  alt="DermAI" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback if image path changes
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/dermai/150/150";
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs leading-tight text-white flex items-center gap-1.5">
                  DermAI Assistant
                </h3>
                <p className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                  Clinical Expert Companion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Selection Selector (Left of delete button) */}
              <div className="flex items-center bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 gap-1 mr-1 transition-all">
                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                <select
                  value={currentLanguage}
                  onChange={(e) => {
                    setCurrentLanguage(e.target.value);
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="bg-transparent text-white font-extrabold text-[10px] outline-none cursor-pointer focus:ring-0 border-0 p-0 pr-1 hover:text-blue-400"
                  title="Change Bot Response Language"
                >
                  <option value="en-US" className="bg-slate-900 text-white">🇺🇸 EN</option>
                  <option value="es-ES" className="bg-slate-900 text-white">🇪🇸 ES</option>
                  <option value="fr-FR" className="bg-slate-900 text-white">🇫🇷 FR</option>
                  <option value="hi-IN" className="bg-slate-900 text-white">🇮🇳 HI</option>
                  <option value="te-IN" className="bg-slate-900 text-white">🇮🇳 TE (Telugu)</option>
                  <option value="zh-CN" className="bg-slate-900 text-white">🇨🇳 ZH</option>
                  <option value="de-DE" className="bg-slate-900 text-white">🇩🇪 DE</option>
                </select>
              </div>

              <button
                onClick={handleClearHistory}
                title="Delete Chat History"
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all cursor-pointer font-extrabold text-[9px] border bg-rose-950/50 border-rose-900/40 hover:bg-rose-900/65 text-rose-300 hover:text-white"
              >
                <Trash2 className="w-3 h-3 shrink-0" />
                <span>Delete Chat</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Language Alert banner */}
          {languageNotification && (
            <div className="bg-blue-50 border-b border-blue-100 text-blue-700 px-4 py-1.5 text-[10px] font-bold flex items-center justify-between shrink-0 animate-fade-in">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
                {languageNotification}
              </span>
              <button 
                type="button" 
                onClick={() => setLanguageNotification(null)} 
                className="text-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages view */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              const isModel = msg.role === "model";
              const parsed = isModel ? parseMessageText(msg.text) : { summary: msg.text, details: msg.text, hasDetails: false };
              const isExpanded = expandedMessageIds[msg.id] || !parsed.hasDetails;
              const textToDisplay = isExpanded ? parsed.details : parsed.summary;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Avatar Icon */}
                  <div className={`p-1.5 rounded-full shrink-0 h-7 w-7 flex items-center justify-center border text-[10px] ${
                    msg.role === "user" 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-white border-slate-200 text-blue-600 shadow-sm"
                  }`}>
                    {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-0.5 min-w-0">
                    <div className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm border ${
                      msg.role === "user"
                        ? "bg-blue-600 border-blue-700 text-white rounded-tr-none"
                        : "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                    }`}>
                      <div className="markdown-body">
                        <ReactMarkdown>{textToDisplay}</ReactMarkdown>
                      </div>

                      {/* Toggle button to expand/collapse details */}
                      {isModel && parsed.hasDetails && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-start">
                          <button
                            type="button"
                            onClick={() => toggleExpandMessage(msg.id)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                          >
                            <span>{isExpanded ? "Show Summary" : "Full Details"}</span>
                            <span className="text-[8px] opacity-75">{isExpanded ? "▲" : "▼"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer with timestamp and Speak Button (Speaker) */}
                    <div className={`text-[8px] text-slate-400 font-medium px-1 flex items-center gap-1.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(textToDisplay, msg.id)}
                        className={`p-1 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                          speakingMessageId === msg.id 
                            ? "text-rose-600 bg-rose-50" 
                            : msg.role === "user" ? "hover:text-blue-200 text-blue-300" : "hover:text-slate-700 text-slate-400"
                        }`}
                        title={speakingMessageId === msg.id ? "Stop Reading" : "Read Aloud (Speaker)"}
                      >
                        {speakingMessageId === msg.id ? (
                          <VolumeX className="w-3 h-3 animate-pulse text-rose-500" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Render starter prompts when welcome screen is active */}
            {messages.length === 1 && (
              <div className="pt-2 pb-1 space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Common Queries ({getLanguageName(currentLanguage)}):
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {STARTER_PROMPTS.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputValue(prompt.text);
                          handleSendMessage(prompt.text);
                        }}
                        disabled={loading}
                        className="w-full text-left p-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl transition-all group flex gap-2.5 cursor-pointer text-xs"
                      >
                        <div className="p-1 bg-slate-50 group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-500 rounded-lg shrink-0 h-6 w-6 flex items-center justify-center border border-slate-100 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-slate-800 text-[10px] group-hover:text-blue-900 leading-tight">{prompt.label}</h5>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">{prompt.text}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex gap-2.5 mr-auto max-w-[80%]">
                <div className="p-1.5 rounded-full bg-white border border-slate-200 text-blue-600 shadow-sm shrink-0 h-7 w-7 flex items-center justify-center">
                  <Bot className="w-3 h-3 animate-spin text-blue-600" />
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  <span className="text-[10px] text-slate-500 font-medium italic animate-pulse">Formulating answer...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-950 p-3 rounded-lg flex items-start gap-2 max-w-[90%] mx-auto">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[10px]">
                  <span className="font-bold">Connection Error:</span>
                  <p>{error}</p>
                  <button 
                    onClick={() => handleSendMessage(messages[messages.length - 1]?.text || "")}
                    className="text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    Retry Sending
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Caution Alert banner inside drawer */}
          <div className="bg-amber-50/70 border-y border-amber-200/50 px-4 py-2 text-[9px] text-slate-600 flex items-start gap-1.5 leading-relaxed shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950">Educational Support Only:</span> AI analysis doesn't replace physician consultation. For rapid spreading, intense pain, or fever, call urgent care.
            </div>
          </div>

          {/* Input field box with Mic (Voice Input) */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                placeholder="Ask about skin conditions or symptoms..."
                className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs outline-none transition-all disabled:opacity-50"
              />
              
              {/* Voice input button (Mic) */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm ${
                  isListening
                    ? "bg-rose-500 border-rose-600 text-white animate-pulse"
                    : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}
                title={isListening ? "Listening... Click to stop" : "Speak your query (Mic)"}
              >
                {isListening ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Auto Read Aloud (Speaker) toggle */}
              <button
                type="button"
                onClick={() => {
                  const newVal = !autoReadResponse;
                  setAutoReadResponse(newVal);
                  if (!newVal && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setSpeakingMessageId(null);
                  }
                }}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm ${
                  autoReadResponse
                    ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                }`}
                title={autoReadResponse ? "Auto-read replies is ENABLED (Click to mute)" : "Auto-read replies is DISABLED (Click to enable)"}
              >
                {autoReadResponse ? (
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. CIRCULAR FLOATING LAUNCHER BUTTON */}
      <div className="relative group">
        {showNotification && !isOpen && (
          <div className="absolute -top-12 right-0 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-[10px] font-bold whitespace-nowrap animate-bounce flex items-center gap-1.5 border border-slate-800">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Ask DermAI Medical Assistant!
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowNotification(false);
              }}
              className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-[-5px] right-6 w-2.5 h-2.5 bg-slate-900 transform rotate-45 border-r border-b border-slate-800" />
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowNotification(false);
          }}
          className={`w-14 h-14 rounded-full shadow-2xl cursor-pointer flex items-center justify-center border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen 
              ? "bg-slate-900 border-slate-700 text-white" 
              : "bg-blue-600 border-white text-white hover:bg-blue-500 hover:shadow-blue-500/20"
          }`}
          title="DermAI Medical Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-spin-once" />
          ) : (
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <img 
                src={AVATAR_IMAGE} 
                alt="DermAI" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to Icon
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Fallback overlay block */}
              <div className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white font-bold text-xs pointer-events-none group-hover:bg-blue-500">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

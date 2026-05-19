import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Image as ImageIcon, 
  Download, 
  User, 
  Sparkles, 
  Search,
  Settings,
  MessageCircle,
  Volume2,
  VolumeX,
  Mic,
  Share2,
  FileText,
  Languages,
  Code,
  LayoutGrid,
  Menu,
  ChevronRight,
  Plus,
  Trash2,
  LogOut,
  LogIn,
  Loader2,
  X,
  Pencil,
  Zap,
  Cpu,
  ShieldCheck,
  Smartphone,
  Eye,
  Terminal,
  Copy,
  ArrowDown,
  ThumbsUp,
  ThumbsDown,
  Globe,
  BrainCircuit,
  Activity
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth, db, loginWithGoogle, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, getDocs, doc, setDoc, deleteDoc } from "./lib/firebase";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import ImageEditor from "./components/ImageEditor";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: "user" | "model";
  text: string;
  image?: string;
  id?: string;
  sources?: { title: string; uri: string }[];
  toolOutputs?: any[];
  thought?: string;
  feedback?: "positive" | "negative";
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: any;
}

interface Memory {
  id: string;
  content: string;
  createdAt: any;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("default");
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

  const generateThinkingSteps = () => {
    const steps = [
      "Initializing YAKA Engine...",
      "Accessing Deep Memories...",
      "Scanning Cloud Knowledge...",
      "Optimizing Response Vectors...",
      "Formulating Final Response..."
    ];
    setThinkingSteps([]);
    steps.forEach((step, i) => {
      setTimeout(() => setThinkingSteps(prev => [...prev, step]), i * 400);
    });
  };
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [showThilina, setShowThilina] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [persona, setPersona] = useState<"standard" | "savage" | "genius" | "creative" | "professional">("standard");
  const [themeColor, setThemeColor] = useState<string>("blue");
  const [isHyperDrive, setIsHyperDrive] = useState(false);

  useEffect(() => {
    if (isHyperDrive) {
        setThemeColor("amber");
        return;
    }
    const colors = {
      standard: "blue",
      savage: "red",
      genius: "purple",
      creative: "orange",
      professional: "zinc"
    };
    setThemeColor(colors[persona]);
  }, [persona, isHyperDrive]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setUseSearch(!useSearch);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            startListening();
        }
        if (e.key === 'Escape') {
            setIsStatsOpen(false);
            setIsShortcutsOpen(false);
            if (input) setInput("");
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [useSearch, input]);

  const ShortcutsModal = () => (
    <AnimatePresence>
      {isShortcutsOpen && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[110] flex items-center justify-center p-6"
            onClick={() => setIsShortcutsOpen(false)}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-md bg-[#111] border border-white/10 rounded-[3rem] p-10 space-y-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-4">
                    <Terminal className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">YAKA Commands</h2>
                </div>
                <div className="space-y-4">
                    {[
                        { key: "Ctrl + K", desc: "Toggle Real-time Web Search" },
                        { key: "Ctrl + M", desc: "Voice Input / Dictation" },
                        { key: "Esc", desc: "Close Modals / Clear Input" },
                        { key: "Enter", desc: "Send Message" },
                        { key: "Shift + Enter", desc: "New Line" }
                    ].map((cmd, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{cmd.desc}</span>
                            <kbd className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-blue-400 border border-white/10">{cmd.key}</kbd>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const NeuralBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
      <div className={cn(
        "absolute inset-0 transition-colors duration-1000",
        themeColor === 'red' ? "bg-red-950/20" : 
        themeColor === 'purple' ? "bg-purple-950/20" : 
        themeColor === 'orange' ? "bg-orange-950/20" : 
        themeColor === 'zinc' ? "bg-zinc-900/20" : "bg-blue-950/20"
      )} />
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={cn(
          "absolute -top-1/4 -left-1/4 w-[150%] h-[150%] rounded-full blur-[120px] mix-blend-screen opacity-10",
          themeColor === 'red' ? "bg-red-600" : 
          themeColor === 'purple' ? "bg-purple-600" : 
          themeColor === 'orange' ? "bg-orange-600" : 
          themeColor === 'zinc' ? "bg-zinc-600" : "bg-blue-600"
        )}
      />
    </div>
  );

  const YakaCore = () => (
    <div className="relative w-32 h-32 flex items-center justify-center">
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                rotate: 360
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className={cn(
                "absolute inset-0 rounded-full blur-2xl opacity-20",
                themeColor === 'red' ? "bg-red-500" : 
                themeColor === 'purple' ? "bg-purple-500" : 
                themeColor === 'orange' ? "bg-orange-500" : 
                themeColor === 'zinc' ? "bg-white" : "bg-blue-500"
            )}
        />
        <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-white/5 rounded-full"
        />
        <div className="relative flex flex-col items-center">
            <motion.div 
                animate={{ 
                    scale: isLoading ? [1, 1.5, 1] : 1,
                    opacity: isLoading ? [0.5, 1, 0.5] : 1
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className={cn(
                    "w-8 h-8 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center overflow-hidden border border-white/20",
                    themeColor === 'red' ? "bg-red-500 shadow-red-500/50" : 
                    themeColor === 'purple' ? "bg-purple-500 shadow-purple-500/50" : 
                    themeColor === 'orange' ? "bg-orange-500 shadow-orange-500/50" : 
                    themeColor === 'zinc' ? "bg-white shadow-white/50" : "bg-blue-500 shadow-blue-500/50"
                )}
            >
                <div className="w-full h-full bg-gradient-to-tr from-transparent via-white/40 to-transparent animate-pulse" />
            </motion.div>
            <div className="mt-4 flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Neural Core</span>
                <div className="flex gap-1 mt-1">
                    {[1,2,3].map(i => (
                        <motion.div 
                            key={i}
                            animate={{ height: isLoading ? [2, 8, 2] : 2 }}
                            transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                            className="w-0.5 bg-blue-500 rounded-full"
                        />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollButton(scrollHeight - scrollTop > clientHeight + 200);
  };

  const StatsModal = () => (
    <AnimatePresence>
      {isStatsOpen && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
            onClick={() => setIsStatsOpen(false)}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[3rem] p-10 space-y-10 shadow-[0_50px_200px_rgba(0,0,0,0.8)]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                             <h2 className="text-xl font-black uppercase tracking-tighter text-white">YAKA System Core</h2>
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Version 3.0.4 - Status: Optimal</p>
                        </div>
                    </div>
                    <button onClick={() => setIsStatsOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                        <X className="w-6 h-6 text-white/40" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Token Velocity", value: isHyperDrive ? "142 t/s" : "88 t/s", icon: Zap, color: "text-amber-400" },
                        { label: "Core Temperature", value: persona === 'savage' ? "64°C" : "42°C", icon: Cpu, color: "text-red-400" },
                        { label: "Memory Integrity", value: "99.98%", icon: ShieldCheck, color: "text-blue-400" },
                        { label: "Deep Synapse", value: `${memories.length * 12} Nodes`, icon: BrainCircuit, color: "text-indigo-400" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] space-y-4">
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{stat.label}</p>
                                <p className="text-xl font-black text-white italic">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">HyperDrive Subsystems</span>
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isHyperDrive ? "text-blue-400" : "text-white/10")}>
                        {isHyperDrive ? "Online" : "Standby"}
                    </span>
                </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  const ToolOutputDisplay = ({ toolOutputs }: { toolOutputs: any[] }) => {
    return (
      <div className="mt-4 space-y-3">
        {toolOutputs.map((output, i) => {
          if (output.type === 'code_execution') {
            return (
              <div key={i} className="bg-black/40 rounded-xl overflow-hidden border border-white/5">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Executing Python Engine</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-blue-500/20 text-[8px] font-black uppercase text-blue-400 tracking-widest">Autonomous</div>
                </div>
                <div className="p-4 font-mono text-xs text-blue-300 leading-relaxed overflow-x-auto">
                    <code>{output.code}</code>
                </div>
              </div>
            );
          }
          if (output.type === 'code_result') {
            return (
              <div key={i} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Engine Output</span>
                </div>
                <div className={cn(
                    "p-4 font-mono text-xs overflow-x-auto",
                    output.outcome === 'SUCCESS' ? "text-green-400" : "text-red-400"
                )}>
                    <pre className="whitespace-pre-wrap">{output.output}</pre>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Auth State
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
      if (u) {
        setDoc(doc(db, "users", u.uid), {
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    });
  }, []);

  // Sync Sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "chats"),
      orderBy("updatedAt", "desc"),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const sess = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(sess);
    });
  }, [user]);

  // Sync Messages
  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "chats", currentSessionId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });
  }, [user, currentSessionId]);

  // Sync Memories
  useEffect(() => {
    if (!user) {
      setMemories([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "memories"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const mems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Memory[];
      setMemories(mems);
    });
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroVisible(false);
    }, 2500);
    
    const thilinaTimer = setTimeout(() => {
      setShowThilina(true);
    }, 800);

    return () => {
      clearTimeout(timer);
      clearTimeout(thilinaTimer);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const createNewChat = async () => {
    if (!user) return;
    const newSessionId = `chat_${Date.now()}`;
    await setDoc(doc(db, "users", user.uid, "chats", newSessionId), {
      title: "New Session",
      updatedAt: serverTimestamp()
    });
    setCurrentSessionId(newSessionId);
    setIsSidebarOpen(false);
  };

  const deleteSession = async (sid: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "chats", sid));
    if (currentSessionId === sid) {
      setCurrentSessionId("default");
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !selectedImage) return;
    if (!user) {
      loginWithGoogle();
      return;
    }

    const userMessage = { 
      role: "user" as const, 
      text: textToSend, 
      image: selectedImage || null,
      timestamp: serverTimestamp()
    };
    
    // Save to Firestore
    const chatRef = collection(db, "users", user.uid, "chats", currentSessionId, "messages");
    await addDoc(chatRef, userMessage);
    
    // Update session title if first message
    if (messages.length === 0) {
      await setDoc(doc(db, "users", user.uid, "chats", currentSessionId), {
        title: textToSend.substring(0, 40) + (textToSend.length > 40 ? "..." : ""),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(doc(db, "users", user.uid, "chats", currentSessionId), {
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    const currentInput = textToSend;
    const currentImage = selectedImage;
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);
    generateThinkingSteps();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentInput, 
          image: currentImage,
          userName: user.displayName,
          memories: memories.map(m => m.content),
          useSearch: useSearch,
          persona: persona,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Save AI Response to Firestore
      await addDoc(chatRef, { 
        role: "model", 
        text: data.text, 
        image: data.image || null,
        sources: data.sources || null,
        toolOutputs: data.toolOutputs || null,
        thought: data.thought || null,
        timestamp: serverTimestamp()
      });

      // Simple heuristic for "Memory"
      const lowerText = data.text.toLowerCase();
      if (lowerText.includes("mathaka thiya gannam") || lowerText.includes("remember that") || lowerText.includes("i'll remember")) {
          await addDoc(collection(db, "users", user.uid, "memories"), {
              content: currentInput,
              createdAt: serverTimestamp()
          });
      }

    } catch (error: any) {
      console.error("Chat Error:", error);
      let errorMessage = "Mata kshama wenna yaluwa, podi prashnayak awa. Ayeth try karanna puluwanda? (Sorry friend, a small problem occurred. Can you try again?)";
      
      if (error.message?.includes("503") || error.message?.includes("demand")) {
        errorMessage = "Ado, dan nam AI engine eka godak busy. Poddak iwasala thawa vinadiyak vage gihilla ayeth try karanna puluwanda? (AI is very busy right now. Can you wait a minute and try again?)";
      }

      await addDoc(chatRef, { 
        role: "model", 
        text: errorMessage,
        timestamp: serverTimestamp()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const VoiceWaveform = () => (
    <div className="flex items-center gap-1.5 h-8 px-4">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.div
          key={i}
          animate={{ height: [4, 16, 24, 8, 4] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          className="w-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      ))}
    </div>
  );

  const handleSpeech = (text: string) => {
    if (!synth) return;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a nice voice if possible
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-GB')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Mage yaluwa, oyaage browser eka voice search support karanne na. (Your browser doesn't support speech recognition.)");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSendMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleExport = () => {
    const chatText = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n\n");
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yaka_gpt_${currentSessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (base64: string) => {
    const link = document.createElement("a");
    link.href = base64;
    link.download = `yaka_gpt_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFeedback = async (msgId: string, type: "positive" | "negative") => {
    if (!user) return;
    const msgRef = doc(db, "users", user.uid, "chats", currentSessionId, "messages", msgId);
    await setDoc(msgRef, { feedback: type }, { merge: true });
    
    // If positive, record in a separate training collection (Autonomous learning simulation)
    if (type === "positive") {
        await addDoc(collection(db, "users", user.uid, "feedback_loop"), {
            messageId: msgId,
            type,
            timestamp: serverTimestamp()
        });
    }
  };

  if (isIntroVisible) {
    return (
      <div className="fixed inset-0 bg-[#0e0e0e] flex flex-col items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-8">
            <motion.div 
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.2, 0.5, 0.2],
                rotate: [0, 90, 180, 270, 360]
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute -inset-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-[80px]"
            />
            <motion.div 
              initial={{ rotate: -20, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
              className="w-32 h-32 rounded-[3.5rem] bg-white text-black flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.2)] relative z-10 overflow-hidden group"
            >
              <motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Sparkles className="w-16 h-16 fill-black" />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </motion.div>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white mb-2 drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)] italic">
                YAKA<span className="text-blue-500">.</span>
            </h1>
            <div className="px-4 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/10 mb-8">
               <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">Next Generation GPT</span>
            </div>
          </motion.div>
          <div className="h-1 w-48 bg-white/10 overflow-hidden rounded-full mb-8">
            <motion.div 
               animate={{ x: ["-100%", "200%"] }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
               className="h-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent w-full"
            />
          </div>
        </motion.div>

        {showThilina && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="fixed bottom-12 flex items-center gap-6 text-white uppercase tracking-[0.5em] text-[10px] font-bold"
          >
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/30"></div>
            DEVELOPED BY THILINA NETHSARA
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/30"></div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex bg-[#0e0e0e] text-[#e3e3e3] h-screen overflow-hidden font-sans relative">
      <NeuralBackground />
      <StatsModal />
      <ShortcutsModal />
      {/* Sidebar - Desktop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="w-80 border-r border-white/10 bg-[#161617] h-full flex flex-col z-40 fixed lg:relative shadow-2xl"
          >
            <div className="p-6">
              <button 
                onClick={createNewChat}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-sm uppercase tracking-widest">New Chat</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar pb-10">
              <div>
                <div className="px-2 mb-4 text-[10px] uppercase font-black text-white/30 tracking-[0.2em]">History</div>
                <div className="space-y-2">
                  {sessions.map(s => (
                    <div key={s.id} className="group relative">
                      <button 
                        onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full text-left p-4 rounded-xl transition-all flex items-center gap-3",
                          currentSessionId === s.id ? "bg-white/10 border border-white/10 shadow-lg" : "hover:bg-white/5"
                        )}
                      >
                        <MessageCircle className="w-4 h-4 text-[#757575]" />
                        <span className="text-sm truncate pr-6 font-medium">{s.title || "Untitled Chat"}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {memories.length > 0 && (
                <div>
                  <div className="px-2 mb-4 text-[10px] uppercase font-black text-white/30 tracking-[0.2em] flex items-center justify-between">
                    <span>What YAKA Remembers</span>
                    <BrainCircuit className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    {memories.slice(0, 5).map(m => (
                      <div key={m.id} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl text-[10px] text-white/40 leading-relaxed italic">
                        "{m.content}"
                      </div>
                    ))}
                    {memories.length > 5 && (
                      <div className="text-[9px] text-center text-white/20 uppercase font-black tracking-widest pt-2">+ {memories.length - 5} more facts</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10">
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-white/5 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BrainCircuit className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Core Memory</span>
                    </div>
                    <div className="text-[10px] text-white/40 leading-relaxed">
                        YAKA remembers your preferences across devices through Firestore.
                    </div>
                </div>
                {user && (
                    <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 p-3 text-[#757575] hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
                    </button>
                )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between px-6 py-4 z-20 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
                <Menu className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-3 group px-2 py-1 rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <Sparkles className="w-5 h-5 fill-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-display font-black tracking-tighter uppercase italic leading-none">YAKA<span className="text-blue-500">.</span></span>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/20">Dev by Thilina Nethsara</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-black/40 border border-white/5 rounded-full overflow-hidden max-w-[200px]">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
                    <div className="flex gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap text-[8px] font-black uppercase tracking-widest text-white/30">
                        <span>Network: Secure</span>
                        <span>Engine: YAKA v3.0</span>
                        <span>Memory: Synchronized</span>
                        <span>Status: Optimal</span>
                    </div>
                </div>

                <button 
                  onClick={() => setUseSearch(!useSearch)}
                  className={cn(
                    "hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all",
                    useSearch ? "bg-blue-500/20 border-blue-500/50 text-blue-400 ring-4 ring-blue-500/10" : "bg-white/5 border-white/10 text-[#757575] hover:text-white"
                  )}
                >
                  <Globe className={cn("w-3 h-3", useSearch && "animate-spin")} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Web Search</span>
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", useSearch ? "bg-blue-400" : "bg-white/20")} />
                </button>

                <button 
                  onClick={() => setIsHyperDrive(!isHyperDrive)}
                  className={cn(
                    "hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all",
                    isHyperDrive ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/10 text-[#757575] hover:text-white"
                  )}
                >
                  <Sparkles className={cn("w-3 h-3", isHyperDrive && "animate-spin")} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{isHyperDrive ? "Hyper Drive On" : "Normal Mode"}</span>
                </button>
                
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg overflow-hidden border border-white/20">
                  {user.photoURL ? <img src={user.photoURL} alt="pro" /> : (user.displayName?.charAt(0) || "U")}
                </div>
              </>
            ) : (
                <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </nav>

        {/* Main Workspace */}
        <main 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-8 relative scroll-smooth bg-gradient-to-b from-transparent to-black/20 z-10"
        >
          {showScrollButton && (
             <button 
                onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                className="fixed bottom-32 right-10 z-[60] w-12 h-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-2xl active:scale-90"
             >
                <ArrowDown className="w-6 h-6" />
             </button>
          )}
          {!user && !isAuthLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-grid-white/[0.02]">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="mb-12"
                >
                   <YakaCore />
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md space-y-8"
                >
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full animate-pulse" />
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center relative z-10 shadow-2xl rotate-3">
                            <MessageCircle className="w-12 h-12 text-white -rotate-3" />
                        </div>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">Adarei mage yaluwa!</h2>
                    <p className="text-[#9e9e9e] text-lg font-light leading-relaxed">
                        Mata oya kiyana dewal hodeat mathaka thiya ganna puluwan wenna Google login eka use karanna. Sign in wela YAKA GPT ekka katha karanna. 
                    </p>
                    <button 
                        onClick={loginWithGoogle}
                        className="w-full group flex items-center justify-center gap-4 px-10 py-5 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-[1.05] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 mt-12"
                    >
                        <LogIn className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                        Get Started Free
                    </button>
                </motion.div>
            </div>
          ) : (
              <div className="max-w-4xl mx-auto h-full flex flex-col relative">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
                
                {/* Dynamic Background Glow */}
                <div className={cn(
                    "fixed inset-0 pointer-events-none transition-all duration-1000 opacity-20 blur-[120px]",
                    isHyperDrive ? "bg-amber-900" :
                    persona === 'savage' ? "bg-red-900" : 
                    persona === 'genius' ? "bg-purple-900" : 
                    persona === 'creative' ? "bg-orange-900" : 
                    persona === 'professional' ? "bg-zinc-800" : "bg-blue-900"
                )} />

                {isHyperDrive && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="fixed inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"
                    />
                )}

                {/* Persona Switcher UI */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-wrap items-center justify-center bg-white/5 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl mb-16 gap-2"
                >
                    {[
                        { id: "standard", label: "Pure", icon: MessageCircle, color: "text-blue-400" },
                        { id: "savage", label: "Savage", icon: Sparkles, color: "text-red-400" },
                        { id: "genius", label: "Genius", icon: BrainCircuit, color: "text-purple-400" },
                        { id: "creative", label: "Art", icon: LayoutGrid, color: "text-orange-400" },
                        { id: "professional", label: "Exec", icon: User, color: "text-zinc-400" }
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPersona(p.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-4 rounded-[1.8rem] transition-all relative overflow-hidden group",
                                persona === p.id ? "bg-white text-black shadow-2xl" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <p.icon className={cn("w-4 h-4", persona === p.id ? "text-black" : p.color)} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                            {persona === p.id && (
                                <motion.div 
                                    layoutId="glow" 
                                    className="absolute inset-0 bg-white/20 blur-xl" 
                                />
                            )}
                        </button>
                    ))}
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-16"
                >
                  <h1 className="text-7xl md:text-9xl font-display font-black mb-6 bg-gradient-to-t from-white/40 to-white bg-clip-text text-transparent tracking-tighter uppercase italic">
                    {persona === 'savage' ? "ADOO!" : (user?.displayName?.split(' ')[0] ? `HI, ${user.displayName.split(' ')[0]}!` : "HI THERE!")}
                  </h1>
                  <p className="text-[#9e9e9e] text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
                    {persona === 'savage' ? 
                        "Man thama YAKA. Kiyapan balanna monada wenna ona kiyala. Man help ekak dennam bayowenna epa." : 
                        "I'm your next-generation intelligence. Ready to create, search, and assist in ways never thought possible."
                    }
                  </p>
                </motion.div>
  
                {/* Options Grid - Expanded to 10 Power Tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-7xl mb-20 px-4">
                  {[
                    { title: "Art Generator", desc: "AI Masterpieces", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10", q: "Mata lassan photo ekak hadala deepan." },
                    { title: "Live Search", desc: "Real-time Truth", icon: Search, color: "text-emerald-400", bg: "bg-emerald-500/10", q: "Search about latest tech news." },
                    { title: "Vision Lab", desc: "Analyze Images", icon: ImageIcon, color: "text-purple-400", bg: "bg-purple-500/10", q: "Meke thiyena de kiyala deepan. (Upload first)" },
                    { title: "Voice Bridge", desc: "Audio Talk", icon: Volume2, color: "text-orange-400", bg: "bg-orange-500/10", q: "Say something funny in a loud voice!" },
                    { title: "Deep Brain", desc: "Core Memories", icon: BrainCircuit, color: "text-pink-400", bg: "bg-pink-500/10", q: "Uba mawa mathaka thiyan nadda?" },
                    { title: "Code Guru", desc: "Software Pro", icon: LayoutGrid, color: "text-cyan-400", bg: "bg-cyan-500/10", q: "Write a high-performance Python script." },
                    { title: "Smart Summary", desc: "Bullet Insights", icon: Plus, color: "text-indigo-400", bg: "bg-indigo-500/10", q: "Mata meka summery karala dapan." },
                    { title: "Language Pro", desc: "Sinhala Mastery", icon: MessageCircle, color: "text-red-400", bg: "bg-red-500/10", q: "Sinhala walin lassan kawiayak kiyapan." },
                    { title: "Data Export", desc: "Get Session", icon: Download, color: "text-teal-400", bg: "bg-teal-500/10", q: "Can we export this chat?" },
                    { title: "System Status", desc: "AI Health", icon: Menu, color: "text-zinc-400", bg: "bg-zinc-500/10", q: "Uba hodata wada neda?" }
                  ].map((action, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i }}
                      onClick={() => {
                        setInput(action.q);
                        handleSendMessage(action.q);
                      }}
                      className="bg-white/[0.03] backdrop-blur-3xl p-5 rounded-3xl hover:bg-white/[0.08] cursor-pointer border border-white/5 transition-all group hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-all group-hover:scale-110", action.bg, action.color)}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-xs text-white uppercase tracking-tighter">{action.title}</h3>
                      <p className="text-[10px] text-[#757575] mt-1 leading-tight">{action.desc}</p>
                    </motion.div>
                  ))}
                </div>
                
                {memories.length > 0 && (
                    <div className="w-full">
                       <div className="flex items-center gap-3 mb-6 text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">
                          <BrainCircuit className="w-4 h-4 text-purple-500" />
                          Long-term Memory
                       </div>
                       <div className="flex flex-wrap gap-3">
                          {memories.map(m => (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={m.id} className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-xs text-[#9e9e9e] max-w-sm truncate shadow-xl"
                              >
                                  "{m.content}"
                              </motion.div>
                          ))}
                       </div>
                    </div>
                )}
              </div>
            ) : (
              <div className="space-y-10 pb-48 pt-10 px-2 lg:px-0">
                {messages.map((message, idx) => (
                  <motion.div
                    key={message.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "flex gap-6 relative group",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-2xl overflow-hidden",
                      message.role === "user" ? "bg-white/10 border border-white/10" : "bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/20"
                    )}>
                      {message.role === "user" ? (
                          user?.photoURL ? <img src={user.photoURL} alt="U" /> : <User className="w-5 h-5 text-white" />
                      ) : <Sparkles className="w-5 h-5 text-white" />}
                    </div>
  
                    <div className={cn(
                      "max-w-[90%] md:max-w-[75%] space-y-3",
                      message.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-6 rounded-[2rem] shadow-2xl relative",
                        message.role === "user" ? "bg-white/5 border border-white/10 text-white" : "bg-[#1a1a1b] border border-white/10 text-[#e6e6e6]"
                      )}>
                        {message.image && (
                          <div className="mb-4 relative group/img overflow-hidden rounded-2xl border border-white/10">
                            <img 
                              src={message.image} 
                              alt="Visual content" 
                              className="max-w-full rounded-xl max-h-[600px] object-contain transition-transform group-hover/img:scale-[1.01]" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button 
                                    onClick={() => setEditingImage(message.image!)}
                                    className="p-4 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Pencil className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={() => downloadImage(message.image!)}
                                    className="p-4 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Download className="w-6 h-6" />
                                </button>
                                <button 
                                    className="p-4 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Share2 className="w-6 h-6" />
                                </button>
                            </div>
                          </div>
                        )}
                        {message.thought && (
                            <div className="mb-6 bg-white/5 border-l-2 border-blue-500/50 rounded-r-2xl overflow-hidden">
                                <div className="px-4 py-2 bg-blue-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BrainCircuit className="w-3 h-3 text-blue-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Thinking Process</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-white/20">Self-Reasoning v2.0</span>
                                </div>
                                <div className="p-4 text-[11px] text-white/50 font-medium italic leading-relaxed">
                                    {message.thought}
                                </div>
                            </div>
                        )}
                        <div className={cn(
                            "markdown-body leading-relaxed text-base",
                            message.role === "user" ? "[&_p]:text-white" : "[&_p]:text-white/90"
                        )}>
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>

                        {message.toolOutputs && message.toolOutputs.length > 0 && (
                            <ToolOutputDisplay toolOutputs={message.toolOutputs} />
                        )}

                        {message.sources && message.sources.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                                <div className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] flex items-center gap-2">
                                    <Search className="w-3 h-3" />
                                    Web Sources
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {message.sources.map((s, i) => (
                                        <a 
                                            key={i} 
                                            href={s.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg transition-all border border-blue-500/20"
                                        >
                                            {s.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={cn(
                            "absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2",
                            message.role === "user" ? "right-full mr-2" : "left-full ml-2"
                        )}>
                            <button 
                                onClick={() => handleCopy(message.text)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                                title="Copy Message"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            {message.role === 'model' && (
                                <>
                                    <button 
                                        onClick={() => handleFeedback(message.id!, "positive")}
                                        className={cn(
                                            "p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 transition-colors",
                                            message.feedback === 'positive' ? "text-green-400 bg-green-500/10" : "hover:text-green-400"
                                        )}
                                        title="Helpful"
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleFeedback(message.id!, "negative")}
                                        className={cn(
                                            "p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 transition-colors",
                                            message.feedback === 'negative' ? "text-red-400 bg-red-500/10" : "hover:text-red-400"
                                        )}
                                        title="Not Helpful"
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={() => handleSpeech(message.text)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                                title="Read Aloud"
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                      <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2">
                         {message.role} • Just Now
                      </div>
                    </div>
                  </motion.div>
                ))}
  
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 max-w-[85%] mr-auto"
                  >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="bg-[#1e1e1e] p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map(i => (
                                        <motion.div 
                                            key={i}
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} 
                                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} 
                                            className="w-1.5 h-1.5 bg-blue-400 rounded-full" 
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] animate-pulse">Scanning Core</span>
                            </div>
                            <div className="flex flex-col gap-1 px-4">
                                {thinkingSteps.map((step, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[8px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2"
                                    >
                                        <div className="w-1 h-1 bg-blue-500/50 rounded-full" />
                                        {step}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
          )}
        </main>
  
        {/* Floating Toolbox (Additional Options) */}
        <AnimatePresence>
            {isToolboxOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="absolute bottom-32 right-12 w-80 bg-[#161617]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-30 p-6 space-y-6"
                >
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="font-black uppercase tracking-[0.2em] text-xs text-white">Advanced Tools</span>
                        <Settings className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Summarize", icon: FileText, cmd: "Summarize our entire conversation so far." },
                            { label: "Translate", icon: Languages, cmd: "Translate the last message to Sinhala." },
                            { label: "Code Help", icon: Code, cmd: "Help me write clean code for [topic]." },
                            { label: "Refactor", icon: LayoutGrid, cmd: "Can you refactor this code to follow best practices?" },
                            { label: "Shortcuts", icon: Terminal, action: () => setIsShortcutsOpen(true) },
                            { label: "Sri Lanka Pro", icon: Smartphone, cmd: "Mata lankawa gana aluthma tora thuru kiyanna." },
                            { label: "Deep Analyze", icon: Eye, cmd: "Analyize this context very deeply and give insights." },
                            { label: "System Log", icon: Terminal, action: () => setIsStatsOpen(true) },
                            { label: "Art Mode", icon: Sparkles, cmd: "Adopt a more creative and artistic personality." },
                            { label: "Debug", icon: Loader2, cmd: "Debug this error I'm facing: [paste error]" },
                            { label: "Export", icon: Download, action: handleExport }
                        ].map((tool, i) => (
                            <button 
                                key={i}
                                onClick={() => { tool.action ? tool.action() : setInput(tool.cmd || ""); setIsToolboxOpen(false); }}
                                className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group"
                            >
                                <tool.icon className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform" />
                                <span className="text-[10px] font-bold uppercase text-white/60 group-hover:text-white transition-colors">{tool.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Input Bar Section */}
        <footer className={cn("p-6 pb-10 transition-all", !user && "opacity-0 pointer-events-none")}>
          <div className="max-w-4xl mx-auto relative flex flex-col gap-6">
            
            {/* Quick Prompts Container */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {[
                    "Kalla hadala dapan",
                    "Latest news search karanna",
                    "Translate last message",
                    "Fix grammar",
                    "Explain like I'm 5",
                    "Make it funny"
                ].map((txt, i) => (
                    <button 
                        key={i} 
                        onClick={() => setInput(txt)}
                        className="flex-shrink-0 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs font-bold text-white/50 hover:text-white transition-all whitespace-nowrap"
                    >
                        {txt}
                    </button>
                ))}
            </div>

            {/* Image Preview */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ y: 20, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 10, opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-6 z-30"
                >
                  <div className="relative group">
                    <img 
                      src={selectedImage} 
                      alt="Upload preview" 
                      className="w-40 h-40 object-cover rounded-[2rem] border-8 border-[#1e1e1e] shadow-2xl rotate-3" 
                    />
                    <button 
                      onClick={() => setEditingImage(selectedImage)}
                      className="absolute -bottom-3 -left-3 bg-blue-600 text-white p-2 rounded-full shadow-2xl hover:bg-blue-700 transition-colors hover:scale-110 active:scale-95"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-2xl hover:bg-red-700 transition-colors hover:scale-110 active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
  
            {/* Discovery Chips / Quick Actions */}
            <div className="flex items-center gap-2 px-6 mb-4 overflow-x-auto no-scrollbar pb-2">
                {[
                    { label: "Hadapan Photo ekak", icon: Sparkles, prompt: "Mata lassan photo ekak hadala deepan" },
                    { label: "Mata Code ekak deepan", icon: LayoutGrid, prompt: "Write a React component for a glassmorphism card" },
                    { label: "Joke ekak kiyapan", icon: MessageCircle, prompt: "Savage joke ekak kiyapan balanna" },
                    { label: "Latest News", icon: Search, prompt: "Lankawe ada aluthma news monada?" }
                ].map((chip) => (
                    <button 
                        key={chip.label}
                        onClick={() => {
                            setInput(chip.prompt);
                            handleSendMessage(chip.prompt);
                        }}
                        className="flex-none flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all active:scale-95 group"
                    >
                        <chip.icon className="w-3 h-3 text-white/40 group-hover:text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">{chip.label}</span>
                    </button>
                ))}
            </div>

            {/* Mode & Tools Bar */}
            <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div 
                          onClick={() => setUseSearch(!useSearch)}
                          className={cn(
                            "w-10 h-6 rounded-full relative p-0.5 cursor-pointer transition-all duration-300",
                            useSearch ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/10 hover:bg-white/20"
                          )}
                        >
                            <motion.div 
                                animate={{ x: useSearch ? 16 : 0 }}
                                className="w-5 h-5 bg-white rounded-full shadow-lg"
                            />
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", useSearch ? "text-blue-400" : "text-white/20")}>
                            Live Grounding
                        </span>
                    </div>

                    <div className="h-4 w-[1px] bg-white/5" />

                    <div 
                        onClick={() => setIsStatsOpen(true)}
                        className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 py-1 px-3 rounded-full transition-all"
                    >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">
                            Core Status: Optimal
                        </span>
                    </div>
                </div>
            </div>

            {/* Actual Input Box */}
              <div className="bg-[#1e1e1f] rounded-[2.5rem] px-8 py-4 flex items-center gap-6 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.4)] focus-within:border-blue-500/30 transition-all group/input relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                
                {isListening ? (
                  <div className="flex-1 flex items-center justify-between px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse">YAKA Engine Listening...</span>
                    <VoiceWaveform />
                    <button onClick={stopListening} className="p-2.5 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all">
                        <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#9e9e9e] hover:text-white transition-colors relative z-10"
                      title="Add Image"
                    >
                      <Plus className="w-7 h-7" />
                    </button>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      accept="image/*"
                      onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setSelectedImage(reader.result as string);
                              reader.readAsDataURL(file);
                          }
                      }}
                    />
                    <input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder={selectedImage ? "Add context to your image..." : "Ado, kiyapan balanna monada wenna ona? (How can I help you?)"}
                      className="bg-transparent flex-1 outline-none text-base md:text-lg text-white placeholder-white/10 py-3 font-medium relative z-10"
                    />
                  </>
                )}
                
                <div className="flex items-center gap-3 relative z-10">
                  <button 
                    onClick={startListening}
                    className={cn(
                        "p-3 rounded-[1.2rem] transition-all",
                        isListening ? "bg-red-500 text-white animate-pulse" : "text-[#757575] hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setIsToolboxOpen(!isToolboxOpen)}
                    className={cn(
                        "p-3 rounded-[1.2rem] transition-all",
                        isToolboxOpen ? "bg-white text-black" : "text-[#757575] hover:text-white hover:bg-white/5"
                    )}
                  >
                    <LayoutGrid className="w-6 h-6" />
                  </button>
                  <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block"></div>
                  <button 
                    onClick={() => handleSendMessage()}
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className={cn(
                      "group/send relative flex items-center justify-center transition-all shadow-2xl",
                      (input.trim() || selectedImage) && !isLoading
                        ? `bg-${themeColor}-600 text-white hover:scale-105 active:scale-95 shadow-${themeColor}-500/40 border border-${themeColor}-400/30 px-6 h-12 rounded-[1.5rem]`
                        : "bg-[#2e2e2e] text-[#555] cursor-not-allowed opacity-50 w-12 h-12 rounded-[1.5rem]"
                    )}
                  >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest overflow-hidden transition-all duration-300",
                                (input.trim() || selectedImage) ? "w-auto opacity-100 mr-1" : "w-0 opacity-0"
                            )}>Send Message</span>
                            <Send className="w-5 h-5 fill-current transition-transform group-hover/send:translate-x-1 group-hover/send:-translate-y-1" />
                        </div>
                    )}
                  </button>
                </div>
              </div>
  
            <p className="text-[10px] text-center text-[#555] mt-8 uppercase tracking-[0.4em] font-black italic">
              YAKA GPT 2.0 • BUILT BY THILINA NETHSARA • FAST AS LIGHTING
            </p>
          </div>
        </footer>
      </div>
      <AnimatePresence>
        {editingImage && (
          <ImageEditor 
            image={editingImage} 
            onSave={(edited) => {
              // If we were editing the selected image for upload
              if (editingImage === selectedImage) {
                setSelectedImage(edited);
              } else {
                // If we edited a message from chat, we treat it as a new "selectedImage" to be used in next message
                setSelectedImage(edited);
              }
              setEditingImage(null);
            }} 
            onCancel={() => setEditingImage(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

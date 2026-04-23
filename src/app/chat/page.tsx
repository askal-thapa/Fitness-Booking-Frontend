"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import DashboardNavbar from "@/components/DashboardNavbar";
import TrainerNavbar from "@/components/TrainerNavbar";
import { Message, Conversation } from "@/types";
import { Send, Smile, ArrowLeft, MessageCircle, X } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const EMOJIS = [
  "😀","😂","😍","🥰","😎","🤔","😅","😭","😤","🥳",
  "👍","👎","❤️","🔥","🎉","✅","🙏","💪","🤝","😊",
  "🏋️","💯","👏","🤩","😇","🫡","🎯","⚡","🌟","🏆",
  "✨","💫","🙌","👊","🫶","💬","🎽","🥇","💦","😴",
];

function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0`}>
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  );
}

function timeLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupMessages(msgs: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  msgs.forEach((msg) => {
    const d = new Date(msg.createdAt);
    const label = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.date === label) last.messages.push(msg);
    else groups.push({ date: label, messages: [msg] });
  });
  return groups;
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const withParam = searchParams.get("with");
  const withUserId = withParam && !isNaN(parseInt(withParam)) ? parseInt(withParam) : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<{ userId: number; name: string; image?: string | null } | null>(
    withUserId ? { userId: withUserId, name: "" } : null,
  );
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">(withUserId ? "chat" : "list");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeConvRef = useRef(activeConv);
  const myUserIdRef = useRef<number | null>(null);
  const tokenRef = useRef<string | null>(null);

  const user = session?.user as any;
  const myUserId = user?.id ? parseInt(user.id) : null;
  const token = user?.accessToken as string | undefined;
  const isTrainer = user?.role === "trainer";

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { myUserIdRef.current = myUserId; }, [myUserId]);
  useEffect(() => { tokenRef.current = token ?? null; }, [token]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/chat");
  }, [status, router]);

  const fetchConversations = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const res = await fetch(`${BACKEND_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (otherUserId: number) => {
    const t = tokenRef.current;
    if (!t) return;
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${BACKEND_URL}/chat/messages?with=${otherUserId}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch {} finally {
      setLoadingMsgs(false);
    }
  }, []);

  // Fetch user info to get name/image when only a userId is in the URL
  useEffect(() => {
    if (!withUserId || !token) return;
    fetch(`${BACKEND_URL}/chat/user/${withUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.name) {
          setActiveConv((prev) => {
            if (!prev || prev.userId !== withUserId) return prev;
            if (prev.name && prev.name !== "") return prev;
            return { userId: withUserId, name: data.name, image: data.imageUrl || null };
          });
        }
      })
      .catch(() => {});
  }, [withUserId, token]);

  // Sync activeConv name/image from conversations list once loaded
  useEffect(() => {
    if (!activeConv) return;
    const conv = conversations.find((c) => c.otherUserId === activeConv.userId);
    if (conv) {
      setActiveConv((prev) =>
        prev ? { ...prev, name: conv.otherUserName, image: conv.otherUserImage } : prev,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Socket setup
  useEffect(() => {
    if (!token) return;
    const socket = io(BACKEND_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    // Join active room as soon as socket connects
    socket.on("connect", () => {
      if (activeConvRef.current) {
        socket.emit("join_room", { otherUserId: activeConvRef.current.userId });
      }
    });

    socket.on("new_message", (msg: Message) => {
      const myId = myUserIdRef.current;
      const conv = activeConvRef.current;

      const isActiveConv =
        conv &&
        ((msg.fromUserId === conv.userId && msg.toUserId === myId) ||
          (msg.fromUserId === myId && msg.toUserId === conv.userId));

      if (isActiveConv) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Refresh sidebar for all new messages (sent + received)
      fetchConversations();

      if (msg.fromUserId !== myId) {
        if (!document.hasFocus() || document.visibilityState === "hidden") {
          playPing();
          toast.message("💬 New message", {
            description: msg.content.length > 60 ? msg.content.slice(0, 60) + "…" : msg.content,
          });
        } else if (!isActiveConv) {
          playPing();
          toast.message("💬 New message", {
            description: msg.content.length > 60 ? msg.content.slice(0, 60) + "…" : msg.content,
          });
        }
      }
    });

    socket.on("user_typing", ({ fromUserId }: { fromUserId: number }) => {
      if (activeConvRef.current?.userId === fromUserId) setOtherTyping(true);
    });

    socket.on("user_stop_typing", ({ fromUserId }: { fromUserId: number }) => {
      if (activeConvRef.current?.userId === fromUserId) setOtherTyping(false);
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, fetchConversations]);

  // Join room + fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConv) { setMessages([]); return; }
    socketRef.current?.emit("join_room", { otherUserId: activeConv.userId });
    fetchMessages(activeConv.userId);
    setOtherTyping(false);
  }, [activeConv?.userId, fetchMessages]);

  // Load conversations on mount
  useEffect(() => { if (token) fetchConversations(); }, [token, fetchConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socketRef.current || !activeConv) return;
    socketRef.current.emit("typing", { toUserId: activeConv.userId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { toUserId: activeConv?.userId });
    }, 1500);
  };

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !activeConv || !socketRef.current) return;
    socketRef.current.emit("send_message", { toUserId: activeConv.userId, content: trimmed });
    setInput("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current.emit("stop_typing", { toUserId: activeConv.userId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const insertEmoji = (emoji: string) => {
    setInput((p) => p + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const openConversation = (userId: number, name: string, image?: string | null) => {
    setActiveConv({ userId, name, image });
    setMobileView("chat");
    router.replace(`/chat?with=${userId}`, { scroll: false });
  };

  if (status === "loading") {
    return (
      <div className="h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const messageGroups = groupMessages(messages);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cream">
      {isTrainer ? <TrainerNavbar /> : <DashboardNavbar />}

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside
          className={`
            ${mobileView === "chat" ? "hidden" : "flex"} md:flex
            w-full md:w-80 lg:w-96 flex-col border-r border-cream-darker bg-white shrink-0 min-h-0
          `}
        >
          <div className="px-5 py-4 border-b border-cream-darker shrink-0">
            <h2 className="text-lg font-bold text-warm-dark tracking-tight flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Messages
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-warm-dark font-semibold mb-1">No conversations yet</p>
                <p className="text-warm-gray text-sm">
                  Visit a trainer&apos;s profile to start chatting.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConv?.userId === conv.otherUserId;
                return (
                  <button
                    key={conv.otherUserId}
                    onClick={() => openConversation(conv.otherUserId, conv.otherUserName, conv.otherUserImage)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-cream-darker/50 ${
                      isActive ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-cream-dark/60"
                    }`}
                  >
                    <Avatar name={conv.otherUserName} src={conv.otherUserImage} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-warm-dark text-sm truncate">{conv.otherUserName}</p>
                        <span className="text-[11px] text-warm-gray shrink-0 ml-2">{timeLabel(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-warm-gray truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section
          className={`
            ${mobileView === "list" ? "hidden" : "flex"} md:flex
            flex-1 flex-col overflow-hidden min-h-0
          `}
        >
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-warm-dark mb-2">Select a conversation</h3>
              <p className="text-warm-gray text-sm max-w-xs">
                Choose a conversation from the left, or message a trainer from their profile.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-cream-darker px-5 py-3.5 flex items-center gap-3 shrink-0 shadow-sm">
                <button
                  className="md:hidden p-1.5 rounded-lg hover:bg-cream-dark transition-colors mr-1"
                  onClick={() => setMobileView("list")}
                >
                  <ArrowLeft className="w-5 h-5 text-warm-dark" />
                </button>
                <Avatar name={activeConv.name || "?"} src={activeConv.image} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-dark leading-tight">
                    {activeConv.name || <span className="text-warm-gray text-sm italic">Loading…</span>}
                  </p>
                  {otherTyping && (
                    <p className="text-xs text-primary font-medium">typing…</p>
                  )}
                </div>
              </div>

              {/* Messages — only this scrolls */}
              <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5 space-y-4 bg-cream">
                {loadingMsgs && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}

                {!loadingMsgs && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <MessageCircle className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-warm-dark font-semibold mb-1">Start the conversation</p>
                    <p className="text-warm-gray text-sm">Send a message to get started!</p>
                  </div>
                )}

                {messageGroups.map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-cream-darker" />
                      <span className="text-[11px] text-warm-gray font-medium shrink-0">{group.date}</span>
                      <div className="flex-1 h-px bg-cream-darker" />
                    </div>

                    <div className="space-y-1.5">
                      {group.messages.map((msg, i) => {
                        const isMe = msg.fromUserId === myUserId;
                        const prevMsg = group.messages[i - 1];
                        const showAvatar = !isMe && (!prevMsg || prevMsg.fromUserId !== msg.fromUserId);

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            {!isMe && (
                              <div className="w-8 shrink-0">
                                {showAvatar && (
                                  <Avatar name={activeConv.name || "?"} src={activeConv.image} size="sm" />
                                )}
                              </div>
                            )}
                            <div
                              className={`max-w-[72%] sm:max-w-[60%] group relative ${isMe ? "items-end" : "items-start"} flex flex-col`}
                            >
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                  isMe
                                    ? "bg-primary text-white rounded-br-sm"
                                    : "bg-white text-warm-dark border border-cream-darker rounded-bl-sm shadow-sm"
                                }`}
                              >
                                {msg.content}
                              </div>
                              <span className="text-[10px] text-warm-gray mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {timeLabel(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {otherTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 shrink-0">
                      <Avatar name={activeConv.name || "?"} src={activeConv.image} size="sm" />
                    </div>
                    <div className="bg-white border border-cream-darker rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 bg-warm-gray rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar — pinned to bottom */}
              <div className="bg-white border-t border-cream-darker px-4 py-3 shrink-0">
                <div className="flex items-center gap-2 bg-cream rounded-2xl border border-cream-darker px-3 py-1.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <div className="relative">
                    <button
                      onClick={() => setShowEmoji((p) => !p)}
                      className="p-1.5 text-warm-gray hover:text-primary transition-colors rounded-lg"
                      type="button"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    {showEmoji && (
                      <div className="absolute bottom-10 left-0 z-50 bg-white rounded-2xl border border-cream-darker shadow-xl p-3 w-64">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Emojis</span>
                          <button onClick={() => setShowEmoji(false)} className="text-warm-gray hover:text-warm-dark">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJIS.map((e) => (
                            <button
                              key={e}
                              onClick={() => insertEmoji(e)}
                              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-cream-dark rounded-lg transition-colors"
                              type="button"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={activeConv.name ? `Message ${activeConv.name}…` : "Type a message…"}
                    className="flex-1 bg-transparent text-sm text-warm-dark placeholder:text-warm-gray/50 outline-none py-1.5"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="p-2 bg-primary text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-95 transition-all shrink-0"
                    type="button"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

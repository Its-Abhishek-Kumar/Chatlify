import React, { useEffect, useMemo, useRef, useState } from "react";
import MessageInput from "./MessageInput";
import { useChatStore } from "../../store/chatStore";
import Logo from "./Logo";
import { api } from "../../services/api";
import {
  createAttachmentBlobUrl,
  downloadBlobUrl,
  downloadAttachmentByUrl,
  formatBytes,
  getAttachmentName,
  openAttachment,
  type AttachmentLike
} from "../../utils/attachments";
import Avatar from "./Avatar";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/authStore";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SmilePlus,
  Pencil,
  Trash2,
  ArrowLeft,
  MoreVertical,
  Pin,
  Star,
  CornerUpLeft,
  Share2,
  Search,
  X,
  FileIcon,
  Play,
  Pause,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  CheckCheck
} from "lucide-react";

interface ChatWindowProps {
  onToggleInfo?: () => void;
}

const formatDateDivider = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  
  // Normalize date parts to compare days precisely
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = dToday.getTime() - dDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short"
  };
  
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = "numeric";
  }
  
  return date.toLocaleDateString([], options);
};

const renderMessageTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#60A5FA] underline hover:text-[#93C5FD] break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const ChatWindow = ({ onToggleInfo }: ChatWindowProps) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const quickPickerRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const quickEmojis = ["❤️", "👍", "😂", "😮", "🔥"];
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Store selections
  const setMessages = useChatStore((s) => s.setMessages);
  const setConversations = useChatStore((s) => s.setConversations);
  const conversations = useChatStore((s) => s.conversations);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setReplyToMessage = useChatStore((s) => s.setReplyToMessage);
  const messages = useChatStore((s) => s.messages);
  const user = useAuthStore((s) => s.user);
  const isSidebarCollapsed = useChatStore((s) => s.isSidebarCollapsed);
  const setSidebarCollapsed = useChatStore((s) => s.setSidebarCollapsed);

  // Local feature states
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const isSearchOpen = useChatStore((s) => s.isSearchOpen);
  const setSearchOpen = useChatStore((s) => s.setSearchOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [starredMsgIds, setStarredMsgIds] = useState<Set<string>>(new Set());
  const [showForwardModal, setShowForwardModal] = useState<string | null>(null);

  const downloadedFiles = useChatStore((s) => s.downloadedFiles);
  const setDownloadedFile = useChatStore((s) => s.setDownloadedFile);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const resolveAttachmentBlob = async (msgId: string, media: AttachmentLike) => {
    const cached = downloadedFiles[msgId];
    if (cached) return cached;

    setDownloadingIds((prev) => {
      const next = new Set(prev);
      next.add(msgId);
      return next;
    });

    try {
      const blobUrl = await createAttachmentBlobUrl(media);
      setDownloadedFile(msgId, blobUrl);
      return blobUrl;
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(msgId);
        return next;
      });
    }
  };

  const handleOpenAttachment = async (msgId: string, media: AttachmentLike) => {
    if (downloadedFiles[msgId]) {
      if (openAttachment({ ...media, url: downloadedFiles[msgId] })) return;
    }

    if (openAttachment(media)) return;

    try {
      const blobUrl = await resolveAttachmentBlob(msgId, media);
      openAttachment({ ...media, url: blobUrl });
    } catch (err) {
      console.error("Open attachment error:", err);
    }
  };

  const handleDownloadAttachment = async (msgId: string, media: AttachmentLike) => {
    try {
      const blobUrl = await resolveAttachmentBlob(msgId, media);
      downloadBlobUrl(blobUrl, getAttachmentName(media));
    } catch (err) {
      console.error("Download attachment error:", err);
      downloadAttachmentByUrl(media);
    }
  };

  const [selectedReactionMsgId, setSelectedReactionMsgId] = useState<string | null>(null);
  const selectedReactionMsg = useMemo(() => {
    return messages.find((m) => m._id === selectedReactionMsgId) || null;
  }, [messages, selectedReactionMsgId]);

  const handleRemoveReaction = (emoji: string) => {
    if (!selectedReactionMsgId) return;
    const socket = getSocket();
    socket?.emit("message:react", {
      messageId: selectedReactionMsgId,
      emoji,
    });
  };

  useEffect(() => {
    if (selectedReactionMsgId && selectedReactionMsg && (!selectedReactionMsg.reactions || selectedReactionMsg.reactions.length === 0)) {
      setSelectedReactionMsgId(null);
      setActiveReactionTab("all");
    }
  }, [selectedReactionMsg, selectedReactionMsgId]);

  const [activeReactionTab, setActiveReactionTab] = useState<string>("all");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const deletingMsg = useMemo(() => {
    return messages.find((m) => m._id === deletingMessageId);
  }, [messages, deletingMessageId]);

  const isDeletingMsgMine = deletingMsg?.senderId === user?._id;

  // Voice note player states (demo playback mock)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState<number>(0);

  const [showMenu, setShowMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstLoadRef = useRef(true);

  // Load starred messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`starred_msgs_${user?._id}`);
    if (saved) {
      try {
        setStarredMsgIds(new Set(JSON.parse(saved)));
      } catch (err) {
        console.error(err);
      }
    }
  }, [user?._id]);

  // Active conversation details
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c._id === activeConversationId);
  }, [conversations, activeConversationId]);

  const isGroup = activeConversation?.type === "group" || activeConversation?.type === "channel" || activeConversation?.type === "community";

  // Other user (for direct chats)
  const otherUser = useMemo(() => {
    if (!activeConversation || isGroup || !user) return null;
    return activeConversation.participants?.find((p) => p?._id?.toString() !== user?._id?.toString()) || null;
  }, [activeConversation, isGroup, user]);

  // Online status for direct chat partner
  const isOnline = useMemo(() => {
    return otherUser?._id ? onlineUsers.has(otherUser._id) : false;
  }, [onlineUsers, otherUser]);

  const onlineCount = useMemo(() => {
    if (!activeConversation || !isGroup) return 0;
    return activeConversation.participants?.filter((p: any) => (
      p?._id && onlineUsers.has(p._id.toString())
    )).length || 0;
  }, [activeConversation, isGroup, onlineUsers]);

  const reactionTabs = useMemo(() => {
    if (!selectedReactionMsg?.reactions) return [];
    const counts = selectedReactionMsg.reactions.reduce((acc: Record<string, number>, r: any) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {});
    return [
      { id: "all", label: `All (${selectedReactionMsg.reactions.length})`, emoji: "" },
      ...Object.entries(counts).map(([emoji, count]) => ({
        id: emoji,
        label: `${emoji} ${count}`,
        emoji
      }))
    ];
  }, [selectedReactionMsg]);

  const filteredReactions = useMemo(() => {
    if (!selectedReactionMsg?.reactions) return [];
    if (activeReactionTab === "all") return selectedReactionMsg.reactions;
    return selectedReactionMsg.reactions.filter((r: any) => r.emoji === activeReactionTab);
  }, [selectedReactionMsg, activeReactionTab]);

  const getReactionUser = (rId: any) => {
    const rawId = rId && typeof rId === "object" ? rId?._id : rId;
    const member = activeConversation?.participants?.find((p) => p?._id?.toString() === rawId?.toString());
    if (member) return { name: member.name, username: member.username, avatar: member.avatar };
    if (rId && typeof rId === "object") {
      return { name: rId.name, username: rId.username, avatar: rId.avatar };
    }
    if (rawId?.toString() === user?._id?.toString()) {
      return { name: user.name, username: user.username, avatar: user.avatar };
    }
    return { name: "User", username: "user", avatar: undefined };
  };



  // Scroll to bottom on new message
  useEffect(() => {
    if (firstLoadRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      firstLoadRef.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch messages with pagination
  const fetchMessages = async (cursor?: string) => {
    if (!activeConversationId) return;
    setLoading(true);

    try {
      const res = await api.get(`/api/messages/${activeConversationId}`, {
        params: { cursor },
      });

      if (cursor) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const newMessages = res.data.filter((m: any) => !existingIds.has(m._id));
          return [...newMessages, ...prev];
        });
      } else {
        setMessages(res.data);
      }

      if (res.data.length < 20) setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!activeConversationId) return;
    setHasMore(true);
    firstLoadRef.current = true;
    fetchMessages();
  }, [activeConversationId]);

  // Scroll-up pagination trigger
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop === 0 && hasMore && !loading) {
        const oldest = messages[0];
        if (oldest?.createdAt) {
          fetchMessages(oldest.createdAt);
        }
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [messages, hasMore, loading]);

  // Read receipt synchronization
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeConversationId || !user) return;

    const hasUnread = messages.some(
      (m) => m.conversationId === activeConversationId && m.senderId !== user._id && m.status !== "seen"
    );

    if (hasUnread) {
      socket.emit("conversation:read", { conversationId: activeConversationId });
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === activeConversationId && m.senderId !== user._id
            ? { ...m, status: "seen" }
            : m
        )
      );
    }
  }, [messages, activeConversationId, user, setMessages]);

  // Listen to typing & message updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleTypingStart = ({ from, conversationId }: any) => {
      if (conversationId === activeConversationId && from !== user._id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(from);
          return next;
        });
      }
    };

    const handleTypingStop = ({ from, conversationId }: any) => {
      if (conversationId === activeConversationId && from !== user._id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(from);
          return next;
        });
      }
    };

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [activeConversationId, user]);

  // Close emoji pickers and dropdown menus on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Close full emoji picker
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setReactionPickerFor(null);
      }
      // Close quick reaction popup
      if (
        quickPickerRef.current &&
        !quickPickerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".reaction-trigger-btn")
      ) {
        setShowPicker(null);
      }
      // Close header options menu
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".header-menu-btn")
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClearChat = () => {
    setShowClearConfirm(true);
    setShowMenu(false);
  };

  const confirmClearChat = async () => {
    if (!activeConversationId) return;
    try {
      console.log("DEBUG: Clearing chat history for:", activeConversationId);
      await api.post(`/api/messages/${activeConversationId}/clear`);
      setMessages((prev) => prev.filter((m) => m.conversationId?.toString() !== activeConversationId.toString()));
      
      const targetConv = conversations.find((c) => c._id?.toString() === activeConversationId.toString());
      const isDirect = targetConv?.type === "direct";

      setConversations((prev: any[]) =>
        prev
          .filter((c) => {
            if (c._id?.toString() !== activeConversationId.toString()) return true;
            // Remove direct conversation from sidebar
            if (c.type === "direct") return false;
            return true;
          })
          .map((c) =>
            c._id?.toString() === activeConversationId.toString() ? { ...c, lastMessage: null } : c
          )
      );

      if (isDirect) {
        setActiveConversation(null);
      }

      setShowClearConfirm(false);
    } catch (err) {
      console.error("Failed to clear chat history", err);
    }
  };

  // Filter messages dynamically based on query search
  const filteredMessages = useMemo(() => {
    const currentConvMsgs = messages.filter((m) => m.conversationId === activeConversationId);
    if (!searchQuery.trim()) return currentConvMsgs;
    return currentConvMsgs.filter(
      (m) => m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, activeConversationId, searchQuery]);



  // Handle message forwarding action
  const handleForwardMessage = (targetConvId: string) => {
    if (!showForwardModal) return;
    const socket = getSocket();
    const sourceMsg = messages.find((m) => m._id === showForwardModal);
    if (!socket || !sourceMsg) return;

    const currentTarget = conversations.find((c) => c._id === targetConvId);
    const receiverId = currentTarget?.type === "direct"
      ? currentTarget.participants.find((p) => p._id !== user?._id)?._id
      : null;

    socket.emit("message:send", {
      conversationId: targetConvId,
      receiverId,
      text: sourceMsg.text,
      media: sourceMsg.media,
      forwarded: true
    });

    setShowForwardModal(null);
  };



  // Toggle Voice Note Demo playback
  const handleToggleVoicePlayback = (messageId: string) => {
    if (playingVoiceId === messageId) {
      setPlayingVoiceId(null);
      setAudioPlaybackProgress(0);
    } else {
      setPlayingVoiceId(messageId);
      setAudioPlaybackProgress(10);
      const interval = setInterval(() => {
        setAudioPlaybackProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPlayingVoiceId(null);
            return 0;
          }
          return prev + 15;
        });
      }, 500);
    }
  };

  if (!activeConversationId) {
    return (
      <div className="glass w-full rounded-sidebar flex flex-col items-center justify-center text-[#71717A] p-8 h-full bg-[#09090B]">
        <Logo size={100} showText={true} />
        <p className="text-xs mt-6 text-[#71717A] max-w-xs text-center leading-relaxed">
          Open a conversation space from the sidebar or search users to start real-time messaging.
        </p>
      </div>
    );
  }

  const formatLastSeen = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return "Offline";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Offline";

    const now = new Date();
    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfInput = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (startOfInput.getTime() === startOfToday.getTime()) {
      return `Last seen today at ${timeStr}`;
    } else if (startOfInput.getTime() === startOfYesterday.getTime()) {
      return `Last seen yesterday at ${timeStr}`;
    } else {
      if (date.getFullYear() === now.getFullYear()) {
        const monthStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
        return `Last seen on ${monthStr} at ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
        return `Last seen on ${dateStr} at ${timeStr}`;
      }
    }
  };

  // Generate metadata details for headers
  const headerSubtitle = isGroup
    ? `${activeConversation?.participants?.length || 0} members, ${onlineCount} online`
    : isOnline
    ? "Online"
    : formatLastSeen(otherUser?.lastSeen);


  // Fetch list of pinned messages in current conversation
  const pinnedMessagesList = filteredMessages.filter((m) =>
    activeConversation?.pinnedMessages?.some((pId: any) => pId?.toString() === m._id?.toString())
  );

  return (
    <div className="glass w-full rounded-sidebar flex flex-col h-full overflow-hidden relative">
      {/* HEADER BAR */}
      <div className="p-3 md:p-4 border-b border-white/5 flex flex-col bg-[#111113]/40 backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <div
            onClick={onToggleInfo}
            className="flex items-center gap-2 md:gap-3.5 min-w-0 cursor-pointer hover:opacity-90 transition"
          >
            {/* Back button for mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveConversation("");
              }}
              className="md:hidden p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition mr-0.5"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Sidebar collapse button for desktop/tablet */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarCollapsed(!isSidebarCollapsed);
              }}
              className="hidden md:flex p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition mr-1"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Profile photo */}
            <Avatar
              src={isGroup ? activeConversation?.avatar : otherUser?.avatar}
              name={isGroup ? activeConversation?.name || "Group" : otherUser?.name || "User"}
              className="w-10 h-10"
              online={!isGroup ? isOnline : false}
            />

            {/* User detail */}
            <div className="text-left min-w-0">
              <h3 className="font-bold text-xs md:text-base text-white truncate flex items-center gap-1">
                {isGroup ? activeConversation?.name : (otherUser?.name || "Unknown User")}
                {pinnedMessagesList.length > 0 && <Pin size={12} className="text-[#71717A] rotate-45 shrink-0" />}
              </h3>
              <p className={`text-[9px] md:text-xs truncate ${isOnline && !isGroup ? "text-green-400 font-medium" : "text-[#71717A]"}`}>
                {headerSubtitle}
              </p>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 md:gap-3 text-[#A1A1AA]">
            <button
              onClick={() => setSearchOpen(!isSearchOpen)}
              className={`p-1.5 md:p-2 hover:bg-[#202024] rounded-xl hover:text-white transition ${isSearchOpen ? "text-[#2563EB]" : ""}`}
              title="Search Messages"
            >
              <Search size={18} />
            </button>

            <button
              onClick={onToggleInfo}
              className="hidden md:block p-1.5 md:p-2 hover:bg-[#202024] rounded-xl hover:text-white transition"
              title="Info Panel"
            >
              <Info size={18} />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-2 hover:bg-[#202024] rounded-xl hover:text-white transition header-menu-btn"
                title="Options"
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-11 z-50 py-1 bg-[#111113]/95 border border-[#2A2A30] rounded-xl shadow-2xl flex flex-col min-w-[150px] backdrop-blur-md select-none">
                  <button
                    onClick={handleClearChat}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-white/5 hover:text-red-300 transition text-left w-full font-medium"
                  >
                    <Trash2 size={14} />
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INLINE TEXT SEARCH INPUT */}
        {isSearchOpen && (
          <div className="mt-3 relative flex items-center">
            <input
              placeholder="Search conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs text-white outline-none focus:border-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-[#71717A] hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* PINNED MESSAGES HEADER BANNER */}
        {pinnedMessagesList.length > 0 && (
          <div
            onClick={() => {
              const targetId = pinnedMessagesList[0]._id;
              const element = document.getElementById(`msg-${targetId}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.classList.add("bg-[#2563EB]/20");
                setTimeout(() => {
                  element.classList.remove("bg-[#2563EB]/20");
                }, 2000);
              }
            }}
            className="mt-2.5 flex items-center justify-between gap-2 bg-[#2563EB]/5 border border-[#2563EB]/10 hover:bg-[#2563EB]/10 rounded-btn p-2 text-left cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Pin size={12} className="text-[#3B82F6] shrink-0 animate-bounce" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-[#60A5FA] uppercase tracking-wider">Pinned Message</p>
                <p className="text-xs text-[#D4D4D8] truncate mt-0.5">
                  {pinnedMessagesList[0].text || "📎 Media attachment"}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-[#71717A] shrink-0 font-medium px-2">
              {pinnedMessagesList.length > 1 ? `+${pinnedMessagesList.length - 1} more` : "📌"}
            </span>
          </div>
        )}
      </div>

      {/* MESSAGES HISTORY WINDOW */}
      <div
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto flex flex-col gap-1.5 bg-gradient-to-b from-[#09090B] to-[#111113] scroll-smooth"
      >
        {loading && (
          <div className="text-center text-xs text-[#2563EB] bg-[#2563EB]/10 py-1.5 px-3 rounded-full w-fit mx-auto">
            Loading previous messages...
          </div>
        )}

        {filteredMessages.map((msg, index) => {
          const isMine = msg.senderId === user?._id;
          const isStarred = starredMsgIds.has(msg._id);

          const msgSender = activeConversation?.participants?.find((p) => p?._id === msg.senderId);
          const senderName = msgSender?.name || "Member";

          // Check if message is a voice note (has custom media.type === "voice" or url ending in sound codecs)
          const isVoiceNote = msg.media?.type === "file" && (msg.media.url.includes("voice") || msg.text === "🎤 Voice Note");

          // Determine if we should show a date divider before this message
          const msgDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : "";
          const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
          const prevMsgDate = prevMsg?.createdAt ? new Date(prevMsg.createdAt).toDateString() : "";
          const showDateDivider = msgDate !== prevMsgDate;

          return (
            <React.Fragment key={msg._id}>
              {showDateDivider && (
                <div className="flex items-center justify-center my-3 shrink-0 w-full col-span-full">
                  <span className="px-3 py-1 bg-[#18181B] border border-white/5 text-[10px] text-[#71717A] font-bold rounded-full uppercase tracking-wider">
                    {formatDateDivider(msg.createdAt)}
                  </span>
                </div>
              )}
              <div
                id={`msg-${msg._id}`}
                onMouseEnter={() => setHoveredMessage(msg._id)}
                onMouseLeave={() => setHoveredMessage(null)}
                className={`flex gap-3 items-end ${isMine ? "justify-end" : "justify-start"} transition-all duration-500 rounded-xl p-0.5 ${
                  msg.reactions && msg.reactions.length > 0 ? "mb-3" : ""
                }`}
              >
              {/* Profile Avatar (left) */}
              {!isMine && (
                <Avatar
                  src={msgSender?.avatar}
                  name={senderName}
                  className="w-8 h-8 mb-1"
                />
              )}

              <div className="relative group max-w-[88%] md:max-w-[72%]">
                {/* Sender Name inside Groups */}
                {isGroup && !isMine && (
                  <span className="block text-[10px] text-[#60A5FA] font-bold mb-1 ml-1.5 text-left">
                    {senderName}
                  </span>
                )}

                {/* BUBBLE BODY */}
                <div
                  className={`pl-3.5 pr-0.5 pt-2 pb-5 ${
                    isMine ? "bubble-sent self-end" : "bubble-received self-start"
                  } relative flex flex-col w-fit`}
                >
                  {/* THREAD REPLIES HEADER BLOCK */}
                  {msg.replyTo && (() => {
                    const replySenderVal = (msg.replyTo as any).senderId;
                    const replySenderId = typeof replySenderVal === "object" && replySenderVal ? replySenderVal._id : replySenderVal;
                    let replySenderName = "Member";
                    if (replySenderId?.toString() === user?._id?.toString()) {
                      replySenderName = "You";
                    } else if (typeof replySenderVal === "object" && replySenderVal?.name) {
                      replySenderName = replySenderVal.name;
                    } else {
                      const found = activeConversation?.participants?.find((p) => p?._id === replySenderId);
                      if (found?.name) replySenderName = found.name;
                    }
                    return (
                      <div className="mb-2.5 p-2 bg-black/25 rounded-btn border-l-2 border-[#3B82F6] text-left text-xs text-[#D4D4D8]">
                        <p className="font-bold text-[9px] text-[#60A5FA] uppercase tracking-wide">
                          {replySenderName}
                        </p>
                        <p className="truncate mt-0.5">{(msg.replyTo as any).text || "📎 Media"}</p>
                      </div>
                    );
                  })()}

                  {/* FORWARDED LABEL */}
                  {msg.forwarded && (
                    <span className="text-[9px] italic opacity-40 mb-1.5 flex items-center gap-1">
                      <Share2 size={8} /> forwarded
                    </span>
                  )}

                  {/* EDIT PANEL */}
                  {editingMessage === msg._id ? (
                    <div className="flex gap-2">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="bg-black/40 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-[#2563EB]"
                      />
                      <button
                        onClick={() => {
                          const socket = getSocket();
                          socket?.emit("message:edit", {
                            messageId: msg._id,
                            text: editText,
                          });
                          setEditingMessage(null);
                        }}
                        className="text-xs px-3 py-1.5 rounded-btn bg-[#2563EB] hover:bg-[#3B82F6] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="text-left leading-relaxed break-words text-xs md:text-sm">
                      {msg.deleted ? (
                        <i className="opacity-40 italic text-gray-400">This message was deleted</i>
                      ) : (
                        <>
                          {/* Text string */}
                          {msg.text && !isVoiceNote && (
                            <div className="pr-12">
                              {renderMessageTextWithLinks(msg.text)}
                              {msg.edited && (
                                <span className="text-[9px] opacity-40 italic ml-2">edited</span>
                              )}
                            </div>
                          )}

                          {/* Rich Link Preview Card */}
                          {msg.linkPreview && msg.linkPreview.title && (
                            <a
                              href={msg.linkPreview.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex flex-col md:flex-row gap-2.5 bg-black/20 border border-white/5 hover:border-white/10 rounded-xl p-2 transition text-left cursor-pointer group w-full max-w-[280px] md:max-w-[320px]"
                            >
                              {msg.linkPreview.image && (
                                <img
                                  src={msg.linkPreview.image}
                                  alt=""
                                  className="w-full md:w-16 h-16 object-cover rounded-lg bg-black/30 border border-white/5 shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                <h4 className="text-[10px] font-bold text-[#60A5FA] group-hover:text-[#93C5FD] truncate">
                                  {msg.linkPreview.title}
                                </h4>
                                {msg.linkPreview.description && (
                                  <p className="text-[9px] text-[#A1A1AA] line-clamp-2 leading-tight">
                                    {msg.linkPreview.description}
                                  </p>
                                )}
                                <span className="text-[7px] text-[#71717A] tracking-wider uppercase font-semibold">
                                  {new URL(msg.linkPreview.url).hostname}
                                </span>
                              </div>
                            </a>
                          )}


                          {/* Custom media file attachment block from screenshot */}
                          {msg.media && !isVoiceNote && (() => {
                            const messageIsMine = msg.senderId?.toString() === user?._id?.toString();
                            const localBlobUrl = downloadedFiles[msg._id];
                            const isDownloading = downloadingIds.has(msg._id);
                            const isUploading = msg.uploadProgress !== undefined;
                            const attachmentName = getAttachmentName(msg.media);
                            const attachmentSize = formatBytes(msg.media.size);

                            const handlePrimaryAction = () => {
                              if (isUploading || isDownloading) return;
                              handleOpenAttachment(msg._id, msg.media!);
                            };

                            return (
                              <div 
                                onClick={handlePrimaryAction}
                                className={`mt-2 p-2.5 bg-black/25 border border-white/10 rounded-btn flex items-center justify-between gap-3 min-w-[220px] max-w-[280px] md:max-w-[320px] w-full ${isUploading || isDownloading ? "cursor-default" : "cursor-pointer hover:bg-black/35"} transition`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="p-2 bg-[#2563EB]/15 text-[#3B82F6] rounded-xl shrink-0">
                                    <FileIcon size={20} />
                                  </div>
                                  <div className="text-left min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-white truncate" title={attachmentName}>
                                      {attachmentName}
                                    </p>
                                    {isUploading ? (
                                      <div className="w-full mt-1.5 flex flex-col gap-1">
                                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-[#3B82F6] transition-all duration-300" 
                                            style={{ width: `${msg.uploadProgress}%` }}
                                          />
                                        </div>
                                        <p className="text-[9px] text-[#A1A1AA]">Uploading... {msg.uploadProgress}%</p>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                                        {attachmentSize || msg.media.mimeType || "Attachment"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {!isUploading && (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAttachment(msg._id, msg.media!);
                                      }}
                                      disabled={isDownloading}
                                      className={`text-[10px] font-bold text-white/90 hover:text-white cursor-pointer ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                      {isDownloading ? "Opening..." : "Open"}
                                    </button>
                                    {!messageIsMine && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadAttachment(msg._id, msg.media!);
                                        }}
                                        disabled={isDownloading}
                                        className={`text-[10px] font-bold text-[#60A5FA] hover:text-[#93C5FD] cursor-pointer ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
                                      >
                                        {localBlobUrl ? "Save again" : "Download"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* VOICE NOTE PLAYER CARD FROM SCREENSHOT */}
                          {isVoiceNote && (
                            <div className="flex items-center gap-3.5 py-1 min-w-[200px] max-w-[280px] md:max-w-[320px] w-full text-left">
                              <button
                                onClick={() => handleToggleVoicePlayback(msg._id)}
                                className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 hover:bg-[#2563EB] transition"
                              >
                                {playingVoiceId === msg._id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                              </button>
                              
                              {/* Waveform indicator bars mockup */}
                              <div className="flex-1 flex items-center gap-0.5 h-6">
                                {Array.from({ length: 24 }).map((_, barIdx) => {
                                  const isActive = playingVoiceId === msg._id && (barIdx / 24) * 100 <= audioPlaybackProgress;
                                  const heights = [8, 12, 16, 10, 14, 20, 12, 8, 16, 18, 12, 10, 14, 16, 8, 12, 20, 14, 10, 8, 12, 14, 10, 6];
                                  return (
                                    <div
                                      key={barIdx}
                                      className={`wave-bar ${isActive ? "wave-bar-active" : ""}`}
                                      style={{ height: `${heights[barIdx % heights.length]}px` }}
                                    />
                                  );
                                })}
                              </div>
                              
                              <span className="text-[10px] text-[#A1A1AA] shrink-0 font-medium">0:15</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}



                  {/* REACTION ROW (ABSOLUTE HANGING CAPSULE) */}
                  {!msg.deleted && msg.reactions && msg.reactions.length > 0 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReactionMsgId(msg._id);
                      }}
                      className={`absolute -bottom-3 ${
                        isMine ? "right-4" : "left-4"
                      } flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#18181B] border border-white/10 shadow-lg cursor-pointer hover:bg-[#27272A] active:scale-95 transition z-20 select-none`}
                    >
                      <div className="flex items-center gap-0.5 text-xs">
                        {Array.from(new Set(msg.reactions.map((r: any) => r.emoji)))
                          .slice(0, 3)
                          .map((emoji: any) => (
                            <span key={emoji} className="leading-none">{emoji}</span>
                          ))}
                      </div>
                      {msg.reactions.length > 1 && (
                        <span className="text-[9px] text-[#A1A1AA] font-bold px-0.5 leading-none">
                          {msg.reactions.length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* FOOTER TIME & TICKS */}
                  {msg.createdAt && (
                    <div className="absolute bottom-1 right-2.5 flex items-center gap-0.5 text-[9px] text-white/50 select-none pointer-events-none">
                      {isStarred && <Star size={8} className="text-yellow-400 fill-yellow-400 mr-0.5" />}
                      
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {isMine && (
                        <span className="message-status-icon leading-none flex items-center">
                          {msg.status === "sending" && <span className="text-gray-400">🕒</span>}
                          {msg.status === "sent" && <Check size={11} strokeWidth={3} className="text-white/55" />}
                          {msg.status === "delivered" && <CheckCheck size={13} strokeWidth={3} className="text-white/65" />}
                          {msg.status === "seen" && <CheckCheck size={13} strokeWidth={3.25} className="message-status-seen" />}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* HOVER ACTIONS OVERLAY */}
                <AnimatePresence>
                  {hoveredMessage === msg._id && !msg.deleted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`absolute -top-10 flex gap-2.5 z-40 bg-[#111113]/90 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md shadow-2xl ${
                        isMine ? "right-2" : "left-2"
                      }`}
                    >
                      {/* Reaction Trigger */}
                      <button
                        onClick={() => setShowPicker(msg._id)}
                        className="text-gray-400 hover:text-white transition reaction-trigger-btn"
                        title="React"
                      >
                        <SmilePlus size={13} />
                      </button>

                      {/* Reply Trigger */}
                      <button
                        onClick={() => setReplyToMessage(msg)}
                        className="text-gray-400 hover:text-white transition"
                        title="Reply"
                      >
                        <CornerUpLeft size={13} />
                      </button>

                      {/* Pin Trigger */}
                      <button
                        onClick={() => {
                          const socket = getSocket();
                          socket?.emit("conversation:pin-message", {
                            conversationId: activeConversationId,
                            messageId: msg._id
                          });
                        }}
                        className="text-gray-400 hover:text-white transition"
                        title="Pin Message"
                      >
                        <Pin size={13} />
                      </button>

                      {/* Forward trigger */}
                      <button
                        onClick={() => setShowForwardModal(msg._id)}
                        className="text-gray-400 hover:text-white transition"
                        title="Forward"
                      >
                        <Share2 size={13} />
                      </button>

                      {/* Edit Button */}
                      {isMine && (
                        <button
                          onClick={() => {
                            setEditingMessage(msg._id);
                            setEditText(msg.text || "");
                          }}
                          className="text-gray-400 hover:text-white transition"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          setDeletingMessageId(msg._id);
                        }}
                        className="text-red-400 hover:text-red-300 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>



                {/* QUICK REACTION POPUP */}
                <AnimatePresence>
                  {showPicker === msg._id && (
                    <motion.div
                      ref={quickPickerRef}
                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.9 }}
                      className={`absolute top-10 glass rounded-full px-3 py-1.5 flex items-center gap-2.5 z-50 shadow-2xl backdrop-blur-xl border border-white/10 ${
                        isMine ? "right-2" : "left-2"
                      }`}
                    >
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            const socket = getSocket();
                            socket?.emit("message:react", {
                              messageId: msg._id,
                              emoji,
                            });
                            setShowPicker(null);
                          }}
                          className="hover:scale-125 transition duration-150 text-base"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setReactionPickerFor(msg._id);
                          setShowPicker(null);
                        }}
                        className="text-xs w-6 h-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 transition flex items-center justify-center text-white"
                      >
                        +
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FULL EMOJI SELECTOR */}
                <AnimatePresence>
                  {reactionPickerFor === msg._id && (
                    <div
                      ref={pickerRef}
                      className={`absolute z-50 top-12 ${isMine ? "right-0" : "left-0"}`}
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          const socket = getSocket();
                          socket?.emit("message:react", {
                            messageId: msg._id,
                            emoji: emojiData.emoji,
                          });
                          setReactionPickerFor(null);
                        }}
                        theme={Theme.DARK}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              </div>
          </React.Fragment>
        );
      })}

        {/* TYPING LOADER */}
        {typingUsers.size > 0 && (
          <div className="text-xs text-[#2563EB] px-4 py-1.5 bg-[#111113]/30 border border-white/5 rounded-xl w-fit italic mr-auto flex items-center gap-1.5 text-left">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
            </span>
            {Array.from(typingUsers)
              .map((uId) => activeConversation?.participants?.find((p) => p?._id === uId)?.name || "Someone")
              .join(", ")}{" "}
            is typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>



      {/* FOOTER MESSAGE WRITER INPUT */}
      <MessageInput />

      {/* FORWARD MESSAGE MODAL OVERLAY */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-5 rounded-modal w-[350px] max-w-full shadow-2xl relative text-left">
            <button
              onClick={() => setShowForwardModal(null)}
              className="absolute top-4 right-4 text-[#71717A] hover:text-white"
            >
              <X size={18} />
            </button>
            <h4 className="text-white text-base font-bold mb-4">Forward Message</h4>
            <p className="text-xs text-[#71717A] mb-3">Choose a conversation to forward this message:</p>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {conversations.map((c) => {
                const other = c.type === "direct"
                  ? c.participants.find((p) => p._id !== user?._id)
                  : null;
                const name = c.type === "direct" ? (other?.name || "User") : c.name;
                return (
                  <div
                    key={c._id}
                    onClick={() => handleForwardMessage(c._id)}
                    className="p-2.5 bg-white/5 hover:bg-[#2563EB]/20 border border-transparent hover:border-[#2563EB]/40 rounded-card cursor-pointer flex justify-between items-center transition"
                  >
                    <span className="text-sm font-semibold text-white truncate">{name}</span>
                    <span className="text-[10px] text-[#71717A] uppercase">{c.type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REACTION DETAILS POPUP MODAL */}
      {selectedReactionMsg && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedReactionMsgId(null);
            setActiveReactionTab("all");
          }}
        >
          <div
            className="glass p-5 rounded-modal w-[340px] max-w-full flex flex-col h-[400px] shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Reactions
              </h3>
              <button
                onClick={() => {
                  setSelectedReactionMsgId(null);
                  setActiveReactionTab("all");
                }}
                className="text-[#71717A] hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto py-3 border-b border-white/5 scrollbar-none shrink-0">
              {reactionTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveReactionTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                    activeReactionTab === tab.id
                      ? "bg-[#2563EB]/15 border-[#2563EB]/40 text-[#60A5FA]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
              {filteredReactions.map((r: any, idx: number) => {
                const rUser = getReactionUser(r.userId);
                const isMyReaction = r.userId && (typeof r.userId === "object" ? r.userId._id : r.userId) === user?._id;
                return (
                  <div key={idx} className="flex justify-between items-center gap-3.5 hover:bg-white/[0.02] p-1.5 rounded-xl transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={rUser.avatar}
                        name={rUser.name}
                        className="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-semibold text-white truncate">
                          {rUser.name} {isMyReaction && " (You)"}
                        </p>
                        <p className="text-[10px] text-[#71717A] truncate">@{rUser.username}</p>
                        {isMyReaction && (
                          <button
                            onClick={() => handleRemoveReaction(r.emoji)}
                            className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer underline block mt-0.5 border-none bg-transparent p-0 text-left transition"
                          >
                            Click to remove
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <span 
                      onClick={() => isMyReaction && handleRemoveReaction(r.emoji)}
                      className={`text-lg select-none shrink-0 pr-1.5 ${isMyReaction ? "cursor-pointer hover:scale-125 transition active:scale-95" : "animate-pulse"}`}
                      title={isMyReaction ? "Click to remove reaction" : ""}
                    >
                      {r.emoji}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DELETE MESSAGE CONFIRMATION MODAL */}
      {deletingMessageId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDeletingMessageId(null)}
        >
          <div
            className="glass p-5 rounded-modal w-[340px] max-w-full text-center relative flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Delete Message?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              {isDeletingMsgMine 
                ? "Would you like to delete this message only for yourself, or delete it for everyone?"
                : "This message will be deleted only for you. Other participants will still be able to see it."
              }
            </p>
            <div className="flex flex-col gap-2 mt-2">
              {isDeletingMsgMine && (
                <button
                  onClick={() => {
                    const socket = getSocket();
                    socket?.emit("message:delete", { messageId: deletingMessageId, deleteFor: "everyone" });
                    setDeletingMessageId(null);
                  }}
                  className="w-full py-2 rounded-btn bg-red-600 hover:bg-red-500 text-xs text-white transition font-bold"
                >
                  Delete for Everyone
                </button>
              )}
              <button
                onClick={() => {
                  const socket = getSocket();
                  socket?.emit("message:delete", { messageId: deletingMessageId, deleteFor: "me" });
                  setDeletingMessageId(null);
                }}
                className="w-full py-2 rounded-btn bg-[#2563EB] hover:bg-[#1D4ED8] text-xs text-white transition font-bold"
              >
                Delete for Me
              </button>
              <button
                onClick={() => setDeletingMessageId(null)}
                className="w-full py-2 rounded-btn bg-white/5 hover:bg-white/10 text-xs text-white transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR CHAT CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="glass p-5 rounded-modal w-[340px] max-w-full text-center relative flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Clear Chat History?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              Are you sure you want to clear your chat history for this conversation? All messages will be permanently hidden for you.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={confirmClearChat}
                className="w-full py-2 rounded-btn bg-red-600 hover:bg-red-500 text-xs text-white transition font-bold"
              >
                Clear Chat
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-2 rounded-btn bg-white/5 hover:bg-white/10 text-xs text-white transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

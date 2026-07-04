import Sidebar from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import InfoDrawer from "../components/chat/InfoDrawer";
import Avatar from "../components/chat/Avatar";
import Logo from "../components/chat/Logo";
import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { getConversationsAPI, getConnectionsAPI, getConnectionNotificationsAPI } from "../services/api";
import {
  MessageSquare,
  Users,
  Radio,
  UserPlus,
  Settings,
  LogOut
} from "lucide-react";

type TabType =
  | "chats"
  | "communities"
  | "channels"
  | "connections"
  | "settings";

const ChatLayout = () => {
  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  // Store actions
  const addMessage = useChatStore((s) => s.addMessage);
  const setConversations = useChatStore((s) => s.setConversations);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const setUserOnline = useChatStore((s) => s.setUserOnline);
  const setUserOffline = useChatStore((s) => s.setUserOffline);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const replaceTempMessage = useChatStore((s) => s.replaceTempMessage);
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const setUnreadCounts = useChatStore((s) => s.setUnreadCounts);
  const setMessages = useChatStore((s) => s.setMessages);
  const updateMessageReaction = useChatStore((s) => s.updateMessageReaction);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const isSidebarCollapsed = useChatStore((s) => s.isSidebarCollapsed);
  const isMobileNavOpen = useChatStore((s) => s.isMobileNavOpen);
  const setMobileNavOpen = useChatStore((s) => s.setMobileNavOpen);
  const setConnections = useChatStore((s) => s.setConnections);
  const setConnectionNotifications = useChatStore((s) => s.setConnectionNotifications);
  const addConnectionNotification = useChatStore((s) => s.addConnectionNotification);
  const removeConnectionNotificationBySenderId = useChatStore((s) => s.removeConnectionNotificationBySenderId);
  const connectionNotifications = useChatStore((s) => s.connectionNotifications);
  const alertModalMessage = useChatStore((s) => s.alertModalMessage);
  const setAlertModalMessage = useChatStore((s) => s.setAlertModalMessage);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Load conversations on startup
  useEffect(() => {
    if (!user) return;
    const fetchConversationsList = async () => {
      try {
        const res = await getConversationsAPI();
        setConversations(res.data);
        const counts: Record<string, number> = {};
        res.data.forEach((c: any) => {
          counts[c._id] = c.unreadCount || 0;
        });
        setUnreadCounts(counts);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    };
    fetchConversationsList();
  }, [user, setConversations, setUnreadCounts]);

  // Load connections & notifications on startup
  useEffect(() => {
    if (!user) return;
    const fetchConnectionsData = async () => {
      try {
        const resConns = await getConnectionsAPI();
        setConnections(resConns.data);
        const resNotifs = await getConnectionNotificationsAPI();
        setConnectionNotifications(resNotifs.data);
      } catch (err) {
        console.error("Failed to load connections or notifications:", err);
      }
    };
    fetchConnectionsData();
  }, [user, setConnections, setConnectionNotifications]);

  // Emit read receipts when switching conversation threads
  useEffect(() => {
    if (activeConversationId) {
      getSocket()?.emit("conversation:read", { conversationId: activeConversationId });
    }
  }, [activeConversationId]);

  // Socket setup
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleMessageNew = (msg: any) => {
      addMessage(msg);
      if (msg.conversationId !== activeConversationId) {
        incrementUnread(msg.conversationId);
      } else {
        socket.emit("conversation:read", { conversationId: msg.conversationId });
      }

      // Check if this conversation exists in our store list.
      // If it doesn't, refetch conversations to restore/add it to the sidebar list.
      const currentConversations = useChatStore.getState().conversations;
      const exists = currentConversations.some((c) => c._id?.toString() === msg.conversationId?.toString());
      if (!exists) {
        getConversationsAPI()
          .then((res) => {
            setConversations(res.data);
          })
          .catch((err) => console.error("Failed to refresh conversations on new message:", err));
      }
    };

    const handlePresenceInit = ({ users }: { users: string[] }) => {
      setOnlineUsers(users);
    };

    const handlePresenceUpdate = ({ userId, status, lastSeen }: { userId: string; status: "online" | "offline"; lastSeen?: string }) => {
      if (status === "online") {
        setUserOnline(userId);
        setConversations((prev) =>
          prev.map((c) => ({
            ...c,
            participants: c.participants.map((p) =>
              p._id === userId ? { ...p, isOnline: true } : p
            )
          }))
        );
      } else {
        setUserOffline(userId);
        setConversations((prev) =>
          prev.map((c) => ({
            ...c,
            participants: c.participants.map((p) =>
              p._id === userId ? { ...p, isOnline: false, lastSeen: lastSeen || new Date().toISOString() } : p
            )
          }))
        );
      }
    };

    const handleDelivered = ({ messageId }: any) => {
      updateMessageStatus(messageId, "delivered");
    };

    const handleRead = ({ messageId }: any) => {
      updateMessageStatus(messageId, "seen");
    };

    const handleConversationRead = ({ conversationId }: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === conversationId && m.senderId === user?._id
            ? { ...m, status: "seen" }
            : m
        )
      );
    };

    const handleSent = (realMessage: any) => {
      addMessage(realMessage);
    };

    const handleMessageUpdated = (msg: any) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    const handleMessageDeleted = (msg: any) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    const handleMessageDeletedForMe = ({ messageId, conversationId, newLastMessage }: any) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setConversations((prev: any[]) =>
        prev.map((c) =>
          c._id?.toString() === conversationId?.toString()
            ? {
                ...c,
                lastMessage: newLastMessage,
                pinnedMessages: (c.pinnedMessages || []).filter(
                  (pId: any) => pId?.toString() !== messageId?.toString()
                )
              }
            : c
        )
      );
    };

    const handleUserProfileUpdated = (updatedUser: any) => {
      setConversations((prev: any[]) =>
        prev.map((conv) => {
          const updatedParticipants = conv.participants.map((part: any) => {
            if (part && part._id?.toString() === updatedUser._id?.toString()) {
              return { ...part, ...updatedUser };
            }
            return part;
          });
          return { ...conv, participants: updatedParticipants };
        })
      );
    };

    const handleConversationDeleted = ({ conversationId }: { conversationId: string }) => {
      setConversations((prev: any[]) => prev.filter((c) => c._id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversation(null);
      }
    };

    const handleConversationUpdated = (updatedConv: any) => {
      setConversations((prev: any[]) =>
        prev.map((c) =>
          c._id?.toString() === updatedConv._id?.toString() ? { ...c, ...updatedConv } : c
        )
      );
    };

    const handleConnectionRequest = (notification: any) => {
      addConnectionNotification(notification);
    };

    const handleConnectionAccepted = (notification: any) => {
      addConnectionNotification(notification);
      const fetchConns = async () => {
        try {
          const resConns = await getConnectionsAPI();
          setConnections(resConns.data);
        } catch (err) {
          console.error("Failed to reload connections on accept socket event:", err);
        }
      };
      fetchConns();
    };

    const handleConnectionWithdrawn = ({ senderId }: { senderId: string }) => {
      removeConnectionNotificationBySenderId(senderId);
      const fetchConns = async () => {
        try {
          const resConns = await getConnectionsAPI();
          setConnections(resConns.data);
        } catch (err) {
          console.error("Failed to reload connections on withdraw socket event:", err);
        }
      };
      fetchConns();
    };

    const handleConnectionRemoved = ({ friendId }: { connectionId: string; friendId: string }) => {
      removeConnectionNotificationBySenderId(friendId);
      const fetchConns = async () => {
        try {
          const resConns = await getConnectionsAPI();
          setConnections(resConns.data);
        } catch (err) {
          console.error("Failed to reload connections on remove socket event:", err);
        }
      };
      fetchConns();
    };

    const handleMessageError = ({ message }: any) => {
      setAlertModalMessage(message || "An error occurred while sending your message.");
    };

    socket.on("message:new", handleMessageNew);
    socket.on("presence:init", handlePresenceInit);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("message:delivered", handleDelivered);
    socket.on("message:read", handleRead);
    socket.on("conversation:read", handleConversationRead);
    socket.on("message:sent", handleSent);
    socket.on("message:updated", handleMessageUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("message:deleted_for_me", handleMessageDeletedForMe);
    socket.on("user:profile_updated", handleUserProfileUpdated);
    socket.on("conversation:deleted", handleConversationDeleted);
    socket.on("conversation:updated", handleConversationUpdated);
    socket.on("connection:request", handleConnectionRequest);
    socket.on("connection:accepted", handleConnectionAccepted);
    socket.on("connection:withdrawn", handleConnectionWithdrawn);
    socket.on("connection:removed", handleConnectionRemoved);
    socket.on("message:error", handleMessageError);
    socket.on("message:reaction", ({ messageId, reactions }) => {
      updateMessageReaction(messageId, reactions);
    });

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("presence:init", handlePresenceInit);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("message:delivered", handleDelivered);
      socket.off("message:read", handleRead);
      socket.off("conversation:read", handleConversationRead);
      socket.off("message:sent", handleSent);
      socket.off("message:updated", handleMessageUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:deleted_for_me", handleMessageDeletedForMe);
      socket.off("user:profile_updated", handleUserProfileUpdated);
      socket.off("conversation:deleted", handleConversationDeleted);
      socket.off("conversation:updated", handleConversationUpdated);
      socket.off("connection:request", handleConnectionRequest);
      socket.off("connection:accepted", handleConnectionAccepted);
      socket.off("connection:withdrawn", handleConnectionWithdrawn);
      socket.off("connection:removed", handleConnectionRemoved);
      socket.off("message:error", handleMessageError);
      socket.off("message:reaction");
    };
  }, [addMessage, updateMessageStatus, setUserOnline, setUserOffline, setOnlineUsers, replaceTempMessage, incrementUnread, setMessages, user, updateMessageReaction, activeConversationId, setConversations, setActiveConversation, addConnectionNotification, setConnections, removeConnectionNotificationBySenderId]);

  const sidebarLinks = [
    { id: "chats", label: "Chats", icon: <MessageSquare size={18} />, badge: Object.values(unreadCounts).filter(c => c > 0).length },
    { id: "communities", label: "Communities", icon: <Users size={18} /> },
    { id: "channels", label: "Channels", icon: <Radio size={18} /> },
    { id: "connections", label: "Connections", icon: <UserPlus size={18} />, badge: connectionNotifications.length },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> }
  ];

  return (
    <div className="h-screen w-screen bg-[#09090B] flex overflow-hidden p-0 md:p-3 gap-3 relative">
      {/* Backdrop overlay for mobile navigation drawer */}
      {isMobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* COLUMN 1: LEFT VERTICAL NAVIGATION SIDEBAR (DESKTOP, TABLET & MOBILE DRAWER Overlay) */}
      <div className={`
        ${isMobileNavOpen 
          ? "flex fixed inset-y-0 left-0 w-[240px] z-50 shadow-2xl bg-[#0E0E10] border-r border-white/5 rounded-none" 
          : "hidden md:flex rounded-sidebar"
        } 
        w-16 lg:w-[240px] glass-strong flex-col justify-between p-3 lg:p-4 transition-all duration-300
      `}>
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto pr-1">
          {/* LOGO */}
          <div className="flex items-center gap-2.5 px-2 justify-center lg:justify-start">
            <Logo 
              size={28} 
              showText={true} 
              variant="small" 
              textClassName={isMobileNavOpen ? "block" : "hidden lg:block"} 
            />
          </div>

          {/* MENU LINKS */}
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setMobileNavOpen(false);
                }}
                className={`flex items-center ${isMobileNavOpen ? "justify-between px-3" : "justify-center lg:justify-between px-2 lg:px-3"} py-2.5 rounded-btn text-xs font-semibold tracking-wide transition duration-150 relative ${
                  activeTab === item.id
                    ? "bg-[#2563EB]/15 text-[#3B82F6] border border-[#2563EB]/25"
                    : "text-[#A1A1AA] hover:text-white hover:bg-white/5 border border-transparent"
                }`}
                title={item.label}
              >
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  {item.icon}
                  <span className={isMobileNavOpen ? "inline" : "hidden lg:inline"}>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className={`${isMobileNavOpen ? "static" : "absolute -top-1 -right-1 lg:static"} px-1.5 py-0.5 bg-[#2563EB] text-[9px] font-bold text-white rounded-full`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

        </div>

        {/* PROFILE FOOTER BAR */}
        <div className={`pt-4 border-t border-white/5 flex ${isMobileNavOpen ? "flex-row items-center justify-between" : "flex-col lg:flex-row items-center justify-center lg:justify-between"} gap-3 lg:gap-2 px-1`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={user?.avatar}
              name={user?.name || "User"}
              className="w-8 h-8 text-[9px]"
            />
            <div className={`text-left min-w-0 ${isMobileNavOpen ? "block" : "hidden lg:block"}`}>
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-green-400 font-medium tracking-wide">Online</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-red-500/10 text-[#71717A] hover:text-red-400 rounded-lg transition"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* COLUMN 2: SEARCH & LIST VIEW COLUMN */}
      <div
        className={`w-full md:w-[340px] lg:w-[360px] h-full ${
          activeConversationId ? "hidden md:flex" : "flex"
        } ${isSidebarCollapsed ? "md:hidden" : ""} flex-col overflow-hidden`}
      >
        <div className="flex-1 min-h-0">
          <Sidebar activeTab={activeTab as any} setActiveTab={setActiveTab} />
        </div>
        
        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="flex md:hidden glass-strong justify-around py-3 px-4 rounded-xl mt-2 z-10 shrink-0">
          {[
            { id: "chats", label: "Chats", icon: <MessageSquare size={18} />, badge: Object.values(unreadCounts).filter(c => c > 0).length },
            { id: "connections", label: "Connections", icon: <UserPlus size={18} />, badge: connectionNotifications.length },
            { id: "communities", label: "Communities", icon: <Users size={18} /> },
            { id: "settings", label: "Settings", icon: <Settings size={18} /> }
          ].map((item) => {
            const hasBadge = !!item.badge && item.badge > 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 transition relative ${
                  activeTab === item.id ? "text-[#3B82F6]" : "text-[#A1A1AA]"
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {hasBadge && (
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-[#2563EB] text-[7px] font-extrabold text-white rounded-full leading-none min-w-[12px] h-[12px] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUMN 3: MAIN CHAT WINDOW */}
      <div
        className={`flex-1 h-full z-10 ${
          activeConversationId ? "flex" : "hidden md:flex"
        } flex-col`}
      >
        <ChatWindow onToggleInfo={() => setShowInfoDrawer(!showInfoDrawer)} />
      </div>

      {/* COLUMN 4: RIGHT DETAIL INFO PANEL (DESKTOP OVERLAY / COLUMN TOGGLE) */}
      {showInfoDrawer && activeConversationId && (
        <div className="fixed inset-y-0 right-0 lg:static w-full sm:w-[360px] lg:w-[320px] h-full z-50 lg:z-20 p-3 lg:p-0 bg-[#09090B]/80 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none flex">
          <InfoDrawer onClose={() => setShowInfoDrawer(false)} />
        </div>
      )}
      {alertModalMessage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="glass p-6 rounded-modal w-[340px] max-w-full text-center shadow-2xl border border-white/10 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Notice</h3>
            <p className="text-xs text-[#A1A1AA] mb-6 leading-relaxed">
              {alertModalMessage}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setAlertModalMessage(null)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-btn transition cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;

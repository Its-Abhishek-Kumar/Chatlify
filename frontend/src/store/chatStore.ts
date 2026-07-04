import { create } from "zustand";

type Media = {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  downloadUrl?: string;
  type: "image" | "video" | "file";
};

export type Message = {
  _id: string;
  text: string;
  senderId: string;
  conversationId: string;
  media?: Media;
  reactions?: any[];
  edited?: boolean;
  deleted?: boolean;
  createdAt?: string;
  status?: string;
  replyTo?: Message | null;
  forwarded?: boolean;
  expiresAt?: string;
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image: string;
  };
  tempId?: string;
  uploadProgress?: number;
};

export type Conversation = {
  _id: string;
  type: "direct" | "group" | "channel" | "community";
  participants: any[];
  lastMessage?: any;
  updatedAt?: Date | string;
  name?: string;
  avatar?: string;
  admin?: string;
  pinnedMessages?: string[];
  disappearingDuration?: number;
  communityId?: string;
};

type ChatState = {
  messages: Message[];
  conversations: Conversation[];
  activeConversationId: string | null;

  onlineUsers: Set<string>;
  unreadCounts: Record<string, number>;

  setUserOnline: (id: string) => void;
  setUserOffline: (id: string) => void;
  setOnlineUsers: (ids: string[]) => void;

  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (msg: Message) => void;
  setActiveConversation: (id: string | null) => void;
  replaceTempMessage: (realMsg: Message) => void;
  setConversations: (
    c: Conversation[] | ((prev: Conversation[]) => Conversation[]),
  ) => void;
  updateMessageStatus: (id: string, status: string) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
  updateMessageReaction: (messageId: string, reactions: any[]) => void;
  updateMessage: (msg: Partial<Message> & { _id: string }) => void;
  replyToMessage: Message | null;
  setReplyToMessage: (msg: Message | null) => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  downloadedFiles: Record<string, string>;
  setDownloadedFile: (msgId: string, blobUrl: string) => void;
  connections: any[];
  connectionNotifications: any[];
  setConnections: (conns: any[]) => void;
  setConnectionNotifications: (notifs: any[]) => void;
  addConnectionNotification: (notif: any) => void;
  removeConnectionNotificationBySenderId: (senderId: string) => void;
  alertModalMessage: string | null;
  setAlertModalMessage: (msg: string | null) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  alertModalMessage: null,
  setAlertModalMessage: (msg) => set({ alertModalMessage: msg }),
  messages: [],
  conversations: [],
  activeConversationId: null,
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  isMobileNavOpen: false,
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  downloadedFiles: {},
  setDownloadedFile: (msgId, blobUrl) => set((state) => ({
    downloadedFiles: { ...state.downloadedFiles, [msgId]: blobUrl }
  })),

  onlineUsers: new Set<string>(),

  unreadCounts: {},
  setUnreadCounts: (counts) => set({ unreadCounts: counts }),

  // 👇 NEW ACTIONS
  setOnlineUsers: (ids: string[]) =>
    set({ onlineUsers: new Set(ids.map((id) => id.toString())) }),
  setUserOnline: (id: string) =>
    set((s) => {
      const setCopy = new Set(s.onlineUsers);
      setCopy.add(id);
      return { onlineUsers: setCopy };
    }),
  setUserOffline: (id: string) =>
    set((s) => {
      const setCopy = new Set(s.onlineUsers);
      setCopy.delete(id);
      return { onlineUsers: setCopy };
    }),

  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) =>
    set((state) => ({
      messages: typeof msgs === "function" ? msgs(state.messages) : msgs,
    })),

  addMessage: (msg) =>
    set((state) => {
      if (msg.tempId) {
        const index = state.messages.findIndex((m) => m._id === msg.tempId);
        if (index !== -1) {
          const tempMsg = state.messages[index];
          // Cache the sender's local blob URL under the new database message ID
          const downloadedFiles = { ...state.downloadedFiles };
          if (tempMsg.media?.url && tempMsg.media.url.startsWith("blob:")) {
            downloadedFiles[msg._id] = tempMsg.media.url;
          }

          const updatedMessages = [...state.messages];
          updatedMessages[index] = msg;
          
          const updatedConversations = state.conversations
            .map((c) =>
              c._id === msg.conversationId
                ? { ...c, lastMessage: msg, updatedAt: new Date() }
                : c,
            )
            .sort(
              (a, b) =>
                new Date(b.updatedAt ?? 0).getTime() -
                new Date(a.updatedAt ?? 0).getTime(),
            );
            
          return {
            messages: updatedMessages,
            conversations: updatedConversations,
            downloadedFiles,
          };
        }
      }

      const exists = state.messages.some((m) => m._id === msg._id);
      if (exists) return {};

      const updatedConversations = state.conversations
        .map((c) =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg, updatedAt: new Date() }
            : c,
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? 0).getTime() -
            new Date(a.updatedAt ?? 0).getTime(),
        );

      return {
        messages: [...state.messages, msg],
        conversations: updatedConversations,
      };
    }),

  // setActiveConversation: (id) => set({ activeConversationId: id }),
  setActiveConversation: (id) =>
    set((state) => ({
      activeConversationId: id,
      unreadCounts: id
        ? {
            ...state.unreadCounts,
            [id]: 0,
          }
        : state.unreadCounts,
    })),
  setConversations: (c) =>
    set((state) => ({
      conversations: typeof c === "function" ? c(state.conversations) : c,
    })),

  updateMessageStatus: (id: string, status: string) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === id ? { ...m, status } : m,
      ),
    })),

  replaceTempMessage: (realMsg) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id.startsWith("temp-") && m.conversationId === realMsg.conversationId
          ? realMsg
          : m,
      ),
    })),

  // ✅ UNREAD COUNT LOGIC
  incrementUnread: (conversationId: string) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),

  clearUnread: (conversationId: string) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: 0,
      },
    })),

  updateMessageReaction: (messageId, reactions) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, reactions } : m,
      ),
    })),
  updateMessage: (msg) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === msg._id ? { ...m, ...msg } : m,
      ),
    })),
  connections: [],
  connectionNotifications: [],
  setConnections: (conns) => set({ connections: conns }),
  setConnectionNotifications: (notifs) => set({ connectionNotifications: notifs }),
  addConnectionNotification: (notif) =>
    set((state) => {
      const exists = state.connectionNotifications.some((n) => n._id === notif._id);
      if (exists) return {};
      return { connectionNotifications: [notif, ...state.connectionNotifications] };
    }),
  removeConnectionNotificationBySenderId: (senderId) =>
    set((state) => ({
      connectionNotifications: state.connectionNotifications.filter(
        (n) => (n.senderId?._id?.toString() || n.senderId?.toString()) !== senderId
      ),
    })),
  replyToMessage: null,
  setReplyToMessage: (msg) => set({ replyToMessage: msg })
}));

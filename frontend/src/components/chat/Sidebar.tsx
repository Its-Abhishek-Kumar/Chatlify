import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect, useRef, useMemo } from "react";
import { getSocket } from "../../services/socket";
import Avatar from "./Avatar";
import {
  searchUsersAPI,
  createConversationAPI,
  createGroupConversationAPI,
  updateProfileAPI,
  getSessionsAPI,
  revokeSessionAPI,
  getStoriesAPI,
  createStoryAPI,
  uploadFileAPI,
  sendConnectionRequestAPI,
  withdrawConnectionRequestAPI,
  respondConnectionRequestAPI,
  markConnectionNotificationsReadAPI,
  getConnectionsAPI,
  getConnectionNotificationsAPI,
  deleteStoryAPI,
  viewStoryAPI,
  toggleLikeStoryAPI,
} from "../../services/api";
import {
  Search,
  X,
  Check,
  ChevronRight,
  Monitor,
  Trash2,
  Pin,
  CheckCheck,
  PenTool,
  Menu,
  Eye,
  ArrowLeft,
  Heart
} from "lucide-react";

interface SidebarProps {
  activeTab:
    | "chats"
    | "communities"
    | "channels"
    | "connections"
    | "saved"
    | "files"
    | "notifications"
    | "settings";
  setActiveTab?: (tab: any) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const user = useAuthStore((s) => s.user);
  const isMobileNavOpen = useChatStore((s) => s.isMobileNavOpen);
  const setMobileNavOpen = useChatStore((s) => s.setMobileNavOpen);
  const connections = useChatStore((s) => s.connections);
  const setConnections = useChatStore((s) => s.setConnections);
  const connectionNotifications = useChatStore((s) => s.connectionNotifications);
  const setConnectionNotifications = useChatStore((s) => s.setConnectionNotifications);
  const setAlertModalMessage = useChatStore((s) => s.setAlertModalMessage);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const timeoutRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Connections sub-tab state
  const [connectionsSubTab, setConnectionsSubTab] = useState<"requests" | "network" | "alerts">("requests");

  // Settings states
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileUsername, setProfileUsername] = useState(user?.username || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || "");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);

  // Group / Channel / Community creation states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"group" | "channel" | "community">("group");
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [parentCommunityId, setParentCommunityId] = useState("");
  
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState<any[]>([]);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<any[]>([]);
  const groupTimeoutRef = useRef<any>(null);

  // Category filter tab
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "groups" | "channels" | "vip">("all");



  // Stories database list & viewer
  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<any[] | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showViewersList, setShowViewersList] = useState(false);
  const storyProgressIntervalRef = useRef<any>(null);
  const storyFileRef = useRef<HTMLInputElement | null>(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<any | null>(null);
  const [connectionPromptUser, setConnectionPromptUser] = useState<any | null>(null);

  useEffect(() => {
    setShowViewersList(false);
  }, [storyIndex, activeStoryGroup]);

  // Command + K Focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Record story view when active story changes
  useEffect(() => {
    if (!activeStoryGroup || !activeStoryGroup[storyIndex]) return;
    const currentStory = activeStoryGroup[storyIndex];
    const isOwnStory = currentStory.userId?._id?.toString() === user?._id?.toString() || currentStory.userId?.toString() === user?._id?.toString();
    
    if (!isOwnStory && user?._id) {
      const markView = async () => {
        try {
          await viewStoryAPI(currentStory._id);
          // Refresh local list to update views state
          loadStories();
        } catch (err) {
          console.error("Failed to mark story as viewed:", err);
        }
      };
      markView();
    }
  }, [activeStoryGroup, storyIndex, user?._id]);



  // Profile photo upload states
  const profilePhotoFileRef = useRef<HTMLInputElement | null>(null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);

  const handleProfilePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfilePhoto(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const upload = await uploadFileAPI(formData);
      setProfileAvatar(upload.data.url);
    } catch (err) {
      console.error("Failed to upload profile photo:", err);
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  // Load context based on active tab swaps
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileUsername(user.username || "");
      setProfileAvatar(user.avatar || "");
    }
    if (activeTab === "settings") {
      fetchSessions();
    } else if (activeTab === "connections") {
      fetchConnectionsList();
      fetchNotificationsList();
      markNotificationsAsRead();
    }
  }, [user, activeTab]);

  // Load active status stories on mount / chats activation
  useEffect(() => {
    if (activeTab === "chats" && user) {
      loadStories();
    }
  }, [activeTab, user]);

  const loadStories = async () => {
    try {
      const res = await getStoriesAPI();
      setStoriesList(res.data);
    } catch (err) {
      console.error("Failed to load stories:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await getSessionsAPI();
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };





  const fetchConnectionsList = async () => {
    try {
      const res = await getConnectionsAPI();
      setConnections(res.data);
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    }
  };

  const fetchNotificationsList = async () => {
    try {
      const res = await getConnectionNotificationsAPI();
      setConnectionNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await markConnectionNotificationsReadAPI();
      // badge should clear, but wait, let's not empty notifications list if they are in the view, 
      // instead we can just let them stay but marked as seen or we can just keep them.
      // Let's clear the notifications list after a short timeout so they see them first, or keep them and mark them isRead locally!
      // Yes, updating their local isRead to true is much cleaner!
      setConnectionNotifications(connectionNotifications.map((n: any) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  const handleSendConnectionRequest = async (recipientId: string) => {
    try {
      await sendConnectionRequestAPI(recipientId);
      // Refresh connections and notifications
      await fetchConnectionsList();
      await fetchNotificationsList();
    } catch (err) {
      console.error("Failed to send connection request:", err);
    }
  };

  const handleRespondConnectionRequest = async (connectionId: string, action: "accept" | "reject") => {
    try {
      await respondConnectionRequestAPI(connectionId, action);
      // Refresh connections and notifications
      await fetchConnectionsList();
      await fetchNotificationsList();
    } catch (err) {
      console.error("Failed to respond to connection request:", err);
    }
  };

  const handleWithdrawConnectionRequest = async (connectionId: string) => {
    try {
      await withdrawConnectionRequestAPI(connectionId);
      // Refresh connections and notifications
      await fetchConnectionsList();
      await fetchNotificationsList();
    } catch (err) {
      console.error("Failed to withdraw connection request:", err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSessionAPI(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      console.error("Failed to revoke session:", err);
    }
  };

  // Uploading stories
  const handleStoryFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStory(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const upload = await uploadFileAPI(formData);
      const mediaUrl = upload.data.url;
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      
      await createStoryAPI(mediaUrl, mediaType);
      loadStories();
    } catch (err) {
      console.error("Failed to post story status:", err);
    } finally {
      setUploadingStory(false);
    }
  };

  // Automated progress timer for the story viewer modal
  useEffect(() => {
    if (activeStoryGroup && !storyToDelete) {
      setStoryProgress(0);
      if (storyProgressIntervalRef.current) clearInterval(storyProgressIntervalRef.current);
      
      storyProgressIntervalRef.current = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            // Move to next story index or close
            if (storyIndex < activeStoryGroup.length - 1) {
              setStoryIndex((prevIdx) => prevIdx + 1);
              return 0;
            } else {
              setActiveStoryGroup(null);
              return 0;
            }
          }
          return prev + 1.0; // Ticks up to 100% in exactly 10 seconds
        });
      }, 100);
    } else {
      if (storyProgressIntervalRef.current) clearInterval(storyProgressIntervalRef.current);
    }

    return () => {
      if (storyProgressIntervalRef.current) clearInterval(storyProgressIntervalRef.current);
    };
  }, [activeStoryGroup, storyIndex, storyToDelete]);

  // Debounced search for direct conversations
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      if (!value.trim()) return setResults([]);
      try {
        const res = await searchUsersAPI(value);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);
  };

  // Debounced search for group members
  const handleGroupSearch = (value: string) => {
    setGroupSearch(value);
    if (groupTimeoutRef.current) clearTimeout(groupTimeoutRef.current);

    groupTimeoutRef.current = setTimeout(async () => {
      if (!value.trim()) return setGroupSearchResults([]);
      try {
        const res = await searchUsersAPI(value);
        setGroupSearchResults(res.data);
      } catch (err) {
        console.error("Group search failed:", err);
      }
    }, 300);
  };

  // Create direct conversation
  const startDirectConversation = async (otherUser: any) => {
    try {
      const res = await createConversationAPI(otherUser._id);
      setActiveConversation(res.data._id);

      const existing = conversations.find((c: any) => c._id === res.data._id);
      if (!existing) {
        setConversations([res.data, ...conversations]);
      }
      setResults([]);
      setSearch("");
    } catch (err: any) {
      console.error("Failed to start direct conversation", err);
      setConnectionPromptUser(otherUser);
    }
  };

  // Create group conversation
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const participantIds = selectedGroupUsers.map((u) => u._id);
      const res = await createGroupConversationAPI(
        groupName,
        participantIds,
        undefined,
        groupType,
        groupType === "group" ? false : onlyAdminsCanPost,
        groupType === "channel" ? parentCommunityId || undefined : undefined
      );
      
      setConversations([res.data, ...conversations]);
      setActiveConversation(res.data._id);
      
      setIsGroupModalOpen(false);
      setGroupName("");
      setGroupType("group");
      setOnlyAdminsCanPost(false);
      setParentCommunityId("");
      setSelectedGroupUsers([]);
      setGroupSearch("");
      setGroupSearchResults([]);
    } catch (err) {
      console.error("Failed to create conversation room:", err);
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setSettingsSuccess("");
    setSettingsError("");
    try {
      const res = await updateProfileAPI({
        name: profileName,
        username: profileUsername,
        avatar: profileAvatar,
      });
      updateUser(res.data);
      setSettingsSuccess("Profile updated successfully!");
    } catch (err: any) {
      setSettingsError(err.response?.data?.message || "Failed to update profile");
    }
  };



  // Filter conversation list based on active tab and search filters
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (!conv?.participants || !user?._id) return false;

      const unreadCount = unreadCounts[conv._id] || 0;
      if (selectedFilter === "unread" && unreadCount === 0) return false;
      if (selectedFilter === "groups" && conv.type !== "group" && conv.type !== "community") return false;
      if (selectedFilter === "channels" && conv.type !== "channel") return false;
      if (selectedFilter === "vip" && (!conv.pinnedMessages || conv.pinnedMessages.length === 0)) return false;

      return true;
    });
  }, [conversations, selectedFilter, unreadCounts, user]);

  // Aggregate user stories list (grouping stories by userId)
  const groupedStories = useMemo(() => {
    const groups: Record<string, any> = {};
    storiesList.forEach((story) => {
      if (!story.userId) return;
      const uId = story.userId._id.toString();
      if (!groups[uId]) {
        groups[uId] = {
          user: story.userId,
          stories: []
        };
      }
      groups[uId].stories.push(story);
    });
    return Object.values(groups);
  }, [storiesList]);

  const ownStoryGroup = useMemo(() => {
    return groupedStories.find((g) => g.user?._id?.toString() === user?._id?.toString());
  }, [groupedStories, user]);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).filter((count) => count > 0).length;
  }, [unreadCounts]);

  const communitiesList = conversations.filter((c) => c.type === "community");
  const channelsList = conversations.filter((c) => c.type === "channel");

  return (
    <div className="glass-strong h-full p-4 flex flex-col z-20 relative">
      {/* 1. CHATS LISTING VIEW */}
      {(activeTab === "chats" || activeTab === "saved" || activeTab === "files" || activeTab === "notifications") && (
        <>
          {/* SEARCH HEADER */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-[#71717A] hover:text-white transition shrink-0"
              title="Toggle Navigation Menu"
            >
              <Menu size={16} />
            </button>
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 text-[#71717A]" size={16} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search chats, users, messages..."
                className="w-full pl-10 pr-10 lg:pr-12 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs text-white outline-none focus:border-[#2563EB] transition"
              />
              {search ? (
                <button
                  onClick={() => {
                    handleSearch("");
                    setResults([]);
                  }}
                  className="absolute right-3 p-1 rounded-full hover:bg-white/10 text-[#71717A] hover:text-white transition cursor-pointer flex items-center justify-center"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="absolute right-3 text-[10px] font-bold text-[#71717A] bg-white/5 border border-white/10 px-1 py-0.5 rounded hidden lg:inline-block pointer-events-none">
                  ⌘K
                </span>
              )}
            </div>
          </div>

          {/* DYNAMIC STORIES ROW FROM DATABASE */}
          <div className="flex gap-4.5 overflow-x-auto pb-4 pt-1 mb-2 scrollbar-none items-center text-left">
            {/* Add Story trigger */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative cursor-pointer">
                <div
                  className={ownStoryGroup ? "story-ring" : ""}
                  onClick={() => {
                    if (ownStoryGroup) {
                      setActiveStoryGroup(ownStoryGroup.stories);
                      setStoryIndex(0);
                    } else {
                      storyFileRef.current?.click();
                    }
                  }}
                >
                  <Avatar
                    src={user?.avatar}
                    name={user?.name || user?.username || "Me"}
                    className={`w-12 h-12 shadow transition ${ownStoryGroup ? "border border-black" : "border border-[#2A2A30] opacity-70 hover:opacity-100"}`}
                  />
                </div>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    storyFileRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 w-4 h-4 bg-[#2563EB] rounded-full flex items-center justify-center text-white border-2 border-[#111113] text-xs font-bold leading-none cursor-pointer"
                >
                  {uploadingStory ? "•" : "+"}
                </span>
              </div>
              <span className="text-[10px] text-[#A1A1AA] font-semibold tracking-wide">
                My Status
              </span>
            </div>

            <input
              ref={storyFileRef}
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={handleStoryFileSelected}
            />

            {/* Stories from database */}
            {groupedStories.map((group, idx) => {
              const isOwnStory = group.user._id.toString() === user?._id?.toString();
              if (isOwnStory) return null; // Already rendered Status Add

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveStoryGroup(group.stories);
                    setStoryIndex(0);
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <div className="story-ring">
                    <Avatar
                      src={group.user.avatar}
                      name={group.user.name}
                      className="w-12 h-12"
                    />
                  </div>
                  <span className="text-[10px] text-[#A1A1AA] font-semibold tracking-wide truncate max-w-[50px]">
                    {group.user.name.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CATEGORIES FILTERS */}
          <div className="flex gap-2.5 pb-3.5 border-b border-white/5 mb-3 text-xs overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread", badge: totalUnreadCount },
              { id: "groups", label: "Groups" },
              { id: "channels", label: "Channels" },
              { id: "vip", label: "VIP" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`py-1 px-3 rounded-full font-bold tracking-wide transition flex items-center gap-1 shrink-0 ${
                  selectedFilter === tab.id
                    ? "bg-[#2563EB]/15 text-[#3B82F6] border border-[#2563EB]/25"
                    : "text-[#71717A] hover:text-[#FAFAFA]"
                }`}
              >
                {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-[#2563EB] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Search results dropdown */}
          {results.length > 0 && (
            <div className="mb-4 space-y-1.5 p-2 bg-[#111113] border border-[#2A2A30] rounded-card max-h-[220px] overflow-y-auto">
              <p className="text-[10px] text-[#71717A] px-2 font-semibold tracking-wider uppercase mb-1">Search Results</p>
              {results.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-2 hover:bg-[#202024] rounded-btn cursor-pointer transition"
                  onClick={() => startDirectConversation(u)}
                >
                  <Avatar
                    src={u.avatar}
                    name={u.name}
                    className="w-8 h-8"
                    online={u.isOnline}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-xs text-[#71717A] truncate">@{u.username}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#71717A]" />
                </div>
              ))}
            </div>
          )}

          {/* Active Chats List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-[#71717A] text-sm">
                <p>No conversations found</p>
                <p className="text-xs mt-1 text-gray-600">Search users to start chatting</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isGroup = conv.type !== "direct";
                const other = !isGroup
                  ? conv.participants.find((p: any) => p?._id?.toString() !== user?._id?.toString())
                  : null;

                const displayName = conv.type === "direct" ? (other?.name || "Unknown") : conv.name;
                const displaySub = conv.type === "direct"
                  ? `@${other?.username || "unknown"}`
                  : `${conv.type.toUpperCase()} (${conv.participants.length} members)`;
                

                const isActive = activeConversationId === conv._id;
                const unreadCount = unreadCounts[conv._id] || 0;
                const isPinned = conv.pinnedMessages && conv.pinnedMessages.length > 0;

                const lastMsgText = conv.lastMessage?.deleted
                  ? ""
                  : conv.lastMessage?.text || (conv.lastMessage?.media ? "📎 Media attachment" : "");

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      setActiveConversation(conv._id);
                      clearUnread(conv._id);
                      getSocket()?.emit("conversation:read", { conversationId: conv._id });
                    }}
                    className={`flex items-center gap-3.5 p-3 rounded-card cursor-pointer border transition duration-200 ${
                      isActive
                        ? "chat-card-active"
                        : "hover:bg-[#18181B] bg-transparent border-transparent"
                    }`}
                  >
                    <Avatar
                      src={conv.type === "direct" ? other?.avatar : conv.avatar}
                      name={displayName}
                      className="w-12 h-12 shadow"
                      online={conv.type === "direct" ? (other?._id && onlineUsers.has(other._id.toString())) : false}
                    />

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline mb-0.5 min-w-0">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="truncate">{displayName}</span>
                          {isPinned && <Pin size={10} className="text-[#71717A] rotate-45 shrink-0" />}
                        </h4>
                        <span className="text-[9px] text-[#71717A] font-medium shrink-0 ml-2">
                          {conv.lastMessage?.createdAt &&
                            new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center min-w-0">
                        <p className="text-[11px] text-[#A1A1AA] truncate flex-1 pr-2 mt-0.5">
                          {lastMsgText || displaySub}
                        </p>

                        {unreadCount > 0 ? (
                          <span className="flex items-center justify-center h-4.5 min-w-4.5 px-1 bg-[#2563EB] text-[9px] font-bold text-white rounded-full shrink-0">
                            {unreadCount}
                          </span>
                        ) : isPinned ? (
                          <Pin size={12} className="text-[#71717A] shrink-0" />
                        ) : conv.lastMessage?.senderId === user?._id ? (
                          <CheckCheck size={12} className="text-[#A1A1AA] shrink-0" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FLOATING ACTION PEN BUTTON */}
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full btn-gradient flex items-center justify-center text-white transition duration-200 z-30 cursor-pointer"
            title="Create Space"
          >
            <PenTool size={18} />
          </button>
        </>
      )}



      {/* 3. COMMUNITIES TAB VIEW (Nesting channels inside Parent Communities) */}
      {activeTab === "communities" && (
        <div className="flex-1 flex flex-col overflow-hidden text-left">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab?.("chats")}
                className="md:hidden p-1 bg-white/5 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
                title="Back to Chats"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Communities Workspace</h3>
            </div>
            <button
              onClick={() => {
                setGroupType("community");
                setIsGroupModalOpen(true);
              }}
              className="text-[10px] font-bold text-[#3B82F6] hover:underline"
            >
              + Create
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {communitiesList.length === 0 ? (
              <p className="text-xs text-[#71717A]">No communities created yet. Create one to organize nested channels.</p>
            ) : (
              communitiesList.map((comm) => {
                // Find channels belonging to this community
                const nestedChannels = conversations.filter((c) => c.type === "channel" && c.communityId === comm._id);

                return (
                  <div key={comm._id} className="p-3 bg-[#111113] border border-[#2A2A30] rounded-card space-y-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={comm.avatar}
                        name={comm.name || "Community"}
                        className="w-10 h-10"
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          🏛️ {comm.name}
                        </p>
                        <p className="text-[10px] text-[#71717A] mt-0.5 uppercase font-bold tracking-wider">
                          {comm.participants.length} Active Members
                        </p>
                      </div>
                    </div>

                    {/* Nested Channels List */}
                    <div className="pl-2 border-l border-white/5 space-y-1">
                      <p className="text-[9px] text-[#71717A] uppercase font-bold tracking-widest mb-1.5">Nested Channels</p>
                      {nestedChannels.length === 0 ? (
                        <p className="text-[10px] text-[#71717A] italic pl-1">No nested channels linked.</p>
                      ) : (
                        nestedChannels.map((chan) => (
                          <div
                            key={chan._id}
                            onClick={() => setActiveConversation(chan._id)}
                            className="p-1.5 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-btn cursor-pointer transition flex justify-between items-center"
                          >
                            <span className="text-[11px] text-[#D4D4D8] font-semibold truncate flex items-center gap-1">
                              📢 {chan.name}
                            </span>
                            <ChevronRight size={10} className="text-[#71717A]" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. CHANNELS TAB VIEW */}
      {activeTab === "channels" && (
        <div className="flex-1 flex flex-col overflow-hidden text-left">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab?.("chats")}
                className="md:hidden p-1 bg-white/5 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
                title="Back to Chats"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Broadcast Channels</h3>
            </div>
            <button
              onClick={() => {
                setGroupType("channel");
                setIsGroupModalOpen(true);
              }}
              className="text-[10px] font-bold text-[#3B82F6] hover:underline"
            >
              + Launch
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {channelsList.length === 0 ? (
              <p className="text-xs text-[#71717A]">No broadcast channels created yet.</p>
            ) : (
              channelsList.map((chan) => (
                <div
                  key={chan._id}
                  onClick={() => setActiveConversation(chan._id)}
                  className="p-3 bg-[#111113] border border-[#2A2A30] hover:border-white/10 rounded-card flex justify-between items-center gap-2 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={chan.avatar}
                      name={chan.name || "Channel"}
                      className="w-8 h-8"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        📢 {chan.name}
                      </p>
                      <p className="text-[10px] text-[#71717A] mt-0.5">
                        {chan.participants.length} Subscribers
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-[#71717A]" />
                </div>
              ))
            )}
          </div>
        </div>
      )}



      {/* 5. CONNECTIONS VIEW */}
      {activeTab === "connections" && (
        <div className="flex-1 flex flex-col overflow-hidden text-left">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab?.("chats")}
              className="md:hidden p-1 bg-white/5 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
              title="Back to Chats"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Connections</h3>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex gap-2 mb-4 border-b border-white/5 pb-2 shrink-0">
            {[
              { id: "network", label: "Network" },
              { id: "requests", label: "Requests" },
              { id: "alerts", label: "Alerts" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setConnectionsSubTab(tab.id as any)}
                className={`py-1 px-3 rounded-full text-xs font-bold tracking-wide transition ${
                  connectionsSubTab === tab.id
                    ? "bg-[#2563EB]/15 text-[#3B82F6] border border-[#2563EB]/25"
                    : "text-[#71717A] hover:text-[#FAFAFA]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* REQUESTS SUB-TAB */}
            {connectionsSubTab === "requests" && (
              <div className="space-y-4">
                {/* Incoming Requests */}
                <div>
                  <h4 className="text-[10px] text-[#71717A] font-bold uppercase tracking-wider mb-2">Incoming Requests</h4>
                  {(() => {
                    const incoming = connections.filter(
                      (c) => c.status === "pending" && c.recipient?._id?.toString() === user?._id?.toString()
                    );
                    if (incoming.length === 0) {
                      return <p className="text-xs text-[#71717A] italic pl-1">No pending incoming requests.</p>;
                    }
                    return (
                      <div className="space-y-2">
                        {incoming.map((conn) => {
                          const requesterUser = conn.requester;
                          return (
                            <div
                              key={conn._id}
                              className="p-2.5 bg-[#111113] border border-[#2A2A30] rounded-card flex justify-between items-center gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar
                                  src={requesterUser?.avatar}
                                  name={requesterUser?.name || "User"}
                                  className="w-8 h-8"
                                />
                                <div className="min-w-0 text-left">
                                  <p className="text-xs font-bold text-white truncate">{requesterUser?.name}</p>
                                  <p className="text-[10px] text-[#71717A] mt-0.5">@{requesterUser?.username}</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleRespondConnectionRequest(conn._id, "accept")}
                                  className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-btn transition"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRespondConnectionRequest(conn._id, "reject")}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-btn transition"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Sent Requests */}
                <div>
                  <h4 className="text-[10px] text-[#71717A] font-bold uppercase tracking-wider mb-2">Sent Requests</h4>
                  {(() => {
                    const sent = connections.filter(
                      (c) => c.status === "pending" && c.requester?._id?.toString() === user?._id?.toString()
                    );
                    if (sent.length === 0) {
                      return <p className="text-xs text-[#71717A] italic pl-1">No pending sent requests.</p>;
                    }
                    return (
                      <div className="space-y-2">
                        {sent.map((conn) => {
                          const recipientUser = conn.recipient;
                          return (
                            <div
                              key={conn._id}
                              className="p-2.5 bg-[#111113] border border-[#2A2A30] rounded-card flex justify-between items-center gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar
                                  src={recipientUser?.avatar}
                                  name={recipientUser?.name || "User"}
                                  className="w-8 h-8"
                                />
                                <div className="min-w-0 text-left">
                                  <p className="text-xs font-bold text-white truncate">{recipientUser?.name}</p>
                                  <p className="text-[10px] text-[#71717A] mt-0.5">@{recipientUser?.username}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleWithdrawConnectionRequest(conn._id)}
                                className="px-2.5 py-1 bg-red-600/15 text-red-500 border border-red-500/25 hover:bg-red-600/25 text-[10px] font-bold rounded-btn transition shrink-0"
                              >
                                Withdraw
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* NETWORK SUB-TAB */}
            {connectionsSubTab === "network" && (
              <div>
                <h4 className="text-[10px] text-[#71717A] font-bold uppercase tracking-wider mb-2">My Connections</h4>
                {(() => {
                  const accepted = connections.filter((c) => c.status === "accepted");
                  if (accepted.length === 0) {
                    return <p className="text-xs text-[#71717A] pl-1">No connections in your network yet.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {accepted.map((conn) => {
                        const friend = conn.requester?._id?.toString() === user?._id?.toString() ? conn.recipient : conn.requester;
                        if (!friend) return null;
                        return (
                          <div
                            key={conn._id}
                            className="p-2.5 bg-[#111113] border border-[#2A2A30] hover:border-white/10 rounded-card flex justify-between items-center gap-2 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar
                                src={friend.avatar}
                                name={friend.name || "User"}
                                className="w-8 h-8"
                                online={onlineUsers.has(friend._id?.toString())}
                              />
                              <div className="min-w-0 text-left">
                                <p className="text-xs font-bold text-white truncate">{friend.name}</p>
                                <p className="text-[10px] text-[#71717A] mt-0.5">@{friend.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => startDirectConversation(friend)}
                              className="px-2.5 py-1 bg-[#2563EB]/15 text-[#3B82F6] border border-[#2563EB]/25 hover:bg-[#2563EB]/25 text-[10px] font-bold rounded-btn transition shrink-0"
                            >
                              Message
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ALERTS SUB-TAB */}
            {connectionsSubTab === "alerts" && (
              <div>
                <h4 className="text-[10px] text-[#71717A] font-bold uppercase tracking-wider mb-2">Recent Activities</h4>
                {connectionNotifications.length === 0 ? (
                  <p className="text-xs text-[#71717A] pl-1">No recent activities.</p>
                ) : (
                  <div className="space-y-2">
                    {connectionNotifications.map((notif) => {
                      const initiator = notif.senderId;
                      return (
                        <div
                          key={notif._id}
                          className="p-2.5 bg-[#111113]/60 border border-[#2A2A30] rounded-card text-left flex gap-2.5 items-center"
                        >
                          <Avatar
                            src={initiator?.avatar}
                            name={initiator?.name || "User"}
                            className="w-8 h-8 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white">
                              <span className="font-bold">{initiator?.name || "Someone"}</span>{" "}
                              {notif.type === "request" 
                                ? "sent you a connection request." 
                                : "accepted your connection request."
                              }
                            </p>
                            <span className="text-[8px] text-[#71717A] block mt-0.5">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SETTINGS VIEW */}
      {activeTab === "settings" && (
        <div className="flex-1 flex flex-col overflow-hidden text-left">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab?.("chats")}
              className="md:hidden p-1 bg-white/5 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
              title="Back to Chats"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Settings</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="flex flex-col items-center py-4 border-b border-[#2A2A30] mb-2">
              <div className="relative group/avatar cursor-pointer" onClick={() => profilePhotoFileRef.current?.click()}>
                <Avatar
                  src={profileAvatar}
                  name={profileName}
                  className="w-20 h-20 mb-3 group-hover/avatar:opacity-70 transition"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white text-[10px] font-bold uppercase transition mb-3">
                  {uploadingProfilePhoto ? "Uploading..." : "Change"}
                </div>
              </div>
              <input
                ref={profilePhotoFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoSelected}
              />
              <h3 className="font-semibold text-base text-white">{user?.name}</h3>
              {user?.email && <p className="text-xs text-[#71717A]">{user.email}</p>}
              {user?.mobileNumber && <p className="text-xs text-[#71717A]">{user.mobileNumber}</p>}
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5">Display Name</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs outline-none focus:border-[#2563EB] transition text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5">Username</label>
                <input
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs outline-none focus:border-[#2563EB] transition text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5">Avatar Image URL</label>
                <input
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  placeholder="Link to custom avatar..."
                  className="w-full px-3 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs outline-none focus:border-[#2563EB] transition text-white"
                />
              </div>
              
              {settingsSuccess && <p className="text-green-400 text-[10px] text-center">{settingsSuccess}</p>}
              {settingsError && <p className="text-red-400 text-[10px] text-center">{settingsError}</p>}

              <button
                onClick={handleSaveProfile}
                className="w-full py-2.5 rounded-btn bg-[#2563EB] hover:bg-[#3B82F6] active:bg-[#1D4ED8] font-bold text-xs transition duration-200 text-white flex items-center justify-center gap-2"
              >
                Save Profile Settings
              </button>
            </div>

            {/* ACTIVE DEVICE SESSIONS */}
            <div className="pt-4 border-t border-white/5 mt-6">
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Active Device Sessions</h4>
              {sessions.length === 0 ? (
                <p className="text-xs text-[#71717A]">No other logged in devices.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s._id}
                      className="p-3 bg-[#111113] border border-[#2A2A30] rounded-card flex justify-between items-center gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-white font-semibold flex items-center gap-1.5">
                          <Monitor size={12} className="text-[#3B82F6]" />
                          {s.deviceName.slice(0, 30)}
                        </p>
                        <p className="text-[10px] text-[#71717A] mt-0.5">
                          IP: {s.ipAddress} • {new Date(s.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                      {s.token !== localStorage.getItem("token") && (
                        <button
                          onClick={() => handleRevokeSession(s._id)}
                          className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-lg transition"
                          title="Revoke Session"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MULTI-USER ROOM MODAL */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 rounded-modal w-[400px] max-w-full flex flex-col max-h-[90vh] shadow-2xl relative text-left">
            <button
              onClick={() => setIsGroupModalOpen(false)}
              className="absolute top-4 right-4 text-[#71717A] hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Create Space</h3>

            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div>
                <label className="block text-[10px] text-[#D4D4D8] mb-1 font-semibold uppercase">Space Type</label>
                <select
                  value={groupType}
                  onChange={(e: any) => setGroupType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs text-white outline-none focus:border-[#2563EB]"
                >
                  <option value="group">Group Chat (Standard)</option>
                  <option value="channel">Channel (Broadcast Channel)</option>
                  <option value="community">Community (Group of Channels)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#D4D4D8] mb-1 font-semibold uppercase">Name</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={`Enter ${groupType} name...`}
                  className="w-full px-3 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs text-white outline-none focus:border-[#2563EB]"
                />
              </div>

              {groupType !== "group" && (
                <div className="flex items-center gap-2 bg-[#111113] p-2.5 rounded-btn border border-[#2A2A30]">
                  <input
                    type="checkbox"
                    id="admins-post"
                    checked={onlyAdminsCanPost}
                    onChange={(e) => setOnlyAdminsCanPost(e.target.checked)}
                    className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="admins-post" className="text-xs text-[#D4D4D8] cursor-pointer">
                    Only administrators can post messages in this channel
                  </label>
                </div>
              )}

              {groupType === "channel" && communitiesList.length > 0 && (
                <div>
                  <label className="block text-[10px] text-[#D4D4D8] mb-1 font-semibold uppercase">Link to Community (Optional)</label>
                  <select
                    value={parentCommunityId}
                    onChange={(e) => setParentCommunityId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs text-white outline-none focus:border-[#2563EB]"
                  >
                    <option value="">None (Standalone Channel)</option>
                    {communitiesList.map((comm) => (
                      <option key={comm._id} value={comm._id}>{comm.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {groupType !== "community" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <label className="block text-[10px] text-[#D4D4D8] mb-1 font-semibold uppercase">Add Members</label>
                  
                  {selectedGroupUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto mb-2 bg-[#111113] p-1.5 rounded-btn border border-[#2A2A30]">
                      {selectedGroupUsers.map((u) => (
                        <span
                          key={u._id}
                          className="flex items-center gap-1 pl-1.5 pr-1 py-0.5 bg-[#2563EB]/20 text-[#60A5FA] text-xs rounded-full border border-[#2563EB]/30"
                        >
                          {u.name}
                          <button
                            onClick={() => setSelectedGroupUsers(selectedGroupUsers.filter((x) => x._id !== u._id))}
                            className="hover:bg-[#2563EB]/30 rounded-full p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 text-[#71717A]" size={16} />
                    <input
                      value={groupSearch}
                      onChange={(e) => handleGroupSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-9 pr-4 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs text-white outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1">
                    {groupSearchResults.map((u) => {
                      const isAdded = selectedGroupUsers.some((x) => x._id === u._id);
                      return (
                        <div
                          key={u._id}
                          className="flex items-center gap-3 p-2 hover:bg-[#202024] rounded-btn cursor-pointer transition"
                          onClick={() => {
                            if (isAdded) {
                              setSelectedGroupUsers(selectedGroupUsers.filter((x) => x._id !== u._id));
                            } else {
                              setSelectedGroupUsers([...selectedGroupUsers, u]);
                            }
                            setGroupSearch("");
                            setGroupSearchResults([]);
                          }}
                        >
                          <Avatar
                            src={u.avatar}
                            name={u.name}
                            className="w-7 h-7"
                          />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-[#71717A] truncate">@{u.username}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isAdded ? "bg-[#2563EB] border-[#2563EB] text-white" : "border-white/20"
                          }`}>
                            {isAdded && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || (groupType !== "community" && selectedGroupUsers.length === 0)}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] active:bg-[#1D4ED8] disabled:bg-gray-700 disabled:opacity-40 text-white font-bold text-xs rounded-btn transition duration-200 mt-2"
              >
                Create {groupType.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN DYNAMIC STORY VIEWER POPUP OVERLAY */}
      {activeStoryGroup && activeStoryGroup.length > 0 && (() => {
        const currentStory = activeStoryGroup[storyIndex];
        const isOwnStory = currentStory?.userId?._id?.toString() === user?._id?.toString() || currentStory?.userId?.toString() === user?._id?.toString();
        const isLiked = currentStory?.likes?.some((l: any) => l._id?.toString() === user?._id?.toString() || l.toString() === user?._id?.toString());
        
        return (
          <div
            onClick={() => setActiveStoryGroup(null)}
            className="fixed inset-0 bg-black/95 z-[999] flex flex-col items-center justify-center cursor-pointer p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[450px] max-w-full aspect-[9/16] bg-[#09090B] rounded-modal overflow-hidden flex flex-col justify-between p-4 relative shadow-2xl border border-white/5"
            >
              {/* Story loading progress bars */}
              <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-50">
                {activeStoryGroup.map((_, barIdx) => {
                  const isCurrent = barIdx === storyIndex;
                  const isViewed = barIdx < storyIndex;
                  const widthPercent = isViewed ? 100 : isCurrent ? storyProgress : 0;
                  return (
                    <div key={barIdx} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-100 ease-linear"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Publisher Avatar & Header */}
              <div className="flex justify-between items-center mt-4 z-40 relative px-2">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentStory?.userId?.avatar}
                    name={currentStory?.userId?.name || "User"}
                    className="w-9 h-9"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">
                      {currentStory?.userId?.name || "User Status"}
                    </p>
                    <p className="text-[9px] text-[#A1A1AA]">
                      {currentStory?.createdAt &&
                        new Date(currentStory.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isOwnStory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStoryToDelete(currentStory);
                      }}
                      className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded-full text-red-400 hover:text-red-300 transition cursor-pointer"
                      title="Delete Story"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setActiveStoryGroup(null)}
                    className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Media Content Body (centered) */}
              <div className="flex-1 flex items-center justify-center py-6 px-2 overflow-hidden z-20">
                {currentStory?.mediaType === "video" ? (
                  <video
                    autoPlay
                    src={currentStory?.mediaUrl}
                    className="max-h-full max-w-full rounded-card object-contain"
                  />
                ) : (
                  <img
                    src={currentStory?.mediaUrl}
                    className="max-h-full max-w-full rounded-card object-contain shadow-lg"
                    alt="Story Content"
                  />
                )}
              </div>

              {/* Next / Previous quick tapping controls */}
              <div
                className="absolute left-0 top-20 bottom-20 w-1/4 z-30 cursor-pointer"
                onClick={() => {
                  if (storyIndex > 0) {
                    setStoryIndex(storyIndex - 1);
                  }
                }}
              />
              <div
                className="absolute right-0 top-20 bottom-20 w-1/4 z-30 cursor-pointer"
                onClick={() => {
                  if (storyIndex < activeStoryGroup.length - 1) {
                    setStoryIndex(storyIndex + 1);
                  } else {
                    setActiveStoryGroup(null);
                  }
                }}
              />

              {/* Viewers list for own story */}
              {isOwnStory && (
                <div className="z-40 relative pb-2 pt-1 border-t border-white/5 flex flex-col items-center select-none bg-[#09090B]/60 rounded-b-modal">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowViewersList(!showViewersList);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 hover:bg-white/5 rounded-full text-xs text-[#3B82F6] font-semibold transition cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>{currentStory?.viewers?.length || 0} Views</span>
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-red-500 font-semibold select-none">
                      <Heart size={14} fill="red" />
                      <span>{currentStory?.likes?.length || 0} Likes</span>
                    </div>
                  </div>

                  {showViewersList && (
                    <div className="mt-2 w-full max-h-[150px] overflow-y-auto px-4 py-2 space-y-2 text-left bg-[#111113] rounded-btn border border-white/5">
                      <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-1">Viewed by</p>
                      {(!currentStory?.viewers || currentStory.viewers.length === 0) ? (
                        <p className="text-xs text-[#71717A] italic">No views yet</p>
                      ) : (
                        currentStory.viewers.map((viewer: any) => {
                          const likedThis = currentStory?.likes?.some(
                            (l: any) => l._id?.toString() === viewer._id?.toString() || l.toString() === viewer._id?.toString()
                          );
                          return (
                            <div key={viewer._id || viewer} className="flex items-center gap-2 py-0.5">
                              <Avatar
                                src={viewer.avatar}
                                name={viewer.name || "User"}
                                className="w-6 h-6 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">{viewer.name || "User"}</p>
                                <p className="text-[9px] text-[#71717A] truncate">@{viewer.username || "user"}</p>
                              </div>
                              {likedThis && (
                                <Heart size={11} fill="red" className="text-red-500 shrink-0 ml-auto mr-1" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Liking option for other users' stories */}
              {!isOwnStory && (
                <div className="z-40 relative pb-3 pt-2 border-t border-white/5 flex justify-center bg-[#09090B]/60 rounded-b-modal">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await toggleLikeStoryAPI(currentStory._id);
                        const updatedGroup = activeStoryGroup.map((s) => s._id === currentStory._id ? res.data : s);
                        setActiveStoryGroup(updatedGroup);
                        loadStories();
                      } catch (err) {
                        console.error("Failed to toggle like on story:", err);
                      }
                    }}
                    className="p-2 hover:bg-white/5 rounded-full transition cursor-pointer flex items-center justify-center"
                    title={isLiked ? "Unlike status" : "Like status"}
                  >
                    <Heart
                      size={20}
                      fill={isLiked ? "red" : "none"}
                      className={isLiked ? "text-red-500 scale-110" : "text-white/70 hover:text-white hover:scale-110 transition"}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {storyToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="glass p-6 rounded-modal w-[320px] max-w-full text-center shadow-2xl border border-white/10 relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Delete Status</h3>
            <p className="text-xs text-[#A1A1AA] mb-6 leading-relaxed">
              Are you sure you want to permanently delete this status update?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStoryToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-btn transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteStoryAPI(storyToDelete._id);
                    if (activeStoryGroup) {
                      const updatedGroup = activeStoryGroup.filter((s) => s._id !== storyToDelete._id);
                      if (updatedGroup.length === 0) {
                        setActiveStoryGroup(null);
                      } else {
                        if (storyIndex >= updatedGroup.length) {
                          setStoryIndex(updatedGroup.length - 1);
                        }
                        setActiveStoryGroup(updatedGroup);
                      }
                    }
                    setStoryToDelete(null);
                    loadStories();
                  } catch (err) {
                    console.error("Failed to delete story:", err);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-btn transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {connectionPromptUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="glass p-6 rounded-modal w-[340px] max-w-full text-center shadow-2xl border border-white/10 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Send Connection Request?</h3>
            <p className="text-xs text-[#A1A1AA] mb-6 leading-relaxed">
              You must be connected to <span className="text-white font-semibold">@{connectionPromptUser.username}</span> to start a conversation. Would you like to send them a connection request?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConnectionPromptUser(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-btn transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await handleSendConnectionRequest(connectionPromptUser._id);
                    setConnectionPromptUser(null);
                    setAlertModalMessage(`Connection request sent to @${connectionPromptUser.username}!`);
                  } catch (err) {
                    console.error("Failed to send connection request:", err);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-btn transition cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useMemo, useState, useRef } from "react";
import { addConversationMembersAPI, searchUsersAPI, removeConversationMembersAPI, leaveConversationAPI, deleteConversationAPI, removeConnectionAPI } from "../../services/api";
import Avatar from "./Avatar";
import { getSocket } from "../../services/socket";
import {
  createAttachmentBlobUrl,
  downloadBlobUrl,
  downloadAttachmentByUrl,
  formatBytes,
  getAttachmentName,
  openAttachment,
  type AttachmentLike
} from "../../utils/attachments";
import {
  X,
  Search,
  Pin,
  MoreHorizontal,
  Image,
  Plus,
  Check,
  LogOut,
  Trash2,
  ArrowLeft,
  FileIcon,
  UserMinus
} from "lucide-react";

interface InfoDrawerProps {
  onClose: () => void;
}

const InfoDrawer = ({ onClose }: InfoDrawerProps) => {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const messages = useChatStore((s) => s.messages);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const user = useAuthStore((s) => s.user);

  const isSearchOpen = useChatStore((s) => s.isSearchOpen);
  const setSearchOpen = useChatStore((s) => s.setSearchOpen);
  const connections = useChatStore((s) => s.connections);
  const setConnections = useChatStore((s) => s.setConnections);
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
  const conversation = useMemo(() => {
    return conversations.find((c) => c._id === activeConversationId);
  }, [conversations, activeConversationId]);

  const [subView, setSubView] = useState<"main" | "media" | "pinned">("main");
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const memberTimeoutRef = useRef<any>(null);
  const [submittingMembers, setSubmittingMembers] = useState(false);
  
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [isRemoveFriendConfirmOpen, setIsRemoveFriendConfirmOpen] = useState(false);
  const [submittingRemoveFriend, setSubmittingRemoveFriend] = useState(false);

  const handleMemberSearch = (val: string) => {
    setMemberSearch(val);
    if (memberTimeoutRef.current) clearTimeout(memberTimeoutRef.current);
    memberTimeoutRef.current = setTimeout(async () => {
      if (!val.trim()) return setMemberResults([]);
      try {
        const res = await searchUsersAPI(val);
        const existingIds = new Set(conversation?.participants?.map((p: any) => p._id.toString()) || []);
        setMemberResults(res.data.filter((u: any) => !existingIds.has(u._id.toString())));
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const handleAddMembersSubmit = async () => {
    if (selectedMembers.length === 0 || !conversation) return;
    setSubmittingMembers(true);
    try {
      const res = await addConversationMembersAPI(
        conversation._id,
        selectedMembers.map((u) => u._id)
      );
      setConversations(conversations.map((c) => (c._id === res.data._id ? res.data : c)));
      setIsAddMembersOpen(false);
      setSelectedMembers([]);
      setMemberSearch("");
      setMemberResults([]);
    } catch (err) {
      console.error("Failed to add members:", err);
    } finally {
      setSubmittingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!conversation) return;
    try {
      const res = await removeConversationMembersAPI(conversation._id, [memberId]);
      setConversations(conversations.map((c) => (c._id === res.data._id ? res.data : c)));
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversation) return;
    setSubmittingLeave(true);
    try {
      await leaveConversationAPI(conversation._id);
      setConversations(conversations.filter((c) => c._id !== conversation._id));
      useChatStore.getState().setActiveConversation(null);
      onClose?.();
    } catch (err) {
      console.error("Failed to leave group:", err);
    } finally {
      setSubmittingLeave(false);
      setIsLeaveConfirmOpen(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!conversation) return;
    setSubmittingDelete(true);
    try {
      await deleteConversationAPI(conversation._id);
      setConversations(conversations.filter((c) => c._id !== conversation._id));
      useChatStore.getState().setActiveConversation(null);
      onClose?.();
    } catch (err) {
      console.error("Failed to delete group:", err);
    } finally {
      setSubmittingDelete(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const isGroup = conversation?.type !== "direct";
  const adminId = conversation?.admin && typeof conversation.admin === "object" && (conversation.admin as any)._id 
    ? (conversation.admin as any)._id 
    : conversation?.admin;
  const isCurrentUserAdmin = adminId?.toString() === user?._id?.toString();

  const onlineCount = useMemo(() => {
    if (!conversation || !isGroup) return 0;
    return conversation.participants.filter((p: any) => p && onlineUsers.has(p._id?.toString())).length;
  }, [conversation, isGroup, onlineUsers]);

  // Detail for the other user in 1:1 chats
  const otherUser = useMemo(() => {
    if (!conversation || isGroup || !user) return null;
    return conversation.participants?.find((p) => p?._id?.toString() !== user?._id?.toString()) || null;
  }, [conversation, isGroup, user]);

  const directConnection = useMemo(() => {
    if (!otherUser?._id || !user?._id) return null;
    return connections.find((connection: any) => {
      if (connection.status !== "accepted") return false;
      const requesterId = connection.requester?._id?.toString() || connection.requester?.toString();
      const recipientId = connection.recipient?._id?.toString() || connection.recipient?.toString();
      const me = user._id.toString();
      const friend = otherUser._id.toString();
      return (
        (requesterId === me && recipientId === friend) ||
        (requesterId === friend && recipientId === me)
      );
    }) || null;
  }, [connections, otherUser?._id, user?._id]);

  const handleRemoveFriend = async () => {
    if (!directConnection?._id) return;
    setSubmittingRemoveFriend(true);
    try {
      await removeConnectionAPI(directConnection._id);
      setConnections(connections.filter((connection: any) => connection._id !== directConnection._id));
      setIsRemoveFriendConfirmOpen(false);
      setShowActionsDropdown(false);
    } catch (err) {
      console.error("Failed to remove friend:", err);
    } finally {
      setSubmittingRemoveFriend(false);
    }
  };

  const title = isGroup ? conversation?.name : otherUser?.name || "Member";

  const sub = isGroup
    ? `${conversation?.participants?.length || 0} members, ${onlineCount} online`
    : otherUser?._id && onlineUsers.has(otherUser._id.toString())
    ? "Online"
    : "Offline";

  const mediaMessages = useMemo(() => {
    return messages.filter((m) => 
      m.conversationId === activeConversationId && 
      !m.deleted && 
      !(m as any).deletedFor?.some((uId: any) => uId?.toString() === user?._id?.toString()) &&
      (m.media || m.linkPreview || (m.text && m.text.match(/(https?:\/\/[^\s]+)/gi)))
    );
  }, [messages, activeConversationId, user]);

  const totalAttachments = mediaMessages.length;

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => 
      m.conversationId === activeConversationId && 
      conversation?.pinnedMessages?.some((pId: any) => pId?.toString() === m._id?.toString()) &&
      !m.deleted &&
      !(m as any).deletedFor?.some((uId: any) => uId?.toString() === user?._id?.toString())
    );
  }, [messages, activeConversationId, conversation, user]);

  const pinnedCount = conversation?.pinnedMessages?.length || 0;

  if (subView === "media") {
    return (
      <div className="glass-strong h-full w-full rounded-sidebar flex flex-col p-4 overflow-hidden text-left z-20">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <button
            onClick={() => setSubView("main")}
            className="flex items-center gap-1.5 text-xs text-[#3B82F6] hover:underline font-semibold"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">Media & Files</h3>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {mediaMessages.length === 0 ? (
            <p className="text-xs text-[#71717A] italic">No media attachments found.</p>
          ) : (
            mediaMessages.map((m) => {
              const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "";
              const sender = conversation?.participants?.find((p) => p?._id?.toString() === m.senderId?.toString());
              
              if (m.media) {
                const mediaObj = m.media as any;
                const attachmentName = getAttachmentName(mediaObj);
                const isDownloading = downloadingIds.has(m._id);
                const messageIsMine = m.senderId?.toString() === user?._id?.toString();
                return (
                  <div key={m._id} className="p-3 bg-[#111113] border border-[#2A2A30] rounded-card hover:border-white/10 transition">
                    <div className="flex items-start gap-2.5 text-left">
                      {/* Media Type Icon / Thumbnail */}
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                        {mediaObj?.url?.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <img src={mediaObj.url} alt="Attachment" className="w-full h-full object-cover" />
                        ) : (
                          <FileIcon size={16} className="text-[#3B82F6]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p 
                          className="text-xs font-bold text-white truncate hover:underline cursor-pointer text-left" 
                          onClick={() => handleOpenAttachment(m._id, mediaObj)}
                          title={attachmentName}
                        >
                          {attachmentName}
                        </p>
                        <div className="text-[10px] text-[#71717A] mt-1.5 flex justify-between items-center w-full">
                          <span>by {sender?.name || "Member"}</span>
                          <span>{dateStr}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[#71717A] truncate">
                            {formatBytes(mediaObj?.size) || mediaObj?.mimeType || "Attachment"}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenAttachment(m._id, mediaObj)}
                              disabled={isDownloading}
                              className={`text-[10px] font-bold text-white/80 hover:text-white ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              Open
                            </button>
                            {!messageIsMine && (
                              <button
                                onClick={() => handleDownloadAttachment(m._id, mediaObj)}
                                disabled={isDownloading}
                                className={`text-[10px] font-bold text-[#60A5FA] hover:text-[#93C5FD] ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                {isDownloading ? "Loading..." : downloadedFiles[m._id] ? "Save again" : "Download"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Link items
                const linkUrl = m.linkPreview?.url || m.text?.match(/(https?:\/\/[^\s]+)/gi)?.[0] || "";
                const linkTitle = m.linkPreview?.title || linkUrl;
                const linkDesc = m.linkPreview?.description || "Shared web link";
                const linkImage = m.linkPreview?.image;

                return (
                  <div key={m._id} className="p-3 bg-[#111113] border border-[#2A2A30] rounded-card hover:border-white/10 transition">
                    <div className="flex items-start gap-2.5 text-left">
                      <div className="w-10 h-10 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-[#3B82F6]/20">
                        {linkImage ? (
                          <img src={linkImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <FileIcon size={16} className="rotate-45" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p 
                          className="text-xs font-bold text-[#60A5FA] hover:text-[#93C5FD] truncate hover:underline cursor-pointer text-left" 
                          onClick={() => linkUrl && window.open(linkUrl, "_blank")}
                        >
                          {linkTitle}
                        </p>
                        <p className="text-[10px] text-[#A1A1AA] line-clamp-1 leading-tight mt-0.5">{linkDesc}</p>
                        <div className="text-[8px] text-[#71717A] mt-1.5 flex justify-between items-center w-full">
                          <span>by {sender?.name || "Member"}</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
    );
  }

  if (subView === "pinned") {
    return (
      <div className="glass-strong h-full w-full rounded-sidebar flex flex-col p-4 overflow-hidden text-left z-20">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <button
            onClick={() => setSubView("main")}
            className="flex items-center gap-1.5 text-xs text-[#3B82F6] hover:underline font-semibold"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">Pinned</h3>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {pinnedMessages.length === 0 ? (
            <p className="text-xs text-[#71717A] italic">No pinned messages.</p>
          ) : (
            pinnedMessages.map((m) => {
              const sender = conversation?.participants?.find((p) => p?._id?.toString() === m.senderId?.toString());
              return (
                <div key={m._id} className="p-3 bg-[#111113] border border-[#2A2A30] rounded-card hover:border-white/10 transition flex items-start justify-between gap-2.5">
                  <div 
                    className="flex-1 min-w-0 flex items-start gap-2.5 cursor-pointer text-left" 
                    onClick={() => {
                      const el = document.getElementById(`msg-${m._id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.classList.add("bg-[#2563EB]/25");
                        setTimeout(() => el.classList.remove("bg-[#2563EB]/25"), 2000);
                      }
                    }}
                  >
                    <Avatar src={sender?.avatar} name={sender?.name || "Member"} className="w-6 h-6 text-[8px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-white truncate">{sender?.name || "Member"}</p>
                      <p className="text-xs text-[#D4D4D8] mt-0.5 line-clamp-2 break-words text-left">{m.text || "📎 Attachment"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const socket = getSocket();
                      socket?.emit("conversation:pin-message", {
                        conversationId: activeConversationId,
                        messageId: m._id
                      });
                    }}
                    className="p-1 hover:bg-white/5 rounded text-[#71717A] hover:text-red-400 shrink-0 transition"
                    title="Unpin Message"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong h-full w-full rounded-sidebar flex flex-col p-4 overflow-y-auto text-left z-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-sm text-[#71717A] uppercase tracking-wider">Details</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-lg text-[#71717A] hover:text-white transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* AVATAR & NAME COLUMN */}
      <div className="flex flex-col items-center text-center border-b border-white/5 pb-5">
        <Avatar
          src={isGroup ? conversation?.avatar : otherUser?.avatar}
          name={title}
          className="w-20 h-20 shadow-lg mb-3.5"
          online={!isGroup ? Boolean(otherUser?._id && onlineUsers.has(otherUser._id.toString())) : false}
        />
        <h4 className="font-bold text-base text-white truncate max-w-full px-2">{title}</h4>
        {!isGroup && otherUser?.username && (
          <p className="text-xs text-[#A1A1AA] mt-0.5 font-medium">@{otherUser.username}</p>
        )}
        <p className="text-xs text-[#71717A] mt-0.5">{sub}</p>

        {/* COMPACT INTERACTION BUTTONS */}
        <div className="flex gap-2 mt-4 text-gray-400">

          <button
            onClick={() => setSearchOpen(!isSearchOpen)}
            className={`w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-white flex items-center justify-center transition ${isSearchOpen ? "text-[#3B82F6] bg-[#3B82F6]/15" : ""}`}
            title="Search"
          >
            <Search size={14} />
          </button>
          <button
            onClick={() => setSubView("pinned")}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-white flex items-center justify-center transition"
            title="Pinned Messages"
          >
            <Pin size={14} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className={`w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-white flex items-center justify-center transition ${showActionsDropdown ? "text-[#3B82F6] bg-[#3B82F6]/15" : ""}`}
              title="More Options"
            >
              <MoreHorizontal size={14} />
            </button>
            
            {showActionsDropdown && (
              <div className="absolute top-10 right-1 w-42 bg-[#18181B]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                
                
                {isGroup ? (
                  <>
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        setIsLeaveConfirmOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      Leave Group
                    </button>
                    {conversation?.admin?.toString() === user?._id?.toString() && (
                      <button
                        onClick={() => {
                          setShowActionsDropdown(false);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-600/10 rounded-lg transition"
                      >
                        Delete Group
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setIsRemoveFriendConfirmOpen(true);
                    }}
                    disabled={!directConnection}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:text-[#71717A] disabled:hover:bg-transparent rounded-lg transition flex items-center gap-2"
                  >
                    <UserMinus size={13} />
                    Remove Friend
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS LIST SECTIONS */}
      <div className="space-y-2 pt-4 border-b border-white/5 pb-5 text-sm">
        {/* Media attachments */}
        <div 
          onClick={() => setSubView("media")}
          className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg transition"
        >
          <span className="text-[#A1A1AA] flex items-center gap-2.5">
            <Image size={15} className="text-[#71717A]" />
            Media, Links & Files
          </span>
          <span className="text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-full">
            {totalAttachments}
          </span>
        </div>

        {/* Pinned items */}
        <div 
          onClick={() => setSubView("pinned")}
          className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg transition"
        >
          <span className="text-[#A1A1AA] flex items-center gap-2.5">
            <Pin size={15} className="text-[#71717A]" />
            Pinned Messages
          </span>
          <span className="text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-full">
            {pinnedCount}
          </span>
        </div>

      </div>

      {/* MEMBER LIST SECTIONS */}
      <div id="drawer-actions-area" className="pt-4 flex-1 flex flex-col min-h-[160px] overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-xs text-white">
            {isGroup ? "Members" : "Direct Context"}
          </span>
          {isGroup && isCurrentUserAdmin && (
            <button
              onClick={() => setIsAddMembersOpen(true)}
              className="flex items-center gap-1 text-[10px] text-[#3B82F6] hover:underline font-bold"
            >
              <Plus size={10} /> Add Members
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {isGroup ? (
            conversation?.participants?.map((member: any) => {
              const isAdmin = conversation.admin?.toString() === member._id?.toString();
              const isMemberOnline = member?._id && onlineUsers.has(member._id.toString());
              return (
                <div key={member._id} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={member.avatar}
                      name={member.name}
                      className="w-7 h-7"
                      online={Boolean(isMemberOnline)}
                    />
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs text-[#E4E4E7] truncate font-medium">
                        {member.name} {member._id === user?._id && " (You)"}
                      </span>
                      {member.username && (
                        <span className="text-[10px] text-[#71717A] truncate">
                          @{member.username}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <span className="text-[9px] text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#71717A] bg-white/5 px-1.5 py-0.5 rounded font-medium">
                        Member
                      </span>
                    )}

                    {isCurrentUserAdmin && !isAdmin && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="text-[9px] font-bold text-red-400 hover:text-red-300 hover:underline bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 transition shrink-0"
                        title="Remove member from group"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 bg-white/5 border border-white/5 rounded-card text-xs text-gray-400 leading-relaxed">
              Shared media, pinned messages, and chat actions for this direct conversation appear here.
            </div>
          )}
        </div>

        {isGroup && (
          <div className="pt-3.5 border-t border-white/5 mt-3 shrink-0 flex flex-col gap-2">
            <button
              onClick={() => setIsLeaveConfirmOpen(true)}
              className="w-full py-2 bg-[#27272A]/40 hover:bg-[#27272A]/70 text-[#E4E4E7] font-bold text-xs rounded-btn border border-white/5 transition flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Leave Group
            </button>
            {isCurrentUserAdmin && (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold text-xs rounded-btn border border-red-600/25 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Delete {conversation?.type === "channel" ? "Channel" : "Group"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ADD MEMBERS DIALOG MODAL */}
      {isAddMembersOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddMembersOpen(false)}>
          <div className="glass p-5 rounded-modal w-[360px] max-w-full flex flex-col max-h-[80vh] shadow-2xl relative text-left" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsAddMembersOpen(false)}
              className="absolute top-4 right-4 text-[#71717A] hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Add Members</h3>

            <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
              {/* Selected horizontal tags */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto mb-2 bg-[#111113]/50 p-2 rounded-btn border border-[#2A2A30]">
                  {selectedMembers.map((u) => (
                    <span
                      key={u._id}
                      className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 bg-[#2563EB]/20 text-[#60A5FA] text-xs rounded-full border border-[#2563EB]/30"
                    >
                      {u.name.split(" ")[0]}
                      <button
                        onClick={() => setSelectedMembers(selectedMembers.filter((x) => x._id !== u._id))}
                        className="hover:bg-[#2563EB]/30 rounded-full p-0.5"
                      >
                        <X size={8} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-[#71717A]" size={14} />
                <input
                  value={memberSearch}
                  onChange={(e) => handleMemberSearch(e.target.value)}
                  placeholder="Search contacts to add..."
                  className="w-full pl-9 pr-4 py-2 bg-[#111113] border border-[#2A2A30] rounded-btn text-xs text-white outline-none focus:border-[#2563EB] transition"
                />
              </div>

              {/* Search results list */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {memberResults.length === 0 && memberSearch.trim() && (
                  <p className="text-[11px] text-[#71717A] text-center py-4">No matchable users found</p>
                )}
                {memberResults.map((u) => {
                  const isAdded = selectedMembers.some((x) => x._id === u._id);
                  return (
                    <div
                      key={u._id}
                      className="flex items-center gap-3.5 p-2 hover:bg-[#202024] rounded-btn cursor-pointer transition"
                      onClick={() => {
                        if (isAdded) {
                          setSelectedMembers(selectedMembers.filter((x) => x._id !== u._id));
                        } else {
                          setSelectedMembers([...selectedMembers, u]);
                        }
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
                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border ${
                        isAdded ? "bg-[#2563EB] border-[#2563EB] text-white" : "border-white/10"
                      }`}>
                        {isAdded && <Check size={10} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleAddMembersSubmit}
                disabled={selectedMembers.length === 0 || submittingMembers}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] active:bg-[#1D4ED8] disabled:bg-gray-700 disabled:opacity-40 text-white font-bold text-xs rounded-btn transition mt-2"
              >
                {submittingMembers ? "Adding..." : `Add Selected (${selectedMembers.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MEMBER REMOVE CONFIRMATION MODAL */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMemberToRemove(null)}>
          <div className="glass p-5 rounded-modal w-[320px] max-w-full text-center relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white text-sm font-bold mb-2">Remove Member</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mb-5">
              Are you sure you want to remove <span className="text-white font-semibold">@{memberToRemove.username}</span> from the group?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-1.5 rounded-btn bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const mId = memberToRemove._id;
                  setMemberToRemove(null);
                  await handleRemoveMember(mId);
                }}
                className="px-4 py-1.5 rounded-btn bg-red-600 hover:bg-red-500 text-xs text-white font-bold transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT CHAT REMOVE FRIEND CONFIRMATION */}
      {isRemoveFriendConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsRemoveFriendConfirmOpen(false)}>
          <div className="glass p-5 rounded-modal w-[320px] max-w-full text-center relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <UserMinus size={18} />
            </div>
            <h4 className="text-white text-sm font-bold mb-2">Remove Friend</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mb-5">
              Remove <span className="text-white font-semibold">{otherUser?.name || "this friend"}</span> from your friends? You can keep the chat history, but new direct messages require connecting again.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsRemoveFriendConfirmOpen(false)}
                className="px-4 py-1.5 rounded-btn bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
                disabled={submittingRemoveFriend}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveFriend}
                className="px-4 py-1.5 rounded-btn bg-red-600 hover:bg-red-500 text-xs text-white font-bold transition flex items-center gap-1.5"
                disabled={submittingRemoveFriend || !directConnection}
              >
                {submittingRemoveFriend ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. LEAVE GROUP CONFIRMATION MODAL */}
      {isLeaveConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsLeaveConfirmOpen(false)}>
          <div className="glass p-5 rounded-modal w-[320px] max-w-full text-center relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white text-sm font-bold mb-2">Leave Group</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mb-5">
              Are you sure you want to leave <span className="text-white font-semibold">{conversation?.name}</span>? 
              {isCurrentUserAdmin && (conversation?.participants?.length || 0) > 1 && (
                <span className="block mt-2 text-[#F59E0B] font-medium">
                  ⚠️ Note: Since you are the admin, the admin role will automatically be assigned to another member.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsLeaveConfirmOpen(false)}
                className="px-4 py-1.5 rounded-btn bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
                disabled={submittingLeave}
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-1.5 rounded-btn bg-red-600 hover:bg-red-500 text-xs text-white font-bold transition flex items-center gap-1.5"
                disabled={submittingLeave}
              >
                {submittingLeave ? "Leaving..." : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. DELETE GROUP CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsDeleteConfirmOpen(false)}>
          <div className="glass p-5 rounded-modal w-[320px] max-w-full text-center relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white text-sm font-bold mb-2">Delete {conversation?.type === "channel" ? "Channel" : "Group"}</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mb-5">
              Are you sure you want to delete <span className="text-white font-semibold">{conversation?.name}</span>? This action is permanent and will delete all messages for all participants.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-1.5 rounded-btn bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
                disabled={submittingDelete}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-1.5 rounded-btn bg-red-600 hover:bg-red-500 text-xs text-white font-bold transition flex items-center gap-1.5"
                disabled={submittingDelete}
              >
                {submittingDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoDrawer;

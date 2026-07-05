import { useState, useRef, useEffect } from "react";
import { getSocket } from "../../services/socket";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { uploadFileAPI } from "../../services/api";
import { Paperclip, Smile, Send, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  
  // Custom attachment files
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Panels triggers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close input emoji picker on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".input-emoji-trigger-btn")
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Store variables
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const user = useAuthStore((s) => s.user);
  const replyToMessage = useChatStore((s) => s.replyToMessage);
  const setReplyToMessage = useChatStore((s) => s.setReplyToMessage);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);

  const currentConv = conversations.find((c) => c._id === activeConversationId);
  const isGroup = currentConv?.type !== "direct";

  const receiver = !isGroup
    ? currentConv?.participants?.find((p: any) => p._id?.toString() !== user?._id?.toString())
    : null;

  const socket = getSocket();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // Send message flow
  const sendMessage = async () => {
    if (!socket || !activeConversationId) return;
    if (!text.trim() && !selectedFile) return;

    const tempId = `temp-${Date.now()}`;
    const messageText = text.trim();
    const activeFile = selectedFile;

    // Reset composer states immediately for snappy feedback
    setText("");
    setSelectedFile(null);
    setPreview(null);
    setShowEmojiPicker(false);
    setReplyToMessage(null);

    let media: any = null;

    if (activeFile) {
      // 1. Initial local media block with ObjectURL preview
      media = {
        url: preview || "",
        name: activeFile.name,
        size: activeFile.size,
        mimeType: activeFile.type || "application/octet-stream",
        type: activeFile.type.startsWith("image")
          ? ("image" as const)
          : activeFile.type.startsWith("video")
          ? ("video" as const)
          : ("file" as const),
      };

      // 2. Optimistic local message insertion into client store
      const tempMsg = {
        _id: tempId,
        conversationId: activeConversationId,
        senderId: user?._id || "",
        text: messageText,
        media,
        createdAt: new Date().toISOString(),
        status: "sending",
        uploadProgress: 0,
        replyTo: replyToMessage ? (replyToMessage as any) : null,
      };
      
      addMessage(tempMsg);

      // 3. Perform network upload with progress indicators
      const formData = new FormData();
      formData.append("file", activeFile);

      try {
        const upload = await uploadFileAPI(formData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          
          // Update the temporary message progress state
          updateMessage({
            _id: tempId,
            uploadProgress: percentCompleted,
          });
        });

        // Set the uploaded permanent Cloudinary secure URL
        media = {
          url: upload.data.url,
          name: upload.data.name || activeFile.name,
          size: upload.data.size || activeFile.size,
          mimeType: upload.data.mimeType || activeFile.type || "application/octet-stream",
          downloadUrl: upload.data.downloadUrl || upload.data.url,
          type: activeFile.type.startsWith("image")
            ? ("image" as const)
            : activeFile.type.startsWith("video")
            ? ("video" as const)
            : ("file" as const),
        };
      } catch (err) {
        console.error("File upload failed:", err);
        // Mark as failed
        updateMessage({
          _id: tempId,
          status: "failed",
          uploadProgress: undefined,
        });
        return;
      }
    }

    // 4. Send message details via socket containing tempId
    socket.emit("message:send", {
      conversationId: activeConversationId,
      receiverId: isGroup ? null : receiver?._id,
      text: messageText,
      media,
      replyToId: replyToMessage?._id || null,
      tempId,
    });
  };

  return (
    <div className="relative border-t border-white/5 bg-white/[0.01] backdrop-blur-md px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex flex-col gap-2 z-20">
      
      {/* 1. QUOTED REPLY PREVIEW ROW */}
      {replyToMessage && (
        <div className="flex items-center justify-between p-2.5 bg-[#2563EB]/10 border-l-2 border-[#2563EB] rounded-btn mb-1 text-left text-xs">
          <div className="min-w-0">
            <p className="font-bold text-[#60A5FA] text-[10px] uppercase">Replying to message</p>
            <p className="text-[#D4D4D8] truncate mt-0.5">{replyToMessage.text || "📎 Media attachment"}</p>
          </div>
          <button
            onClick={() => setReplyToMessage(null)}
            className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. EMOJI SELECTOR PANEL */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef} 
          className="absolute bottom-[72px] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 z-50 shadow-2xl w-[92vw] max-w-[350px] md:w-[350px]"
          style={{ isolation: "isolate", contain: "content" }}
        >
          <EmojiPicker 
            onEmojiClick={handleEmojiClick} 
            theme={Theme.DARK} 
            width="100%"
            height={350}
          />
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center justify-between p-2 bg-[#111113] border border-[#2A2A30] rounded-btn w-fit gap-3 mb-1">
          {preview ? (
            <img src={preview} className="w-12 h-12 rounded-lg object-cover border border-white/10" alt="Preview" />
          ) : (
            <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
              📎 {selectedFile.name.slice(0, 20)}...
            </div>
          )}
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreview(null);
            }}
            className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 text-xs flex items-center justify-center transition"
          >
            ×
          </button>
        </div>
      )}

      {/* INPUT ACTIONS BAR */}
      <div className="flex items-center gap-3">
        {/* Hidden File Input */}
        <input
          ref={fileRef}
          hidden
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
          }}
        />

        {/* Rounded Input container */}
        <div className="flex-1 bg-[#111113] border border-[#2A2A30] rounded-full flex items-center px-4 py-1.5 transition-all duration-150 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]/30">
          <input
            value={text}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setText(e.target.value);
              if (!socket) return;

              if (!isTypingRef.current) {
                isTypingRef.current = true;
                socket.emit("typing:start", {
                  conversationId: activeConversationId,
                  to: isGroup ? null : receiver?._id,
                });
              }

              clearTimeout(typingTimeoutRef.current!);

              typingTimeoutRef.current = setTimeout(() => {
                isTypingRef.current = false;
                socket.emit("typing:stop", {
                  conversationId: activeConversationId,
                  to: isGroup ? null : receiver?._id,
                });
              }, 1500);
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-white placeholder-[#71717A] text-xs md:text-sm outline-none border-none py-1 px-1"
          />

          {/* Action icon buttons inside input container */}
          <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 hover:text-white transition input-emoji-trigger-btn"
              title="Emojis"
            >
              <Smile size={16} />
            </button>
            
            <button
              onClick={() => fileRef.current?.click()}
              className="p-1 hover:text-white transition"
              title="Attach File"
            >
              <Paperclip size={16} />
            </button>
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={sendMessage}
          className="w-9 h-9 rounded-full btn-gradient flex items-center justify-center text-white transition shrink-0 shadow-lg"
          title="Send"
        >
          <Send size={15} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;

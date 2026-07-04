import { Message } from "../models/Message.js";
import { Conversation } from "../models/Conversation.js";
import { Connection } from "../models/Connection.js";
import { onlineUsers } from "./socketManager.js";

// Helper function to extract metadata from a URL for previewing
const extractMetadata = async (url: string) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    });

    clearTimeout(timeout);
    const html = await res.text();

    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i) ||
                       html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:title["']/i) ||
                       html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";

    const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i) ||
                      html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:description["']/i) ||
                      html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    const description = descMatch ? descMatch[1] : "";

    const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i) ||
                     html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["']/i);
    const image = imgMatch ? imgMatch[1] : "";

    if (!title && !description) return null;

    return { title, description, image, url };
  } catch (err) {
    console.error("Failed to extract metadata for:", url);
    return null;
  }
};

export const handleSendMessage = async (io: any, socket: any, data: any) => {
  const { conversationId, text, receiverId, media, replyToId, forwarded, disappearingDuration, tempId } = data;
  const senderId = socket.data.userId;

  // 1. Fetch conversation details to get type and participants list
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return;

  // Channel admin-only check
  const isChannelOrCommunity = conversation.type === "channel" || conversation.type === "community";
  if (isChannelOrCommunity && conversation.onlyAdminsCanPost) {
    const isAdmin = conversation.admin?.toString() === senderId.toString();
    if (!isAdmin) {
      socket.emit("message:error", { message: "Only administrators can send messages to this channel" });
      return;
    }
  }

  // Connection check for direct messages
  if (conversation.type === "direct") {
    const otherParticipant = conversation.participants.find(
      (p: any) => p.toString() !== senderId.toString()
    );
    if (otherParticipant) {
      const connection = await Connection.findOne({
        status: "accepted",
        $or: [
          { requester: senderId, recipient: otherParticipant },
          { requester: otherParticipant, recipient: senderId }
        ]
      });
      if (!connection) {
        socket.emit("message:error", { message: "You must be friends with this user to send messages." });
        return;
      }
    }
  }

  const isGroup = conversation.type === "group" || isChannelOrCommunity;

  // Determine initial status: direct message is delivered immediately if recipient is online
  let initialStatus = "sent";
  if (!isGroup && receiverId) {
    const isOnline = onlineUsers.has(receiverId.toString());
    if (isOnline) {
      initialStatus = "delivered";
    }
  }

  // Calculate TTL if disappearing messages is enabled
  let expiresAt = undefined;
  const dispDuration = disappearingDuration || conversation.disappearingDuration;
  if (dispDuration && dispDuration > 0) {
    expiresAt = new Date(Date.now() + dispDuration * 1000);
  }

  // Extract link preview if text has links
  let linkPreview = undefined;
  if (text) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const match = text.match(urlRegex);
    if (match && match.length > 0) {
      const url = match[0];
      const preview = await extractMetadata(url);
      if (preview) {
        linkPreview = preview;
      }
    }
  }

  // 2. Create the message in database
  let message: any = await Message.create({
    conversationId,
    senderId,
    text,
    media,
    status: initialStatus,
    replyTo: replyToId || undefined,
    forwarded: !!forwarded,
    expiresAt,
    linkPreview
  } as any);

  // Populate replyTo details if present
  if (message.replyTo) {
    message = await message.populate("replyTo");
  }

  // 3. Update the conversation record
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    updatedAt: new Date()
  });

  // 4. Broadcast to participants
  const messageData = message.toObject ? message.toObject() : message;
  if (tempId) {
    messageData.tempId = tempId;
  }

  if (isGroup) {
    conversation.participants.forEach((pId: any) => {
      if (!pId) return;
      // Broadcast to everyone else
      io.to(pId.toString()).emit("message:new", messageData);
    });
  } else {
    // Send to sender & receiver
    io.to(senderId.toString()).emit("message:new", messageData);
    if (receiverId) {
      io.to(receiverId.toString()).emit("message:new", messageData);
    }
  }
};
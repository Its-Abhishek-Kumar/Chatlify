import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Connection } from "../models/Connection.js";
import { io } from "../server.js";

// Safe ObjectId string extractor supporting populated models, raw ObjectIds, and strings
const getObjectIdStr = (val: any): string => {
  if (!val) return "";
  if (typeof val === "object" && val._id) {
    return val._id.toString();
  }
  return val.toString();
};

// Helper function to find or create a direct conversation
const findOrCreateDirectConversation = async (
  currentUserId: string,
  userId: string,
) => {
  // Check if they are connected
  const connection = await Connection.findOne({
    status: "accepted",
    $or: [
      { requester: currentUserId, recipient: userId },
      { requester: userId, recipient: currentUserId }
    ]
  });
  if (!connection) {
    throw new Error("You must be connected to this user to start a conversation.");
  }

  let conversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: [currentUserId, userId] },
  }).populate("participants", "username name email lastSeen isOnline avatar");

  if (!conversation) {
    conversation = await Conversation.create({
      type: "direct",
      participants: [currentUserId, userId],
    });

    await conversation.populate("participants", "username name email lastSeen isOnline avatar");
  }

  return conversation;
};

// Retrieve active conversations list for user with persistent unread counts
export const getUserConversations = async (req: any, res: any) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.query; // optional

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : null;

    // If a specific user is provided, ensure conversation exists
    if (userId) {
      await findOrCreateDirectConversation(currentUserId, userId);
    }

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "username name email lastSeen isOnline avatar")
      .sort({ updatedAt: -1 });

    // Dynamic unread count calculation and lastMessage check
    const mapped = await Promise.all(
      conversations.map(async (conv: any) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: currentUserId },
          readBy: { $ne: currentUserId }
        });

        // Find the actual last message not deleted for this user
        const actualLastMessage = await Message.findOne({
          conversationId: conv._id,
          deleted: { $ne: true },
          deletedFor: currentUserIdObj ? { $nin: [currentUserIdObj] } : { $exists: true }
        } as any)
          .sort({ createdAt: -1 })
          .populate("replyTo")
          .populate({
            path: "reactions.userId",
            select: "name username avatar isOnline"
          });

        // Filter pinnedMessages to exclude any messages deleted for this user or everyone
        const nonDeletedPinnedMessageIds = await Message.find({
          _id: { $in: conv.pinnedMessages || [] },
          deleted: { $ne: true },
          deletedFor: currentUserIdObj ? { $nin: [currentUserIdObj] } : { $exists: true }
        } as any).distinct("_id");

        const convObj = conv.toObject();
        convObj.participants = (convObj.participants || []).filter((p: any) => p != null);
        convObj.unreadCount = unreadCount;
        convObj.lastMessage = actualLastMessage;
        convObj.pinnedMessages = nonDeletedPinnedMessageIds;
        return convObj;
      })
    );

    res.json(mapped);
  } catch (err: any) {
    console.error("Failed to retrieve conversations:", err);
    res.status(500).json({ message: "Failed to retrieve conversations", error: err.message });
  }
};

export const createOrGetConversation = async (req: any, res: any) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.userId;

    const conversation = await findOrCreateDirectConversation(
      currentUserId,
      userId,
    );

    res.json(conversation);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create or retrieve conversation", error: err.message });
  }
};

export const createGroupConversation = async (req: any, res: any) => {
  try {
    const { name, participantIds, avatar, type, onlyAdminsCanPost, communityId } = req.body;
    const currentUserId = req.userId;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Make sure admin is included in participants
    const uniqueParticipants = Array.from(
      new Set([currentUserId, ...(participantIds || [])])
    );

    const conversation = await Conversation.create({
      type: type || "group",
      name,
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      participants: uniqueParticipants,
      admin: currentUserId,
      onlyAdminsCanPost: !!onlyAdminsCanPost,
      communityId: communityId || undefined
    });

    await conversation.populate("participants", "username name email mobileNumber lastSeen isOnline avatar");

    res.json(conversation);
  } catch (err: any) {
    console.error("Failed to create conversation:", err);
    res.status(500).json({ message: "Failed to create conversation", error: err.message });
  }
};

// Add members to conversation (restricted to Group Admin)
export const addConversationMembers = async (req: any, res: any) => {
  try {
    const { conversationId, participantIds } = req.body;
    const currentUserId = req.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Enforce WhatsApp group admin permissions
    if (conversation.type !== "direct") {
      if (!conversation.admin || conversation.admin.toString() !== currentUserId.toString()) {
        return res.status(403).json({ message: "Only the group admin can add members" });
      }
    } else {
      if (!conversation.participants.map((p) => p.toString()).includes(currentUserId.toString())) {
        return res.status(403).json({ message: "You are not a member of this conversation" });
      }
    }

    const newParticipants = Array.from(
      new Set([...conversation.participants.map((p) => p.toString()), ...(participantIds || [])])
    );

    conversation.participants = newParticipants as any;
    await conversation.save();
    
    await conversation.populate("participants", "username name email mobileNumber lastSeen isOnline avatar");

    res.json(conversation);
  } catch (err: any) {
    console.error("Failed to add members:", err);
    res.status(500).json({ message: "Failed to add members", error: err.message });
  }
};

// Remove members from conversation (restricted to Group Admin)
export const removeConversationMembers = async (req: any, res: any) => {
  try {
    const { conversationId, participantIds } = req.body;
    const currentUserId = req.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Enforce WhatsApp group admin permissions
    if (conversation.type !== "direct") {
      if (!conversation.admin || conversation.admin.toString() !== currentUserId.toString()) {
        return res.status(403).json({ message: "Only the group admin can remove members" });
      }
    } else {
      return res.status(400).json({ message: "Cannot remove members from a direct conversation" });
    }

    const toRemove = new Set(participantIds || []);
    const newParticipants = conversation.participants.filter(
      (p) => !toRemove.has(p.toString())
    );

    // Keep admin in participants list
    if (!newParticipants.map((p) => p.toString()).includes(conversation.admin.toString())) {
      newParticipants.push(conversation.admin);
    }

    conversation.participants = newParticipants as any;
    await conversation.save();
    
    await conversation.populate("participants", "username name email mobileNumber lastSeen isOnline avatar");

    res.json(conversation);
  } catch (err: any) {
    console.error("Failed to remove members:", err);
    res.status(500).json({ message: "Failed to remove members", error: err.message });
  }
};

// Leave a group conversation (automatically auto-promotes another participant to admin if leaving user was admin)
export const leaveConversation = async (req: any, res: any) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type === "direct") {
      return res.status(400).json({ message: "Cannot leave a direct conversation" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some((p: any) => {
      return getObjectIdStr(p) === getObjectIdStr(currentUserId);
    });
    if (!isParticipant) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    // Filter out leaving user
    const newParticipants = conversation.participants.filter((p: any) => {
      return getObjectIdStr(p) !== getObjectIdStr(currentUserId);
    });

    // If leaving user is the admin, promote another member if any exist
    if (conversation.admin && getObjectIdStr(conversation.admin) === getObjectIdStr(currentUserId)) {
      if (newParticipants.length > 0) {
        // Auto-promote the first remaining participant to admin
        conversation.admin = getObjectIdStr(newParticipants[0]) as any;
      } else {
        // No members left, clear admin
        conversation.admin = null as any;
      }
    }

    conversation.participants = newParticipants as any;
    await conversation.save();
    
    await conversation.populate("participants", "username name email mobileNumber lastSeen isOnline avatar");

    res.json(conversation);
  } catch (err: any) {
    console.error("Failed to leave group:", err);
    res.status(500).json({ message: "Failed to leave group", error: err.message });
  }
};

// Complete Group/Channel/Community deletion (restricted to Group Admin)
export const deleteConversation = async (req: any, res: any) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type === "direct") {
      return res.status(400).json({ message: "Cannot delete a direct conversation" });
    }

    // Verify current user is admin
    const adminIdStr = getObjectIdStr(conversation.admin);
    const userIdStr = getObjectIdStr(currentUserId);

    if (!adminIdStr || adminIdStr !== userIdStr) {
      return res.status(403).json({ message: "Only the administrator can delete this group/channel" });
    }

    // Capture participants list before deletion to broadcast
    const participantsList = conversation.participants || [];

    // Delete conversation and messages
    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({ conversationId });

    // Notify participants in real-time
    participantsList.forEach((p: any) => {
      const pIdStr = getObjectIdStr(p);
      if (pIdStr) {
        io.to(pIdStr).emit("conversation:deleted", { conversationId });
      }
    });

    res.json({ message: "Group deleted successfully", conversationId });
  } catch (err: any) {
    console.error("Failed to delete group:", err);
    res.status(500).json({ message: "Failed to delete group", error: err.message });
  }
};

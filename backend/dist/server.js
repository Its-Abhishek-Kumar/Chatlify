import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
import { connectDB } from "./db/db.js";
import { handleSendMessage } from "./sockets/messageHandler.js";
import { onlineUsers, setUserOnline, setUserOffline, } from "./sockets/socketManager.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import { Message } from "./models/Message.js";
import { User } from "./models/User.js";
import { Conversation } from "./models/Conversation.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/connections", connectionRoutes);
const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
connectDB();
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token)
        return next(new Error("Unauthorized"));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = decoded.userId;
        next();
    }
    catch {
        next(new Error("Invalid token"));
    }
});
// io.use((socket, next) => {
//   const userId = socket.handshake.auth.userId;
//   if (!userId) {
//     return next(new Error("Unauthorized"));
//   }
//   // attach userId to socket
//   socket.data.userId = userId;
//   next();
// });
// Socket entry point
io.on("connection", async (socket) => {
    const userId = socket.data.userId;
    // Join the user's personal room for direct event targeting (multi-device friendly)
    socket.join(userId.toString());
    const wasOffline = !onlineUsers.has(userId);
    setUserOnline(userId);
    if (wasOffline) {
        await User.findByIdAndUpdate(userId, {
            isOnline: true,
        });
        io.emit("presence:update", {
            userId,
            status: "online",
        });
    }
    // ✅ OFFLINE MESSAGE DELIVERY SYNC
    // When a user connects, mark all "sent" messages directed to them as "delivered" and notify senders
    try {
        const directConversations = await Conversation.find({
            type: "direct",
            participants: userId
        });
        const directConvIds = directConversations.map((c) => c._id);
        const offlineMessages = await Message.find({
            conversationId: { $in: directConvIds },
            senderId: { $ne: userId },
            status: "sent"
        });
        if (offlineMessages.length > 0) {
            const msgIds = offlineMessages.map((m) => m._id);
            await Message.updateMany({ _id: { $in: msgIds } }, { status: "delivered" });
            // Notify senders about delivery status updates
            const senders = new Set(offlineMessages.map((m) => m.senderId?.toString() || ""));
            senders.forEach(senderId => {
                if (!senderId)
                    return;
                const senderMsgs = offlineMessages.filter((m) => m.senderId?.toString() === senderId);
                senderMsgs.forEach((msg) => {
                    io.to(senderId).emit("message:delivered", { messageId: msg._id });
                });
            });
        }
    }
    catch (err) {
        console.error("Failed to sync offline messages:", err);
    }
    socket.emit("presence:init", {
        users: Array.from(onlineUsers.keys()),
    });
    socket.on("typing:start", async ({ conversationId, to }) => {
        try {
            if (to) {
                io.to(to).emit("typing:start", {
                    from: socket.data.userId,
                    conversationId,
                });
            }
            else if (conversationId) {
                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    conversation.participants.forEach((pId) => {
                        if (!pId)
                            return;
                        if (pId.toString() !== socket.data.userId.toString()) {
                            io.to(pId.toString()).emit("typing:start", {
                                from: socket.data.userId,
                                conversationId,
                            });
                        }
                    });
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    });
    socket.on("typing:stop", async ({ conversationId, to }) => {
        try {
            if (to) {
                io.to(to).emit("typing:stop", {
                    from: socket.data.userId,
                    conversationId,
                });
            }
            else if (conversationId) {
                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    conversation.participants.forEach((pId) => {
                        if (!pId)
                            return;
                        if (pId.toString() !== socket.data.userId.toString()) {
                            io.to(pId.toString()).emit("typing:stop", {
                                from: socket.data.userId,
                                conversationId,
                            });
                        }
                    });
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    });
    // ✅ OPTIMIZED READ RECEIPT EVENT (BULK)
    socket.on("conversation:read", async ({ conversationId }) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation)
                return;
            // Add user to readBy array for all messages in the conversation sent by others
            await Message.updateMany({ conversationId, senderId: { $ne: userId } }, { $addToSet: { readBy: userId } });
            if (conversation.type === "direct") {
                await Message.updateMany({ conversationId, senderId: { $ne: userId }, status: { $ne: "seen" } }, { status: "seen" });
                const otherParticipant = conversation.participants.find((p) => p.toString() !== userId.toString());
                if (otherParticipant) {
                    io.to(otherParticipant.toString()).emit("conversation:read", { conversationId });
                }
            }
            else {
                // Group chat: mark status as "seen" if all other participants have read it
                const participantCount = conversation.participants.length;
                await Message.updateMany({
                    conversationId,
                    senderId: { $ne: userId },
                    status: { $ne: "seen" },
                    [`readBy.${participantCount - 2}`]: { $exists: true }
                }, { status: "seen" });
                conversation.participants.forEach((pId) => {
                    if (!pId)
                        return;
                    if (pId.toString() !== userId.toString()) {
                        io.to(pId.toString()).emit("conversation:read", { conversationId, readerId: userId });
                    }
                });
            }
        }
        catch (err) {
            console.error("Failed to mark conversation read:", err);
        }
    });
    // Backward compatibility fallback for single message read
    socket.on("message:read", async ({ messageId, to }) => {
        try {
            await Message.findByIdAndUpdate(messageId, {
                status: "seen",
                $addToSet: { readBy: userId }
            });
            io.to(to).emit("message:read", { messageId });
        }
        catch (err) {
            console.error(err);
        }
    });
    socket.on("message:react", async ({ messageId, emoji }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message)
                return;
            const conversation = await Conversation.findById(message.conversationId);
            if (!conversation)
                return;
            const existingReaction = message.reactions.find((r) => r.userId.toString() === userId.toString());
            if (existingReaction?.emoji === emoji) {
                message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId.toString());
            }
            else if (existingReaction) {
                existingReaction.emoji = emoji;
                existingReaction.reactedAt = new Date();
            }
            else {
                message.reactions.push({ userId, emoji });
            }
            await message.save();
            await message.populate({
                path: "reactions.userId",
                select: "name username avatar isOnline"
            });
            const payload = {
                messageId,
                reactions: message.reactions,
            };
            // Broadcast reaction to all conversation participants
            conversation.participants.forEach((pId) => {
                if (!pId)
                    return;
                io.to(pId.toString()).emit("message:reaction", payload);
            });
        }
        catch (err) {
            console.error(err);
        }
    });
    socket.on("message:edit", async ({ messageId, text }) => {
        try {
            const message = await Message.findByIdAndUpdate(messageId, { text, edited: true }, { new: true });
            if (!message)
                return;
            const conversation = await Conversation.findById(message.conversationId);
            if (!conversation)
                return;
            conversation.participants.forEach((pId) => {
                if (!pId)
                    return;
                io.to(pId.toString()).emit("message:updated", message);
            });
        }
        catch (err) {
            console.error(err);
        }
    });
    socket.on("message:delete", async ({ messageId, deleteFor = "everyone" }) => {
        try {
            console.log("DEBUG [message:delete]:", { messageId, deleteFor, userId });
            if (deleteFor === "everyone") {
                const message = await Message.findByIdAndUpdate(messageId, { deleted: true, text: "", reactions: [] }, { new: true });
                if (!message)
                    return;
                // Find the actual latest non-deleted message in the conversation
                const newLastMsg = await Message.findOne({
                    conversationId: message.conversationId,
                    deleted: { $ne: true }
                }).sort({ createdAt: -1 });
                const conversation = await Conversation.findByIdAndUpdate(message.conversationId, {
                    $pull: { pinnedMessages: message._id },
                    lastMessage: newLastMsg ? newLastMsg._id : null
                }, { new: true })
                    .populate("participants", "username name email mobileNumber lastSeen isOnline avatar")
                    .populate("lastMessage");
                if (!conversation)
                    return;
                for (const p of conversation.participants) {
                    if (!p)
                        continue;
                    const pId = p._id?.toString() || p.toString();
                    const pLastMsg = await Message.findOne({
                        conversationId: conversation._id,
                        deleted: { $ne: true },
                        deletedFor: { $nin: [new mongoose.Types.ObjectId(pId)] }
                    })
                        .sort({ createdAt: -1 })
                        .populate("replyTo")
                        .populate({
                        path: "reactions.userId",
                        select: "name username avatar isOnline"
                    });
                    const pPinnedIds = await Message.find({
                        _id: { $in: conversation.pinnedMessages || [] },
                        deleted: { $ne: true },
                        deletedFor: { $nin: [new mongoose.Types.ObjectId(pId)] }
                    }).distinct("_id");
                    const convObj = conversation.toObject();
                    convObj.participants = (convObj.participants || []).filter((pEl) => pEl != null);
                    convObj.lastMessage = pLastMsg;
                    convObj.pinnedMessages = pPinnedIds;
                    io.to(pId).emit("message:deleted", message);
                    io.to(pId).emit("conversation:updated", convObj);
                }
            }
            else {
                // delete for me
                const message = await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: new mongoose.Types.ObjectId(userId) } }, { new: true });
                if (!message)
                    return;
                // Fetch the new actual last message for this user
                const newLastMsg = await Message.findOne({
                    conversationId: message.conversationId,
                    deletedFor: { $nin: [new mongoose.Types.ObjectId(userId)] }
                })
                    .sort({ createdAt: -1 })
                    .populate("replyTo")
                    .populate({
                    path: "reactions.userId",
                    select: "name username avatar isOnline"
                });
                socket.emit("message:deleted_for_me", {
                    messageId,
                    conversationId: message.conversationId,
                    newLastMessage: newLastMsg
                });
            }
        }
        catch (err) {
            console.error(err);
        }
    });
    // Handle sending message
    socket.on("message:send", (data) => {
        handleSendMessage(io, socket, data);
    });
    // Conversation Message Pinning
    socket.on("conversation:pin-message", async ({ conversationId, messageId }) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation)
                return;
            const idx = conversation.pinnedMessages.indexOf(messageId);
            if (idx > -1) {
                // Unpin
                conversation.pinnedMessages.splice(idx, 1);
            }
            else {
                // Pin
                conversation.pinnedMessages.push(messageId);
            }
            await conversation.save();
            const updated = await Conversation.findById(conversationId).populate("participants", "username name email mobileNumber lastSeen isOnline avatar");
            conversation.participants.forEach((pId) => {
                if (!pId)
                    return;
                io.to(pId.toString()).emit("conversation:updated", updated);
            });
        }
        catch (err) {
            console.error("Message pin error:", err);
        }
    });
    // Handle disconnect
    socket.on("disconnect", async () => {
        setUserOffline(userId);
        setTimeout(async () => {
            if (!onlineUsers.has(userId)) {
                const lastSeen = new Date();
                await User.findByIdAndUpdate(userId, {
                    lastSeen,
                    isOnline: false,
                });
                io.emit("presence:update", {
                    userId,
                    status: "offline",
                    lastSeen,
                });
            }
        }, 3000); // wait 3 sec before declaring offline
    });
});
// Start server
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "127.0.0.1";
server.listen(Number(PORT), HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
//# sourceMappingURL=server.js.map
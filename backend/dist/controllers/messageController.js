import mongoose from "mongoose";
import { Message } from "../models/Message.js";
export const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const query = {
        conversationId,
        deletedFor: { $nin: [new mongoose.Types.ObjectId(req.userId)] }
    };
    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }
    const messages = await Message.find(query)
        .populate("replyTo")
        .populate({
        path: "reactions.userId",
        select: "name username avatar isOnline"
    })
        .sort({ createdAt: -1 })
        .limit(Number(limit));
    res.json(messages.reverse()); // oldest → newest
};
export const clearChat = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.userId;
    try {
        await Message.updateMany({ conversationId: new mongoose.Types.ObjectId(conversationId) }, { $addToSet: { deletedFor: new mongoose.Types.ObjectId(userId) } });
        res.json({ success: true, message: "Chat history cleared successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to clear chat history" });
    }
};
//# sourceMappingURL=messageController.js.map
import { CallHistory } from "../models/CallHistory.js";
import { Conversation } from "../models/Conversation.js";
// Fetch call history logs
export const getCallHistory = async (req, res) => {
    try {
        const userId = req.userId;
        // Find conversations the user is in
        const conversations = await Conversation.find({ participants: userId });
        const conversationIds = conversations.map((c) => c._id);
        const logs = await CallHistory.find({ conversationId: { $in: conversationIds } })
            .populate("callerId", "name username avatar")
            .populate("conversationId", "name avatar type participants")
            .sort({ createdAt: -1 })
            .limit(30);
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to retrieve call history", error: err.message });
    }
};
// Create a new call history log entry
export const createCallHistory = async (req, res) => {
    try {
        const { conversationId, type, status, duration } = req.body;
        const userId = req.userId;
        const log = await CallHistory.create({
            conversationId,
            callerId: userId,
            type,
            status,
            duration
        });
        const populated = await log.populate([
            { path: "callerId", select: "name username avatar" },
            { path: "conversationId", select: "name avatar type participants" }
        ]);
        res.json(populated);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to record call log", error: err.message });
    }
};
//# sourceMappingURL=callController.js.map
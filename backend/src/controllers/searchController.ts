import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";

export const performGlobalSearch = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { q, type, date } = req.query;

    const queryStr = q ? q.toString().trim() : "";
    const filterType = type ? type.toString() : "all"; // all, message, user, media, file

    // 1. Fetch conversations the user is part of
    const userConversations = await Conversation.find({ participants: userId });
    const conversationIds = userConversations.map((c) => c._id);

    const results: any = {
      messages: [],
      users: [],
      media: [],
      files: []
    };

    // Filter by date if specified
    const dateFilter: any = {};
    if (date) {
      const parsedDate = new Date(date.toString());
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
        dateFilter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // A. USER SEARCH (Search matching usernames or names globally)
    if ((filterType === "all" || filterType === "user") && queryStr) {
      const users = await User.find({
        _id: { $ne: userId },
        $or: [
          { name: { $regex: queryStr, $options: "i" } },
          { username: { $regex: queryStr, $options: "i" } }
        ]
      }).limit(15);
      results.users = users;
    }

    // B. MESSAGE TEXT SEARCH
    if ((filterType === "all" || filterType === "message") && queryStr) {
      const messages = await Message.find({
        conversationId: { $in: conversationIds },
        text: { $regex: queryStr, $options: "i" },
        deleted: false,
        ...dateFilter
      })
        .populate("senderId", "name username avatar")
        .sort({ createdAt: -1 })
        .limit(30);
      results.messages = messages;
    }

    // C. MEDIA SEARCH (images/videos)
    if (filterType === "all" || filterType === "media") {
      const mediaQuery: any = {
        conversationId: { $in: conversationIds },
        "media.type": { $in: ["image", "video"] },
        ...dateFilter
      };
      if (queryStr) {
        mediaQuery.text = { $regex: queryStr, $options: "i" };
      }
      const mediaMessages = await Message.find(mediaQuery)
        .populate("senderId", "name username avatar")
        .sort({ createdAt: -1 })
        .limit(20);
      results.media = mediaMessages;
    }

    // D. FILE SEARCH
    if (filterType === "all" || filterType === "file") {
      const fileQuery: any = {
        conversationId: { $in: conversationIds },
        "media.type": "file",
        ...dateFilter
      };
      if (queryStr) {
        fileQuery.text = { $regex: queryStr, $options: "i" };
      }
      const fileMessages = await Message.find(fileQuery)
        .populate("senderId", "name username avatar")
        .sort({ createdAt: -1 })
        .limit(20);
      results.files = fileMessages;
    }

    res.json(results);
  } catch (err: any) {
    console.error("Global search error:", err);
    res.status(500).json({ message: "Search execution failed", error: err.message });
  }
};

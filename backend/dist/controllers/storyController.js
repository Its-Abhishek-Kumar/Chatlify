import { Story } from "../models/Story.js";
import { Conversation } from "../models/Conversation.js";
// Upload a new status story
export const createStory = async (req, res) => {
    try {
        const { mediaUrl, mediaType } = req.body;
        const userId = req.userId;
        if (!mediaUrl) {
            return res.status(400).json({ message: "Media URL is required to publish story" });
        }
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours
        const story = await Story.create({
            userId,
            mediaUrl,
            mediaType: mediaType || "image",
            expiresAt
        });
        const populated = await story.populate("userId", "name username avatar");
        res.json(populated);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to create story", error: err.message });
    }
};
// Retrieve active stories of the user's conversation participants
export const getActiveStories = async (req, res) => {
    try {
        const userId = req.userId;
        // Find conversations user is in
        const conversations = await Conversation.find({ participants: userId });
        // Extract unique contact IDs (including user itself to see own stories!)
        const participantIds = new Set([userId.toString()]);
        conversations.forEach((conv) => {
            conv.participants.forEach((pId) => {
                participantIds.add(pId.toString());
            });
        });
        // Query active stories within 24 hours limit
        const activeStories = await Story.find({
            userId: { $in: Array.from(participantIds) },
            expiresAt: { $gt: new Date() }
        })
            .populate("userId", "name username avatar isOnline lastSeen")
            .populate("viewers", "name username avatar")
            .populate("likes", "name username avatar")
            .sort({ createdAt: -1 });
        res.json(activeStories);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to retrieve stories", error: err.message });
    }
};
// Delete a story
export const deleteStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.userId;
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }
        if (story.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this story" });
        }
        await Story.findByIdAndDelete(storyId);
        res.json({ message: "Story deleted successfully", storyId });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete story", error: err.message });
    }
};
// View a story (add viewer)
export const viewStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.userId;
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }
        // Do not add the creator as a viewer of their own story
        if (story.userId.toString() !== userId.toString()) {
            if (!story.viewers.includes(userId)) {
                story.viewers.push(userId);
                await story.save();
            }
        }
        const populated = await Story.findById(storyId)
            .populate("userId", "name username avatar isOnline lastSeen")
            .populate("viewers", "name username avatar")
            .populate("likes", "name username avatar");
        res.json(populated);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to view story", error: err.message });
    }
};
// Like / unlike a story
export const toggleLikeStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.userId;
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }
        const likeIdx = story.likes.indexOf(userId);
        if (likeIdx > -1) {
            // Already liked, so unlike it
            story.likes.splice(likeIdx, 1);
        }
        else {
            // Like it
            story.likes.push(userId);
        }
        await story.save();
        const populated = await Story.findById(storyId)
            .populate("userId", "name username avatar isOnline lastSeen")
            .populate("viewers", "name username avatar")
            .populate("likes", "name username avatar");
        res.json(populated);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to toggle like on story", error: err.message });
    }
};
//# sourceMappingURL=storyController.js.map
import mongoose, { Schema } from "mongoose";
const ConversationSchema = new Schema({
    type: {
        type: String,
        enum: ["direct", "group", "channel", "community"],
        default: "direct"
    },
    participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    name: {
        type: String
    },
    avatar: {
        type: String
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation"
    },
    onlyAdminsCanPost: {
        type: Boolean,
        default: false
    },
    disappearingDuration: {
        type: Number,
        default: 0 // 0 means disabled, otherwise in seconds (e.g. 86400 for 24h)
    },
    pinnedMessages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }]
}, { timestamps: true });
// Indexing for faster retrieval and sorting of conversations by update time
ConversationSchema.index({ participants: 1, updatedAt: -1 });
export const Conversation = mongoose.model("Conversation", ConversationSchema);
//# sourceMappingURL=Conversation.js.map
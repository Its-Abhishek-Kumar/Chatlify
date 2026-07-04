import mongoose, { Schema } from "mongoose";
const ReactionSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    emoji: {
        type: String,
        required: true,
    },
    reactedAt: {
        type: Date,
        default: Date.now,
    },
});
const PollOptionSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    votes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
});
const MessageSchema = new Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    text: {
        type: String,
        default: "",
    },
    media: {
        url: String,
        name: String,
        size: Number,
        mimeType: String,
        downloadUrl: String,
        type: {
            type: String,
            enum: ["image", "video", "file"],
        },
    },
    reactions: [ReactionSchema],
    edited: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedFor: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent",
    },
    readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    forwarded: {
        type: Boolean,
        default: false
    },
    // Time-To-Live index to support disappearing messages natively in MongoDB
    expiresAt: {
        type: Date,
        index: { expires: 0 }
    },
    linkPreview: {
        url: String,
        title: String,
        description: String,
        image: String
    }
}, { timestamps: true });
// Compound indexes for scaling message loading (cursor pagination) and receipt queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, deletedFor: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, deleted: 1, deletedFor: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, status: 1 });
export const Message = mongoose.model("Message", MessageSchema);
//# sourceMappingURL=Message.js.map
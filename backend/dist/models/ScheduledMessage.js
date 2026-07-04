import mongoose, { Schema } from "mongoose";
const ScheduledMessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    media: {
        url: String,
        type: { type: String, enum: ["image", "video", "file"] }
    },
    scheduledFor: { type: Date, required: true },
    sent: { type: Boolean, default: false }
}, { timestamps: true });
ScheduledMessageSchema.index({ scheduledFor: 1, sent: 1 });
export const ScheduledMessage = mongoose.model("ScheduledMessage", ScheduledMessageSchema);
//# sourceMappingURL=ScheduledMessage.js.map
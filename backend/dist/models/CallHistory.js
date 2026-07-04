import mongoose, { Schema } from "mongoose";
const CallHistorySchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    callerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["audio", "video"], required: true },
    status: { type: String, enum: ["missed", "completed", "busy"], required: true },
    duration: { type: Number, default: 0 }, // in seconds
}, { timestamps: true });
export const CallHistory = mongoose.model("CallHistory", CallHistorySchema);
//# sourceMappingURL=CallHistory.js.map
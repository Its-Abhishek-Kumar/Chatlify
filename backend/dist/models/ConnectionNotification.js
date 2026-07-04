import mongoose, { Schema } from "mongoose";
const ConnectionNotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // recipient of notification
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // initiator
    type: { type: String, enum: ["request", "accepted"], required: true },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });
export const ConnectionNotification = mongoose.model("ConnectionNotification", ConnectionNotificationSchema);
//# sourceMappingURL=ConnectionNotification.js.map
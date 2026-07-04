import mongoose, { Schema } from "mongoose";

const SessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  deviceId: { type: String, required: true },
  deviceName: { type: String, default: "Unknown Device" },
  ipAddress: { type: String, default: "Unknown IP" },
  token: { type: String, required: true },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

SessionSchema.index({ userId: 1 });
SessionSchema.index({ token: 1 });

export const Session = mongoose.model("Session", SessionSchema);

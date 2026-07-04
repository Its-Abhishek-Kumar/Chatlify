import mongoose, { Schema } from "mongoose";

const ConnectionSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness and fast checks
ConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const Connection = mongoose.model("Connection", ConnectionSchema);

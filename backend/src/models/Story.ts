import mongoose, { Schema, Document } from "mongoose";

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  mediaUrl: string;
  mediaType: "image" | "video";
  viewers: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
}

const StorySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    viewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Story = mongoose.model<IStory>("Story", StorySchema);

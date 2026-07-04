import mongoose, { Schema, Document } from "mongoose";
const StorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    viewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: { createdAt: true, updatedAt: false } });
export const Story = mongoose.model("Story", StorySchema);
//# sourceMappingURL=Story.js.map
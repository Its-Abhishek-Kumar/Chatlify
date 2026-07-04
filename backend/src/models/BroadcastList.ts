import mongoose, { Schema } from "mongoose";

const BroadcastListSchema = new Schema({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipients: [{ type: Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export const BroadcastList = mongoose.model("BroadcastList", BroadcastListSchema);

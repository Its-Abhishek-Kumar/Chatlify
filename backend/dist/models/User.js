import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    name: { type: String, required: true },
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    mobileNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: String,
    lastSeen: Date,
    isOnline: { type: Boolean, default: false }
}, { timestamps: true });
export const User = mongoose.model("User", UserSchema);
//# sourceMappingURL=User.js.map
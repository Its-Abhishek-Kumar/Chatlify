import { User } from "../models/User.js";
import { io } from "../server.js";

export const searchUsers = async (req: any, res: any) => {
  const { query } = req.query;
  const currentUserId = req.userId;

  let filter: any = { _id: { $ne: currentUserId } };
  
  if (query && query.trim() !== "") {
    filter.$or = [
      { username: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } }
    ];
  }

  try {
    const users = await User.find(filter).select("username name avatar isOnline lastSeen");
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to search users", error: err.message });
  }
};

export const updateProfile = async (req: any, res: any) => {
  try {
    const { name, username, avatar } = req.body;
    const currentUserId = req.userId;

    // Check if username is already taken by someone else
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: currentUserId } });
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const user = await User.findByIdAndUpdate(
      currentUserId,
      { name, username, avatar },
      { new: true }
    ).select("-password");

    if (user) {
      // Broadcast profile updates in real-time to reflect to everyone
      io.emit("user:profile_updated", user);
    }

    res.json(user);
  } catch (err: any) {
    console.error("Failed to update profile:", err);
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};
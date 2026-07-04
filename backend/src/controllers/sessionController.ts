import { Session } from "../models/Session.js";

// List user's active login sessions
export const getSessions = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const sessions = await Session.find({ userId }).sort({ lastActive: -1 });
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load active sessions", error: err.message });
  }
};

// Revoke/Delete a specific login session
export const revokeSession = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    const result = await Session.findOneAndDelete({ _id: sessionId, userId });
    if (!result) {
      return res.status(404).json({ message: "Session not found or unauthorized" });
    }

    res.json({ message: "Session revoked successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to revoke session", error: err.message });
  }
};

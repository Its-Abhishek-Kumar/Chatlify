import express from "express";
import { getMessages, clearChat } from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();
router.get("/:conversationId", authMiddleware, getMessages);
router.post("/:conversationId/clear", authMiddleware, clearChat);
export default router;
//# sourceMappingURL=messageRoutes.js.map
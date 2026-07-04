import express from "express";
import {
  getUserConversations,
  createOrGetConversation,
  createGroupConversation,
  addConversationMembers,
  removeConversationMembers,
  leaveConversation,
  deleteConversation,
} from "../controllers/conversationController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getUserConversations);
router.post("/create", authMiddleware, createOrGetConversation);
router.post("/group", authMiddleware, createGroupConversation);
router.post("/add-members", authMiddleware, addConversationMembers);
router.post("/remove-members", authMiddleware, removeConversationMembers);
router.post("/:conversationId/leave", authMiddleware, leaveConversation);
router.delete("/:conversationId", authMiddleware, deleteConversation);

export default router;
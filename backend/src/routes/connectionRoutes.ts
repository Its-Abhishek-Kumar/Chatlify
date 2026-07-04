import express from "express";
import {
  sendConnectionRequest,
  respondConnectionRequest,
  getConnections,
  getNotifications,
  markNotificationsRead,
  withdrawConnectionRequest,
  removeConnection
} from "../controllers/connectionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/request", authMiddleware, sendConnectionRequest);
router.post("/respond", authMiddleware, respondConnectionRequest);
router.post("/withdraw", authMiddleware, withdrawConnectionRequest);
router.delete("/:connectionId", authMiddleware, removeConnection);
router.get("/list", authMiddleware, getConnections);
router.get("/notifications", authMiddleware, getNotifications);
router.post("/notifications/read", authMiddleware, markNotificationsRead);

export default router;

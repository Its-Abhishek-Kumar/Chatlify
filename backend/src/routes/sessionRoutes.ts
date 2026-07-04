import express from "express";
import { getSessions, revokeSession } from "../controllers/sessionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getSessions);
router.delete("/:sessionId", authMiddleware, revokeSession);

export default router;

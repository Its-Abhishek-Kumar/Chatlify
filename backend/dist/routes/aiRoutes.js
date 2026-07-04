import express from "express";
import { getSmartReplies, translateText, summarizeConversation, callAIAssistant, } from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();
router.post("/smart-reply", authMiddleware, getSmartReplies);
router.post("/translate", authMiddleware, translateText);
router.post("/summarize", authMiddleware, summarizeConversation);
router.post("/assistant", authMiddleware, callAIAssistant);
export default router;
//# sourceMappingURL=aiRoutes.js.map
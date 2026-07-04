import express from "express";
import { getCallHistory, createCallHistory } from "../controllers/callController.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();
router.get("/", authMiddleware, getCallHistory);
router.post("/", authMiddleware, createCallHistory);
export default router;
//# sourceMappingURL=callRoutes.js.map
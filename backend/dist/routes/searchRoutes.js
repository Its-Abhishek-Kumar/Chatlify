import express from "express";
import { performGlobalSearch } from "../controllers/searchController.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();
router.get("/", authMiddleware, performGlobalSearch);
export default router;
//# sourceMappingURL=searchRoutes.js.map
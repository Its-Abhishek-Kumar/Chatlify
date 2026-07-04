import express from "express";
import { searchUsers, updateProfile } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();
router.get("/search", authMiddleware, searchUsers);
router.put("/profile", authMiddleware, updateProfile);
export default router;
//# sourceMappingURL=userRoutes.js.map
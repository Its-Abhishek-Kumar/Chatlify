import express from "express";
import { createStory, getActiveStories, deleteStory, viewStory, toggleLikeStory } from "../controllers/storyController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, createStory);
router.get("/", authMiddleware, getActiveStories);
router.delete("/:storyId", authMiddleware, deleteStory);
router.post("/:storyId/view", authMiddleware, viewStory);
router.post("/:storyId/like", authMiddleware, toggleLikeStory);

export default router;

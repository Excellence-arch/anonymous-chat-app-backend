import express from "express"
import { sendMessage, getChatHistory, getUserChats, searchUsers } from "../controllers/chatController"
import { authenticateToken } from "../middleware/auth"
import { validateMessage, handleValidationErrors } from "../middleware/validation"
import { contentFilter } from "../middleware/contentFilter"
import { messageLimiter } from "../middleware/rateLimiter"

const router = express.Router()

router.use(authenticateToken)

router.post("/send", messageLimiter, validateMessage, handleValidationErrors, contentFilter, sendMessage)
router.get("/history/:userId", getChatHistory)
router.get("/chats", getUserChats)
router.get("/search", searchUsers)

export default router

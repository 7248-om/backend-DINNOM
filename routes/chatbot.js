import express from 'express';
import { handleChat } from '../controllers/chatbotController.js';

const router = express.Router();

// @route   POST /api/chatbot
router.post('/', handleChat);

export default router;


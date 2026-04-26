import { Router }               from 'express';
import * as messagingController from './messaging.controller.js';
import { authenticate }         from '../../middlewares/auth.middleware.js';
import validate                 from '../../middlewares/validate.middleware.js';
import {
  sendMessageSchema,
  messageFilterSchema,
} from './messaging.validation.js';

const router = Router();

router.use(authenticate);

// ── Static routes first ───────────────────────────────────────────────────────

// Inbox — all conversations
router.get('/conversations',
  messagingController.getAllConversations
);

// Unread count — for notification badge
router.get('/unread/count',
  messagingController.getUnreadCount
);

// ── Dynamic routes ────────────────────────────────────────────────────────────

// Send a message to a user
router.post('/:receiverId',
  validate(sendMessageSchema),
  messagingController.sendMessage
);

// Get conversation with a specific user
router.get('/:userId',
  validate(messageFilterSchema, 'query'),
  messagingController.getConversation
);

// Mark conversation as read
router.patch('/:userId/read',
  messagingController.markAsRead
);

// Delete a message
router.delete('/:messageId',
  messagingController.deleteMessage
);

export default router;
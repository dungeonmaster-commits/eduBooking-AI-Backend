import * as messagingService from './messaging.service.js';
import { sendSuccess }       from '../../utils/response.util.js';

export const sendMessage = async (req, res, next) => {
  try {
    const message = await messagingService.sendMessage(
      req.user.id,
      req.params.receiverId,
      req.validatedBody.content
    );
    return sendSuccess(res, {
      statusCode: 201,
      message:    'Message sent',
      data:       message,
    });
  } catch (err) { next(err); }
};

export const getConversation = async (req, res, next) => {
  try {
    const result = await messagingService.getConversation(
      req.user.id,
      req.params.userId,
      req.validatedQuery
    );
    return sendSuccess(res, {
      message: 'Conversation retrieved',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const getAllConversations = async (req, res, next) => {
  try {
    const result = await messagingService.getAllConversations(req.user.id);
    return sendSuccess(res, {
      message: 'Conversations retrieved',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await messagingService.markAsRead(
      req.user.id,
      req.params.userId
    );
    return sendSuccess(res, { message: result.message });
  } catch (err) { next(err); }
};

export const deleteMessage = async (req, res, next) => {
  try {
    await messagingService.deleteMessage(req.params.messageId, req.user.id);
    return sendSuccess(res, { message: 'Message deleted' });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await messagingService.getUnreadCount(req.user.id);
    return sendSuccess(res, {
      message: 'Unread count retrieved',
      data:    result,
    });
  } catch (err) { next(err); }
};
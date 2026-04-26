import * as messagingRepository from './messaging.repository.js';
import prisma from '../../database/prisma.client.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors.util.js';

export const sendMessage = async (senderId, receiverId, content) => {
  // 1. Cannot message yourself
  if (senderId === receiverId) {
    throw new ValidationError('You cannot send a message to yourself');
  }

  // 2. Check receiver exists
  const receiver = await prisma.user.findUnique({
    where:  { id: receiverId },
    select: { id: true, isActive: true },
  });

  if (!receiver || !receiver.isActive) {
    throw new NotFoundError('User not found');
  }

  // 3. Send message
  return messagingRepository.createMessage(senderId, receiverId, content);
};

export const getConversation = async (userId, otherUserId, filters) => {
  // Check other user exists
  const otherUser = await prisma.user.findUnique({
    where:  { id: otherUserId },
    select: {
      id:      true,
      profile: {
        select: { firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });

  if (!otherUser) throw new NotFoundError('User not found');

  // Get messages
  const result = await messagingRepository.findConversation(
    userId,
    otherUserId,
    filters
  );

  // Auto mark messages from other user as read
  await messagingRepository.markConversationAsRead(userId, otherUserId);

  return { otherUser, ...result };
};

export const getAllConversations = async (userId) => {
  return messagingRepository.findAllConversations(userId);
};

export const markAsRead = async (userId, otherUserId) => {
  await messagingRepository.markConversationAsRead(userId, otherUserId);
  return { message: 'Conversation marked as read' };
};

export const deleteMessage = async (messageId, requestingUserId) => {
  const message = await messagingRepository.findMessageById(messageId);

  if (!message) throw new NotFoundError('Message not found');

  // Only sender can delete their own message
  if (message.sender.id !== requestingUserId) {
    throw new ForbiddenError('You can only delete your own messages');
  }

  // Cannot delete already deleted message
  if (message.isDeleted) {
    throw new ValidationError('Message is already deleted');
  }

  return messagingRepository.softDeleteMessage(messageId);
};

export const getUnreadCount = async (userId) => {
  const count = await messagingRepository.countUnreadMessages(userId);
  return { unreadCount: count };
};
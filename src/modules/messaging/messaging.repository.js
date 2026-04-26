import prisma from '../../database/prisma.client.js';

// ── Shared select ─────────────────────────────────────────────────────────────
const messageSelect = {
  id:        true,
  content:   true,
  isRead:    true,
  isDeleted: true,
  readAt:    true,
  createdAt: true,
  sender: {
    select: {
      id:      true,
      profile: {
        select: {
          firstName: true,
          lastName:  true,
          avatarUrl: true,
        },
      },
    },
  },
  receiver: {
    select: {
      id:      true,
      profile: {
        select: {
          firstName: true,
          lastName:  true,
          avatarUrl: true,
        },
      },
    },
  },
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

/**
 * Get full conversation between two users.
 * Shows messages from both sides, ordered oldest first.
 */
export const findConversation = async (userAId, userBId, filters) => {
  const { page, limit } = filters;
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    OR: [
      { senderId: userAId, receiverId: userBId },
      { senderId: userBId, receiverId: userAId },
    ],
  };

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'asc' },
      select:  messageSelect,
    }),
    prisma.message.count({ where }),
  ]);

  return {
    messages,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext:    page < Math.ceil(total / limit),
      hasPrev:    page > 1,
    },
  };
};

/**
 * Get all conversations for a user (inbox view).
 * Returns the latest message from each unique conversation.
 *
 * This is like an email inbox — one row per contact,
 * showing the most recent message.
 */
export const findAllConversations = async (userId) => {
  // Get all messages involving this user
  const messages = await prisma.message.findMany({
    where: {
      isDeleted: false,
      OR: [
        { senderId:   userId },
        { receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id:         true,
      content:    true,
      isRead:     true,
      createdAt:  true,
      senderId:   true,
      receiverId: true,
    },
  });

  // Group by conversation partner — keep only latest message per partner
  const conversationMap = new Map();

  for (const msg of messages) {
    const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!conversationMap.has(otherUserId)) {
      conversationMap.set(otherUserId, msg);
    }
  }

  // Enrich each conversation with user profile + unread count
  const enriched = await Promise.all(
    Array.from(conversationMap.entries()).map(async ([otherUserId, lastMsg]) => {
      const otherUser = await prisma.user.findUnique({
        where:  { id: otherUserId },
        select: {
          id:      true,
          profile: {
            select: {
              firstName: true,
              lastName:  true,
              avatarUrl: true,
            },
          },
        },
      });

      const unreadCount = await prisma.message.count({
        where: {
          senderId:   otherUserId,
          receiverId: userId,
          isRead:     false,
          isDeleted:  false,
        },
      });

      return {
        user: otherUser,
        lastMessage: {
          id:        lastMsg.id,
          content:   lastMsg.content,
          isRead:    lastMsg.isRead,
          createdAt: lastMsg.createdAt,
          isMine:    lastMsg.senderId === userId,
        },
        unreadCount,
      };
    })
  );

  // Sort by most recent
  return enriched.sort(
    (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
  );
};

export const findMessageById = async (id) => {
  return prisma.message.findUnique({
    where:  { id },
    select: messageSelect,
  });
};

export const countUnreadMessages = async (userId) => {
  return prisma.message.count({
    where: {
      receiverId: userId,
      isRead:     false,
      isDeleted:  false,
    },
  });
};

// ─────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────

export const createMessage = async (senderId, receiverId, content) => {
  return prisma.message.create({
    data:   { senderId, receiverId, content },
    select: messageSelect,
  });
};

/**
 * Mark all messages from a specific sender as read.
 * Called when user opens a conversation.
 */
export const markConversationAsRead = async (receiverId, senderId) => {
  return prisma.message.updateMany({
    where: {
      receiverId,
      senderId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

/**
 * Soft delete a message — sender only.
 * Message stays in DB but isDeleted = true.
 */
export const softDeleteMessage = async (messageId) => {
  return prisma.message.update({
    where: { id: messageId },
    data:  { isDeleted: true, content: 'This message was deleted' },
  });
};
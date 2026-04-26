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
  // Get all unique users this person has chatted with
  // We use raw query here for efficiency — Prisma doesn't support
  // DISTINCT ON natively for this conversation pattern
  const conversations = await prisma.$queryRaw`
    SELECT DISTINCT ON (other_user_id)
      other_user_id,
      message_id,
      content,
      is_read,
      created_at,
      sender_id
    FROM (
      SELECT
        CASE
          WHEN sender_id = ${userId}::uuid THEN receiver_id
          ELSE sender_id
        END AS other_user_id,
        id  AS message_id,
        content,
        is_read,
        created_at,
        sender_id
      FROM messages
      WHERE
        (sender_id = ${userId}::uuid OR receiver_id = ${userId}::uuid)
        AND is_deleted = false
    ) AS convs
    ORDER BY other_user_id, created_at DESC
  `;

  // Fetch profile info for each conversation partner
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const otherUser = await prisma.user.findUnique({
        where:  { id: conv.other_user_id },
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

      // Count unread messages from this conversation partner
      const unreadCount = await prisma.message.count({
        where: {
          senderId:   conv.other_user_id,
          receiverId: userId,
          isRead:     false,
          isDeleted:  false,
        },
      });

      return {
        user:         otherUser,
        lastMessage: {
          id:        conv.message_id,
          content:   conv.content,
          isRead:    conv.is_read,
          createdAt: conv.created_at,
          isMine:    conv.sender_id === userId,
        },
        unreadCount,
      };
    })
  );

  // Sort by most recent message
  return enriched.sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
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
import type { Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message';
import Chat from '../models/Chat';
import User from '../models/User';
import type { AuthRequest } from '../middleware/auth';

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user!.userId;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404).json({ error: 'Receiver not found' });
      return;
    }

    // Create message
    const message = new Message({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content: content.trim(),
      timestamp: new Date(),
      isRead: false,
      isBlocked: false,
    });

    await message.save();

    // Update or create chat
    const participants = [
      new mongoose.Types.ObjectId(senderId),
      new mongoose.Types.ObjectId(receiverId),
    ].sort();

    await Chat.findOneAndUpdate(
      { participants },
      {
        participants,
        lastMessage: content.trim(),
        lastMessageTime: new Date(),
      },
      { upsert: true, new: true }
    );

    // Populate sender info for response
    await message.populate('senderId', 'username avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
    return;
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.userId;
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Get messages between current user and specified user
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
      isBlocked: false,
    })
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const chats = await Chat.find({
      participants: new mongoose.Types.ObjectId(userId),
    })
      .populate({
        path: 'participants',
        select: 'username avatar lastSeen isOnline',
        match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } },
      })
      .sort({ lastMessageTime: -1 });

    // Get unread message counts
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipant = chat.participants.find(
          (p: any) => p._id.toString() !== userId
        );

        if (!otherParticipant) return null;

        const unreadCount = await Message.countDocuments({
          senderId: otherParticipant._id,
          receiverId: userId,
          isRead: false,
          isBlocked: false,
        });

        return {
          chatId: chat._id,
          participant: otherParticipant,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          unreadCount,
        };
      })
    );

    res.json({
      chats: chatsWithUnreadCount.filter((chat) => chat !== null),
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user!.userId;

    const searchFilter: any = {
      _id: { $ne: currentUserId },
    };

    // If query is provided, filter by username
    if (query && typeof query === 'string' && query.trim().length > 0) {
      searchFilter.username = { $regex: query.trim(), $options: 'i' };
    }

    const users = await User.find(searchFilter)
      .select('username avatar lastSeen isOnline')
      .sort({ isOnline: -1, lastSeen: -1 }) // Online users first, then by last seen
      .limit(50);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';
import Chat from '../models/Chat';
import mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export const initializeSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user: any = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.username} connected`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Join user to their own room
    socket.join(socket.userId!);

    // Broadcast user online status to all connected clients
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.username,
      isOnline: true,
    });

    // Handle joining chat rooms
    socket.on('join_chat', (chatId: string) => {
      socket.join(chatId);
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(chatId);
    });

    // Handle sending messages
    socket.on(
      'send_message',
      async (data: { receiverId: string; content: string }) => {
        try {
          const { receiverId, content } = data;

          // Check if receiver exists
          const receiver = await User.findById(receiverId);
          if (!receiver) {
            socket.emit('error', { message: 'Receiver not found' });
            return;
          }

          // Create message
          const message = new Message({
            senderId: new mongoose.Types.ObjectId(socket.userId!),
            receiverId: new mongoose.Types.ObjectId(receiverId),
            content: content.trim(),
            timestamp: new Date(),
            isRead: false,
            isBlocked: false,
          });

          await message.save();

          // Populate sender info
          await message.populate('senderId', 'username avatar');
          await message.populate('receiverId', 'username avatar');

          // Update or create chat
          const participants = [
            new mongoose.Types.ObjectId(socket.userId!),
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

          // Create chat room ID
          const chatRoomId = participants
            .map((p) => p.toString())
            .sort()
            .join('-');

          // Emit message to both sender and receiver
          io.to(socket.userId!).emit('new_message', message);
          io.to(receiverId).emit('new_message', message);

          // Emit chat update
          io.to(socket.userId!).emit('chat_updated');
          io.to(receiverId).emit('chat_updated');
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    // Handle message read status
    socket.on('mark_messages_read', async (data: { senderId: string }) => {
      try {
        await Message.updateMany(
          {
            senderId: data.senderId,
            receiverId: socket.userId,
            isRead: false,
          },
          { isRead: true }
        );

        // Notify sender that messages were read
        io.to(data.senderId).emit('messages_read', {
          readBy: socket.userId,
        });
      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { receiverId: string }) => {
      io.to(data.receiverId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: true,
      });
    });

    socket.on('typing_stop', (data: { receiverId: string }) => {
      io.to(data.receiverId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: false,
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.username} disconnected`);

      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        username: socket.username,
        isOnline: false,
      });
    });
  });

  return io;
};

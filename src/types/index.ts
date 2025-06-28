export interface User {
  _id?: string
  username: string
  email: string
  password: string
  avatar: string
  createdAt: Date
  lastSeen: Date
}

export interface Message {
  _id?: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  isRead: boolean
  isBlocked: boolean
}

export interface Chat {
  _id?: string
  participants: string[]
  lastMessage?: string
  lastMessageTime?: Date
  createdAt: Date
}

export interface AuthRequest extends Request {
  user?: {
    userId: string
    username: string
  }
}

import mongoose, { Schema, type Document } from "mongoose"

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId
  receiverId: mongoose.Types.ObjectId
  content: string
  timestamp: Date
  isRead: boolean
  isBlocked: boolean
}

const MessageSchema: Schema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
})

MessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 })

export default mongoose.model<IMessage>("Message", MessageSchema)

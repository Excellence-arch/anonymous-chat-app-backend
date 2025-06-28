import mongoose, { Schema, type Document } from "mongoose"

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[]
  lastMessage: string
  lastMessageTime: Date
  createdAt: Date
}

const ChatSchema: Schema = new Schema({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  lastMessage: {
    type: String,
    default: "",
  },
  lastMessageTime: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

ChatSchema.index({ participants: 1 })

export default mongoose.model<IChat>("Chat", ChatSchema)

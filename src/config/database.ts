import mongoose from "mongoose"

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/anonymous-chat"

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log("✅ Connected to MongoDB")
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error)
})

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected")
})

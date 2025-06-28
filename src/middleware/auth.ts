import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User from "../models/User"

export interface AuthRequest extends Request {
  user?: {
    userId: string
    username: string
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user: any = await User.findById(decoded.userId).select("-password")

    if (!user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      username: user.username,
    }

    next()
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
}

import { body, validationResult } from "express-validator"
import type { Request, Response, NextFunction } from "express"

export const validateRegistration = [
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
]

export const validateLogin = [
  body("identifier").notEmpty().withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("Password is required"),
]

export const validateMessage = [
  body("receiverId").isMongoId().withMessage("Invalid receiver ID"),
  body("content").isLength({ min: 1, max: 1000 }).withMessage("Message must be between 1 and 1000 characters").trim(),
]

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
    return;
  }
  next()
}

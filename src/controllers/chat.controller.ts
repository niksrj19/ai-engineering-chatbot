import { Request, Response, NextFunction } from "express";

import { ChatService } from "../services/chat.service.js";

export class ChatController {

  constructor(
    private readonly chatService: ChatService
  ) {}

  chat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const { message } = req.body;

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          error: "message is required",
        });
      }

      const result =
        await this.chatService.chat(message);

      return res.json({
        data: result,
      });

    } catch (error) {

      next(error);
    }
  };
}
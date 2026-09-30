import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  ChatService,
} from "../services/chat.service.js";

export class ChatController {

  constructor(
    private readonly chatService:
      ChatService
  ) {}

  chat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const {
        conversationId,
        message,
      } = req.body;

      if (
        typeof conversationId !==
          "string" ||
        !conversationId.trim()
      ) {
        return res.status(400).json({
          error:
            "conversationId is required",
        });
      }

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          error:
            "message is required",
        });
      }

      const result =
        await this.chatService.chat(
          conversationId,
          message
        );

      return res.json({
        data: result,
      });

    } catch (error) {

      next(error);
    }
  };

   stream = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
   const controller =
    new AbortController();

  try {

    // req.on("close", () => {

    //   if (!res.writableEnded) {
    //     controller.abort();

    //     console.log(
    //       "Client disconnected. " +
    //       "Aborting LLM request."
    //     );
    //   }
    // });

    const { message } = req.body;

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "message is required",
      });
    }

    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.flushHeaders();

    const stream =
      this.chatService.stream(message);

    for await (const chunk of stream) {

      res.write(
        `data: ${JSON.stringify({
          type: "token",
          content: chunk,
        })}\n\n`
      );
    }

    res.write(
      `data: ${JSON.stringify({
        type: "done",
      })}\n\n`
    );

    if (!controller.signal.aborted) {

      res.write(
        `data: ${JSON.stringify({
          type: "done",
        })}\n\n`
      );

      res.end();
    }

  } catch (error) {

     if (controller.signal.aborted) {
      return;
    }

    next(error);
  }
};
}
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


       /*
     * Development-only authenticated
     * context.
     *
     * Production:
     * userId MUST come from the
     * authentication middleware/session,
     * never from a client-controlled
     * header/body.
     */
       const requestContext = {
      userId: "demo-user",

      requestId:
        crypto.randomUUID(),

      conversationId,
    };



    const response =
      await this.chatService.chat(
        conversationId,
        message,
        requestContext
      );

     

      return res.json(response);

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

    req.on(
      "close",
      () => {

        if (
          !res.writableEnded
        ) {
          controller.abort();

          console.log(
            "Client disconnected. Aborting LLM request."
          );
        }
      }
    );

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
      typeof message !==
        "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error:
          "message is required",
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
      this.chatService.stream(
        conversationId,
        message,
        controller.signal
      );

    for await (
      const event of stream
    ) {

      if (
        controller.signal.aborted
      ) {
        break;
      }

      res.write(
        `data: ${JSON.stringify(
          event
        )}\n\n`
      );
    }

    if (
      !controller.signal.aborted
    ) {

      res.end();
    }

  } catch (error) {

    if (
      controller.signal.aborted
    ) {
      return;
    }

    next(error);
  }
};
}
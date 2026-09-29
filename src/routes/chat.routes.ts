import { Router } from "express";

import { ChatController } from "../controllers/chat.controller.js";

export function createChatRoutes(
  controller: ChatController
) {

  const router = Router();

  router.post(
    "/chat",
    controller.chat
  );

  return router;
}
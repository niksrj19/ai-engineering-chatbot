import {
  Request,
  Response,
  NextFunction,
} from "express";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {

  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: "Internal server error",
  });
}
import "./observability/instrument";
import express, { Application, NextFunction, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import exportRoutes from "./routes/export.routes";
import eventRoutes from "./routes/events.routes";
import zoneRoutes from "./routes/zones.routes";
import participationsRoutes from "./routes/participations.routes";
import chatRoutes from "./routes/chat.routes";
import searchRoutes from "./routes/search.routes";
import notificationRoutes from "./routes/notifications.routes";
import { initSocketServer } from "./sockets/server.socket";
import pool from "./config/database";
import { databaseHealth, metricsMiddleware, metricsRegistry } from "./observability/metrics";
import { Sentry } from "./observability/instrument";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    if (res.statusCode >= 500) {
      Sentry.captureMessage(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, "error");
    }
  });
  next();
});

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    databaseHealth.set(1);
    res.status(200).json({
      status: "OK",
      services: { api: "up", database: "up" },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    databaseHealth.set(0);
    Sentry.captureException(error);
    res.status(503).json({
      status: "DEGRADED",
      services: { api: "up", database: "down" },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/metrics", async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to EventManager API",
    version: "1.0.0",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/participations", participationsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
  });
});

Sentry.setupExpressErrorHandler(app);

initSocketServer(server);

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or change PORT.`,
    );
  } else if (error.code === "EACCES") {
    console.error(`Port ${PORT} requires elevated privileges.`);
  } else {
    console.error("Server startup error:", error);
  }

  process.exitCode = 1;
});

server.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;

import express, { Application, Request, Response } from "express";
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
import accessRoutes from "./routes/access.routes";
import chatRoutes from "./routes/chat.routes";
import { initSocketServer } from "./sockets/server.socket";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);

app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost",
  "https://localhost",
  "http://localhost:5000",
  "http://10.0.2.2:3000",
  "http://10.0.2.2:5000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "EventManager API is running",
    timestamp: new Date().toISOString(),
  });
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
app.use("/api/access", accessRoutes);
app.use("/api/chat", chatRoutes);
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
  });
});

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

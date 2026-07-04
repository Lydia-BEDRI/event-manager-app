import { NextFunction, Request, Response } from "express";
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "prom-client";

export const metricsRegistry = new Registry();
metricsRegistry.setDefaultLabels({ service: "eventmanager-backend" });

collectDefaultMetrics({
  prefix: "eventmanager_",
  register: metricsRegistry,
});

const httpRequests = new Counter({
  name: "eventmanager_http_requests_total",
  help: "Nombre total de requêtes HTTP reçues.",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry],
});

const httpDuration = new Histogram({
  name: "eventmanager_http_request_duration_seconds",
  help: "Durée des requêtes HTTP en secondes.",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const databaseHealth = new Gauge({
  name: "eventmanager_database_up",
  help: "Disponibilité de MySQL (1 disponible, 0 indisponible).",
  registers: [metricsRegistry],
});

function routeLabel(req: Request): string {
  const routePath = req.route?.path;
  if (routePath) {
    return `${req.baseUrl || ""}${routePath}`;
  }

  return req.path === "/metrics" ? "/metrics" : "unmatched";
}

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    if (req.path === "/metrics") return;

    const labels = {
      method: req.method,
      route: routeLabel(req),
      status_code: String(res.statusCode),
    };
    const duration = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

    httpRequests.inc(labels);
    httpDuration.observe(labels, duration);
  });

  next();
}

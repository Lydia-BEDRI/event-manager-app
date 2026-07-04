import { EventEmitter } from "events";
import { NextFunction, Request, Response } from "express";
import { metricsMiddleware, metricsRegistry } from "../observability/metrics";

describe("observability metrics", () => {
  it("expose les métriques Node.js et HTTP au format Prometheus", async () => {
    const req = {
      method: "GET",
      path: "/events",
      baseUrl: "/api/events",
      route: { path: "/" },
    } as unknown as Request;
    const emitter = new EventEmitter();
    const res = Object.assign(emitter, { statusCode: 200 }) as unknown as Response;
    const next = jest.fn() as NextFunction;

    metricsMiddleware(req, res, next);
    emitter.emit("finish");

    const metrics = await metricsRegistry.metrics();
    expect(next).toHaveBeenCalledTimes(1);
    expect(metrics).toContain("eventmanager_http_requests_total");
    expect(metrics).toContain('route="/api/events/"');
    expect(metrics).toContain("eventmanager_process_cpu_user_seconds_total");
  });

  it("n’enregistre pas le scraping de /metrics lui-même", async () => {
    const before = await metricsRegistry.getSingleMetricAsString(
      "eventmanager_http_requests_total",
    );
    const req = {
      method: "GET",
      path: "/metrics",
      baseUrl: "",
    } as unknown as Request;
    const emitter = new EventEmitter();
    const res = Object.assign(emitter, { statusCode: 200 }) as unknown as Response;

    metricsMiddleware(req, res, jest.fn());
    emitter.emit("finish");

    const after = await metricsRegistry.getSingleMetricAsString(
      "eventmanager_http_requests_total",
    );
    expect(after).toBe(before);
  });
});

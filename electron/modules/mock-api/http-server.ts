import type { Server } from "node:http";
import type { MockEndpoint } from "@shared/index";
import cors from "cors";
import express from "express";

export class MockHttpServer {
  private app: express.Application;
  private server: Server | null = null;
  private endpoints: Map<string, MockEndpoint>;

  constructor(endpointsMap: Map<string, MockEndpoint>) {
    this.endpoints = endpointsMap;
    this.app = express();

    // Middlewares
    this.app.use(cors());
    this.app.use(express.json()); // to parse JSON bodies if needed, though we just return them for mock
    this.app.use(express.urlencoded({ extended: true }));

    // Catch-all middleware for all /mock paths
    this.app.use("/mock", async (req, res) => {
      // Check if endpoint exists
      const requestPath = req.path === "" ? "/" : req.path;
      const method = req.method.toUpperCase();

      // Find endpoint matching method and path
      let matchedEndpoint: MockEndpoint | null = null;
      for (const endpoint of this.endpoints.values()) {
        if (endpoint.method === method && endpoint.path === requestPath) {
          matchedEndpoint = endpoint;
          break;
        }
      }

      if (!matchedEndpoint) {
        // Return 404 with list of available endpoints
        const available = Array.from(this.endpoints.values()).map(
          (ep) => `${ep.method} /mock${ep.path}`,
        );
        return res.status(404).json({
          error: "Mock endpoint not found",
          method,
          path: requestPath,
          availableEndpoints: available,
        });
      }

      // Simulate delay
      if (matchedEndpoint.delay && matchedEndpoint.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, matchedEndpoint.delay));
      }

      // Increment hits
      matchedEndpoint.hits += 1;

      // Set content type and status code
      res.setHeader("Content-Type", matchedEndpoint.contentType || "application/json");
      res.status(matchedEndpoint.statusCode || 200);

      // Send response body
      try {
        // If content type is json, try to parse and send as JSON object to ensure correct formatting
        if (matchedEndpoint.contentType === "application/json") {
          const jsonBody = JSON.parse(matchedEndpoint.responseBody);
          return res.json(jsonBody);
        } else {
          return res.send(matchedEndpoint.responseBody);
        }
      } catch (_error) {
        // Fallback to sending raw string if JSON parsing fails
        return res.send(matchedEndpoint.responseBody);
      }
    });
  }

  start(port: number = 3001): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          resolve(port);
        });

        this.server?.on("error", (e: Error & { code?: string }) => {
          if (e.code === "EADDRINUSE") {
            reject(new Error(`Port ${port} is already in use.`));
          } else {
            reject(e);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err?: Error) => {
          if (err) return reject(err);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

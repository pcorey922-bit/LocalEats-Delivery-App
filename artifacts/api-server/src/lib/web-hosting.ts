import express, { Router } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
export function webHosting(directory: string) {
  const root = path.resolve(directory),
    index = path.join(root, "index.html");
  if (!existsSync(index))
    throw new Error("WEB_DIST_DIR must contain the built website index.html");
  const router = Router();
  const assets = express.static(root, {
    dotfiles: "ignore",
    index: false,
    fallthrough: true,
    setHeaders(res, file) {
      res.setHeader(
        "Cache-Control",
        file.includes(`${path.sep}assets${path.sep}`) &&
          /-[\w-]{8,}\.[\w]+$/.test(file)
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      );
    },
  });
  router.use((req, res, next) => {
    if (
      req.path === "/api" ||
      req.path.startsWith("/api/") ||
      ["/livez", "/readyz"].includes(req.path)
    )
      return next();
    if (!["GET", "HEAD"].includes(req.method)) return next();
    if (req.path.split("/").some((segment) => segment.startsWith("."))) {
      res.status(404).end();
      return;
    }
    assets(req, res, (error) => {
      if (error) return next(error);
      if (path.extname(req.path) || !req.accepts("html")) {
        res.status(404).end();
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(index);
    });
  });
  return router;
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In dev, /api/* serverless functions don't exist — proxy them to the
// production deployment so the frontend behaves identically.
// Override with DEV_API_TARGET if needed.
const API_TARGET =
  process.env.DEV_API_TARGET ?? "https://footautopsie.com";

const apiProxy = {
  name: "api-proxy",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api")) return next();
      try {
        const url = `${API_TARGET}${req.url}`;
        const upstream = await fetch(url, {
          method: req.method,
          headers: {
            "content-type": req.headers["content-type"] ?? "application/json",
            ...(req.headers.authorization
              ? { authorization: req.headers.authorization }
              : {}),
          },
          body:
            req.method === "GET" || req.method === "HEAD"
              ? undefined
              : await new Promise(resolve => {
                  const chunks = [];
                  req.on("data", c => chunks.push(c));
                  req.on("end", () => resolve(Buffer.concat(chunks)));
                }),
        });
        res.statusCode = upstream.status;
        upstream.headers.forEach((v, k) => {
          if (!["content-encoding", "transfer-encoding"].includes(k))
            res.setHeader(k, v);
        });
        res.end(Buffer.from(await upstream.arrayBuffer()));
      } catch (e) {
        res.statusCode = 502;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: `API proxy failed: ${e.message}` }));
      }
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiProxy],
});

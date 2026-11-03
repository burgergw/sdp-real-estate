// Minimal static server for previewing the site locally (no dependencies).
// Serves the project root; used by .claude/launch.json.
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 8139;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

function send(res, status, file) {
  res.writeHead(status, {
    "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400); return res.end("Bad request"); }
  let file = path.join(root, rel);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) { file = path.join(file, "index.html"); }
    // Clean page addresses, as on Hostinger: /goodhope serves goodhope.html
    else if (err && !path.extname(file)) { file += ".html"; }
    fs.stat(file, (err2, stat2) => {
      if (!err2 && stat2.isFile()) return send(res, 200, file);
      res.writeHead(404); res.end("Not found");
    });
  });
}).listen(port, () => console.log(`SDP Real Estate preview: http://localhost:${port}/`));

export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    source: "vercel-api-function",
    timestamp: new Date().toISOString(),
  });
}
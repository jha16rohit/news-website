export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    source: "nested-share-api-function",
    path: req.url,
  });
}
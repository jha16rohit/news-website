import app from "./app";

const PORT = Number(process.env.PORT) || 5001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// 🔥 KEEP PROCESS ALIVE (FIX)
server.on("listening", () => {
  console.log("Server is actively listening...");
});

// 🔥 PREVENT AUTO EXIT
process.stdin.resume();
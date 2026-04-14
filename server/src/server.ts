import app from "./app";

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
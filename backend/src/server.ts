import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import app from "./app";
import connectDB from "./config/db";

console.log(process.env.MONGO_URI);

const PORT = process.env.PORT || 5001;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
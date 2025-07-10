console.log("Starting Chatwoot Webhook server...");

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { handleDeleteEmail } from "./delete-email.js";
import { handleMarkAsRead } from "./mark-as-read.js";

const app = express();
app.use(express.json());

app.get("/healthz", (req, res) => res.send("OK"));

app.post("/webhook/delete-email", handleDeleteEmail);
app.post("/webhook/mark-as-read", handleMarkAsRead);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
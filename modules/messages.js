import mongoose from "mongoose";

const messagesSchema = new mongoose.Schema({
  messages: [
    {
      role: { type: String, required: true }, // "user" ou "assistant"
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Messages = mongoose.model("Messages", messagesSchema);

export default Messages;

import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { writeFile } from "fs/promises";
import fetch from "node-fetch"; // Required to download audio files
import googleTTS from "google-tts-api";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Replace this with your actual Telegram Bot Token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
const PORT = 3000;

// Serve the audio files via HTTP
app.use(express.static("audio"));

// Helper function to generate text-to-speech audio
const generateVoice = async (text, filePath) => {
  // Generate the Google TTS URL
  const url = googleTTS.getAudioUrl(text, {
    lang: "en", // Language code (change to "km" for Khmer)
    slow: false,
  });

  // Download the audio file from the generated URL
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  // Write the audio data to a file
  await writeFile(filePath, Buffer.from(buffer));
};

// Bot logic to handle user messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text) {
    const text = msg.text;
    // const audioFileName = `audio_${Date.now()}.mp3`;
    // const audioFilePath = `audio/${audioFileName}`;
    const audioFileName = `Preview.ogg`;
    const audioFilePath = `audio/${audioFileName}`;

    try {
      // Generate text-to-speech audio
      await generateVoice(text, audioFilePath);

      // Send the audio back to the user
      await bot.sendVoice(chatId, audioFilePath);
    } catch (error) {
      console.error("Error generating voice:", error);
      bot.sendMessage(chatId, "Sorry, I couldn't process your request.");
    }
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

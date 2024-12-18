import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { writeFile } from "fs/promises";
import fetch from "node-fetch"; // Required to download audio files
import * as franc from "franc-min";
import googleTTS from "google-tts-api";
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

// Replace this with your actual Telegram Bot Token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
const port = process.env.PORT || 3000;

// Serve the audio files via HTTP
app.use(express.static("audio"));

const generateVoice = async (text, filePath) => {
  // Detect the language of the input text
  const detectedLang = franc.franc(text); // Returns the ISO 639-3 language code
  let langCode = "en"; // Default language is English

  console.log("Detected language code:", detectedLang);
  // If the detected language is Khmer (ISO 639-3 code for Khmer is 'und')
  if (detectedLang === "und") {
    langCode = "km"; // Set language code to Khmer
  }

  // Generate the Google TTS URL
  const url = googleTTS.getAudioUrl(text, {
    lang: langCode, // Use dynamic language code
    slow: false,
  });

  try {
    // Download the audio file from the generated URL
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // Write the audio data to a file
    await writeFile(filePath, Buffer.from(buffer));
  } catch (error) {
    console.error("Error generating voice:", error);
    throw error;
  }
};

// Bot logic to handle user messages
bot.on("message", async (msg) => {
  const chatId = msg?.chat.id;

  if (msg?.text == "/start") {
    bot.sendMessage(
      chatId,
      "Please send me some text(Khmer or English) less than 300 characters, and I will convert it to speech."
    );

    return;
  }

  if (msg?.text) {
    const text = msg.text;

    const audioFileName = `Preview.mp3`;
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
  } else {
    bot.sendMessage(
      chatId,
      "Please send me some text(Khmer or English) less than 300 characters, and I will convert it to speech."
    );
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

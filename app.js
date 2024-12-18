import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { writeFile, readdir, unlink } from "fs/promises"; // Use fs.promises for async file operations
import fetch from "node-fetch"; // Required to download audio files
import * as franc from "franc-min";
import googleTTS from "google-tts-api";
import dotenv from "dotenv";
import e from "express";
// Load environment variables from .env file
dotenv.config();

// Replace this with your actual Telegram Bot Token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
const port = process.env.PORT || 3000;

// Serve the audio files via HTTP
app.use(express.static("audio"));

// handle long text
const generateVoice = async (text) => {
  // Detect the language of the input text
  const detectedLang = franc.franc(text); // Returns the ISO 639-3 language code
  let langCode = "en"; // Default language is English

  console.log("Detected language code:", detectedLang);
  // If the detected language is Khmer (ISO 639-3 code for Khmer is 'und')
  if (detectedLang === "und") {
    langCode = "km"; // Set language code to Khmer
  } else if (detectedLang === "tha") {
    langCode = "th";
  } else if (detectedLang === "vie") {
    langCode = "vi";
  } else if (detectedLang === "jpn") {
    langCode = "ja";
  } else if (detectedLang === "kor") {
    langCode = "ko";
  } else if (detectedLang === "cmn") {
    langCode = "zh";
  } else if (detectedLang === "por") {
    langCode = "pt";
  } else if (detectedLang === "ind") {
    langCode = "id";
  } else if (detectedLang === "mal") {
    langCode = "ml";
  } else if (detectedLang === "zho") {
    langCode = "zh";
  } else if (detectedLang === "fra") {
    langCode = "fr";
  } else if (detectedLang === "deu") {
    langCode = "de";
  } else if (detectedLang === "ita") {
    langCode = "it";
  } else if (detectedLang === "spa") {
    langCode = "es";
  } else if (detectedLang === "rus") {
    langCode = "ru";
  } else if (detectedLang === "ara") {
    langCode = "ar";
  } else if (detectedLang === "hin") {
    langCode = "hi";
  } else if (detectedLang === "msa") {
    langCode = "ms";
  } else if (detectedLang === "fil") {
    langCode = "tl";
  }

  // Generate the Google TTS URLs using getAllAudioUrls
  const results = googleTTS.getAllAudioUrls(text, {
    lang: langCode,
    slow: false,
    host: "https://translate.google.com",
    splitPunct: ",.?",
  });

  // console.log("Generated audio URLs:", results);
  try {
    // Download the audio files from each URL and save them
    for (let i = 0; i < results.length; i++) {
      const response = await fetch(results[i].url);
      const buffer = await response.arrayBuffer();

      const audioFilePath = `audio/Preview_${i + 1}.mp3`; // Different file for each URL
      await writeFile(audioFilePath, Buffer.from(buffer));
      console.log(`Audio file saved: ${audioFilePath}`);
    }
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
      "Please send me some text (any languages), and I will convert it to speech."
    );

    return;
  }

  if (msg?.text) {
    const text = msg.text;

    try {
      // Generate text-to-speech audio
      await generateVoice(text);

      // Fetch all the generated audio files
      const files = await fetchAudioFiles();

      // Send all the generated audio files back to the user
      for (const file of files) {
        await bot.sendVoice(chatId, file);
        // After sending, delete the file
        await unlink(file);
        console.log(`Deleted audio file: ${file}`);
      }
    } catch (error) {
      console.error("Error generating voice:", error);
      bot.sendMessage(chatId, "Sorry, I couldn't process your request.");
    }
  } else {
    bot.sendMessage(
      chatId,
      "Please send me some text (any languages), and I will convert it to speech."
    );
  }
});

// Function to fetch all the generated audio files
const fetchAudioFiles = async () => {
  // Fetch all the files generated in the "audio" directory
  const audioFiles = await readdir("audio");

  // Filter the files to only include those starting with "Preview" and ending with ".mp3"
  return audioFiles
    .filter((file) => file.startsWith("Preview") && file.endsWith(".mp3"))
    .map((file) => `audio/${file}`);
};

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

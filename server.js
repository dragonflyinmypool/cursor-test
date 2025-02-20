require("dotenv").config();
const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle API queries
app.post("/query", async (req, res) => {
  try {
    const query = `Analyze the etymology of the word "${req.body.query}" and provide a response in the following JSON structure:
    {
      "oldest_root": "Describe the oldest known root of this word, including its original meaning and language (return as a single text string)",
      "evolution": "Describe how the word evolved through time, listing the major changes and languages it passed through (return as a single text string)",
      "related_words": "List and describe related words that share this root, both in the original language and other languages (return as a single text string)"
    }
    
    Important: Each field must be a simple text string, not an object or array. Format the text with line breaks where needed.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: query }],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content);

    // Ensure all fields are strings
    Object.keys(response).forEach((key) => {
      if (typeof response[key] !== "string") {
        response[key] = JSON.stringify(response[key], null, 2);
      }
    });

    res.json(response);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ error: "Failed to process query" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

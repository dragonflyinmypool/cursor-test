require("dotenv").config();
const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error("OpenAI initialization error:", error);
}

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
    // Check if OpenAI is properly initialized
    if (!openai) {
      throw new Error("OpenAI client is not properly initialized");
    }

    // Validate input
    if (!req.body.query || typeof req.body.query !== "string") {
      throw new Error("Invalid query parameter");
    }

    const query = `Analyze the etymology of the word "${req.body.query}" and provide a response in the following JSON structure:
    {
      "oldest_root": {
        "word": "Write the oldest known root word (preferably proto-Indo-European root if applicable, really try to go back to the indo-european root)",
        "language": "Specify the language of this root word",
        "meaning": "Provide the original meaning of this root word"
      },
      "evolution": "Describe how the word evolved through time, listing the major changes and languages it passed through",
      "related_words": "List and describe related words that share this root, both in the original language and other languages"
    }
    
    Important: The oldest_root MUST be a JSON object with exactly these three fields as shown above, not a string. The evolution and related_words should be strings.
    Do not include any additional fields or nested objects.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: query }],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
    });

    if (!completion.choices || !completion.choices[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI");
    }

    const response = JSON.parse(completion.choices[0].message.content);

    // Validate response structure
    const requiredFields = ["oldest_root", "evolution", "related_words"];
    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Parse oldest_root if it's a string
    if (typeof response.oldest_root === "string") {
      try {
        response.oldest_root = JSON.parse(response.oldest_root);
      } catch (e) {
        console.error("Failed to parse oldest_root:", response.oldest_root);
        throw new Error("Invalid oldest_root format");
      }
    }

    console.log("Parsed oldest_root:", response.oldest_root);

    // Validate oldest_root structure
    if (!response.oldest_root || typeof response.oldest_root !== "object") {
      throw new Error("oldest_root must be an object");
    }

    const requiredRootFields = ["word", "language", "meaning"];
    for (const field of requiredRootFields) {
      if (!(field in response.oldest_root)) {
        throw new Error(`Missing required field in oldest_root: ${field}`);
      }
    }

    // Only convert specific fields to strings if needed
    if (typeof response.evolution !== "string") {
      response.evolution = JSON.stringify(response.evolution, null, 2);
    }
    if (typeof response.related_words !== "string") {
      response.related_words = JSON.stringify(response.related_words, null, 2);
    }

    res.json(response);
  } catch (error) {
    console.error("API Error:", {
      message: error.message,
      stack: error.stack,
      query: req.body.query,
    });

    res.status(500).json({
      error: "Failed to process query",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Environment:", process.env.NODE_ENV);
});

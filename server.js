require("dotenv").config();
const express = require("express");
const path = require("path");
const OpenAI = require("openai");
const { createEtymologyPrompt } = require("./src/prompts/etymologyPrompt");

const app = express();
const PORT = process.env.PORT || 3000;

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
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "user", content: createEtymologyPrompt(req.body.query) },
    ],
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
    max_tokens: 1000,
    temperature: 0.8,
  });

  const response = JSON.parse(completion.choices[0].message.content);
  console.log("********* This is the response *********", response);
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

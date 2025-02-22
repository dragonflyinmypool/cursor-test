export const createEtymologyPrompt = (
  word
) => `Analyze the etymology of the word "${word}" and provide a response in the following JSON structure:
{
  "oldest_root": {
    "word": "Write the oldest known root word (preferably proto-Indo-European root if applicable). Ask yourself the question: What is the oldest root word that is related to the word ${word}? Just write the word, don't add any other text.",
    "pronunciation": "Provide the pronunciation of this root word in simple english",
    "language": "Specify the language of this root word",
    "meaning": "Provide the original meaning of this root word"
  },
  "evolution": "Describe how the word evolved through time, starting from the oldest root word and moving forward in time",
  "related_words": "List and describe related words that share this root, both in the original language and other languages. Write the [word] - [meaning] for each related word."
}

Important: 
1. The oldest_root MUST be a JSON object with EXACTLY these four fields: word, pronunciation, language, and meaning.
2. The pronunciation field is REQUIRED and MUST NOT be omitted.
3. The evolution and related_words should be strings.
4. Do not include any additional fields or nested objects.`;

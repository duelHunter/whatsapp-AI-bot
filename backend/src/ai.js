// backend/src/ai.js

require('dotenv').config();
const axios = require('axios');
const { InferenceClient } = require('@huggingface/inference');

const AI_API_KEY = process.env.AI_API_KEY || 'ollama';
const AI_MODEL = process.env.AI_MODEL || 'qwen3-coder:30b';
const AI_URL = process.env.AI_BASE_URL || 'http://127.0.0.1:11434/v1/chat/completions';
const HF_EMBED_MODEL = process.env.HF_EMBED_MODEL || "BAAI/bge-base-en-v1.5";

const hfClient = process.env.HF_API_TOKEN ? new InferenceClient(process.env.HF_API_TOKEN) : null;

/**
 * Generate a natural language reply using KB snippets via NVIDIA (Mistral Medium 3.5).
 */
async function generateAIReply({
  userMessage,
  kbMatches = [],
  systemInstruction = "You are a helpful customer support assistant for this business. Use the provided knowledge base snippets as the main source of truth. If the answer is not clearly in the snippets, you can answer from general knowledge but keep it relevant to the business.",
}) {
  try {
    const kbContext = kbMatches
      .map(
        (m, i) =>
          `Snippet ${i + 1} (from "${m.title}", score: ${m.score?.toFixed?.(3) ?? "n/a"}):\n${m.text}`
      )
      .join("\n\n");

    const userPrompt = kbMatches.length
      ? `Use these knowledge base snippets when relevant:\n\n${kbContext}\n\nUser question:\n${userMessage}`
      : `No knowledge base snippets were retrieved.\n\nUser question:\n${userMessage}`;

    const response = await axios.post(AI_URL, {
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 1024,
      stream: false,
    }, {
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const output = response.data?.choices?.[0]?.message?.content?.trim() ||
      "I'm not sure, could you rephrase?";

    return output;
  } catch (err) {
    console.error("❌ generateAIReply Error:", err?.response?.data || err.message);
    return "AI Error: Something went wrong while generating a reply.";
  }
}

/**
 * Create embeddings using Hugging Face Inference SDK (BAAI/bge-base-en-v1.5).
 */
async function embedText(text) {
  try {
    if (!hfClient) {
      console.error("❌ Missing HF_API_TOKEN in .env");
      return [];
    }

    const output = await hfClient.featureExtraction({
      model: HF_EMBED_MODEL,
      inputs: text,
      provider: "hf-inference",
    });

    if (Array.isArray(output) && typeof output[0] === 'number') {
      return output;
    }
    if (Array.isArray(output) && Array.isArray(output[0])) {
      return output[0];
    }

    console.error("❌ Unexpected HF embedding response format:", typeof output);
    return [];

  } catch (err) {
    console.error("❌ embedText Error:", err);
    return [];
  }
}

module.exports = {
  generateAIReply,
  embedText,
};

// kb.js
const fs = require('fs');
const path = require('path');
const { embedText } = require('./gemini');

// Path to local "vector db"
const KB_PATH = path.join(__dirname, 'kb.json');

// Load KB from file or start empty
function loadKB() {
    if (!fs.existsSync(KB_PATH)) {
        return { chunks: [] };
    }
    const raw = fs.readFileSync(KB_PATH, 'utf8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse kb.json, starting fresh:', e);
        return { chunks: [] };
    }
}

// Save KB to file
function saveKB(kb) {
    fs.writeFileSync(KB_PATH, JSON.stringify(kb, null, 2), 'utf8');
}

// Simple text chunking: split into ~800-char blocks
function chunkText(text, maxLen = 800) {
    const sentences = text.split(/(?<=[\.!\?])\s+/);
    const chunks = [];
    let current = '';

    for (const s of sentences) {
        if ((current + ' ' + s).length > maxLen) {
            if (current.trim()) chunks.push(current.trim());
            current = s;
        } else {
            current += ' ' + s;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

// Common helper: take a big text, embed chunks, append to kb.json
async function addTextToKB(title, text) {
    const kb = loadKB();
    const chunks = chunkText(text);
    let added = 0;
  
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
  
      const embedding = await embedText(chunk); // calls Gemini embeddings
  
      kb.chunks.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        title,
        text: chunk,
        embedding,
      });
  
      added++;
    }
  
    saveKB(kb);
    return added;
  }


module.exports = {
    loadKB,
    saveKB,
    chunkText,
    addTextToKB,
    KB_PATH
};

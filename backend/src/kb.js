// kb.js
const fs = require('fs');
const path = require('path');

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

// Cosine similarity between two vectors
function cosineSim(a, b) {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

module.exports = {
    loadKB,
    saveKB,
    chunkText,
    cosineSim,
    KB_PATH
};

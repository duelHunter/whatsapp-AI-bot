// backend/src/services/receiptVerification.js
//
// Extracts structured fields (amount, date, reference, bank name) from a payment
// receipt photo using a vision-capable model, so an admin can cross-check it
// against the order at a glance. This is advisory only — extraction results are
// never used to auto-confirm an order, since a photo can be edited/faked. Failures
// here must never block receipt submission; they just mean the admin reviews
// without an extraction hint.

require('dotenv').config();
const axios = require('axios');

const AI_API_KEY = process.env.AI_API_KEY || 'ollama';
const AI_URL = process.env.AI_BASE_URL || 'http://127.0.0.1:11434/v1/chat/completions';
// Vision-capable models are a different capability than the text/tool-calling model
// used for chat (e.g. qwen3-coder/gemma4 may not accept images). Point this at a
// vision model pulled on the same Ollama instance (e.g. "llava:latest", "llama3.2-vision"),
// or override with a hosted vision-capable endpoint.
const VISION_AI_MODEL = process.env.VISION_AI_MODEL || 'llava:latest';

const EXTRACTION_PROMPT = `You are looking at a photo of a bank transfer / payment receipt.
Extract the following fields and respond with ONLY a JSON object, no other text:
{
  "amount": <number or null>,
  "currency": <string or null>,
  "reference": <string or null, the transaction/reference number if visible>,
  "date": <string or null, as shown on the receipt>,
  "bank_name": <string or null>,
  "confidence": <"high", "medium", or "low" — how confident you are this is a genuine, legible bank receipt>
}
If the image is not a bank receipt, or text is not legible, use null for the fields you cannot read and "low" confidence.`;

function extractJson(text) {
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

/**
 * @param {Buffer} mediaBuffer - raw image bytes
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<{amount: number|null, currency: string|null, reference: string|null,
 *   date: string|null, bankName: string|null, confidence: string|null, notes: string|null}>}
 */
async function extractReceiptData(mediaBuffer, mimeType) {
    const fallback = {
        amount: null, currency: null, reference: null,
        date: null, bankName: null, confidence: null,
        notes: 'Extraction not available',
    };

    if (!mediaBuffer || !mimeType?.startsWith('image/')) {
        return { ...fallback, notes: 'Not an image — extraction skipped' };
    }

    try {
        const base64 = mediaBuffer.toString('base64');
        const response = await axios.post(AI_URL, {
            model: VISION_AI_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: EXTRACTION_PROMPT },
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
                    ],
                },
            ],
            temperature: 0,
            max_tokens: 400,
            stream: false,
        }, {
            headers: {
                Authorization: `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            timeout: 30000,
        });

        const content = response.data?.choices?.[0]?.message?.content;
        const parsed = extractJson(content);
        if (!parsed) {
            console.warn('⚠️ Receipt extraction: model did not return parseable JSON');
            return { ...fallback, notes: 'Model response was not valid JSON' };
        }

        return {
            amount: typeof parsed.amount === 'number' ? parsed.amount : null,
            currency: parsed.currency || null,
            reference: parsed.reference || null,
            date: parsed.date || null,
            bankName: parsed.bank_name || null,
            confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : null,
            notes: null,
        };
    } catch (err) {
        console.error('❌ Receipt extraction failed:', err?.response?.data || err.message);
        return { ...fallback, notes: `Extraction error: ${err.message}` };
    }
}

module.exports = { extractReceiptData };

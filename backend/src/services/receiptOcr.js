// backend/src/services/receiptOcr.js
//
// Alternative to receiptVerification.js's vision-model extraction: plain OCR
// (Tesseract) + regex parsing. No model download, no API key, runs fully local.
// Same output shape as extractReceiptData() so the two are drop-in comparable.
// Advisory only — see receiptVerification.js for why this must never auto-confirm
// an order.

const { createWorker } = require('tesseract.js');

const AMOUNT_PATTERN = /(?:amount|total|paid|amt)[^\d]{0,15}([\d][\d,]*\.\d{2})/i;
const FALLBACK_AMOUNT_PATTERN = /(\d{1,3}(?:,\d{3})*\.\d{2})/;
const REFERENCE_PATTERN = /(?:ref(?:erence)?|txn|transaction)[^\w]{0,5}(?:no\.?|id|number)?[:\s]*([A-Za-z0-9\-]{5,})/i;
const DATE_PATTERN = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})/;
const BANK_PATTERN = /([A-Za-z][A-Za-z\s]{2,30}\bBank\b)/i;

function parseAmount(text) {
    const m = text.match(AMOUNT_PATTERN) || text.match(FALLBACK_AMOUNT_PATTERN);
    if (!m) return null;
    const n = Number(m[1].replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
}

/**
 * @param {Buffer} mediaBuffer - raw image bytes
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<{amount, currency, reference, date, bankName, confidence, notes, rawText}>}
 */
async function extractReceiptDataOCR(mediaBuffer, mimeType) {
    const fallback = {
        amount: null, currency: null, reference: null,
        date: null, bankName: null, confidence: null,
        notes: 'Extraction not available', rawText: '',
    };

    if (!mediaBuffer || !mimeType?.startsWith('image/')) {
        return { ...fallback, notes: 'Not an image — extraction skipped' };
    }

    let worker;
    try {
        worker = await createWorker('eng');
        const { data: { text, confidence } } = await worker.recognize(mediaBuffer);

        if (!text || !text.trim()) {
            return { ...fallback, notes: 'OCR found no legible text', rawText: '' };
        }

        const referenceMatch = text.match(REFERENCE_PATTERN);
        const dateMatch = text.match(DATE_PATTERN);
        const bankMatch = text.match(BANK_PATTERN);

        return {
            amount: parseAmount(text),
            currency: null, // Tesseract doesn't identify currency symbols reliably enough to trust
            reference: referenceMatch ? referenceMatch[1] : null,
            date: dateMatch ? dateMatch[1] : null,
            bankName: bankMatch ? bankMatch[1].trim() : null,
            // Tesseract's own word-confidence (0-100) as a rough proxy — this reflects
            // legibility, not whether the parsed fields are actually correct.
            confidence: confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low',
            notes: null,
            rawText: text.trim(),
        };
    } catch (err) {
        console.error('❌ OCR extraction failed:', err.message);
        return { ...fallback, notes: `OCR error: ${err.message}` };
    } finally {
        if (worker) await worker.terminate();
    }
}

module.exports = { extractReceiptDataOCR };

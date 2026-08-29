// Standalone test for the Tesseract-based OCR extraction (alternative to the
// vision-LLM path in testReceiptExtraction.js). No WhatsApp, DB, or vision model
// required — runs fully local.
// Usage: node scripts/testReceiptOcr.js path/to/receipt.jpg

const fs = require('fs');
const path = require('path');
const { extractReceiptDataOCR } = require('../src/services/receiptOcr');

const MIME_BY_EXT = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
};

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: node scripts/testReceiptOcr.js path/to/receipt.jpg');
        process.exit(1);
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_BY_EXT[ext];
    if (!mimeType) {
        console.error(`Unsupported extension "${ext}". Supported: ${Object.keys(MIME_BY_EXT).join(', ')}`);
        process.exit(1);
    }

    const buffer = fs.readFileSync(filePath);
    console.log(`Running Tesseract OCR on ${filePath} (${mimeType}, ${buffer.length} bytes)...`);

    const start = Date.now();
    const result = await extractReceiptDataOCR(buffer, mimeType);
    console.log(`Done in ${Date.now() - start}ms\n`);

    const { rawText, ...parsed } = result;
    console.log('Parsed fields:', JSON.stringify(parsed, null, 2));
    console.log('\n--- Raw OCR text ---');
    console.log(rawText || '(none)');
}

main().catch(err => {
    console.error('❌ Test script failed:', err);
    process.exit(1);
});

// Standalone test for the receipt OCR/vision extraction, no WhatsApp or DB involved.
// Usage: node scripts/testReceiptExtraction.js path/to/receipt.jpg

const fs = require('fs');
const path = require('path');
const { extractReceiptData } = require('../src/services/receiptVerification');

const MIME_BY_EXT = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
};

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: node scripts/testReceiptExtraction.js path/to/receipt.jpg');
        process.exit(1);
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_BY_EXT[ext];
    if (!mimeType) {
        console.error(`Unsupported extension "${ext}". Supported: ${Object.keys(MIME_BY_EXT).join(', ')}`);
        process.exit(1);
    }

    const buffer = fs.readFileSync(filePath);
    console.log(`Sending ${filePath} (${mimeType}, ${buffer.length} bytes) to VISION_AI_MODEL=${process.env.VISION_AI_MODEL || 'llava:latest'}...`);

    const start = Date.now();
    const result = await extractReceiptData(buffer, mimeType);
    console.log(`Done in ${Date.now() - start}ms\n`);
    console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
    console.error('❌ Test script failed:', err);
    process.exit(1);
});

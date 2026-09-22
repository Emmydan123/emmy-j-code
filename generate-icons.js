const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'icons');
fs.mkdirSync(dir, { recursive: true });

(async () => {
  const sizes = [192, 512];

  for (const size of sizes) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#5b4bdb"/>
            <stop offset="100%" stop-color="#2c256f"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="116" fill="url(#bg)"/>
        <rect x="56" y="56" width="400" height="400" rx="94" fill="rgba(255,255,255,0.08)"/>
        <text x="256" y="300" text-anchor="middle" font-size="180" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#ffffff">EJ</text>
      </svg>
    `;

    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(dir, `icon-${size}.png`));
  }

  console.log('Generated icons:', sizes.map((s) => `icon-${s}.png`).join(', '));
})();

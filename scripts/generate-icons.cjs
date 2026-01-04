const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG lock icon
const lockSvg = `
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#grad)"/>
  <path d="M 48 50 L 48 42 Q 48 32 56 32 L 72 32 Q 80 32 80 42 L 80 50"
        stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/>
  <rect x="42" y="50" width="44" height="32" rx="4" fill="white"/>
  <circle cx="64" cy="66" r="4" fill="#3b82f6"/>
  <rect x="62" y="66" width="4" height="10" fill="#3b82f6"/>
</svg>
`;

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}.png`);

    await sharp(Buffer.from(lockSvg))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated icon-${size}.png`);
  }

  console.log('✓ All icons generated successfully');
}

generateIcons().catch(console.error);

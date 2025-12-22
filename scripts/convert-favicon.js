import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';

const svg = readFileSync('static/logo.svg', 'utf8');

// Create PNG at different sizes for favicon
const sizes = [
  { size: 32, name: 'favicon.png' },
  { size: 192, name: 'logo-192.png' },
  { size: 512, name: 'logo-512.png' }
];

for (const { size, name } of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size }
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  writeFileSync(`static/${name}`, pngBuffer);
  console.log(`Created static/${name} (${size}x${size})`);
}

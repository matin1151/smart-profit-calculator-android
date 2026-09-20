import { mkdir, copyFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';

const copies = [
  ['node_modules/vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf', 'www/fonts/Vazirmatn-Regular.ttf'],
  ['node_modules/xlsx/dist/xlsx.full.min.js', 'www/vendor/xlsx.full.min.js']
];

for (const [source, destination] of copies) {
  await mkdir(destination.substring(0, destination.lastIndexOf('/')), { recursive: true });
  try {
    await access(source);
  } catch {
    throw new Error(`Dependency asset not found: ${source}`);
  }
  await copyFile(source, destination);
  console.log(`Prepared ${destination}`);
}

import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';
import sharp from 'sharp';

const root = path.resolve(process.cwd());
const docs = root;
const patterns = [
  path.join(docs, '*.jpg'),
  path.join(docs, '*.jpeg'),
  path.join(docs, '*.png')
];

function findImages(patterns){
  return patterns.flatMap(p => glob.sync(p, { nodir: true }));
}

async function convert(file){
  const dir = path.dirname(file);
  const base = path.basename(file, path.extname(file));
  const out = path.join(dir, base + '.webp');
  try {
    const buf = await sharp(file).webp({ quality: 82 }).toBuffer();
    await fs.writeFile(out, buf);
    console.log('Converted', path.relative(docs, file), '->', path.relative(docs, out));
  } catch (e) {
    console.warn('Skip', file, e.message);
  }
}

async function main(){
  const files = findImages(patterns);
  await Promise.all(files.map(convert));
}

main().catch(err => { console.error(err); process.exit(1); });

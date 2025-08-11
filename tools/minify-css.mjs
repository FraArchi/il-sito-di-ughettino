// Minifica CSS con cssnano
import fs from 'fs';
import cssnano from 'cssnano';
import postcss from 'postcss';

const files = [
  { src: 'docs/style.css', dest: 'docs/style.min.css' },
  { src: 'docs/ugoAI.css', dest: 'docs/ugoAI.min.css' }
];

for (const { src, dest } of files) {
  const css = fs.readFileSync(src, 'utf8');
  postcss([cssnano])
    .process(css, { from: src, to: dest })
    .then(result => {
      fs.writeFileSync(dest, result.css);
      console.log(`Minificato: ${dest}`);
    })
    .catch(err => {
      console.error(`Errore minifica ${src}:`, err);
    });
}

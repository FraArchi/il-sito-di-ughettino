// Minifica tutti i CSS nella cartella docs/ con cssnano
import fs from 'fs';
import path from 'path';
import cssnano from 'cssnano';
import postcss from 'postcss';

const cssDir = path.resolve('docs');
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && !f.endsWith('.min.css'));

for (const file of files) {
  const src = path.join(cssDir, file);
  const dest = path.join(cssDir, file.replace(/\.css$/, '.min.css'));
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

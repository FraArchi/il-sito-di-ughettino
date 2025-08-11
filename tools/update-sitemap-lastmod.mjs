import fs from 'node:fs';
import path from 'node:path';

const sitemapPath = path.resolve('docs', 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error('sitemap.xml non trovato in docs/');
  process.exit(0);
}

let xml = fs.readFileSync(sitemapPath, 'utf8');

// ISO 8601 con +00:00
const nowISO = new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');

// Aggiorna o inserisce <lastmod> per ogni <url>
xml = xml.replace(/<url>([\s\S]*?)<\/url>/g, (match, inner) => {
  let updated = inner;
  if (/<lastmod>.*?<\/lastmod>/.test(inner)) {
    updated = inner.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${nowISO}</lastmod>`);
  } else {
    // Inserisce lastmod prima di </url>
    updated = inner.replace(/\s*$/, `\n    <lastmod>${nowISO}</lastmod>\n  `);
  }
  return `<url>${updated}</url>`;
});

fs.writeFileSync(sitemapPath, xml, 'utf8');
console.log(`Aggiornati i tag <lastmod> a: ${nowISO}`);
#!/usr/bin/env node

/**
 * Parses Daggerheart consumables from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-consumables.js [path-to-html]
 * Defaults to data/consumables.html in project root.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'consumables.html');
const html = fs.readFileSync(filePath, 'utf-8');

function stripHtml(str) {
  return str
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .trim();
}

const rowRegex = /<tr class="armourPiece"[^>]*>([\s\S]*?)<\/tr>/g;
const nameRegex = /<td class="name">([\s\S]*?)<\/td>/;
const descRegex = /<td class="description">([\s\S]*?)<\/td>/;

const results = [];
let match;

while ((match = rowRegex.exec(html)) !== null) {
  const rowHtml = match[1];

  const nameMatch = rowHtml.match(nameRegex);
  const descMatch = rowHtml.match(descRegex);

  if (nameMatch && descMatch) {
    results.push({
      name: stripHtml(nameMatch[1]),
      description: stripHtml(descMatch[1]),
    });
  }
}

if (flags.includes('--count')) {
  console.log(`Found ${results.length} consumables:\n`);
  results.forEach(c => console.log(`  - ${c.name}`));
} else {
  console.log(JSON.stringify(results, null, 2));
}

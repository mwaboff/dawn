#!/usr/bin/env node

/**
 * Parses Daggerheart items from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-items.js [path-to-html]
 * Defaults to data/items.html in project root.
 *
 * Use --count flag for summary instead of full JSON output.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'items.html');
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

const results = [];

const trRegex = /<tr class="armourPiece"[^>]*data-name="([^"]*)"[^>]*data-description="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g;
let trMatch;

while ((trMatch = trRegex.exec(html)) !== null) {
  const dataName = trMatch[1].trim();
  const dataDescription = trMatch[2].trim();
  const trHtml = trMatch[3];

  // Parse name from td content, fall back to data attribute
  const nameTdMatch = trHtml.match(/<td class="name">([\s\S]*?)<\/td>/);
  const name = nameTdMatch ? stripHtml(nameTdMatch[1]) : stripHtml(dataName);

  // Parse description from td content, fall back to data attribute
  const descTdMatch = trHtml.match(/<td class="description">([\s\S]*?)<\/td>/);
  const description = descTdMatch ? stripHtml(descTdMatch[1]) : stripHtml(dataDescription);

  results.push({
    name,
    description,
  });
}

if (flags.includes('--count')) {
  console.log(`Parsed ${results.length} items`);
  results.forEach(r => {
    console.log(`  ${r.name}`);
  });
} else {
  console.log(JSON.stringify(results, null, 2));
}

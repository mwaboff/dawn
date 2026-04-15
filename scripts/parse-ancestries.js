#!/usr/bin/env node

/**
 * Parses Daggerheart ancestries from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-ancestries.js [path-to-html]
 * Defaults to data/ancestries.html in project root.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'ancestries.html');
const html = fs.readFileSync(filePath, 'utf-8');

function stripHtml(str) {
  return str
    .replace(/<strong>(.*?)<\/strong>/g, '$1')
    .replace(/<em>(.*?)<\/em>/g, '$1')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
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

function firstSentence(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(.*?[.!?])(?:\s|$)/);
  return match ? match[1].trim() : normalized;
}

// Find all ancestry card block start positions
const cardStarts = [];
const startRegex = /<div class="ancestry card text"[^>]*>/g;
let startMatch;
while ((startMatch = startRegex.exec(html)) !== null) {
  cardStarts.push({ index: startMatch.index });
}

const ancestries = [];

for (let i = 0; i < cardStarts.length; i++) {
  const start = cardStarts[i].index;
  const end = i + 1 < cardStarts.length ? cardStarts[i + 1].index : html.length;
  const cardHtml = html.substring(start, end);

  // Extract name
  const nameMatch = cardHtml.match(/<h2 class="name"[^>]*>([\s\S]*?)<\/h2>/);
  const name = nameMatch ? stripHtml(nameMatch[1]) : '';

  // Extract description (div with view-transition-name for description, first sentence only)
  const descMatch = cardHtml.match(/view-transition-name: ancestry-[^"]*-description;">([\s\S]*?)<\/div>/);
  const fullDescription = descMatch ? stripHtml(descMatch[1]) : '';
  const description = firstSentence(fullDescription);

  // Extract features — each <p><strong>Name:</strong> text</p>
  const features = [];
  const featureRegex = /<p><strong>(.*?):<\/strong>([\s\S]*?)<\/p>/g;
  let featureMatch;
  while ((featureMatch = featureRegex.exec(cardHtml)) !== null) {
    const featureName = stripHtml(featureMatch[1]);
    const featureDescription = stripHtml(featureMatch[2]).replace(/^\s+/, '');
    features.push({ name: featureName, description: featureDescription });
  }

  ancestries.push({ name, description, features });
}

// Output
if (flags.includes('--count')) {
  console.log(`Parsed ${ancestries.length} ancestries`);
  ancestries.forEach(a => {
    console.log(`  ${a.name} — ${a.features.map(f => f.name).join(', ')}`);
  });
} else {
  console.log(JSON.stringify(ancestries, null, 2));
}

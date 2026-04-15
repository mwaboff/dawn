#!/usr/bin/env node

/**
 * Parses Daggerheart communities from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-communities.js [path-to-html]
 * Defaults to data/communities.html in project root.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'communities.html');
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

// Find all community card block start positions
const cardStarts = [];
const startRegex = /<div class="community card text"[^>]*>/g;
let match;
while ((match = startRegex.exec(html)) !== null) {
  cardStarts.push({ index: match.index });
}

const communities = [];

for (let i = 0; i < cardStarts.length; i++) {
  const start = cardStarts[i].index;
  const end = i + 1 < cardStarts.length ? cardStarts[i + 1].index : html.length;
  const cardHtml = html.substring(start, end);

  // Extract name
  const nameMatch = cardHtml.match(/<h3 class="name">([\s\S]*?)<\/h3>/);
  const name = nameMatch ? stripHtml(nameMatch[1]) : '';

  // Extract description
  const descMatch = cardHtml.match(/<div class="description">([\s\S]*?)<\/div>/);
  const description = descMatch ? stripHtml(descMatch[1]) : '';

  // Extract feature name and description
  const featureMatch = cardHtml.match(/<div class="feature"><strong>(.*?):<\/strong>([\s\S]*?)<\/div>/);
  const featureName = featureMatch ? stripHtml(featureMatch[1]) : '';
  const featureDescription = featureMatch ? stripHtml(featureMatch[2]) : '';

  communities.push({
    name,
    description,
    featureName,
    featureDescription,
  });
}

// Output
if (flags.includes('--count')) {
  console.log(`Parsed ${communities.length} communities`);
  communities.forEach(c => {
    console.log(`  ${c.name} — ${c.featureName}`);
  });
} else {
  console.log(JSON.stringify(communities, null, 2));
}

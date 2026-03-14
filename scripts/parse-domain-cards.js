#!/usr/bin/env node

/**
 * Parses Daggerheart domain cards from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-domain-cards.js [path-to-html]
 * Defaults to DOMAINCRDS.html in project root.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'DOMAINCRDS.html');
const html = fs.readFileSync(filePath, 'utf-8');

const DOMAIN_IDS = {
  'Arcana': 1,
  'Blade': 2,
  'Bone': 3,
  'Codex': 4,
  'Grace': 5,
  'Midnight': 6,
  'Sage': 7,
  'Splendor': 8,
  'Valor': 9,
};

const TYPE_MAP = {
  'Spell': 'SPELL',
  'Ability': 'ABILITY',
  'Grimoire': 'GRIMOIRE',
  'Transformation': 'TRANSFORMATION',
  'Wild': 'WILD',
};

// Extract all card divs
const cardRegex = /<div class="ability card text" id="([^"]*)">([\s\S]*?)(?=<div class="ability card text"|<\/div>\s*<\/div>\s*<\/div>)/g;

// More robust: split on card boundaries
const cardStarts = [];
const startRegex = /<div class="ability card text" id="([^"]*)"/g;
let match;
while ((match = startRegex.exec(html)) !== null) {
  cardStarts.push({ id: match[1], index: match.index });
}

const cards = [];

for (let i = 0; i < cardStarts.length; i++) {
  const start = cardStarts[i].index;
  const end = i + 1 < cardStarts.length ? cardStarts[i + 1].index : html.length;
  const cardHtml = html.substring(start, end);

  // Extract name
  const nameMatch = cardHtml.match(/<h3 class="name">([\s\S]*?)<\/h3>/);
  const name = nameMatch ? nameMatch[1].trim() : cardStarts[i].id;

  // Extract level
  const levelMatch = cardHtml.match(/<span class="level">Level (\d+)<\/span>/);
  const level = levelMatch ? parseInt(levelMatch[1], 10) : 0;

  // Extract domain
  const domainMatch = cardHtml.match(/<span class="domain">([^<]+)<\/span>/);
  const domain = domainMatch ? domainMatch[1].trim() : '';

  // Extract type
  const typeMatch = cardHtml.match(/<span class="type">([^<]+)<\/span>/);
  const type = typeMatch ? typeMatch[1].trim() : '';

  // Extract recall cost
  const recallMatch = cardHtml.match(/Recall cost:<\/span>\s*(\d+)/);
  const recallCost = recallMatch ? parseInt(recallMatch[1], 10) : 0;

  // Extract text content
  const textMatch = cardHtml.match(/<div class="text">([\s\S]*?)<\/div>/);
  const rawText = textMatch ? textMatch[1].trim() : '';

  cards.push({
    name,
    level,
    domain,
    type,
    recallCost,
    rawText,
  });
}

// Output
if (flags.includes('--count')) {
  console.log(`Parsed ${cards.length} cards`);
  const typeCounts = {};
  cards.forEach(c => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  console.log('By type:', typeCounts);
  const domainCounts = {};
  cards.forEach(c => { domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1; });
  console.log('By domain:', domainCounts);
} else {
  console.log(JSON.stringify(cards, null, 2));
}

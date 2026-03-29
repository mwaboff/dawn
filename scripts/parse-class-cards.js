#!/usr/bin/env node

/**
 * Parses Daggerheart classes from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-class-cards.js [path-to-html]
 * Defaults to data/class-raw.html in project root.
 *
 * Use --count flag for summary instead of full JSON output.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'class-raw.html');
const html = fs.readFileSync(filePath, 'utf-8');

const DOMAIN_MAP = {
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

const articleRegex = /<article class="class section"[^>]*>([\s\S]*?)<\/article>/g;
let articleMatch;

while ((articleMatch = articleRegex.exec(html)) !== null) {
  const articleHtml = articleMatch[1];

  // Class name
  const nameMatch = articleHtml.match(/<h2 class="name">(.*?)<\/h2>/);
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

  // Description (first div inside text-columns-2)
  const descMatch = articleHtml.match(/<div class="text text-columns-2">\s*<div>([\s\S]*?)<\/div>/);
  const description = descMatch ? stripHtml(descMatch[1]) : '';

  // Domains
  const domains = [];
  const domainRegex = /<span class="name">\s*([\w]+)\s*<\/span>/g;
  let domainMatch;
  while ((domainMatch = domainRegex.exec(articleHtml)) !== null) {
    const domainName = domainMatch[1].trim();
    if (DOMAIN_MAP[domainName]) {
      domains.push({ name: domainName, id: DOMAIN_MAP[domainName] });
    }
  }

  // Starting evasion
  const evasionMatch = articleHtml.match(/<strong>Starting evasion:<\/strong>\s*(\d+)/);
  const startingEvasion = evasionMatch ? parseInt(evasionMatch[1], 10) : null;

  // Starting HP
  const hpMatch = articleHtml.match(/<strong>Starting HP:<\/strong>\s*(\d+)/);
  const startingHitPoints = hpMatch ? parseInt(hpMatch[1], 10) : null;

  // Class items
  const itemsMatch = articleHtml.match(/<strong>Class items:<\/strong>\s*(.*?)<\/div>/);
  const startingClassItems = itemsMatch ? itemsMatch[1].trim() : null;

  // Hope feature
  const hopeMatch = articleHtml.match(/<h3>.*?hope feature<\/h3>\s*<div><strong>(.*?):<\/strong>\s*([\s\S]*?)<\/div>/);
  const hopeFeature = hopeMatch ? {
    name: hopeMatch[1].trim(),
    description: stripHtml(hopeMatch[2]),
  } : null;

  // Subclasses
  const subclasses = [];
  const subclassSection = articleHtml.match(/<h3>Subclasses:<\/h3>\s*<ul>([\s\S]*?)<\/ul>/);
  if (subclassSection) {
    const subclassRegex = /<a[^>]*>(.*?)<\/a>/g;
    let scMatch;
    while ((scMatch = subclassRegex.exec(subclassSection[1])) !== null) {
      subclasses.push(scMatch[1].trim());
    }
  }

  results.push({
    name,
    description,
    domains,
    startingEvasion,
    startingHitPoints,
    startingClassItems,
    hopeFeature,
    subclasses,
  });
}

if (flags.includes('--count')) {
  console.log(`Parsed ${results.length} classes`);
  results.forEach(r => {
    console.log(`  ${r.name}: domains=[${r.domains.map(d => d.name).join(', ')}], evasion=${r.startingEvasion}, hp=${r.startingHitPoints}, hopeFeature=${r.hopeFeature?.name || 'none'}, subclasses=[${r.subclasses.join(', ')}]`);
  });
} else {
  console.log(JSON.stringify(results, null, 2));
}

#!/usr/bin/env node

/**
 * Parses Daggerheart subclass cards from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-subclass-cards.js [path-to-html]
 * Defaults to data/subclass-raw.html in project root.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'subclass-raw.html');
const html = fs.readFileSync(filePath, 'utf-8');

const TRAIT_MAP = {
  'Agility': 'AGILITY',
  'Strength': 'STRENGTH',
  'Finesse': 'FINESSE',
  'Instinct': 'INSTINCT',
  'Presence': 'PRESENCE',
  'Knowledge': 'KNOWLEDGE',
};

const LEVEL_MAP = {
  'Foundation': 'FOUNDATION',
  'Specializations': 'SPECIALIZATION',
  'Masteries': 'MASTERY',
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

function extractFeatures(sectionHtml) {
  const features = [];
  const featureRegex = /<p><strong>(.*?):<\/strong>\s*([\s\S]*?)<\/p>/g;
  let match;
  while ((match = featureRegex.exec(sectionHtml)) !== null) {
    const name = match[1].trim();
    const description = stripHtml(match[2]).trim();
    features.push({ name, description });
  }
  return features;
}

// Parse class headings and article blocks
let currentClass = null;
const results = [];

// Split by h2 class headers
const classRegex = /<h2 id="([^"]+)">([^<]+)<\/h2>/g;
const classPositions = [];
let classMatch;
while ((classMatch = classRegex.exec(html)) !== null) {
  classPositions.push({
    name: classMatch[2].trim(),
    index: classMatch.index,
  });
}

// Extract articles
const articleRegex = /<article class="subclass"[^>]*>([\s\S]*?)<\/article>/g;
let articleMatch;

while ((articleMatch = articleRegex.exec(html)) !== null) {
  const articleHtml = articleMatch[1];
  const articleIndex = articleMatch.index;

  // Determine which class this article belongs to
  currentClass = null;
  for (let i = classPositions.length - 1; i >= 0; i--) {
    if (articleIndex > classPositions[i].index) {
      currentClass = classPositions[i].name;
      break;
    }
  }

  // Extract subclass path name
  const nameMatch = articleHtml.match(/<h3 class="name"[^>]*>([\s\S]*?)<\/h3>/);
  const subclassPathName = nameMatch ? nameMatch[1].trim() : 'Unknown';

  // Extract spellcast trait
  const traitMatch = articleHtml.match(/<h4>Spellcast trait<\/h4>\s*<div>(.*?)<\/div>/);
  const traitText = traitMatch ? traitMatch[1].trim() : '';
  const spellcastingTrait = TRAIT_MAP[traitText] || null;

  // Extract features by level
  const levels = ['Foundation', 'Specializations', 'Masteries'];
  for (const level of levels) {
    const levelRegex = new RegExp(
      `<h4>${level} features<\\/h4>\\s*([\\s\\S]*?)(?=<\\/div>)`,
    );
    const levelMatch = articleHtml.match(levelRegex);
    if (levelMatch) {
      const features = extractFeatures(levelMatch[1]);
      results.push({
        className: currentClass,
        subclassPathName,
        spellcastingTrait,
        level: LEVEL_MAP[level],
        features,
        rawHtml: levelMatch[1].trim(),
      });
    }
  }
}

if (flags.includes('--count')) {
  console.log(`Parsed ${results.length} subclass cards across ${classPositions.length} classes`);
  const classCounts = {};
  results.forEach(r => { classCounts[r.className] = (classCounts[r.className] || 0) + 1; });
  console.log('By class:', classCounts);
  const levelCounts = {};
  results.forEach(r => { levelCounts[r.level] = (levelCounts[r.level] || 0) + 1; });
  console.log('By level:', levelCounts);
} else {
  console.log(JSON.stringify(results, null, 2));
}

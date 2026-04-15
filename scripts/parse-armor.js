#!/usr/bin/env node

/**
 * Parses Daggerheart armor from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-armor.js [path-to-html]
 * Defaults to data/armor.html in project root.
 *
 * Use --count flag for summary instead of full JSON output.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'armor.html');
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

const trRegex = /<tr class="armourPiece"[^>]*data-name="([^"]*)"[^>]*data-tier="([^"]*)"[^>]*data-thresholds="([^"]*)"[^>]*data-score="([^"]*)"[^>]*data-feature="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g;
let trMatch;

while ((trMatch = trRegex.exec(html)) !== null) {
  const name = trMatch[1].trim();
  const tier = parseInt(trMatch[2], 10);
  const thresholds = trMatch[3].trim();
  const baseScore = parseInt(trMatch[4], 10);
  const trHtml = trMatch[6];

  // Parse thresholds from data attribute
  const thresholdParts = thresholds.split(' / ');
  const baseMajorThreshold = parseInt(thresholdParts[0], 10);
  const baseSevereThreshold = parseInt(thresholdParts[1], 10);

  // Parse feature from td content
  const featureTdMatch = trHtml.match(/<td class="feature">([\s\S]*?)<\/td>/);
  const featureTdContent = featureTdMatch ? featureTdMatch[1].trim() : '';

  const armor = {
    name,
    tier,
    baseMajorThreshold,
    baseSevereThreshold,
    baseScore,
  };

  if (featureTdContent) {
    const strongMatch = featureTdContent.match(/<strong>(.*?):<\/strong>/);
    if (strongMatch) {
      armor.featureName = strongMatch[1].trim();
      // Get description: everything after the </strong> tag
      const descriptionRaw = featureTdContent.replace(/<strong>.*?<\/strong>/, '').trim();
      armor.featureDescription = stripHtml(descriptionRaw);
    }
  }

  results.push(armor);
}

if (flags.includes('--count')) {
  console.log(`Parsed ${results.length} armors`);
  results.forEach(r => {
    console.log(`  ${r.name}: tier=${r.tier}, score=${r.baseScore}, feature=${r.featureName || 'none'}`);
  });
} else {
  console.log(JSON.stringify(results, null, 2));
}

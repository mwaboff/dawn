#!/usr/bin/env node

/**
 * Parses Daggerheart weapons from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-weapons.js [path-to-html]
 * Defaults to data/weapons.html in project root.
 *
 * Use --count flag for summary instead of full JSON output.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'weapons.html');
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

const rangeMap = {
  'Melee': 'MELEE',
  'Very Close': 'VERY_CLOSE',
  'Close': 'CLOSE',
  'Far': 'FAR',
  'Very Far': 'VERY_FAR',
};

const burdenMap = {
  'One-Handed': 'ONE_HANDED',
  'Two-Handed': 'TWO_HANDED',
};

const damageTypeMap = {
  'Physical': 'PHYSICAL',
  'Magical': 'MAGIC',
};

const results = [];
let currentTier = 0;

// Find all tier headings and their positions
const tierRegex = /<h2[^>]*>\s*Tier\s+(\d+)\b/gi;
const tierPositions = [];
let tierMatch;
while ((tierMatch = tierRegex.exec(html)) !== null) {
  tierPositions.push({ tier: parseInt(tierMatch[1], 10), index: tierMatch.index });
}

const trRegex = /<tr class="weapon"[^>]*data-name="([^"]*)"[^>]*data-cat="([^"]*)"[^>]*data-damage_type="([^"]*)"[^>]*data-trait="([^"]*)"[^>]*data-range="([^"]*)"[^>]*data-die="([^"]*)"[^>]*data-burden="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g;
let trMatch;

while ((trMatch = trRegex.exec(html)) !== null) {
  const trIndex = trMatch.index;

  // Determine current tier based on position
  for (let i = tierPositions.length - 1; i >= 0; i--) {
    if (trIndex > tierPositions[i].index) {
      currentTier = tierPositions[i].tier;
      break;
    }
  }

  const name = trMatch[1].trim();
  const cat = trMatch[2].trim();
  const damageType = trMatch[3].trim();
  const trait = trMatch[4].trim();
  const range = trMatch[5].trim();
  const die = trMatch[6].trim();
  const burden = trMatch[7].trim();
  const trHtml = trMatch[8];

  // Parse damage text from td
  const damageTdMatch = trHtml.match(/<td class="damage">([\s\S]*?)<\/td>/);
  const damageText = damageTdMatch ? damageTdMatch[1].trim() : '';
  const modifierMatch = damageText.match(/d\d+\+(\d+)/);
  const modifier = modifierMatch ? parseInt(modifierMatch[1], 10) : 0;

  // Parse feature from td
  const featureTdMatch = trHtml.match(/<td class="feature">([\s\S]*?)<\/td>/);
  const featureTdContent = featureTdMatch ? featureTdMatch[1].trim() : '';

  const weapon = {
    name,
    tier: currentTier,
    isPrimary: cat === 'Primary',
    trait: trait.toUpperCase(),
    range: rangeMap[range] || range.toUpperCase(),
    burden: burdenMap[burden] || burden.toUpperCase(),
    damage: {
      diceCount: 1,
      diceType: die.toUpperCase(),
      modifier,
      damageType: damageTypeMap[damageType] || damageType.toUpperCase(),
    },
  };

  // Parse feature name and description
  if (featureTdContent) {
    const strongMatch = featureTdContent.match(/<strong>(.*?):<\/strong>/);
    if (strongMatch) {
      const featureName = strongMatch[1].trim();
      // Empty feature: <strong>:</strong> with no name text
      if (featureName) {
        weapon.featureName = featureName;
        const descriptionRaw = featureTdContent.replace(/<strong>.*?<\/strong>/, '').trim();
        weapon.featureDescription = stripHtml(descriptionRaw);
      }
    }
  }

  results.push(weapon);
}

if (flags.includes('--count')) {
  console.log(`Parsed ${results.length} weapons`);
  results.forEach(r => {
    console.log(`  ${r.name}: tier=${r.tier}, trait=${r.trait}, range=${r.range}, die=${r.damage.diceType}, feature=${r.featureName || 'none'}`);
  });
} else {
  console.log(JSON.stringify(results, null, 2));
}

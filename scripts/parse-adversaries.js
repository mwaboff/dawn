#!/usr/bin/env node

/**
 * Parses Daggerheart adversaries from HTML and outputs structured JSON.
 *
 * Usage: node scripts/parse-adversaries.js [path-to-html]
 * Defaults to data/adversaries.html in project root.
 *
 * Use --count flag for summary instead of full JSON output.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'data', 'adversaries.html');
const html = fs.readFileSync(filePath, 'utf-8');

const RANGE_MAP = {
  'Melee': 'MELEE',
  'Very Close': 'VERY_CLOSE',
  'Close': 'CLOSE',
  'Far': 'FAR',
  'Very Far': 'VERY_FAR',
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

function parseDamage(damageStr) {
  if (!damageStr) return null;
  const diceMatch = damageStr.match(/(\d+)d(\d+)(?:\+(\d+))?\s*(phy|mag)/);
  if (diceMatch) {
    return {
      diceCount: parseInt(diceMatch[1], 10),
      diceType: 'D' + diceMatch[2],
      modifier: diceMatch[3] ? parseInt(diceMatch[3], 10) : 0,
      damageType: diceMatch[4] === 'phy' ? 'PHYSICAL' : 'MAGIC',
    };
  }
  const flatMatch = damageStr.match(/^(\d+)\s*(phy|mag)$/);
  if (flatMatch) {
    return {
      diceCount: 0,
      diceType: null,
      modifier: parseInt(flatMatch[1], 10),
      damageType: flatMatch[2] === 'phy' ? 'PHYSICAL' : 'MAGIC',
    };
  }
  return null;
}

function parseThresholds(thresholdStr) {
  if (!thresholdStr || thresholdStr === 'None') {
    return { major: null, severe: null };
  }
  var parts = thresholdStr.split('/');
  return {
    major: parts[0] && parts[0] !== 'None' ? parseInt(parts[0], 10) : null,
    severe: parts[1] && parts[1] !== 'None' ? parseInt(parts[1], 10) : null,
  };
}

var results = [];

var adversaryRegex = /<div class="adversary card text"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="adversary card text"|<\/div>\s*<(?:h2|\/div))/g;
var advMatch;

while ((advMatch = adversaryRegex.exec(html)) !== null) {
  var cardHtml = advMatch[0];

  var nameAttr = cardHtml.match(/data-name="([^"]*)"/);
  var tierAttr = cardHtml.match(/data-tier="([^"]*)"/);
  var typeAttr = cardHtml.match(/data-type="([^"]*)"/);
  var difficultyAttr = cardHtml.match(/data-difficulty="([^"]*)"/);
  var thresholdsAttr = cardHtml.match(/data-thresholds="([^"]*)"/);
  var hpAttr = cardHtml.match(/data-hp="([^"]*)"/);
  var stressAttr = cardHtml.match(/data-stress="([^"]*)"/);
  var atkAttr = cardHtml.match(/data-atk="([^"]*)"/);
  var rangeAttr = cardHtml.match(/data-range="([^"]*)"/);
  var damageAttr = cardHtml.match(/data-damage="([^"]*)"/);

  var name = nameAttr ? nameAttr[1] : 'Unknown';
  var tier = tierAttr ? parseInt(tierAttr[1], 10) : 0;
  var adversaryType = typeAttr ? typeAttr[1].toUpperCase() : 'STANDARD';
  var difficulty = difficultyAttr ? parseInt(difficultyAttr[1], 10) : 0;
  var thresholds = parseThresholds(thresholdsAttr ? thresholdsAttr[1] : null);
  var hitPointMax = hpAttr ? parseInt(hpAttr[1], 10) : 0;
  var stressMax = stressAttr ? parseInt(stressAttr[1], 10) : 0;
  var attackModifier = atkAttr ? parseInt(atkAttr[1], 10) : 0;
  var rangeValue = rangeAttr ? rangeAttr[1] : 'Melee';
  var attackRange = RANGE_MAP[rangeValue] || rangeValue.toUpperCase().replace(/ /g, '_');
  var damage = parseDamage(damageAttr ? damageAttr[1] : null);

  var descMatch = cardHtml.match(/<div style="font-weight: bold;">.*?<\/div>\s*<div>(.*?)<\/div>/);
  var description = descMatch ? stripHtml(descMatch[1]) : '';

  var motivesMatch = cardHtml.match(/<strong>Motives &amp; Tactics:<\/strong>\s*(.*?)<\/div>/);
  var motivesAndTactics = motivesMatch ? stripHtml(motivesMatch[1]).replace(/^\*\*Motives & Tactics:\*\*\s*/, '') : '';

  var weaponMatch = cardHtml.match(/<span><strong>([^<]+):<\/strong>\s*(?:Melee|Very Close|Close|Far|Very Far)<\/span>/);
  var weaponName = null;
  if (weaponMatch) {
    var standardLabels = ['Difficulty', 'Thresholds', 'Hp', 'Stress', 'Atk', 'Experience'];
    var candidate = weaponMatch[1].trim();
    if (standardLabels.indexOf(candidate) === -1) {
      weaponName = candidate;
    }
  }

  var expMatch = cardHtml.match(/<strong>Experience:<\/strong>\s*(.*?)<\/span>/);
  var experience = expMatch ? stripHtml(expMatch[1]).replace(/^\*\*Experience:\*\*\s*/, '') : '';

  var features = [];
  var featuresSection = cardHtml.match(/<h3[^>]*>Features<\/h3>\s*([\s\S]*?)$/);
  if (featuresSection) {
    var featureRegex = /<div><strong>(.*?):<\/strong>\s*([\s\S]*?)<\/div>/g;
    var featMatch;
    while ((featMatch = featureRegex.exec(featuresSection[1])) !== null) {
      features.push({
        name: featMatch[1].trim(),
        description: stripHtml(featMatch[2]),
      });
    }
  }

  results.push({
    name: name,
    description: description,
    motivesAndTactics: motivesAndTactics,
    tier: tier,
    adversaryType: adversaryType,
    difficulty: difficulty,
    majorThreshold: thresholds.major,
    severeThreshold: thresholds.severe,
    hitPointMax: hitPointMax,
    stressMax: stressMax,
    attackModifier: attackModifier,
    weaponName: weaponName,
    attackRange: attackRange,
    damage: damage,
    experience: experience,
    features: features,
  });
}

if (flags.includes('--count')) {
  console.log('Parsed ' + results.length + ' adversaries');
  results.forEach(function(r) {
    console.log('  ' + r.name + ': tier=' + r.tier + ', type=' + r.adversaryType + ', difficulty=' + r.difficulty + ', hp=' + r.hitPointMax);
  });
} else {
  console.log(JSON.stringify(results, null, 2));
}

#!/usr/bin/env node

/**
 * Converts raw parsed domain cards into the final JSON structure.
 * Handles: feature splitting, cost tagging, modifier detection.
 *
 * Usage: node scripts/convert-domain-cards.js [path-to-html]
 * Output: data/domain-cards.json
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const filePath = args[0] || path.join(__dirname, '..', 'DOMAINCRDS.html');
const html = fs.readFileSync(filePath, 'utf-8');

const DOMAIN_IDS = {
  'Arcana': 1, 'Blade': 2, 'Bone': 3, 'Codex': 4, 'Grace': 5,
  'Midnight': 6, 'Sage': 7, 'Splendor': 8, 'Valor': 9,
};

const TYPE_MAP = {
  'Spell': 'SPELL', 'Ability': 'ABILITY', 'Grimoire': 'GRIMOIRE',
  'Transformation': 'TRANSFORMATION', 'Wild': 'WILD',
};

// --- Step 1: Parse HTML ---

function parseHtml(htmlContent) {
  const cardStarts = [];
  const startRegex = /<div class="ability card text" id="([^"]*)"/g;
  let match;
  while ((match = startRegex.exec(htmlContent)) !== null) {
    cardStarts.push({ id: match[1], index: match.index });
  }

  return cardStarts.map((start, i) => {
    const end = i + 1 < cardStarts.length ? cardStarts[i + 1].index : htmlContent.length;
    const cardHtml = htmlContent.substring(start.index, end);

    const nameMatch = cardHtml.match(/<h3 class="name">([\s\S]*?)<\/h3>/);
    const levelMatch = cardHtml.match(/<span class="level">Level (\d+)<\/span>/);
    const domainMatch = cardHtml.match(/<span class="domain">([^<]+)<\/span>/);
    const typeMatch = cardHtml.match(/<span class="type">([^<]+)<\/span>/);
    const recallMatch = cardHtml.match(/Recall cost:<\/span>\s*(\d+)/);
    const textMatch = cardHtml.match(/<div class="text">([\s\S]*?)<\/div>/);

    return {
      name: nameMatch ? nameMatch[1].trim() : start.id,
      level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
      domain: domainMatch ? domainMatch[1].trim() : '',
      type: typeMatch ? typeMatch[1].trim() : '',
      recallCost: recallMatch ? parseInt(recallMatch[1], 10) : 0,
      rawText: textMatch ? textMatch[1].trim() : '',
    };
  });
}

// --- Step 2: Split Features ---

function splitFeatures(rawText, cardType) {
  if (cardType === 'Grimoire') {
    return splitGrimoireFeatures(rawText);
  }

  const paragraphs = rawText.split(/\n\n+/);
  if (paragraphs.length > 1) {
    const namedFeatures = paragraphs.filter(p => /^[A-Z][A-Za-z\s'''-]+:/.test(p.trim()));
    if (namedFeatures.length === paragraphs.length) {
      return paragraphs.map(p => {
        const colonIdx = p.indexOf(':');
        return {
          name: p.substring(0, colonIdx).trim(),
          description: p.substring(colonIdx + 1).trim(),
        };
      });
    }
  }

  return [{ description: rawText }];
}

function splitGrimoireFeatures(rawText) {
  const features = [];
  const regex = /\*\*([^*]+?):\*\*\s*/g;
  let match;
  const splits = [];

  while ((match = regex.exec(rawText)) !== null) {
    splits.push({ name: match[1].replace(/:$/, '').trim(), index: match.index, end: regex.lastIndex });
  }

  for (let i = 0; i < splits.length; i++) {
    const textStart = splits[i].end;
    const textEnd = i + 1 < splits.length ? splits[i + 1].index : rawText.length;
    const description = rawText.substring(textStart, textEnd).trim();
    features.push({ name: splits[i].name, description });
  }

  return features;
}

// --- Step 3: Detect Cost Tags ---

function detectCostTags(description) {
  const costs = [];

  const hopePatterns = [
    /[Ss]pend\s+(\d+)\s+Hope/g,
    /[Ss]pend\s+a\s+Hope/g,
  ];
  for (const pattern of hopePatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const amount = match[1] || '1';
      const label = `${amount} Hope`;
      if (!costs.some(c => c.label === label)) {
        costs.push({ label, category: 'COST' });
      }
    }
  }

  const stressPatterns = [
    /[Mm]ark\s+(\d+)\s+Stress/g,
    /[Mm]ark\s+a\s+Stress/g,
  ];
  for (const pattern of stressPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const amount = match[1] || '1';
      const label = `${amount} Stress`;
      if (!costs.some(c => c.label === label)) {
        costs.push({ label, category: 'COST' });
      }
    }
  }

  return costs.length > 0 ? costs : undefined;
}

// --- Step 4: Detect Modifiers ---

function detectModifiers(description) {
  const modifiers = [];

  const dmgThresholdMatch = description.match(/\+(\d+)\s+bonus\s+to\s+(?:your\s+)?damage\s+thresholds/i);
  if (dmgThresholdMatch) {
    const value = parseInt(dmgThresholdMatch[1], 10);
    modifiers.push({ target: 'MAJOR_DAMAGE_THRESHOLD', operation: 'ADD', value });
    modifiers.push({ target: 'SEVERE_DAMAGE_THRESHOLD', operation: 'ADD', value });
  }

  const majorMatch = description.match(/\+(\d+)\s+(?:bonus\s+)?to\s+(?:your\s+)?major\s+damage\s+threshold/i);
  if (majorMatch) {
    modifiers.push({ target: 'MAJOR_DAMAGE_THRESHOLD', operation: 'ADD', value: parseInt(majorMatch[1], 10) });
  }

  const severeMatch = description.match(/\+(\d+)\s+(?:bonus\s+)?to\s+(?:your\s+)?severe\s+damage\s+threshold/i);
  if (severeMatch) {
    modifiers.push({ target: 'SEVERE_DAMAGE_THRESHOLD', operation: 'ADD', value: parseInt(severeMatch[1], 10) });
  }

  const evasionMatch = description.match(/\+(\d+)\s+(?:bonus\s+)?to\s+(?:your\s+|their\s+)?evasion/i);
  if (evasionMatch) {
    modifiers.push({ target: 'EVASION', operation: 'ADD', value: parseInt(evasionMatch[1], 10) });
  }

  const armorMatch = description.match(/\+(\d+)\s+(?:bonus\s+)?to\s+(?:your\s+|their\s+)?armor\s+score/i);
  if (armorMatch) {
    modifiers.push({ target: 'ARMOR_SCORE', operation: 'ADD', value: parseInt(armorMatch[1], 10) });
  }

  // +X to attack rolls
  const attackMatch = description.match(/\+(\d+)\s+(?:bonus\s+)?to\s+(?:your\s+)?attack\s+rolls?/i);
  if (attackMatch) {
    modifiers.push({ target: 'ATTACK_ROLL', operation: 'ADD', value: parseInt(attackMatch[1], 10) });
  }

  // +X to damage rolls
  const dmgRollMatch = description.match(/\+(\d+)\s+(?:bonus\s+)?to\s+(?:your\s+)?damage\s+rolls?/i);
  if (dmgRollMatch) {
    modifiers.push({ target: 'DAMAGE_ROLL', operation: 'ADD', value: parseInt(dmgRollMatch[1], 10) });
  }

  const hpMatch = description.match(/\+(\d+)\s+(?:bonus\s+)?(?:to\s+)?(?:your\s+)?(?:hit\s+points?|hp|max(?:imum)?\s+hit\s+points?)/i);
  if (hpMatch) {
    modifiers.push({ target: 'HIT_POINT_MAX', operation: 'ADD', value: parseInt(hpMatch[1], 10) });
  }

  const traits = ['Agility', 'Strength', 'Finesse', 'Instinct', 'Presence', 'Knowledge'];
  for (const trait of traits) {
    const traitRegex = new RegExp(`\\+(\\d+)\\s+(?:bonus\\s+)?to\\s+(?:your\\s+)?${trait}`, 'i');
    const traitMatch = description.match(traitRegex);
    if (traitMatch) {
      modifiers.push({ target: trait.toUpperCase(), operation: 'ADD', value: parseInt(traitMatch[1], 10) });
    }
  }

  return modifiers.length > 0 ? modifiers : undefined;
}

// --- Assemble ---

function convertCard(rawCard) {
  const features = splitFeatures(rawCard.rawText, rawCard.type);

  const mappedFeatures = features.map(f => {
    const feature = {
      description: f.description,
      featureType: 'DOMAIN',
      expansionId: 1,
    };

    if (f.name) {
      feature.name = f.name;
    }

    const costTags = detectCostTags(f.description);
    if (costTags) {
      feature.costTags = costTags;
    }

    const modifiers = detectModifiers(f.description);
    if (modifiers) {
      feature.modifiers = modifiers;
    }

    return feature;
  });

  return {
    name: rawCard.name,
    expansionId: 1,
    isOfficial: true,
    associatedDomainId: DOMAIN_IDS[rawCard.domain] || 0,
    level: rawCard.level,
    recallCost: rawCard.recallCost,
    type: TYPE_MAP[rawCard.type] || rawCard.type.toUpperCase(),
    features: mappedFeatures,
  };
}

// --- Main ---

const rawCards = parseHtml(html);
const convertedCards = rawCards.map(convertCard);

if (flags.includes('--dry-run')) {
  console.log(JSON.stringify(convertedCards, null, 2));
} else {
  const outputDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'domain-cards.json');
  fs.writeFileSync(outputPath, JSON.stringify(convertedCards, null, 2) + '\n');
  console.log(`Wrote ${convertedCards.length} cards to ${outputPath}`);

  const typeCounts = {};
  convertedCards.forEach(c => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  console.log('By type:', typeCounts);

  const multiFeature = convertedCards.filter(c => c.features.length > 1).length;
  const withCosts = convertedCards.filter(c => c.features.some(f => f.costTags)).length;
  const withModifiers = convertedCards.filter(c => c.features.some(f => f.modifiers)).length;
  console.log(`Multi-feature: ${multiFeature}, With costs: ${withCosts}, With modifiers: ${withModifiers}`);
}

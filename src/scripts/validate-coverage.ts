import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve('.');
const TEMP_DIR = path.join(PROJECT_ROOT, 'temp', 'common-core');
const STANDARDS_PATH = path.join(TEMP_DIR, 'standards.jsonl');
const RDF_PATH = path.join(TEMP_DIR, 'core-ontology-math.rdf');
const COVERAGE_PATH = path.resolve(PROJECT_ROOT, 'public', 'coverage', 'ccss-coverage.json');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function parseRDF(rdfContent: string): Record<string, string> {
  const nodes: Record<string, string> = {}; // URI -> Type
  const descriptionRegex = /<rdf:Description\s+rdf:about="([^"]+)">([\s\S]*?)<\/rdf:Description>/g;
  let match;
  
  while ((match = descriptionRegex.exec(rdfContent)) !== null) {
    const uri = match[1];
    const innerContent = match[2];
    
    let type = 'Unknown';
    if (innerContent.includes('rdf:resource="http://edugraph.io/edu#Area"')) {
      type = 'Area';
    } else if (innerContent.includes('rdf:resource="http://edugraph.io/edu#Scope"')) {
      type = 'Scope';
    } else if (innerContent.includes('rdf:resource="http://edugraph.io/edu#Ability"')) {
      type = 'Ability';
    }
    
    if (type !== 'Unknown') {
      nodes[uri] = type;
    }
  }
  return nodes;
}

function runValidation() {
  console.log('=== Initiating Standards Coverage Validation ===\n');
  const result: ValidationResult = { passed: true, errors: [], warnings: [] };

  // 1. Check file existence
  if (!fs.existsSync(COVERAGE_PATH)) {
    result.errors.push(`Coverage file not found at: ${COVERAGE_PATH}`);
    result.passed = false;
    printReport(result);
    return;
  }
  if (!fs.existsSync(STANDARDS_PATH)) {
    result.errors.push(`Standards definitions not found at: ${STANDARDS_PATH}`);
    result.passed = false;
    printReport(result);
    return;
  }
  if (!fs.existsSync(RDF_PATH)) {
    result.errors.push(`RDF ontology file not found at: ${RDF_PATH}`);
    result.passed = false;
    printReport(result);
    return;
  }

  // 2. Load data
  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf-8'));
  const rdfContent = fs.readFileSync(RDF_PATH, 'utf-8');
  const standardsLines = fs.readFileSync(STANDARDS_PATH, 'utf-8').split('\n');

  // Parse RDF
  const rdfNodes = parseRDF(rdfContent);
  console.log(`[Ontology] Loaded ${Object.keys(rdfNodes).length} valid concepts from RDF.`);

  // Parse Standards.jsonl
  const standardsMap: Record<string, any> = {};
  for (const line of standardsLines) {
    if (!line.trim()) continue;
    const std = JSON.parse(line);
    standardsMap[std.id] = std;
  }

  // Find actual leaf nodes in standards.jsonl
  const actualLeavesMap: Record<string, any> = {};
  for (const std of Object.values(standardsMap)) {
    if (std.children && std.children.length === 0) {
      actualLeavesMap[std.id] = std;
    }
  }
  const totalLeafNodes = Object.keys(actualLeavesMap).length;
  console.log(`[CCSS] Loaded ${Object.keys(standardsMap).length} standards, including ${totalLeafNodes} leaf nodes.`);

  const coverage = coverageData.coverage || {};
  const tasks = coverageData.tasks || [];
  const metadata = coverageData.metadata || {};

  console.log(`[Coverage] Loaded evaluations for ${Object.keys(coverage).length} standards.`);
  console.log(`[Backlog] Loaded ${tasks.length} tasks.\n`);

  // --- CHECK 1: metadata count matches coverage length ---
  const coverageKeys = Object.keys(coverage);
  if (coverageKeys.length !== metadata.total_leaves_scanned) {
    result.errors.push(`Metadata scanned count (${metadata.total_leaves_scanned}) does not match coverage keys length (${coverageKeys.length})`);
    result.passed = false;
  }

  // --- CHECK 2: Coverage completeness (either K-8 only, or K-12) ---
  const isHSIncluded = coverageKeys.some(id => id.startsWith('HS') || /^[NAFGS]-/.test(id.split('.')[0]));
  const expectedCount = isHSIncluded ? totalLeafNodes : 288; // K-8 is exactly 288 leaf nodes
  
  if (coverageKeys.length !== expectedCount) {
    result.warnings.push(`Scanned standard count (${coverageKeys.length}) does not match the expected count (${expectedCount}). (HS included: ${isHSIncluded})`);
  }

  // --- CHECK 3: Standards and Ontology Integrity inside coverage ---
  for (const [id, std] of Object.entries(coverage) as any) {
    // A. Verify standard ID exists in standards.jsonl
    if (!standardsMap[id]) {
      result.errors.push(`[Standard ID Error] Standard ID "${id}" in coverage file does not exist in standards.jsonl`);
      result.passed = false;
    } else if (standardsMap[id].children && standardsMap[id].children.length > 0) {
      result.errors.push(`[Leaf Node Error] Standard ID "${id}" is evaluated in coverage, but it is not a leaf node (has children)`);
      result.passed = false;
    }

    // B. Verify matched ontology classes exist in RDF
    const areas = std.matched_areas || [];
    const scopes = std.matched_scopes || [];
    const abilities = std.matched_abilities || [];

    for (const area of areas) {
      if (!rdfNodes[area]) {
        result.errors.push(`[Ontology Error] Standard "${id}" maps to non-existent URI: "${area}"`);
        result.passed = false;
      } else if (rdfNodes[area] !== 'Area') {
        result.errors.push(`[Ontology Classification Error] Standard "${id}" maps to "${area}" under areas, but it is classified as ${rdfNodes[area]} in RDF`);
        result.passed = false;
      }
    }

    for (const scope of scopes) {
      if (!rdfNodes[scope]) {
        result.errors.push(`[Ontology Error] Standard "${id}" maps to non-existent URI: "${scope}"`);
        result.passed = false;
      } else if (rdfNodes[scope] !== 'Scope') {
        result.errors.push(`[Ontology Classification Error] Standard "${id}" maps to "${scope}" under scopes, but it is classified as ${rdfNodes[scope]} in RDF`);
        result.passed = false;
      }
    }

    for (const ability of abilities) {
      if (!rdfNodes[ability]) {
        result.errors.push(`[Ontology Error] Standard "${id}" maps to non-existent URI: "${ability}"`);
        result.passed = false;
      } else if (rdfNodes[ability] !== 'Ability') {
        result.errors.push(`[Ontology Classification Error] Standard "${id}" maps to "${ability}" under abilities, but it is classified as ${rdfNodes[ability]} in RDF`);
        result.passed = false;
      }
    }

    // C. Verify cluster_id exists in standards.jsonl
    const clusterId = std.cluster_id;
    if (clusterId && clusterId !== 'Other') {
      if (!standardsMap[clusterId]) {
        result.errors.push(`[Cluster ID Error] Standard "${id}" references non-existent cluster ID "${clusterId}"`);
        result.passed = false;
      } else if (standardsMap[clusterId].level.toLowerCase() !== 'cluster') {
        result.warnings.push(`[Cluster Level Warning] Standard "${id}" references cluster "${clusterId}", but its level in standards.jsonl is "${standardsMap[clusterId].level}"`);
      }
    }
  }

  // --- CHECK 4: Tasks referential integrity and coverage ---
  const taskStandardIds = new Set<string>();
  const taskIds = new Set<string>();

  for (const task of tasks) {
    // A. Check duplicate task IDs
    if (taskIds.has(task.id)) {
      result.errors.push(`[Task ID Error] Duplicate Task ID found: "${task.id}"`);
      result.passed = false;
    }
    taskIds.add(task.id);

    // B. Check standard IDs in task
    const affectedStds = task.standards || [];
    if (affectedStds.length === 0) {
      result.warnings.push(`[Task Warning] Task "${task.id}" has an empty standards list`);
    }

    for (const stdId of affectedStds) {
      taskStandardIds.add(stdId);

      // Verify standard exists in coverage map
      const covEntry = coverage[stdId];
      if (!covEntry) {
        result.errors.push(`[Task Standard Error] Task "${task.id}" references standard "${stdId}" which does not exist in the coverage map`);
        result.passed = false;
        continue;
      }

      // Verify task type matches the standard's coverage status
      if (task.type === 'ONTOLOGY_EXTENSION' && covEntry.ontology_covered) {
        result.errors.push(`[Task Logic Error] Standard "${stdId}" is included in ONTOLOGY_EXTENSION task "${task.id}", but is marked as ontology_covered: true`);
        result.passed = false;
      }
      if (task.type === 'DATASET_ENRICHMENT' && covEntry.dataset_covered) {
        result.errors.push(`[Task Logic Error] Standard "${stdId}" is included in DATASET_ENRICHMENT task "${task.id}", but is marked as dataset_covered: true`);
        result.passed = false;
      }
    }
  }

  // --- CHECK 5: Orphaning check (Are all uncovered standards assigned to a task?) ---
  for (const [id, std] of Object.entries(coverage) as any) {
    if (!std.ontology_covered) {
      if (!taskStandardIds.has(id)) {
        result.errors.push(`[Orphaned Standard Error] Standard "${id}" is missing ontology coverage but has no associated task in the backlog`);
        result.passed = false;
      }
    } else if (!std.dataset_covered) {
      if (!taskStandardIds.has(id)) {
        result.errors.push(`[Orphaned Standard Error] Standard "${id}" is missing dataset coverage but has no associated task in the backlog`);
        result.passed = false;
      }
    }
  }

  printReport(result);
}

function printReport(result: ValidationResult) {
  console.log('=== Validation Report ===');
  if (result.errors.length > 0) {
    console.log(`❌ FAILED with ${result.errors.length} errors:`);
    result.errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('✅ ALL CRITICAL CHECKS PASSED SUCCESSFULLY!');
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} Warnings:`);
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('\n=========================');
  process.exit(result.passed ? 0 : 1);
}

runValidation();

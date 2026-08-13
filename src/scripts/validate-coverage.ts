import fs from 'fs';
import path from 'path';
import { Area, Scope, Ability } from 'edugraph-ts';

const PROJECT_ROOT = path.resolve('.');
const TEMP_DIR = path.join(PROJECT_ROOT, 'temp', 'common-core');
const STANDARDS_PATH = path.join(TEMP_DIR, 'standards.jsonl');
const coverageDirArg = process.argv.slice(2)
  .find(arg => arg.startsWith('--coverage-dir='))
  ?.slice('--coverage-dir='.length);
const COVERAGE_DIR = path.resolve(PROJECT_ROOT, coverageDirArg || path.join('public', 'coverage', 'preview'));
const COVERAGE_PATH = path.join(COVERAGE_DIR, 'ccss-coverage.json');
const MANIFEST_PATH = path.join(COVERAGE_DIR, 'coverage-manifest.json');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
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
  if (!fs.existsSync(MANIFEST_PATH)) {
    result.errors.push(`Coverage manifest not found at: ${MANIFEST_PATH}`);
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

  // 2. Load data
  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf-8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const standardsLines = fs.readFileSync(STANDARDS_PATH, 'utf-8').split('\n');

  if (manifest.schema_version !== 2) {
    result.errors.push(`Unsupported coverage manifest schema: ${manifest.schema_version}`);
    result.passed = false;
  }
  if (manifest.channel !== 'latest' && manifest.channel !== 'preview') {
    result.errors.push(`Invalid coverage manifest channel: ${manifest.channel}`);
    result.passed = false;
  }
  if (!manifest.source_ref || !manifest.source_sha) {
    result.errors.push('Coverage manifest must include source_ref and source_sha.');
    result.passed = false;
  }
  if (manifest.generated_at !== coverageData.metadata?.generated_at) {
    result.errors.push('Coverage manifest and data generated_at values do not match.');
    result.passed = false;
  }
  if (manifest.ontology_version !== coverageData.metadata?.ontology_version) {
    result.errors.push('Coverage manifest and data ontology versions do not match.');
    result.passed = false;
  }

  // Populate rdfNodes dynamically from edugraph-ts enums
  const rdfNodes: Record<string, string> = {};
  for (const a of Object.values(Area)) {
    rdfNodes[a] = 'Area';
  }
  for (const s of Object.values(Scope)) {
    rdfNodes[s] = 'Scope';
  }
  for (const ab of Object.values(Ability)) {
    rdfNodes[ab] = 'Ability';
  }
  console.log(`[Ontology] Loaded ${Object.keys(rdfNodes).length} valid concepts from edugraph-ts.`);

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

  const implementationStrategies = new Set(['reuse', 'expand', 'new']);
  const isModuleImplementation = (item: any) => item
    && typeof item.module === 'string'
    && item.module.trim() !== ''
    && implementationStrategies.has(item.strategy);
  const isImplementation = (item: any) => item
    && typeof item.id === 'string'
    && item.id.trim() !== ''
    && typeof item.description === 'string'
    && item.description.trim() !== ''
    && Array.isArray(item.generators)
    && item.generators.length > 0
    && item.generators.every(isModuleImplementation)
    && Array.isArray(item.views)
    && item.views.length > 0
    && item.views.every(isModuleImplementation);
  const ontologyDimensions = new Set(['Area', 'Scope', 'Ability']);
  const isOntologyChange = (item: any) => item
    && ontologyDimensions.has(item.dimension)
    && Array.isArray(item.entities)
    && item.entities.length > 0
    && item.entities.every((entity: unknown) => typeof entity === 'string' && entity.trim() !== '')
    && new Set(item.entities).size === item.entities.length;
  const isOntologyPackage = (item: any) => item
    && typeof item.id === 'string'
    && item.id.trim() !== ''
    && typeof item.description === 'string'
    && item.description.trim() !== ''
    && Array.isArray(item.changes)
    && item.changes.length > 0
    && item.changes.every(isOntologyChange)
    && new Set(item.changes.map((change: any) => change.dimension)).size === item.changes.length;

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

    // C. Verify competencies list of flat lists and their ontology URIs
    if (std.competencies !== undefined) {
      if (!Array.isArray(std.competencies)) {
        result.errors.push(`[Competencies Error] Standard "${id}" competencies is not an array`);
        result.passed = false;
      } else {
        for (let idx = 0; idx < std.competencies.length; idx++) {
          const comp = std.competencies[idx];
          if (!Array.isArray(comp)) {
            result.errors.push(`[Competencies Error] Standard "${id}" competency at index ${idx} is not a flat list array`);
            result.passed = false;
          } else {
            for (const labelIri of comp) {
              if (typeof labelIri !== 'string' || !rdfNodes[labelIri]) {
                result.errors.push(`[Ontology Error] Standard "${id}" competency at index ${idx} references invalid ontology URI: "${labelIri}"`);
                result.passed = false;
              }
            }
          }
        }
      }
    }

    // D. Verify implementation_todos structure
    if (std.implementation_todos !== undefined) {
      if (!Array.isArray(std.implementation_todos)) {
        result.errors.push(`[Implementation Todos Error] Standard "${id}" implementation_todos is not an array`);
        result.passed = false;
      } else {
        for (let idx = 0; idx < std.implementation_todos.length; idx++) {
          const item = std.implementation_todos[idx];
          if (!item
            || typeof item.id !== 'string'
            || !Array.isArray(item.labels)
            || !isImplementation(item.implementation)) {
            result.errors.push(`[Implementation Todos Error] Standard "${id}" implementation_todo at index ${idx} is invalid`);
            result.passed = false;
          }
        }
      }
    }

    // E. Verify ontology_todos structure
    if (std.ontology_todos !== undefined) {
      if (!Array.isArray(std.ontology_todos)) {
        result.errors.push(`[Ontology Todos Error] Standard "${id}" ontology_todos is not an array`);
        result.passed = false;
      } else {
        for (let idx = 0; idx < std.ontology_todos.length; idx++) {
          const item = std.ontology_todos[idx];
          if (!item
            || typeof item.title !== 'string'
            || typeof item.description !== 'string'
            || !isOntologyPackage(item.ontology)) {
            result.errors.push(`[Ontology Todos Error] Standard "${id}" ontology_todo at index ${idx} is invalid`);
            result.passed = false;
          }
        }
      }
    }

    // F. Verify beyond_scope structure and status flags
    if (std.beyond_scope !== undefined) {
      if (!Array.isArray(std.beyond_scope)) {
        result.errors.push(`[Beyond Scope Error] Standard "${id}" beyond_scope is not an array`);
        result.passed = false;
      } else {
        for (let idx = 0; idx < std.beyond_scope.length; idx++) {
          const item = std.beyond_scope[idx];
          if (!item || typeof item.title !== 'string' || typeof item.description !== 'string') {
            result.errors.push(`[Beyond Scope Error] Standard "${id}" beyond_scope item at index ${idx} is invalid`);
            result.passed = false;
          }
        }
      }
    }

    const hasBeyondScope = Array.isArray(std.beyond_scope) && std.beyond_scope.length > 0;
    if (Boolean(std.fully_beyond_scope) && (!hasBeyondScope || (std.competencies && std.competencies.length > 0))) {
      result.errors.push(`[Beyond Scope Status Error] Standard "${id}" has an inconsistent fully_beyond_scope flag`);
      result.passed = false;
    }
    if (Boolean(std.partially_beyond_scope) && (!hasBeyondScope || Boolean(std.fully_beyond_scope))) {
      result.errors.push(`[Beyond Scope Status Error] Standard "${id}" has an inconsistent partially_beyond_scope flag`);
      result.passed = false;
    }

    // G. Verify cluster_id exists in standards.jsonl
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
  const taskImplementationIds = new Set<string>();
  const taskOntologyIds = new Set<string>();
  const coverageImplementationIds = new Set<string>(Object.values(coverage)
    .flatMap((entry: any) => entry.implementation_todos || [])
    .map((todo: any) => todo.implementation?.id)
    .filter((id: unknown): id is string => typeof id === 'string'));
  const coverageOntologyIds = new Set<string>(Object.values(coverage)
    .flatMap((entry: any) => entry.ontology_todos || [])
    .map((todo: any) => todo.ontology?.id)
    .filter((id: unknown): id is string => typeof id === 'string'));

  for (const task of tasks) {
    // A. Check duplicate task IDs
    if (taskIds.has(task.id)) {
      result.errors.push(`[Task ID Error] Duplicate Task ID found: "${task.id}"`);
      result.passed = false;
    }
    taskIds.add(task.id);

    if (task.implementation !== undefined && !isImplementation(task.implementation)) {
      result.errors.push(`[Task Implementation Error] Task "${task.id}" has an invalid implementation definition`);
      result.passed = false;
    } else if (task.implementation) {
      taskImplementationIds.add(task.implementation.id);
    }
    if (task.ontology !== undefined && !isOntologyPackage(task.ontology)) {
      result.errors.push(`[Task Ontology Error] Task "${task.id}" has an invalid ontology package`);
      result.passed = false;
    } else if (task.ontology) {
      if (taskOntologyIds.has(task.ontology.id)) {
        result.errors.push(`[Task Ontology Error] Ontology package "${task.ontology.id}" has multiple backlog tasks`);
        result.passed = false;
      }
      taskOntologyIds.add(task.ontology.id);
    }
    if (task.type === 'ONTOLOGY_EXTENSION' && !task.ontology) {
      result.errors.push(`[Task Ontology Error] Ontology task "${task.id}" must reference an ontology package`);
      result.passed = false;
    }
    if (task.ontology && task.type !== 'ONTOLOGY_EXTENSION') {
      result.errors.push(`[Task Ontology Error] Task "${task.id}" references an ontology package but is not an ONTOLOGY_EXTENSION task`);
      result.passed = false;
    }

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
      if (task.type === 'ONTOLOGY_EXTENSION' && covEntry.ontology_covered && (!covEntry.ontology_todos || covEntry.ontology_todos.length === 0)) {
        result.errors.push(`[Task Logic Error] Standard "${stdId}" is included in ONTOLOGY_EXTENSION task "${task.id}", but is marked as ontology_covered: true with no ontology_todos`);
        result.passed = false;
      }
      if (task.type === 'DATASET_ENRICHMENT'
        && covEntry.dataset_covered
        && (!covEntry.implementation_todos || covEntry.implementation_todos.length === 0)) {
        result.errors.push(`[Task Logic Error] Standard "${stdId}" is included in DATASET_ENRICHMENT task "${task.id}", but is marked as dataset_covered with no implementation_todos`);
        result.passed = false;
      }
      if (task.implementation
        && !covEntry.implementation_todos?.some((todo: any) => todo.implementation?.id === task.implementation.id)) {
        result.errors.push(`[Task Implementation Error] Task "${task.id}" assigns implementation "${task.implementation.id}" to unrelated standard "${stdId}"`);
        result.passed = false;
      }
      if (task.ontology
        && !covEntry.ontology_todos?.some((todo: any) => todo.ontology?.id === task.ontology.id)) {
        result.errors.push(`[Task Ontology Error] Task "${task.id}" assigns ontology package "${task.ontology.id}" to unrelated standard "${stdId}"`);
        result.passed = false;
      }
      if (covEntry.fully_beyond_scope) {
        result.errors.push(`[Task Logic Error] Fully beyond-scope standard "${stdId}" must not appear in backlog task "${task.id}"`);
        result.passed = false;
      }
    }
  }

  for (const implementationId of coverageImplementationIds) {
    if (!taskImplementationIds.has(implementationId)) {
      result.errors.push(`[Orphaned Implementation Error] Implementation "${implementationId}" has no package-level backlog task`);
      result.passed = false;
    }
  }
  for (const ontologyId of coverageOntologyIds) {
    if (!taskOntologyIds.has(ontologyId)) {
      result.errors.push(`[Orphaned Ontology Error] Ontology package "${ontologyId}" has no package-level backlog task`);
      result.passed = false;
    }
  }

  // --- CHECK 5: Orphaning check (Are all uncovered standards assigned to a task?) ---
  for (const [id, std] of Object.entries(coverage) as any) {
    if (std.fully_beyond_scope) continue;
    if (!std.ontology_covered || (std.ontology_todos && std.ontology_todos.length > 0)) {
      if (!taskStandardIds.has(id)) {
        result.errors.push(`[Orphaned Standard Error] Standard "${id}" is missing ontology coverage (or has pending ontology tasks) but has no associated task in the backlog`);
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

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Ability, Area, Scope } from 'edugraph-ts';
import { CompetencyTarget, OntologyTodo } from '../types/ml-engine.ts';
import { findLeafModules } from '../lib/module-resolver.ts';
import { isSubConceptOf, isCompatibleConcept } from '../lib/ontology.ts';
import { getViewToProblemTypeMap, getGeneratorProblemType } from '../lib/type-parser.ts';
import { extractSchemaLabels, generateWithLabels } from '../lib/utils.ts';
import { setSeed } from '../lib/random.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const TEMP_DIR = path.resolve(PROJECT_ROOT, 'temp', 'common-core');
const STANDARDS_PATH = path.join(TEMP_DIR, 'standards.jsonl');
const OUTPUT_PATH = path.resolve(PROJECT_ROOT, 'public', 'coverage', 'ccss-coverage.json');

// 1. Read package.json to sync ontology version
const pkgPath = path.resolve(PROJECT_ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const edugraphTsUrl = pkg.dependencies['edugraph-ts'] || '';
const versionMatch = edugraphTsUrl.match(/\/releases\/download\/(v[\d.]+)\//);
const version = versionMatch ? versionMatch[1] : 'v0.6.0';

// Recursively find the parent Cluster ID for a standard
function findParentClusterId(stdId: string, standardsMap: Record<string, any>): string {
  let current = standardsMap[stdId];
  while (current && current.level.toLowerCase() !== 'cluster') {
    const parentId = current.parent;
    if (!parentId) break;
    current = standardsMap[parentId];
  }
  return current ? current.id : 'Other';
}

function findStandardIdForTarget(targetId: string, sortedLeafIds: string[]): string | null {
  for (const stdId of sortedLeafIds) {
    if (targetId === stdId || targetId.startsWith(stdId + '-')) {
      return stdId;
    }
  }
  return null;
}

async function loadGeneratorAndViewSpecs() {
  const viewsDir = path.resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
  const allViewModules = findLeafModules(viewsDir);
  const allViewSpecs: any[] = [];
  const viewGeneralLabelsMap: Record<string, string[]> = {};

  for (const vMod of allViewModules) {
    try {
      const viewSpecModule = await import(pathToFileURL(path.resolve(vMod.absolutePath, 'spec.ts')).href);
      allViewSpecs.push(viewSpecModule.spec);
      const viewCamelCase = vMod.id.replace(/-([a-z])/g, g => g[1].toUpperCase());
      const camelCaseName = viewCamelCase[0].toUpperCase() + viewCamelCase.slice(1);
      const viewSchema = viewSpecModule[`${camelCaseName}ViewSchema`];
      const viewLabels = Array.from(new Set([
        ...(viewSpecModule.spec?.generalLabels || []),
        ...extractSchemaLabels(viewSchema)
      ]));
      viewGeneralLabelsMap[vMod.id] = viewLabels;
    } catch (e) {
      // Ignore
    }
  }

  const generatorsDir = path.resolve(PROJECT_ROOT, 'src', 'generators');
  const allGenModules = findLeafModules(generatorsDir);
  const allGeneratorSpecs: any[] = [];

  for (const gMod of allGenModules) {
    try {
      const specModule = await import(pathToFileURL(path.resolve(gMod.absolutePath, 'spec.ts')).href);
      const generatorSpec = specModule.spec;
      const camelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());
      const className = camelCase(gMod.id[0].toUpperCase() + gMod.id.slice(1)) + 'Generator';
      const generatorModule = await import(pathToFileURL(path.resolve(gMod.absolutePath, 'generator.ts')).href);
      const GeneratorClass = generatorModule[className];

      if (GeneratorClass) {
        const generator = new GeneratorClass();
        const generatorGeneralLabels = Array.from(new Set([
          ...(generatorSpec?.generalLabels || []),
          ...extractSchemaLabels(generator.schema)
        ]));
        allGeneratorSpecs.push({
          generatorId: gMod.id,
          spec: generatorSpec,
          generatorGeneralLabels,
          generator
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  return { allViewSpecs, viewGeneralLabelsMap, allGeneratorSpecs };
}

function findMatchingGeneratorForTarget(
  target: CompetencyTarget,
  viewToType: any,
  abilitiesList: Set<string>,
  allViewSpecs: any[],
  viewGeneralLabelsMap: Record<string, string[]>,
  allGeneratorSpecs: any[]
): string | null {
  for (const gen of allGeneratorSpecs) {
    const genTypeName = getGeneratorProblemType(gen.generatorId);
    if (!genTypeName) continue;

    const compatibleViews = allViewSpecs.filter(v => viewToType[v.viewId] === genTypeName);
    if (compatibleViews.length === 0) continue;
    if (!gen.generatorGeneralLabels) continue;

    const matchingViewsForTarget = compatibleViews.filter(viewSpec => {
      const viewLabels = viewGeneralLabelsMap[viewSpec.viewId];
      if (!viewLabels) return false;
      return target.labels.every(compLabel => {
        if (!compLabel.startsWith('http://edugraph.io/edu/')) return true;
        if (abilitiesList.has(compLabel)) {
          return viewLabels.some(viewLabel => isCompatibleConcept(compLabel, viewLabel));
        }
        const supportedByGen = gen.generatorGeneralLabels.some((genLabel: string) => isSubConceptOf(compLabel, genLabel));
        const supportedByView = viewLabels.some((viewLabel: string) => isCompatibleConcept(compLabel, viewLabel));
        return supportedByGen || supportedByView;
      });
    });

    if (matchingViewsForTarget.length > 0) {
      let problemStub = null;
      for (let seed = 42; seed < 52 && !problemStub; seed++) {
        setSeed(seed);
        problemStub = generateWithLabels(gen.generator, target.labels);
      }

      if (problemStub) {
        const matchedViews = matchingViewsForTarget.filter(viewSpec => {
          if (viewSpec.constraints) {
            for (const [key, constraint] of Object.entries(viewSpec.constraints) as any) {
              const val = problemStub.data[key] !== undefined ? problemStub.data[key] : target.constraints?.[key];
              if (val === undefined) {
                const VISUAL_PARAMS = new Set(['outline', 'reverse', 'decimal', 'desc', 'asc']);
                if (VISUAL_PARAMS.has(key)) continue;
                return false;
              }
              if (constraint.type === 'range') {
                if (val < constraint.min || val > constraint.max) return false;
              } else if (constraint.type === 'options') {
                if (!constraint.values.includes(val)) return false;
              }
            }
          }
          return true;
        });

        if (matchedViews.length > 0) {
          return gen.generatorId;
        }
      }
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const gradeLimit = args.find(a => a.startsWith('--grade='))?.split('=')[1];
  const excludeHS = args.includes('--k8') || args.includes('--exclude-hs');

  console.log('--- Initiating CCSS Ontology Mapping Pipeline ---');

  // Extract valid Area, Scope, Ability values
  const allAreas = Object.values(Area);
  const allScopes = Object.values(Scope);
  const allAbilities = Object.values(Ability);

  // 2. Load CCSS leaf standards
  if (!fs.existsSync(STANDARDS_PATH)) {
    console.error(`Error: standards.jsonl not found at ${STANDARDS_PATH}. Run generate:standards-explorer first.`);
    process.exit(1);
  }

  const standardsLines = fs.readFileSync(STANDARDS_PATH, 'utf-8').split('\n');
  const standardsMap: Record<string, any> = {};
  const leafNodes: any[] = [];

  for (const line of standardsLines) {
    if (!line.trim()) continue;
    const std = JSON.parse(line);
    standardsMap[std.id] = std;
  }

  for (const std of Object.values(standardsMap)) {
    if (std.children && std.children.length === 0) {
      const first = std.id.split('.')[0];
      const isHS = first.startsWith('HS') || /^[NAFGS]-/.test(first);
      if (!isHS || !excludeHS) {
        leafNodes.push(std);
      }
    }
  }

  let targetLeaves = leafNodes;
  if (gradeLimit) {
    targetLeaves = leafNodes.filter(n => {
      const first = n.id.split('.')[0];
      const normalizedLimit = gradeLimit.toLowerCase().trim();
      if ((normalizedLimit === 'k' || normalizedLimit === 'kindergarten') && first === 'K') return true;
      if (normalizedLimit === 'hs' || normalizedLimit === 'high school') {
        return first.startsWith('HS') || /^[NAFGS]-/.test(first);
      }
      if (first === gradeLimit) return true;
      if (`grade ${first}`.toLowerCase() === normalizedLimit) return true;
      return false;
    });
    console.log(`[CCSS] Filtering standards for Grade Limit: ${gradeLimit}. Found ${targetLeaves.length} leaf nodes.`);
  } else {
    console.log(`[CCSS] Found ${targetLeaves.length} total leaf nodes to evaluate.`);
  }

  // 3. Load spec module generic exports (spec, implementationTodos, ontologyTodos)
  const specDir = path.resolve(PROJECT_ROOT, 'src', 'spec', 'ccss');
  const allSpecTargets: CompetencyTarget[] = [];
  const allImplementationTodos: CompetencyTarget[] = [];
  const allOntologyTodos: OntologyTodo[] = [];

  if (fs.existsSync(specDir) && fs.lstatSync(specDir).isDirectory()) {
    const files = fs.readdirSync(specDir).filter(f => f.endsWith('.ts'));
    for (const file of files) {
      const filePath = path.resolve(specDir, file);
      const mod = await import(pathToFileURL(filePath).href);
      if (Array.isArray(mod.spec)) {
        allSpecTargets.push(...mod.spec);
      }
      if (Array.isArray(mod.implementationTodos)) {
        allImplementationTodos.push(...mod.implementationTodos);
      }
      if (Array.isArray(mod.ontologyTodos)) {
        allOntologyTodos.push(...mod.ontologyTodos);
      }
    }
  }
  console.log(`[CCSS Spec] Loaded ${allSpecTargets.length} implemented targets, ${allImplementationTodos.length} implementation TODOs, and ${allOntologyTodos.length} ontology TODOs.`);

  // Load view & generator specs for matching
  const { allViewSpecs, viewGeneralLabelsMap, allGeneratorSpecs } = await loadGeneratorAndViewSpecs();
  const viewToType = getViewToProblemTypeMap();
  const abilitiesList = new Set<string>(Object.values(Ability));

  // 4. Load existing coverage cache if it exists
  const cache: Record<string, any> = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
      if (existing && existing.coverage) {
        Object.assign(cache, existing.coverage);
        console.log(`[Cache] Loaded existing mapping cache for ${Object.keys(cache).length} standards.`);
      }
    } catch (e) {
      console.warn('[Cache] Could not parse existing coverage JSON.', e);
    }
  }

  // 5. Programmatic Dataset, Permutations & Backlog Processing
  console.log('[Coverage] Processing competencies and dataset matching...');
  const finalCoverageMap: Record<string, any> = {};
  const sortedLeafIds = leafNodes.map(l => l.id).sort((a, b) => b.length - a.length);

  for (const std of leafNodes) {
    const evalObj = cache[std.id] || {
      id: std.id,
      ontology_covered: false,
      matched_areas: [],
      matched_scopes: [],
      matched_abilities: [],
      reasoning: 'Evaluation missing/failed.',
      suggested_task: { title: 'Map Standard', description: 'Re-run evaluation for this standard.' }
    };

    // Match implemented target permutations
    const matchedTargets = allSpecTargets.filter(t => findStandardIdForTarget(t.id, sortedLeafIds) === std.id);
    const competencies: string[][] = matchedTargets.map(t => t.labels);

    // Match implementation TODOs
    const matchedImplementationTodos = allImplementationTodos.filter(t => findStandardIdForTarget(t.id, sortedLeafIds) === std.id);
    const implementation_todos = matchedImplementationTodos.map(t => ({
      id: t.id,
      labels: t.labels,
      explanation: t.explanation || ''
    }));

    // Match ontology TODOs
    const matchedOntologyTodos = allOntologyTodos.filter(o => o.standardId === std.id);
    const ontology_todos = matchedOntologyTodos.map(o => ({
      title: o.title,
      description: o.description
    }));

    let matched_areas: string[] = [];
    let matched_scopes: string[] = [];
    let matched_abilities: string[] = [];
    let ontology_covered = false;

    if (competencies.length > 0) {
      ontology_covered = true;
      const allLabelsUnion = Array.from(new Set(competencies.flat()));
      matched_areas = allLabelsUnion.filter(l => allAreas.includes(l as any));
      matched_scopes = allLabelsUnion.filter(l => allScopes.includes(l as any));
      matched_abilities = allLabelsUnion.filter(l => allAbilities.includes(l as any));
    } else {
      ontology_covered = evalObj.ontology_covered ?? false;
      matched_areas = evalObj.matched_areas || [];
      matched_scopes = evalObj.matched_scopes || [];
      matched_abilities = evalObj.matched_abilities || [];
    }

    // Check dataset coverage for matchedTargets
    let dataset_covered = false;
    let generator_module: string | null = null;

    if (matchedTargets.length > 0) {
      const genModulesSet = new Set<string>();
      let allTargetsCovered = true;

      for (const target of matchedTargets) {
        const genId = findMatchingGeneratorForTarget(
          target,
          viewToType,
          abilitiesList,
          allViewSpecs,
          viewGeneralLabelsMap,
          allGeneratorSpecs
        );
        if (genId) {
          genModulesSet.add(genId);
        } else {
          allTargetsCovered = false;
        }
      }

      if (genModulesSet.size > 0) {
        generator_module = Array.from(genModulesSet).join(', ');
        dataset_covered = allTargetsCovered;
      }
    } else {
      dataset_covered = evalObj.dataset_covered ?? false;
      generator_module = evalObj.generator_module ?? null;
    }

    finalCoverageMap[std.id] = {
      id: std.id,
      ontology_covered,
      competencies,
      implementation_todos,
      ontology_todos,
      matched_areas,
      matched_scopes,
      matched_abilities,
      reasoning: evalObj.reasoning || '',
      suggested_task: evalObj.suggested_task || { title: '', description: '' },
      dataset_covered,
      generator_module,
      cluster_id: findParentClusterId(std.id, standardsMap)
    };
  }

  // 6. Consolidate Task Backlog from implementationTodos and ontologyTodos
  console.log('[Tasks] Building task backlog from spec TODOs...');
  const tasksByCluster: Record<string, any[]> = {};
  
  for (const [, data] of Object.entries(finalCoverageMap)) {
    if (data.ontology_covered && data.dataset_covered && (!data.ontology_todos || data.ontology_todos.length === 0)) continue;

    const clusterId = data.cluster_id;
    if (!tasksByCluster[clusterId]) {
      tasksByCluster[clusterId] = [];
    }
    tasksByCluster[clusterId].push(data);
  }

  const consolidatedTasks: any[] = [];
  for (const [clusterId, missingStds] of Object.entries(tasksByCluster)) {
    const parentCluster = standardsMap[clusterId] || { description: 'Other Math Concepts' };
    const missingOntology = missingStds.filter(s => !s.ontology_covered || (s.ontology_todos && s.ontology_todos.length > 0));
    const missingGenerator = missingStds.filter(s => s.ontology_covered && (!s.ontology_todos || s.ontology_todos.length === 0) && !s.dataset_covered);

    if (missingOntology.length > 0) {
      const descriptions = missingOntology.map(s => {
        if (s.ontology_todos && s.ontology_todos.length > 0) {
          return `- ${s.id}: ${s.ontology_todos.map((t: any) => `${t.title} (${t.description})`).join('; ')}`;
        }
        return `- ${s.id}: ${s.suggested_task.description || 'Extend ontology'}`;
      });
      consolidatedTasks.push({
        id: `task-ontology-${clusterId}`,
        type: 'ONTOLOGY_EXTENSION',
        cluster_id: clusterId,
        cluster_description: parentCluster.description,
        title: `Extend Ontology for ${clusterId}`,
        description: `Extend ontology to support: ${missingOntology.map(s => s.id).join(', ')}. Details:\n` + descriptions.join('\n'),
        standards: missingOntology.map(s => s.id)
      });
    }

    if (missingGenerator.length > 0) {
      const descriptions = missingGenerator.map(s => {
        if (s.implementation_todos && s.implementation_todos.length > 0) {
          const explanation = s.implementation_todos[0].explanation;
          return `- ${s.id}: ${explanation}`;
        }
        return `- ${s.id}: Implement generator/view for missing competencies`;
      });
      consolidatedTasks.push({
        id: `task-generator-${clusterId}`,
        type: 'DATASET_ENRICHMENT',
        cluster_id: clusterId,
        cluster_description: parentCluster.description,
        title: `Generate Dataset for ${clusterId}`,
        description: `Implement/extend generators and views to cover: ${missingGenerator.map(s => s.id).join(', ')}. Details:\n` + descriptions.join('\n'),
        standards: missingGenerator.map(s => s.id)
      });
    }
  }

  // Save outputs
  const finalJson = {
    metadata: {
      generated_at: new Date().toISOString(),
      ontology_version: version,
      total_leaves_scanned: leafNodes.length,
      covered_count: Object.values(finalCoverageMap).filter(s => s.dataset_covered).length,
      missing_generator_count: Object.values(finalCoverageMap).filter(s => s.ontology_covered && !s.dataset_covered).length,
      missing_ontology_count: Object.values(finalCoverageMap).filter(s => !s.ontology_covered).length,
    },
    coverage: finalCoverageMap,
    tasks: consolidatedTasks
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalJson, null, 2), 'utf-8');
  console.log(`[Output] Successfully wrote coverage and tasks data to: ${OUTPUT_PATH}`);

  const { covered_count, total_leaves_scanned, missing_generator_count, missing_ontology_count } = finalJson.metadata;
  console.log(`\nMapping pipeline complete!`);
  console.log(`Total scanned: ${total_leaves_scanned}`);
  console.log(`Covered by Dataset: ${covered_count} (${Math.round((covered_count/total_leaves_scanned)*100)}%)`);
  console.log(`Missing Generator: ${missing_generator_count}`);
  console.log(`Missing Ontology: ${missing_ontology_count}`);
}

main().catch(console.error);

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { IncomingMessage } from 'http';
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
const DOMAINS_PATH = path.join(TEMP_DIR, 'domain_groups.json');
const OUTPUT_PATH = path.resolve(PROJECT_ROOT, 'public', 'coverage', 'ccss-coverage.json');
const TREE_OUT_PATH = path.resolve(PROJECT_ROOT, 'public', 'coverage', 'ccss-tree.json');

const STANDARDS_URL = 'https://huggingface.co/datasets/allenai/achieve-the-core/raw/main/standards.jsonl';
const DOMAINS_URL = 'https://huggingface.co/datasets/allenai/achieve-the-core/raw/main/domain_groups.json';

// 1. Read package.json to sync ontology version
const pkgPath = path.resolve(PROJECT_ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const edugraphTsUrl = pkg.dependencies['edugraph-ts'] || '';
const versionMatch = edugraphTsUrl.match(/\/releases\/download\/(v[\d.]+)\//);
const version = versionMatch ? versionMatch[1] : 'v0.6.0';

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${dest}...`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response: IncomingMessage) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download file: status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function getDomainCat(id: string): string {
  const parts = id.split('.');
  const first = parts[0];
  if (first.startsWith('HS')) return first.charAt(2) || '';
  if (/^[NAFGS]-/.test(first)) return first.charAt(0);
  return parts[1] || '';
}

function findDomainGroupName(domainCat: string, domainGroups: any): string {
  if (!domainCat) return 'Other';
  for (const [groupName, groupData] of Object.entries(domainGroups)) {
    const cats = (groupData as any).domain_cats || [];
    if (cats.includes(domainCat)) return groupName;
  }
  for (const [groupName, groupData] of Object.entries(domainGroups)) {
    const cats = (groupData as any).domain_cats || [];
    for (const cat of cats) {
      if (domainCat.startsWith(cat) || cat.startsWith(domainCat)) return groupName;
    }
  }
  return 'Other';
}

function getGrade(id: string): string {
  const first = id.split('.')[0];
  if (first.startsWith('HS') || /^[NAFGS]-/.test(first)) return 'High School';
  if (first === 'K') return 'Kindergarten';
  if (/^[1-8]$/.test(first)) return `Grade ${first}`;
  return 'Other';
}

async function ensureStandardsAndTreeData() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  if (!fs.existsSync(STANDARDS_PATH)) {
    await downloadFile(STANDARDS_URL, STANDARDS_PATH);
  }
  if (!fs.existsSync(DOMAINS_PATH)) {
    await downloadFile(DOMAINS_URL, DOMAINS_PATH);
  }

  // Generate ccss-tree.json
  const domainGroups = JSON.parse(fs.readFileSync(DOMAINS_PATH, 'utf-8'));
  const standardsLines = fs.readFileSync(STANDARDS_PATH, 'utf-8').split('\n');
  const standards: any[] = [];
  const standardMap: Record<string, any> = {};

  for (const line of standardsLines) {
    if (line.trim()) {
      const std = JSON.parse(line);
      standards.push(std);
      standardMap[std.id] = std;
    }
  }

  const tree: any = {};
  const gradeOrder = [
    'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'High School'
  ];

  for (const grade of gradeOrder) {
    tree[grade] = {};
    for (const groupName of Object.keys(domainGroups)) {
      tree[grade][groupName] = {
        description: domainGroups[groupName].description,
        domains: {}
      };
    }
    tree[grade]['Other'] = {
      description: 'Other concepts and miscellaneous standards.',
      domains: {}
    };
  }

  const clusters = standards.filter(s => s.level.toLowerCase() === 'cluster');
  const standardsList = standards.filter(s => s.level.toLowerCase() === 'standard');
  const subStandards = standards.filter(s => s.level.toLowerCase() === 'sub-standard');

  const domains: Record<string, any> = {};
  for (const cluster of clusters) {
    const parentDomainId = cluster.parent;
    if (!parentDomainId) continue;
    const grade = getGrade(cluster.id);
    const domainCat = getDomainCat(cluster.id);
    const groupName = findDomainGroupName(domainCat, domainGroups);

    if (!domains[parentDomainId]) {
      domains[parentDomainId] = {
        id: parentDomainId,
        name: `${parentDomainId} - ${groupName}`,
        grade,
        group: groupName,
        clusters: []
      };
    }
  }

  const clusterMap: Record<string, any> = {};
  for (const cluster of clusters) {
    clusterMap[cluster.id] = {
      id: cluster.id,
      description: cluster.description,
      cluster_type: cluster.cluster_type || 'major cluster',
      standards: []
    };
    const domainId = cluster.parent;
    if (domainId && domains[domainId]) {
      domains[domainId].clusters.push(clusterMap[cluster.id]);
    }
  }

  const standardUiMap: Record<string, any> = {};
  for (const std of standardsList) {
    standardUiMap[std.id] = {
      id: std.id,
      description: std.description,
      aspects: std.aspects,
      modeling: std.modeling,
      subStandards: []
    };
    const clusterId = std.parent;
    if (clusterId && clusterMap[clusterId]) {
      clusterMap[clusterId].standards.push(standardUiMap[std.id]);
    }
  }

  for (const sub of subStandards) {
    const parentStdId = sub.parent;
    if (parentStdId && standardUiMap[parentStdId]) {
      standardUiMap[parentStdId].subStandards.push({
        id: sub.id,
        description: sub.description,
        aspects: sub.aspects,
        modeling: sub.modeling
      });
    }
  }

  for (const domain of Object.values(domains)) {
    const { grade, group, id } = domain;
    if (tree[grade] && tree[grade][group]) {
      tree[grade][group].domains[id] = {
        id,
        name: domain.name,
        clusters: domain.clusters
      };
    }
  }

  for (const grade of Object.keys(tree)) {
    for (const groupName of Object.keys(tree[grade])) {
      if (Object.keys(tree[grade][groupName].domains).length === 0) {
        delete tree[grade][groupName];
      }
    }
  }

  const coverageDir = path.resolve(PROJECT_ROOT, 'public', 'coverage');
  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
  }

  fs.writeFileSync(TREE_OUT_PATH, JSON.stringify({ tree, standardsMap: standardMap }, null, 2), 'utf-8');
  console.log(`[Tree] Saved ccss-tree.json to: ${TREE_OUT_PATH}`);
}

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
      let anyMatched = false;
      
      for (const viewSpec of matchingViewsForTarget) {
        if (viewSpec.rejectedLabels && target.labels.some((l: string) => viewSpec.rejectedLabels!.includes(l))) {
            continue;
        }

        const combinedLabels = [...target.labels];

        let problemStub = null;
        
        for (let seed = 42; seed < 52 && !problemStub; seed++) {
          setSeed(seed);
          problemStub = generateWithLabels(gen.generator, combinedLabels);
        }
        
        if (problemStub) {
          anyMatched = true;
          break;
        }
      }

      if (anyMatched) {
        return gen.generatorId;
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

  // 1. Ensure standards and tree data exist
  await ensureStandardsAndTreeData();

  // Extract valid Area, Scope, Ability values
  const allAreas = Object.values(Area);
  const allScopes = Object.values(Scope);
  const allAbilities = Object.values(Ability);

  // 2. Load CCSS leaf standards
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

  // 4. Programmatic Dataset, Permutations & Backlog Processing
  console.log('[Coverage] Processing competencies and dataset matching from spec files...');
  const finalCoverageMap: Record<string, any> = {};
  const sortedLeafIds = leafNodes.map(l => l.id).sort((a, b) => b.length - a.length);

  for (const std of leafNodes) {
    // Match implemented target permutations from spec files
    const matchedTargets = allSpecTargets.filter(t => findStandardIdForTarget(t.id, sortedLeafIds) === std.id);
    const competencies: string[][] = matchedTargets.map(t => t.labels);

    // Match implementation TODOs from spec files
    const matchedImplementationTodos = allImplementationTodos.filter(t => findStandardIdForTarget(t.id, sortedLeafIds) === std.id);
    const implementation_todos = matchedImplementationTodos.map(t => ({
      id: t.id,
      labels: t.labels,
      explanation: t.explanation || ''
    }));

    // Match ontology TODOs from spec files
    const matchedOntologyTodos = allOntologyTodos.filter(o => o.standardId === std.id);
    const ontology_todos = matchedOntologyTodos.map(o => ({
      title: o.title,
      description: o.description
    }));

    const spec_covered = matchedTargets.length > 0 || matchedImplementationTodos.length > 0 || matchedOntologyTodos.length > 0;

    let matched_areas: string[] = [];
    let matched_scopes: string[] = [];
    let matched_abilities: string[] = [];
    let ontology_covered = false;

    if (spec_covered) {
      const allLabels = [...competencies.flat(), ...implementation_todos.flatMap(t => t.labels)];
      if (allLabels.length > 0) {
        const allLabelsUnion = Array.from(new Set(allLabels));
        matched_areas = allLabelsUnion.filter(l => allAreas.includes(l as any));
        matched_scopes = allLabelsUnion.filter(l => allScopes.includes(l as any));
        matched_abilities = allLabelsUnion.filter(l => allAbilities.includes(l as any));
      }
      ontology_covered = (competencies.length > 0 || implementation_todos.length > 0) && matchedOntologyTodos.length === 0;
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
    }

    finalCoverageMap[std.id] = {
      id: std.id,
      spec_covered,
      ontology_covered,
      competencies,
      implementation_todos,
      ontology_todos,
      matched_areas,
      matched_scopes,
      matched_abilities,
      reasoning: spec_covered ? '' : 'Spec file not yet created for this grade.',
      suggested_task: spec_covered ? null : { title: 'Analyze Standard', description: 'Domain analysis required to define target competencies.' },
      dataset_covered,
      generator_module,
      cluster_id: findParentClusterId(std.id, standardsMap)
    };
  }

  // 5. Consolidate Task Backlog from spec TODOs and uncovered standards
  console.log('[Tasks] Building task backlog...');
  const tasksByCluster: Record<string, any[]> = {};
  
  for (const [, data] of Object.entries(finalCoverageMap)) {
    if (data.spec_covered && data.ontology_covered && data.dataset_covered && (!data.ontology_todos || data.ontology_todos.length === 0) && (!data.implementation_todos || data.implementation_todos.length === 0)) continue;

    const clusterId = data.cluster_id;
    if (!tasksByCluster[clusterId]) {
      tasksByCluster[clusterId] = [];
    }
    tasksByCluster[clusterId].push(data);
  }

  const consolidatedTasks: any[] = [];
  for (const [clusterId, missingStds] of Object.entries(tasksByCluster)) {
    const parentCluster = standardsMap[clusterId] || { description: 'Other Math Concepts' };
    
    const specCoveredStds = missingStds.filter(s => s.spec_covered);
    const uncoveredStds = missingStds.filter(s => !s.spec_covered);

    const missingOntology = specCoveredStds.filter(s => s.ontology_todos && s.ontology_todos.length > 0);
    const missingGenerator = specCoveredStds.filter(s => 
      (!s.ontology_todos || s.ontology_todos.length === 0) &&
      ((s.implementation_todos && s.implementation_todos.length > 0) || !s.dataset_covered)
    );

    if (missingOntology.length > 0) {
      const descriptions = missingOntology.map(s => {
        if (s.ontology_todos && s.ontology_todos.length > 0) {
          return `- ${s.id}: ${s.ontology_todos.map((t: any) => `${t.title} (${t.description})`).join('; ')}`;
        }
        return `- ${s.id}: Extend ontology`;
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

    if (uncoveredStds.length > 0) {
      consolidatedTasks.push({
        id: `task-analysis-${clusterId}`,
        type: 'ANALYSIS',
        cluster_id: clusterId,
        cluster_description: parentCluster.description,
        title: `Perform Analysis for ${clusterId}`,
        description: `Perform domain analysis and write spec file for: ${uncoveredStds.map(s => s.id).join(', ')}.`,
        standards: uncoveredStds.map(s => s.id)
      });
    }
  }

  // Save outputs
  const finalJson = {
    metadata: {
      generated_at: new Date().toISOString(),
      ontology_version: version,
      total_leaves_scanned: leafNodes.length,
      spec_covered_count: Object.values(finalCoverageMap).filter(s => s.spec_covered).length,
      covered_count: Object.values(finalCoverageMap).filter(s => s.dataset_covered).length,
      missing_generator_count: Object.values(finalCoverageMap).filter(s => s.spec_covered && (!s.ontology_todos || s.ontology_todos.length === 0) && ((s.implementation_todos && s.implementation_todos.length > 0) || !s.dataset_covered)).length,
      missing_ontology_count: Object.values(finalCoverageMap).filter(s => s.spec_covered && (s.ontology_todos && s.ontology_todos.length > 0)).length,
      analysis_needed_count: Object.values(finalCoverageMap).filter(s => !s.spec_covered).length
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

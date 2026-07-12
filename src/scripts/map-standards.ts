import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Area, Scope, Ability } from 'edugraph-ts';

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

const RDF_PATH = path.join(TEMP_DIR, `core-ontology-math-${version}.rdf`);
const RDF_URL = `https://github.com/christian-bick/edugraph-ontology/releases/download/${version}/core-ontology-math.rdf`;

interface RDFNode {
  uri: string;
  type: 'Area' | 'Scope' | 'Ability' | 'Unknown';
  partOf: string[];
  expands: string[];
}

function parseRDF(rdfContent: string): Record<string, RDFNode> {
  const nodes: Record<string, RDFNode> = {};
  
  const descriptionRegex = /<rdf:Description\s+rdf:about="([^"]+)">([\s\S]*?)<\/rdf:Description>/g;
  let match;
  
  while ((match = descriptionRegex.exec(rdfContent)) !== null) {
    const uri = match[1];
    const innerContent = match[2];
    
    const partOf: string[] = [];
    const partOfRegex = /<edu:partOf\s+rdf:resource="([^"]+)"\s*\/>/g;
    let partMatch;
    while ((partMatch = partOfRegex.exec(innerContent)) !== null) {
      partOf.push(partMatch[1]);
    }
    
    const expands: string[] = [];
    const expandsRegex = /<edu:expands\s+rdf:resource="([^"]+)"\s*\/>/g;
    let expMatch;
    while ((expMatch = expandsRegex.exec(innerContent)) !== null) {
      expands.push(expMatch[1]);
    }
    
    let type: 'Area' | 'Scope' | 'Ability' | 'Unknown' = 'Unknown';
    if (innerContent.includes('rdf:resource="http://edugraph.io/edu#Area"')) {
      type = 'Area';
    } else if (innerContent.includes('rdf:resource="http://edugraph.io/edu#Scope"')) {
      type = 'Scope';
    } else if (innerContent.includes('rdf:resource="http://edugraph.io/edu#Ability"')) {
      type = 'Ability';
    }
    
    nodes[uri] = { uri, type, partOf, expands };
  }
  
  return nodes;
}

function isSubConceptOf(childUri: string, parentUri: string, rdfNodes: Record<string, RDFNode>): boolean {
  if (childUri === parentUri) return true;
  
  const visited = new Set<string>();
  const queue = [childUri];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === parentUri) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const node = rdfNodes[current];
    if (node) {
      for (const parent of [...node.partOf, ...node.expands]) {
        if (!visited.has(parent)) {
          queue.push(parent);
        }
      }
    }
  }
  
  return false;
}

// Cache RDF file
function downloadWithRedirects(urlStr: string, destPath: string, timeoutMs = 15000, retries = 3): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const attemptDownload = (currentUrl: string, attemptsLeft: number) => {
      const request = https.get(currentUrl, (response) => {
        const { statusCode } = response;
        
        // Handle redirect status codes (301, 302, 303, 307, 308)
        if (statusCode && [301, 302, 303, 307, 308].includes(statusCode)) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request.destroy();
            attemptDownload(redirectUrl, attemptsLeft);
            return;
          }
        }

        if (statusCode !== 200) {
          request.destroy();
          if (attemptsLeft > 1) {
            console.warn(`[Download] Received status code ${statusCode} for ${currentUrl}. Retrying in 2s...`);
            setTimeout(() => attemptDownload(currentUrl, attemptsLeft - 1), 2000);
          } else {
            reject(new Error(`Failed to download file. Status code: ${statusCode}`));
          }
          return;
        }

        const file = fs.createWriteStream(destPath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });

      request.on('error', (err) => {
        request.destroy();
        if (attemptsLeft > 1) {
          console.warn(`[Download] Error occurred: ${err.message}. Retrying in 2s...`);
          setTimeout(() => attemptDownload(currentUrl, attemptsLeft - 1), 2000);
        } else {
          reject(err);
        }
      });

      request.setTimeout(timeoutMs, () => {
        request.destroy();
        if (attemptsLeft > 1) {
          console.warn(`[Download] Timeout occurred. Retrying in 2s...`);
          setTimeout(() => attemptDownload(currentUrl, attemptsLeft - 1), 2000);
        } else {
          reject(new Error('Request timed out'));
        }
      });
    };

    attemptDownload(urlStr, retries);
  });
}

async function ensureRdfCached(): Promise<string> {
  if (fs.existsSync(RDF_PATH)) {
    console.log(`[Ontology] RDF cached copy found at ${RDF_PATH}`);
    return fs.readFileSync(RDF_PATH, 'utf-8');
  }

  console.log(`[Ontology] Cache miss. Downloading RDF from: ${RDF_URL}`);
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  await downloadWithRedirects(RDF_URL, RDF_PATH);
  return fs.readFileSync(RDF_PATH, 'utf-8');
}

// Load active generator configurations statically
async function loadGeneratorPermutations() {
  const generatorsDir = path.resolve(PROJECT_ROOT, 'src', 'generators');
  const modules = fs.readdirSync(generatorsDir).filter(d => {
    return fs.statSync(path.join(generatorsDir, d)).isDirectory() && d !== 'shared';
  });

  const generatorPerms: Record<string, any[]> = {};
  for (const moduleName of modules) {
    const permPath = path.join(generatorsDir, moduleName, 'permutations.ts');
    if (fs.existsSync(permPath)) {
      try {
        const { config } = await import(`../generators/${moduleName}/permutations.ts`);
        if (config && config.generationConfig && config.generationConfig.permutations) {
          generatorPerms[moduleName] = config.generationConfig.permutations;
          console.log(`[Generators] Statically loaded ${config.generationConfig.permutations.length} permutations for [${moduleName}]`);
        }
      } catch (e) {
        console.warn(`[Generators] Could not load permutations for ${moduleName}:`, e);
      }
    }
  }
  return generatorPerms;
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

async function main() {
  const args = process.argv.slice(2);
  const gradeLimit = args.find(a => a.startsWith('--grade='))?.split('=')[1];
  const excludeHS = args.includes('--k8') || args.includes('--exclude-hs');

  console.log('--- Initiating CCSS Ontology Mapping Pipeline ---');

  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not found in environment variables.');
    process.exit(1);
  }

  // 1. Load ontology context
  const ontologyRdf = await ensureRdfCached();
  const rdfNodes = parseRDF(ontologyRdf);
  console.log(`[Ontology] Parsed ${Object.keys(rdfNodes).length} nodes from RDF schema.`);

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
      // Include all leaf standards, but allow excluding High School if requested
      const first = std.id.split('.')[0];
      const isHS = first.startsWith('HS') || /^[NAFGS]-/.test(first);
      
      if (!isHS || !excludeHS) {
        leafNodes.push(std);
      }
    }
  }

  // Filter leaf nodes if limit set
  let targetLeaves = leafNodes;
  if (gradeLimit) {
    targetLeaves = leafNodes.filter(n => {
      const first = n.id.split('.')[0];
      const normalizedLimit = gradeLimit.toLowerCase().trim();
      
      // Kindergarten
      if ((normalizedLimit === 'k' || normalizedLimit === 'kindergarten') && first === 'K') return true;
      
      // High School
      if (normalizedLimit === 'hs' || normalizedLimit === 'high school') {
        return first.startsWith('HS') || /^[NAFGS]-/.test(first);
      }
      
      // Specific numerical grade
      if (first === gradeLimit) return true;
      if (`grade ${first}`.toLowerCase() === normalizedLimit) return true;
      
      return false;
    });
    console.log(`[CCSS] Filtering standards for Grade Limit: ${gradeLimit}. Found ${targetLeaves.length} leaf nodes.`);
  } else {
    console.log(`[CCSS] Found ${targetLeaves.length} total leaf nodes to evaluate.`);
  }

  // 3. Load active generator permutations
  const generatorPerms = await loadGeneratorPermutations();
  const activePermsList: { moduleName: string; labels: Set<string> }[] = [];
  for (const [moduleName, perms] of Object.entries(generatorPerms)) {
    for (const perm of perms) {
      activePermsList.push({
        moduleName,
        labels: new Set(perm.labels)
      });
    }
  }

  // 4. Configure Gemini client
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      evaluations: {
        type: SchemaType.ARRAY,
        description: "Array of standard mapping evaluations",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING, description: "The exact ID of the standard" },
            ontology_covered: { type: SchemaType.BOOLEAN, description: "True if the ontology contains classes representing the concept" },
            matched_areas: { 
              type: SchemaType.ARRAY, 
              items: { type: SchemaType.STRING },
              description: "Array of matched Area ontology IRIs"
            },
            matched_scopes: { 
              type: SchemaType.ARRAY, 
              items: { type: SchemaType.STRING },
              description: "Array of matched Scope ontology IRIs"
            },
            matched_abilities: { 
              type: SchemaType.ARRAY, 
              items: { type: SchemaType.STRING },
              description: "Array of matched Ability ontology IRIs"
            },
            reasoning: { type: SchemaType.STRING, description: "Pedagogical explanation of the match or what is missing" },
            suggested_task: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING, description: "Clear short task title if missing" },
                description: { type: SchemaType.STRING, description: "Actionable details on what to add" }
              },
              required: ["title", "description"]
            }
          },
          required: ["id", "ontology_covered", "matched_areas", "matched_scopes", "matched_abilities", "reasoning", "suggested_task"]
        }
      }
    },
    required: ["evaluations"]
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.1
    }
  });

  // 5. Load existing coverage cache if it exists
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

  const evalOntology = args.includes('--eval-ontology');
  const uncachedLeaves = targetLeaves.filter(leaf => 
    !cache[leaf.id] || 
    cache[leaf.id].ontology_covered === undefined ||
    (evalOntology && cache[leaf.id].ontology_covered === false)
  );
  console.log(`[CCSS] ${targetLeaves.length - uncachedLeaves.length} standards already cached. ${uncachedLeaves.length} need evaluation.`);

  const BATCH_SIZE = 10;
  const results: Record<string, any> = {};

  for (let i = 0; i < uncachedLeaves.length; i += BATCH_SIZE) {
    const batch = uncachedLeaves.slice(i, i + BATCH_SIZE);
    console.log(`[Gemini] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(uncachedLeaves.length / BATCH_SIZE)} (${batch.length} standards)...`);

    const prompt = `
You are an expert curriculum mapper and ontologist. Your task is to map a batch of Common Core State Standards (CCSS) leaf nodes to the EduGraph mathematical ontology.

Here is the context of the EduGraph Ontology (classes and properties):
${ontologyRdf}

Valid Ontology Terms:
- AREAS (Focus primary matching here):
${allAreas.map(a => `  * ${a}`).join('\n')}

- SCOPES (Secondary matching):
${allScopes.map(s => `  * ${s}`).join('\n')}

- ABILITIES (Tertiary matching - typically http://edugraph.io/edu/ProcedureExecution):
${allAbilities.map(ab => `  * ${ab}`).join('\n')}

INSTRUCTIONS:
For each CCSS standard in the list below, determine if it can be represented by a combination of the valid Areas, Scopes, and Abilities.
1. Match the concept of the standard:
   - Primary: Match the mathematical topic/action to one or more AREAS (e.g., addition, subtraction, division).
   - Secondary: Match the number domain, representation, or visual elements to one or more SCOPES (e.g., IntegersWithZero, Base10).
   - Tertiary: Match the pedagogical action to one or more ABILITIES (typically http://edugraph.io/edu/ProcedureExecution).
2. Set "ontology_covered" to true if the ontology has the concepts required to represent this standard.
3. If the ontology does NOT cover this standard, set "ontology_covered" to false. In this case, "matched_areas", "matched_scopes", and "matched_abilities" can be empty. Provide a "suggested_task" describing the new classes/concepts that need to be added to the ontology (e.g., "Add Fractions area and representation scopes").
4. If the ontology covers it, populate the "matched_areas", "matched_scopes", and "matched_abilities" lists. You can leave the "suggested_task" fields with empty strings, or suggest a minor enrichment.

Standard Batch to Evaluate:
${JSON.stringify(batch.map(b => ({ id: b.id, description: b.description })), null, 2)}
`;

    try {
      const chatRes = await model.generateContent(prompt);
      const resText = chatRes.response.text();
      const parsed = JSON.parse(resText);

      if (parsed && parsed.evaluations) {
        for (const evalObj of parsed.evaluations) {
          // Post-processing filter to ensure only valid IRIs are allowed
          evalObj.matched_areas = (evalObj.matched_areas || []).filter((x: string) => allAreas.includes(x as any));
          evalObj.matched_scopes = (evalObj.matched_scopes || []).filter((x: string) => allScopes.includes(x as any));
          evalObj.matched_abilities = (evalObj.matched_abilities || []).filter((x: string) => allAbilities.includes(x as any));
          
          results[evalObj.id] = evalObj;
        }
      }
    } catch (err) {
      console.error(`[Gemini] Failed to process batch starting at index ${i}:`, err);
    }
  }

  // 6. Programmatic Dataset Coverage Check
  console.log('[Coverage] Running deterministic dataset checks...');
  const finalCoverageMap: Record<string, any> = {};

  for (const std of leafNodes) {
    const evalObj = results[std.id] || cache[std.id] || {
      id: std.id,
      ontology_covered: false,
      matched_areas: [],
      matched_scopes: [],
      matched_abilities: [],
      reasoning: 'Evaluation missing/failed.',
      suggested_task: { title: 'Map Standard', description: 'Re-run evaluation for this standard.' }
    };

    let dataset_covered = false;
    let generator_module = null;

    if (evalObj.ontology_covered) {
      const requiredTags = [
        ...evalObj.matched_areas,
        ...evalObj.matched_scopes
      ];

      if (requiredTags.length > 0) {
        const allAbilities = Object.values(Ability);
        
        // Find all permutations that overlap with the required tags (excluding abilities)
        const qualifyingPerms = activePermsList.filter(perm => {
          const permTags = Array.from(perm.labels).filter(l => !allAbilities.includes(l as any));
          return permTags.some(genLabel => {
            return requiredTags.some(reqTag => isSubConceptOf(genLabel, reqTag, rdfNodes));
          });
        });

        if (qualifyingPerms.length > 0) {
          const unionTags = new Set<string>();
          qualifyingPerms.forEach(p => {
            Array.from(p.labels)
              .filter(l => !allAbilities.includes(l as any))
              .forEach(t => unionTags.add(t));
          });

          // Standard is covered if all required Areas/Scopes are in this union
          const coversAll = requiredTags.every(reqTag => {
            return Array.from(unionTags).some(qTag => isSubConceptOf(qTag, reqTag, rdfNodes));
          });

          if (coversAll) {
            dataset_covered = true;
            // Since it's a union, we list the distinct modules involved
            const modules = Array.from(new Set(qualifyingPerms.map(p => p.moduleName)));
            generator_module = modules.join(', ');
          }
        }
      }
    }

    finalCoverageMap[std.id] = {
      ...evalObj,
      dataset_covered,
      generator_module,
      cluster_id: findParentClusterId(std.id, standardsMap)
    };
  }

  // 7. Group & Cluster Tasks by parent Cluster ID
  console.log('[Tasks] Grouping task backlog by Cluster ID...');
  const tasksByCluster: Record<string, any[]> = {};
  
  for (const [stdId, data] of Object.entries(finalCoverageMap)) {
    if (data.dataset_covered) continue;

    const clusterId = data.cluster_id;
    if (!tasksByCluster[clusterId]) {
      tasksByCluster[clusterId] = [];
    }
    tasksByCluster[clusterId].push(data);
  }

  // Consolidate into structured backlog tasks
  const consolidatedTasks: any[] = [];
  for (const [clusterId, missingStds] of Object.entries(tasksByCluster)) {
    const parentCluster = standardsMap[clusterId] || { description: 'Other Math Concepts' };
    const missingOntology = missingStds.filter(s => !s.ontology_covered);
    const missingGenerator = missingStds.filter(s => s.ontology_covered && !s.dataset_covered);

    if (missingOntology.length > 0) {
      consolidatedTasks.push({
        id: `task-ontology-${clusterId}`,
        type: 'ONTOLOGY_EXTENSION',
        cluster_id: clusterId,
        cluster_description: parentCluster.description,
        title: `Extend Ontology for ${clusterId}`,
        description: `Extend ontology to support: ${missingOntology.map(s => `${s.id} (${s.suggested_task.title})`).join(', ')}. Details:\n` +
          missingOntology.map(s => `- ${s.id}: ${s.suggested_task.description}`).join('\n'),
        standards: missingOntology.map(s => s.id)
      });
    }

    if (missingGenerator.length > 0) {
      consolidatedTasks.push({
        id: `task-generator-${clusterId}`,
        type: 'DATASET_ENRICHMENT',
        cluster_id: clusterId,
        cluster_description: parentCluster.description,
        title: `Generate Dataset for ${clusterId}`,
        description: `Implement/extend generators and views to cover: ${missingGenerator.map(s => s.id).join(', ')}. Suggested tasks:\n` +
          missingGenerator.map(s => `- ${s.id}: ${s.suggested_task.description || 'Map to matching ontology tags'}`).join('\n'),
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

  // Summary Metrics
  const { covered_count, total_leaves_scanned, missing_generator_count, missing_ontology_count } = finalJson.metadata;
  console.log(`\nMapping pipeline complete!`);
  console.log(`Total scanned: ${total_leaves_scanned}`);
  console.log(`Covered by Dataset: ${covered_count} (${Math.round((covered_count/total_leaves_scanned)*100)}%)`);
  console.log(`Missing Generator: ${missing_generator_count}`);
  console.log(`Missing Ontology: ${missing_ontology_count}`);
}

main().catch(console.error);

import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync, lstatSync, readdirSync } from 'fs';
import { isSubConceptOf, isCompatibleConcept } from '../lib/ontology.ts';
import { setSeed } from '../lib/random.ts';
import { getViewToProblemTypeMap, getGeneratorProblemType } from '../lib/type-parser.ts';
import { Ability } from 'edugraph-ts';
import { extractSchemaLabels, generateWithLabels } from '../lib/utils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

async function main() {
    const args = process.argv.slice(2);
    const specArg = args.find(a => a.startsWith('--spec='));
    if (!specArg) {
        console.error('Error: The --spec parameter is required.');
        console.error('Usage: npx vite-node src/scripts/show-matching-stats.ts --spec=<spec_module>');
        console.error('Example: npx vite-node src/scripts/show-matching-stats.ts --spec=test');
        console.error('Example: npx vite-node src/scripts/show-matching-stats.ts --spec=ccss');
        process.exit(1);
    }
    const specName = specArg.split('=')[1];

    const specPath = resolve(PROJECT_ROOT, 'src', 'spec', specName);
    const specDir = existsSync(specPath) && lstatSync(specPath).isDirectory() ? specPath : null;
    const specFile = !specDir && existsSync(`${specPath}.ts`) ? `${specPath}.ts` : null;

    if (!specDir && !specFile) {
        console.error(`Error: Spec module not found at: ${specPath}`);
        process.exit(1);
    }

    interface CompetencyTarget {
        id: string;
        labels: string[];
        constraints?: Record<string, any>;
    }

    const allTargets: CompetencyTarget[] = [];
    if (specDir) {
        const files = readdirSync(specDir).filter(f => f.endsWith('.ts'));
        for (const file of files) {
            const filePath = resolve(specDir, file);
            const module = await import(pathToFileURL(filePath).href);
            for (const [key, value] of Object.entries(module)) {
                if (Array.isArray(value)) {
                    allTargets.push(...value);
                }
            }
        }
    } else if (specFile) {
        const module = await import(pathToFileURL(specFile).href);
        for (const [key, value] of Object.entries(module)) {
            if (Array.isArray(value)) {
                allTargets.push(...value);
            }
        }
    }

    console.log('========================================================================');
    console.log('                 EduGraph Competency Matching Statistics                ');
    console.log('========================================================================\n');

    // 1. Load all view specs
    const viewsDir = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
    const allViewDirs = readdirSync(viewsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const allViewSpecs = [];
    const viewGeneralLabelsMap: Record<string, string[]> = {};
    for (const viewId of allViewDirs) {
        const viewSpecPath = resolve(viewsDir, viewId, 'spec.ts');
        if (existsSync(viewSpecPath)) {
            try {
                const viewSpecModule = await import(`../visuals/views/${viewId}/spec.ts`);
                allViewSpecs.push(viewSpecModule.spec);

                const viewCamelCase = viewId.replace(/-([a-z])/g, g => g[1].toUpperCase());
                const camelCaseName = viewCamelCase[0].toUpperCase() + viewCamelCase.slice(1);
                const viewSchema = viewSpecModule[`${camelCaseName}ViewSchema`];
                const viewLabels = Array.from(new Set([
                    ...(viewSpecModule.spec?.generalLabels || []),
                    ...extractSchemaLabels(viewSchema)
                ]));
                viewGeneralLabelsMap[viewId] = viewLabels;
            } catch (e) {
                // Ignore missing or invalid specs
            }
        }
    }

    // 2. Load all generator specs and classes
    const generatorsDir = resolve(PROJECT_ROOT, 'src', 'generators');
    const allGenDirs = readdirSync(generatorsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const allGeneratorSpecs = [];
    for (const genId of allGenDirs) {
        const specPath = resolve(generatorsDir, genId, 'spec.ts');
        const genPath = resolve(generatorsDir, genId, 'generator.ts');
        if (existsSync(specPath) && existsSync(genPath)) {
            try {
                const specModule = await import(`../generators/${genId}/spec.ts`);
                const generatorSpec = specModule.spec;

                const camelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());
                const className = camelCase(genId[0].toUpperCase() + genId.slice(1)) + 'Generator';
                const generatorModule = await import(`../generators/${genId}/generator.ts`);
                const GeneratorClass = generatorModule[className];
                
                if (GeneratorClass) {
                    const generator = new GeneratorClass();
                    const generatorGeneralLabels = Array.from(new Set([
                        ...(generatorSpec?.generalLabels || []),
                        ...extractSchemaLabels(generator.schema)
                    ]));
                    allGeneratorSpecs.push({
                        generatorId: genId,
                        spec: generatorSpec,
                        generatorGeneralLabels,
                        generator
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }

    console.log(`Loaded ${allViewSpecs.length} View Specifications.`);
    console.log(`Loaded ${allGeneratorSpecs.length} Generator Specifications.`);
    console.log(`Loaded ${allTargets.length} targets from spec module "${specName}".\n`);

    const viewToType = getViewToProblemTypeMap();
    const abilitiesList = new Set<string>(Object.values(Ability));

    let targetCount = 0;
    const generatorStats: Record<string, { targetMatches: number; viewPairs: number }> = {};
    for (const gen of allGeneratorSpecs) {
        generatorStats[gen.generatorId] = { targetMatches: 0, viewPairs: 0 };
    }

    for (const target of allTargets) {
        targetCount++;
        console.log(`------------------------------------------------------------------------`);
        console.log(`Target ${targetCount}/${allTargets.length}: ${target.id}`);
        console.log(`Labels: ${target.labels.map(l => l.split('/').pop()).join(', ')}`);
        
        let targetHasMatch = false;

        for (const gen of allGeneratorSpecs) {
            const genTypeName = getGeneratorProblemType(gen.generatorId);
            if (!genTypeName) continue;

            const compatibleViews = allViewSpecs.filter(v => viewToType[v.viewId] === genTypeName);
            if (compatibleViews.length === 0) continue;

            if (!gen.generatorGeneralLabels) {
                continue;
            }

            // Check if union of labels supports target labels
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
                // Generate a deterministic sample problem to test constraints. Retry over a
                // few fixed seeds: generators may legitimately return null for an unlucky
                // sample (e.g. tied category counts), which the dataset pipeline retries too.
                let problemStub = null;
                for (let seed = 42; seed < 52 && !problemStub; seed++) {
                    setSeed(seed);
                    problemStub = generateWithLabels(gen.generator, target.labels);
                }

                if (problemStub) {
                    const matchedViews = matchingViewsForTarget.filter(viewSpec => {
                        if (viewSpec.constraints) {
                            for (const [key, constraint] of Object.entries(viewSpec.constraints) as any) {
                                const val = problemStub.data[key] !== undefined ? problemStub.data[key] : target.constraints[key];
                                if (val === undefined) {
                                    const VISUAL_PARAMS = new Set(['outline', 'reverse', 'decimal', 'desc', 'asc']);
                                    if (VISUAL_PARAMS.has(key)) {
                                        continue;
                                    }
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
                        targetHasMatch = true;
                        generatorStats[gen.generatorId].targetMatches++;
                        generatorStats[gen.generatorId].viewPairs += matchedViews.length;

                        console.log(`  └─► Generator: [${gen.generatorId}]`);
                        console.log(`      └─► Compatible Views: [${matchedViews.map(v => v.viewId).join(', ')}]`);
                    }
                } else {
                    console.log(`  └─► Generator: [${gen.generatorId}] (Returned null stub)`);
                }
            }
        }

        if (!targetHasMatch) {
            console.log(`  └─► Compatible Generator: NONE (Legacy or Unmatched)`);
        }
    }

    console.log('\n========================================================================');
    console.log('                           SUMMARY STATISTICS                           ');
    console.log('========================================================================');
    console.table(Object.entries(generatorStats).map(([genId, stats]) => ({
        'Generator ID': genId,
        'Matched CCSS Targets': stats.targetMatches,
        'Total Generator-View Pairs': stats.viewPairs
    })));
    console.log('========================================================================\n');
}

main().catch(console.error);

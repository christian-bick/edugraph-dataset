import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';
import { KindergartenSpec } from '../../config/spec/ccss/kindergarten.ts';
import { doesGeneratorSupportCompetency, findCompatibleViews } from '../lib/ontology.ts';
import { setSeed } from '../lib/random.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

async function main() {
    console.log('========================================================================');
    console.log('                 EduGraph Competency Matching Statistics                ');
    console.log('========================================================================\n');

    // 1. Load all view specs
    const viewsDir = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
    const allViewDirs = readdirSync(viewsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const allViewSpecs = [];
    for (const viewId of allViewDirs) {
        const viewSpecPath = resolve(viewsDir, viewId, 'spec.ts');
        if (existsSync(viewSpecPath)) {
            try {
                const viewSpecModule = await import(`../visuals/views/${viewId}/spec.ts`);
                allViewSpecs.push(viewSpecModule.spec);
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
                    allGeneratorSpecs.push({
                        generatorId: genId,
                        spec: generatorSpec,
                        generator: new GeneratorClass()
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }

    console.log(`Loaded ${allViewSpecs.length} View Specifications.`);
    console.log(`Loaded ${allGeneratorSpecs.length} Generator Specifications.`);
    console.log(`Loaded ${KindergartenSpec.length} CCSS Kindergarten Targets.\n`);

    let targetCount = 0;
    const generatorStats: Record<string, { targetMatches: number; viewPairs: number }> = {};
    for (const gen of allGeneratorSpecs) {
        generatorStats[gen.generatorId] = { targetMatches: 0, viewPairs: 0 };
    }

    for (const target of KindergartenSpec) {
        targetCount++;
        console.log(`------------------------------------------------------------------------`);
        console.log(`Target ${targetCount}/${KindergartenSpec.length}: ${target.id}`);
        console.log(`Labels: ${target.labels.map(l => l.split('/').pop()).join(', ')}`);
        
        let targetHasMatch = false;

        for (const gen of allGeneratorSpecs) {
            // Check if generator supports this target
            if (gen.spec.supportedLabels && gen.spec.supportedLabels.length > 0) {
                const isMatched = doesGeneratorSupportCompetency(gen.spec.supportedLabels, target.labels);
                if (isMatched) {
                    targetHasMatch = true;
                    generatorStats[gen.generatorId].targetMatches++;

                    // Generate a deterministic sample problem to test views
                    setSeed(42);
                    const problemStub = gen.generator.generate({
                        labels: target.labels,
                        constraints: target.constraints
                    });

                    if (problemStub) {
                        const matchedViews = findCompatibleViews(target.labels, problemStub.data, allViewSpecs, target.constraints);
                        generatorStats[gen.generatorId].viewPairs += matchedViews.length;
                        
                        console.log(`  └─► Generator: [${gen.generatorId}]`);
                        if (matchedViews.length > 0) {
                            console.log(`      └─► Compatible Views: [${matchedViews.map(v => v.viewId).join(', ')}]`);
                        } else {
                            console.log(`      └─► Compatible Views: NONE (No views matched physical constraints)`);
                        }
                    } else {
                        console.log(`  └─► Generator: [${gen.generatorId}] (Returned null stub)`);
                    }
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

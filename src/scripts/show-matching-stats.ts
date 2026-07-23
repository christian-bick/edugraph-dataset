import {
    loadTargets,
    loadGeneratorCatalog,
    loadViewCatalog,
    matchTargets,
    computeSampleKey,
    generateSampleWithRetry
} from '../lib/generation.ts';
import { shortenLabel } from '../lib/utils.ts';

async function main() {
    const args = process.argv.slice(2);
    const specName = process.env.npm_config_spec || (args.find(a => a.includes('spec='))?.split('spec=')[1]);
    if (!specName) {
        console.error('Error: The --spec parameter is required.');
        console.error('Usage: npx vite-node src/scripts/show-matching-stats.ts --spec=<spec_module>');
        console.error('Example: npx vite-node src/scripts/show-matching-stats.ts --spec=test');
        console.error('Example: npx vite-node src/scripts/show-matching-stats.ts --spec=ccss');
        process.exit(1);
    }

    const [allTargets, generatorCatalog, viewCatalog] = await Promise.all([
        loadTargets(specName),
        loadGeneratorCatalog(),
        loadViewCatalog()
    ]);

    console.log('========================================================================');
    console.log('                 EduGraph Competency Matching Statistics                ');
    console.log('========================================================================\n');

    console.log(`Loaded ${viewCatalog.length} View Specifications.`);
    console.log(`Loaded ${generatorCatalog.length} Generator Specifications.`);
    console.log(`Loaded ${allTargets.length} targets from spec module "${specName}".\n`);

    let targetCount = 0;
    const generatorStats: Record<string, { targetMatches: number; viewPairs: number }> = {};
    for (const gen of generatorCatalog) {
        generatorStats[gen.generatorId] = { targetMatches: 0, viewPairs: 0 };
    }

    for (const target of allTargets) {
        targetCount++;
        console.log(`------------------------------------------------------------------------`);
        console.log(`Target ${targetCount}/${allTargets.length}: ${target.id}`);
        console.log(`Labels: ${target.labels.map(l => l.split('/').pop()).join(', ')}`);

        const { tuples, rejections } = matchTargets([target], generatorCatalog, viewCatalog);

        // Group matched tuples per generator and probe actual generation using
        // the production sample keys, so the stats reflect what the pipeline
        // would really produce.
        const viewsByGenerator = new Map<string, string[]>();
        for (const tuple of tuples) {
            if (!viewsByGenerator.has(tuple.generatorId)) {
                viewsByGenerator.set(tuple.generatorId, []);
            }
            viewsByGenerator.get(tuple.generatorId)!.push(tuple.viewId);
        }

        let targetHasMatch = false;

        for (const [generatorId, viewIds] of viewsByGenerator.entries()) {
            const generator = generatorCatalog.find(g => g.generatorId === generatorId)!.generator;
            const generatingViews: string[] = [];
            const failingViews: string[] = [];

            for (const viewId of viewIds) {
                const sampleKey = computeSampleKey({
                    targetId: target.id,
                    generatorId,
                    viewId,
                    split: 'train',
                    mode: 'question',
                    instanceIdx: 0
                });
                try {
                    const { stub } = generateSampleWithRetry({
                        generator,
                        labels: [...target.labels],
                        sampleKey,
                        maxAttempts: 10
                    });
                    if (stub) {
                        generatingViews.push(viewId);
                    } else {
                        failingViews.push(`${viewId} (null stub)`);
                    }
                } catch (e) {
                    failingViews.push(`${viewId} (${e instanceof Error ? e.message : String(e)})`);
                }
            }

            if (generatingViews.length > 0) {
                targetHasMatch = true;
                generatorStats[generatorId].targetMatches++;
                generatorStats[generatorId].viewPairs += generatingViews.length;

                console.log(`  └─► Generator: [${generatorId}]`);
                console.log(`      └─► Compatible Views: [${generatingViews.join(', ')}]`);
            }
            for (const failure of failingViews) {
                console.log(`  └─► Generator: [${generatorId}] failed generation for: ${failure}`);
            }
        }

        // Rejected-label verdicts are deliberate view boundaries worth surfacing
        const rejectedByView = rejections.filter(r => r.verdict.reason === 'rejected-label');
        for (const rejection of rejectedByView) {
            console.log(`  └─► View [${rejection.viewId}] rejects ${shortenLabel(rejection.verdict.label!)} (via ${rejection.generatorId})`);
        }

        if (!targetHasMatch) {
            console.log(`  └─► Compatible Generator: NONE (Legacy or Unmatched)`);
            const unsupported = rejections.filter(r => r.verdict.reason === 'unsupported-label');
            const labelCounts = new Map<string, number>();
            for (const rejection of unsupported) {
                const label = shortenLabel(rejection.verdict.label || 'unknown');
                labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
            }
            for (const [label, count] of labelCounts.entries()) {
                console.log(`      └─► Unsupported label across ${count} pair(s): ${label}`);
            }
        }
    }

    console.log('\n========================================================================');
    console.log('                           SUMMARY STATISTICS                           ');
    console.log('========================================================================');
    console.table(Object.entries(generatorStats).map(([genId, stats]) => ({
        'Generator ID': genId,
        'Matched Targets': stats.targetMatches,
        'Total Generator-View Pairs': stats.viewPairs
    })));
    console.log('========================================================================\n');
}

main().catch(console.error);

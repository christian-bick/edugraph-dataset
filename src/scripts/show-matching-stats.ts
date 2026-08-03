import {
    loadGeneratorCatalog,
    loadViewCatalog,
    matchTargets,
    computeSampleKey,
    generateSampleWithRetry
} from '../lib/generation.ts';
import { loadMatchingTargets } from '../lib/spec-validator.ts';
import { shortenLabel } from '../lib/utils.ts';
import { getCliOption } from '../lib/cli.ts';

async function main() {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec');
    const raw = args.includes('--raw');
    if (!specName) {
        console.error('Error: The --spec parameter is required.');
        console.error('Usage: npx vite-node src/scripts/show-matching-stats.ts --spec=<spec_module> [--raw]');
        console.error('Example: npx vite-node src/scripts/show-matching-stats.ts --spec=test');
        console.error('Example: npx vite-node src/scripts/show-matching-stats.ts --spec=ccss --raw');
        process.exit(1);
    }

    const [allTargets, generatorCatalog, viewCatalog] = await Promise.all([
        loadMatchingTargets(specName, { raw }),
        loadGeneratorCatalog(),
        loadViewCatalog()
    ]);

    console.log('========================================================================');
    console.log('                 EduGraph Competency Matching Statistics                ');
    console.log('========================================================================\n');

    console.log(`Loaded ${viewCatalog.length} View Specifications.`);
    console.log(`Loaded ${generatorCatalog.length} Generator Specifications.`);
    const targetMode = raw ? 'raw source definitions' : 'production-normalized targets';
    console.log(`Loaded ${allTargets.length} ${targetMode} from spec module "${specName}".\n`);

    let targetCount = 0;
    const generatorStats: Record<string, { targetMatches: number; viewPairs: number }> = {};
    for (const gen of generatorCatalog) {
        generatorStats[gen.generatorId] = { targetMatches: 0, viewPairs: 0 };
    }

    for (const target of allTargets) {
        targetCount++;
        console.log('------------------------------------------------------------------------');
        console.log(`Target ${targetCount}/${allTargets.length}: ${target.id}`);
        console.log(`Labels: ${target.labels.map(shortenLabel).join(', ')}`);

        const { tuples, rejections } = matchTargets([target], generatorCatalog, viewCatalog);

        // Matching and generation are separate facts. Every semantic tuple is
        // reported even when its bounded generation probe cannot produce a stub.
        const viewsByGenerator = new Map<string, string[]>();
        for (const tuple of tuples) {
            const viewIds = viewsByGenerator.get(tuple.generatorId) ?? [];
            viewIds.push(tuple.viewId);
            viewsByGenerator.set(tuple.generatorId, viewIds);
        }

        for (const [generatorId, viewIds] of viewsByGenerator.entries()) {
            const generator = generatorCatalog.find(entry => entry.generatorId === generatorId)!.generator;
            generatorStats[generatorId].targetMatches++;
            generatorStats[generatorId].viewPairs += viewIds.length;

            console.log(`  Generator: [${generatorId}]`);
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
                    const { stub, attempt } = generateSampleWithRetry({
                        generator,
                        labels: [...target.labels],
                        sampleKey,
                        maxAttempts: 10
                    });
                    const probeStatus = stub
                        ? `probe generated on attempt ${attempt}`
                        : `probe produced no stub after ${attempt} attempts`;
                    console.log(`    View: [${viewId}] - semantic match; ${probeStatus}`);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.log(`    View: [${viewId}] - semantic match; probe failed: ${message}`);
                }
            }
        }

        // Rejected-label verdicts are deliberate view boundaries worth surfacing.
        const rejectedByView = rejections.filter(rejection => rejection.verdict.reason === 'rejected-label');
        for (const rejection of rejectedByView) {
            console.log(
                `  View [${rejection.viewId}] rejects ${shortenLabel(rejection.verdict.label!)} ` +
                `(via ${rejection.generatorId})`
            );
        }

        if (tuples.length === 0) {
            console.log('  Compatible Generator: NONE (Legacy or Unmatched)');
            const unsupported = rejections.filter(rejection => rejection.verdict.reason === 'unsupported-label');
            const labelCounts = new Map<string, number>();
            for (const rejection of unsupported) {
                const label = shortenLabel(rejection.verdict.label || 'unknown');
                labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
            }
            for (const [label, count] of labelCounts.entries()) {
                console.log(`    Unsupported label across ${count} pair(s): ${label}`);
            }
        }
    }

    console.log('\n========================================================================');
    console.log('                           SUMMARY STATISTICS                           ');
    console.log('========================================================================');
    console.table(Object.entries(generatorStats).map(([generatorId, stats]) => ({
        'Generator ID': generatorId,
        'Semantically Matched Targets': stats.targetMatches,
        'Semantic Generator-View Pairs': stats.viewPairs
    })));
    console.log('========================================================================\n');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});

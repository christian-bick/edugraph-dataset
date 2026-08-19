import { describe, expect, it } from 'vitest';
import {
    computeSampleKey,
    computeSampleSeed,
    generateSample,
    generateSampleByKey,
    generateTargetSamples,
    loadGeneratorCatalog,
    loadTargets,
    loadViewCatalog,
    matchTargets,
    SampleIdentity
} from './generation.ts';
import { isProblemTypeCompatible } from './type-parser.ts';
import {Scope} from 'edugraph-ts';

describe('catalogs and end-to-end matching', () => {
    it('routes CCSS comparison targets to representation-compatible views', async () => {
        const [generatorCatalog, viewCatalog, targets] = await Promise.all([
            loadGeneratorCatalog(),
            loadViewCatalog(),
            loadTargets('ccss')
        ]);
        const { tuples } = matchTargets(targets, generatorCatalog, viewCatalog);
        const viewsFor = (targetPrefix: string) => new Set(
            tuples
                .filter(tuple => tuple.target.id.startsWith(targetPrefix))
                .map(tuple => tuple.viewId)
        );

        expect(viewsFor('K.CC.C.6-compare-groups')).toEqual(new Set([
            'numbers-compare-counting',
            'numbers-compare-matching'
        ]));
        expect(viewsFor('K.CC.C.7-compare-numerals')).toEqual(new Set([
            'numbers-compare'
        ]));
        expect(viewsFor('1.NBT.B.3-place-value-comparison')).toEqual(new Set([
            'numbers-place-value-comparison'
        ]));
    }, 90000);

    it('loads catalogs, matches the test spec and replays a sample by key', async () => {
        const [generatorCatalog, viewCatalog, targets] = await Promise.all([
            loadGeneratorCatalog(),
            loadViewCatalog(),
            loadTargets('test')
        ]);

        expect(generatorCatalog.length).toBeGreaterThan(0);
        expect(viewCatalog.length).toBeGreaterThan(0);
        expect(targets.length).toBeGreaterThan(0);

        expect(viewCatalog
            .find(view => view.viewId === 'operations-word-problem-within-100')
            ?.supportedLabels
        ).toContain(Scope.LengthMeasurement);

        for (const gen of generatorCatalog) {
            expect(gen.generatorId).toBeTruthy();
            expect(Array.isArray(gen.labels)).toBe(true);
        }

        const { tuples, rejections } = matchTargets(targets, generatorCatalog, viewCatalog);
        expect(tuples.length).toBeGreaterThan(0);

        for (const tuple of tuples) {
            const gen = generatorCatalog.find(g => g.generatorId === tuple.generatorId)!;
            const view = viewCatalog.find(v => v.viewId === tuple.viewId)!;
            if (gen.problemType != null && view.problemType != null) {
                expect(isProblemTypeCompatible(gen.problemType, view.problemType)).toBe(true);
            }
        }

        for (const rejection of rejections) {
            expect(['unsupported-label', 'missing-required-label', 'rejected-label'])
                .toContain(rejection.verdict.reason);
        }

        const tuple = tuples[0];
        const identity: SampleIdentity = {
            targetId: tuple.target.id,
            generatorId: tuple.generatorId,
            viewId: tuple.viewId,
            split: 'train',
            mode: 'question',
            instanceIdx: 0
        };
        const sampleKey = computeSampleKey(identity);
        const replayed = await generateSampleByKey({ sampleKey, attempt: 1, specName: 'test' });

        const generator = generatorCatalog.find(g => g.generatorId === tuple.generatorId)!.generator;
        const direct = generateSample({
            generator,
            labels: [...tuple.target.labels],
            seed: computeSampleSeed(sampleKey, 1)
        });

        expect(replayed.identity).toEqual(identity);
        expect(replayed.stub).toEqual(direct);
    }, 60000);

    it('generates all samples for a single target deterministically', async () => {
        const [generatorCatalog, viewCatalog, targets] = await Promise.all([
            loadGeneratorCatalog(),
            loadViewCatalog(),
            loadTargets('test')
        ]);

        const { tuples } = matchTargets(targets, generatorCatalog, viewCatalog);
        const target = tuples[0].target;

        const first = generateTargetSamples(target, generatorCatalog, viewCatalog);
        const second = generateTargetSamples(target, generatorCatalog, viewCatalog);

        expect(first.length).toBeGreaterThan(0);
        expect(first).toEqual(second);

        const questionCount = first.filter(s => s.identity.mode === 'question').length;
        const solutionCount = first.filter(s => s.identity.mode === 'solution').length;
        expect(questionCount).toBe(solutionCount);

        const keys = new Set(first.map(s => s.sampleKey));
        expect(keys.size).toBe(first.length);
    }, 60000);
});

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Ability, Area, Scope } from 'edugraph-ts';
import {
    computeSampleKey,
    parseSampleKey,
    computeSampleSeed,
    computeSampleFilename,
    matchesTarget,
    matchTargets,
    loadGeneratorCatalog,
    loadViewCatalog,
    loadTargets,
    loadSpecTodos,
    generateSample,
    generateSampleWithRetry,
    generateSampleByKey,
    generateTargetSamples,
    computeContentFingerprint,
    isValTuple,
    DEFAULT_VAL_RATIO,
    buildRenderPayload,
    SampleIdentity,
    GeneratorMatchInfo,
    ViewMatchInfo
} from './generation.ts';
import {isProblemTypeCompatible} from './type-parser.ts';
import { random } from './random.ts';
import { ProblemGenerator, ProblemStub } from '../types/ml-engine.ts';

const IDENTITY: SampleIdentity = {
    targetId: 'test-writing-0',
    generatorId: 'writing',
    viewId: 'numbers-write-standard',
    split: 'train',
    mode: 'question',
    instanceIdx: 0
};

describe('sample identity', () => {
    it('computes a canonical sample key', () => {
        expect(computeSampleKey(IDENTITY)).toBe(
            'test-writing-0#writing#numbers-write-standard#train#question#inst:0'
        );
    });

    it('round-trips through parseSampleKey', () => {
        const key = computeSampleKey(IDENTITY);
        expect(parseSampleKey(key)).toEqual(IDENTITY);

        const solIdentity: SampleIdentity = { ...IDENTITY, split: 'val', mode: 'solution', instanceIdx: 3 };
        expect(parseSampleKey(computeSampleKey(solIdentity))).toEqual(solIdentity);
    });

    it('rejects key parts containing the separator', () => {
        expect(() => computeSampleKey({ ...IDENTITY, targetId: 'bad#id' })).toThrow();
        expect(() => computeSampleKey({ ...IDENTITY, targetId: '' })).toThrow();
        expect(() => computeSampleKey({ ...IDENTITY, instanceIdx: -1 })).toThrow();
        expect(() => computeSampleKey({ ...IDENTITY, instanceIdx: 1.5 })).toThrow();
    });

    it('rejects malformed sample keys', () => {
        expect(() => parseSampleKey('too#few#parts')).toThrow();
        expect(() => parseSampleKey('a#b#c#train#question#no-inst')).toThrow();
        expect(() => parseSampleKey('a#b#c#test#question#inst:0')).toThrow();
        expect(() => parseSampleKey('a#b#c#train#answer#inst:0')).toThrow();
    });
});

describe('computeSampleSeed', () => {
    const key = computeSampleKey(IDENTITY);

    // Golden values: these seeds are a stability contract. If this test fails,
    // a refactor changed seed derivation and regenerating will invalidate the
    // entire dataset and VQA cache.
    it('is stable across refactors (golden values)', () => {
        expect(computeSampleSeed(key, 1)).toBe(2124007814);
        expect(computeSampleSeed(key, 2)).toBe(2073674957);
        expect(computeSampleSeed(computeSampleKey({ ...IDENTITY, mode: 'solution' }), 1)).toBe(1854781205);
    });

    it('differs per identity component and attempt', () => {
        const base = computeSampleSeed(key, 1);
        expect(computeSampleSeed(key, 2)).not.toBe(base);
        expect(computeSampleSeed(computeSampleKey({ ...IDENTITY, mode: 'solution' }), 1)).not.toBe(base);
        expect(computeSampleSeed(computeSampleKey({ ...IDENTITY, split: 'val' }), 1)).not.toBe(base);
        expect(computeSampleSeed(computeSampleKey({ ...IDENTITY, viewId: 'numbers-write-stroke' }), 1)).not.toBe(base);
        expect(computeSampleSeed(computeSampleKey({ ...IDENTITY, instanceIdx: 1 }), 1)).not.toBe(base);
    });

    it('stays within the positive int32 range', () => {
        for (let attempt = 1; attempt <= 100; attempt++) {
            const seed = computeSampleSeed(key, attempt);
            expect(seed).toBeGreaterThanOrEqual(0);
            expect(seed).toBeLessThan(2147483647);
        }
    });
});

describe('computeSampleFilename', () => {
    it('builds a stable filename from the identity (golden values)', () => {
        expect(computeSampleFilename(IDENTITY)).toBe(
            'test-writing-0_writing_numbers-write-standard_inst-0_mode-Q.png'
        );
        expect(computeSampleFilename({ ...IDENTITY, mode: 'solution', instanceIdx: 2 })).toBe(
            'test-writing-0_writing_numbers-write-standard_inst-2_mode-S.png'
        );
    });

    it('sanitizes unsafe characters in identity parts', () => {
        expect(computeSampleFilename({ ...IDENTITY, targetId: 'K.CC.B.5-how-many-3' })).toBe(
            'K-CC-B-5-how-many-3_writing_numbers-write-standard_inst-0_mode-Q.png'
        );
    });
});

describe('matchesTarget', () => {
    const gen = (labels: string[], problemType: string | null = 'WritingProblem'): GeneratorMatchInfo => ({
        generatorId: 'gen-a',
        labels,
        problemType
    });
    const view = (
        supportedLabels: string[],
        rejectedLabels: string[] = [],
        problemType: string | null = 'WritingProblem'
    ): ViewMatchInfo => ({
        viewId: 'view-a',
        supportedLabels,
        rejectedLabels,
        problemType
    });

    it('matches when the generator supports all target labels', () => {
        const verdict = matchesTarget(
            [Area.DigitNotation, Scope.NumbersSmaller10],
            gen([Area.DigitNotation, Scope.NumbersSmaller10]),
            view([])
        );
        expect(verdict).toEqual({ matched: true });
    });

    it('matches when the view supports a label the generator does not', () => {
        const verdict = matchesTarget(
            [Area.DigitNotation],
            gen([]),
            view([Area.DigitNotation])
        );
        expect(verdict).toEqual({ matched: true });
    });

    it('accepts an ability from the module that owns it without double declaration', () => {
        const generatorOwned = matchesTarget(
            [Ability.ProcedureExecution],
            gen([Ability.ProcedureExecution]),
            view([])
        );
        expect(generatorOwned).toEqual({ matched: true });

        const viewOwned = matchesTarget(
            [Ability.ProcedureExecution],
            gen([]),
            view([Ability.ProcedureExecution])
        );
        expect(viewOwned).toEqual({ matched: true });

        const unsupported = matchesTarget(
            [Ability.ProcedureExecution],
            gen([]),
            view([])
        );
        expect(unsupported).toEqual({
            matched: false,
            reason: 'unsupported-label',
            label: Ability.ProcedureExecution
        });
    });

    it('matches a broad target label with a more specific view/generator capability', () => {
        // A broad standard (ProcedureUnderstanding) is satisfied by a view that
        // exercises a specialization of it (ProcedureInversion partOf ProcedureUnderstanding).
        const abilityVerdict = matchesTarget(
            [Ability.ProcedureUnderstanding],
            gen([]),
            view([Ability.ProcedureInversion])
        );
        expect(abilityVerdict).toEqual({ matched: true });

        // Same directionality for Area (ObjectSorting partOf CollectionSense).
        const areaVerdict = matchesTarget(
            [Area.CollectionSense],
            gen([Area.ObjectSorting]),
            view([])
        );
        expect(areaVerdict).toEqual({ matched: true });
    });

    it('does NOT match a specific target label with only a more general capability', () => {
        // A specific requirement (ProcedureInversion) is not satisfied by a view
        // that only promises the general ancestor (ProcedureUnderstanding).
        const abilityVerdict = matchesTarget(
            [Ability.ProcedureInversion],
            gen([]),
            view([Ability.ProcedureUnderstanding])
        );
        expect(abilityVerdict).toEqual({
            matched: false,
            reason: 'unsupported-label',
            label: Ability.ProcedureInversion
        });

        // Same directionality for Area: specific target, general generator.
        const areaVerdict = matchesTarget(
            [Area.ObjectSorting],
            gen([Area.CollectionSense]),
            view([])
        );
        expect(areaVerdict).toEqual({
            matched: false,
            reason: 'unsupported-label',
            label: Area.ObjectSorting
        });
    });

    it('reports the offending unsupported label', () => {
        const unknownLabel = 'http://edugraph.io/edu/Area.DoesNotExist';
        const verdict = matchesTarget(
            [Area.DigitNotation, unknownLabel],
            gen([Area.DigitNotation]),
            view([])
        );
        expect(verdict).toEqual({ matched: false, reason: 'unsupported-label', label: unknownLabel });
    });

    it('ignores non-ontology labels', () => {
        const verdict = matchesTarget(['some-plain-tag'], gen([]), view([]));
        expect(verdict).toEqual({ matched: true });
    });

    it('rejects via view rejectedLabels even when labels are supported', () => {
        const verdict = matchesTarget(
            [Scope.NumbersSmaller100],
            gen([Scope.NumbersSmaller100]),
            view([], [Scope.NumbersSmaller100])
        );
        expect(verdict).toEqual({ matched: false, reason: 'rejected-label', label: Scope.NumbersSmaller100 });
    });

    it('rejects incompatible problem types before label checks', () => {
        const verdict = matchesTarget(
            [Area.DigitNotation],
            gen([Area.DigitNotation], 'WritingProblem'),
            view([Area.DigitNotation], [], 'CountingProblem')
        );
        expect(verdict).toEqual({ matched: false, reason: 'incompatible-type' });
    });

    it('accepts a generator subtype through a named union view contract', () => {
        const verdict = matchesTarget(
            [Area.Addition],
            gen([Area.Addition], 'ArithmeticTripleProblem'),
            view([], [], 'ArithmeticProblem')
        );
        expect(verdict).toEqual({ matched: true });
    });

    it('skips the type check when either side has no known type', () => {
        const verdict = matchesTarget(
            [Area.DigitNotation],
            gen([Area.DigitNotation], null),
            view([], [], 'CountingProblem')
        );
        expect(verdict).toEqual({ matched: true });
    });
});

function makeStubGenerator(
    generate: (config: any) => ProblemStub | null
): ProblemGenerator {
    return { type: 'writing', schema: {}, generate };
}

describe('generateSample', () => {
    const generator = makeStubGenerator(() => {
        const value = Math.floor(random() * 1000000);
        return { id: `stub-${value}`, data: { value } };
    });

    it('is deterministic for the same seed', () => {
        const a = generateSample({ generator, labels: [], seed: 12345 });
        const b = generateSample({ generator, labels: [], seed: 12345 });
        expect(a).toEqual(b);
    });

    it('differs for different seeds', () => {
        const a = generateSample({ generator, labels: [], seed: 12345 });
        const b = generateSample({ generator, labels: [], seed: 54321 });
        expect(a!.data.value).not.toBe(b!.data.value);
    });
});

describe('generateSampleWithRetry', () => {
    const sampleKey = computeSampleKey(IDENTITY);

    it('returns the first successful draw with attempt 1', () => {
        const generator = makeStubGenerator(() => ({ data: { value: Math.floor(random() * 100) } }));
        const result = generateSampleWithRetry({ generator, labels: [], sampleKey });
        expect(result.stub).not.toBeNull();
        expect(result.attempt).toBe(1);
        expect(result.seed).toBe(computeSampleSeed(sampleKey, 1));
    });

    it('salts the seed per attempt to escape null draws', () => {
        // Deterministically fails on the attempt-1 seed and succeeds afterwards
        const firstSeedValue = (() => {
            const probe = makeStubGenerator(() => ({ data: { value: random() } }));
            return generateSample({ generator: probe, labels: [], seed: computeSampleSeed(sampleKey, 1) })!.data.value;
        })();
        const generator = makeStubGenerator(() => {
            const value = random();
            return value === firstSeedValue ? null : { data: { value } };
        });
        const result = generateSampleWithRetry({ generator, labels: [], sampleKey });
        expect(result.stub).not.toBeNull();
        expect(result.attempt).toBe(2);
        expect(result.seed).toBe(computeSampleSeed(sampleKey, 2));
    });

    it('retries on caller-defined duplicates', () => {
        const seen = new Set<string>();
        const generator = makeStubGenerator(() => ({ data: { value: Math.floor(random() * 100) } }));

        const first = generateSampleWithRetry({
            generator,
            labels: [],
            sampleKey,
            isDuplicate: (stub) => seen.has(computeContentFingerprint(stub.data))
        });
        seen.add(computeContentFingerprint(first.stub!.data));

        const second = generateSampleWithRetry({
            generator,
            labels: [],
            sampleKey,
            isDuplicate: (stub) => seen.has(computeContentFingerprint(stub.data))
        });
        expect(second.attempt).toBeGreaterThan(1);
        expect(computeContentFingerprint(second.stub!.data)).not.toBe(computeContentFingerprint(first.stub!.data));
    });

    it('gives up after maxAttempts with a null stub', () => {
        const generator = makeStubGenerator(() => null);
        const result = generateSampleWithRetry({ generator, labels: [], sampleKey, maxAttempts: 5 });
        expect(result.stub).toBeNull();
        expect(result.attempt).toBe(5);
    });
});

describe('computeContentFingerprint', () => {
    it('is invariant to object key order', () => {
        const a = computeContentFingerprint({ b: 2, a: 1, nested: { y: [1, 2], x: 'z' } });
        const b = computeContentFingerprint({ nested: { x: 'z', y: [1, 2] }, a: 1, b: 2 });
        expect(a).toBe(b);
        expect(a).toBe('9b50d019657b7ddc');
    });

    it('differs for different values', () => {
        expect(computeContentFingerprint({ a: 1 })).not.toBe(computeContentFingerprint({ a: 2 }));
        expect(computeContentFingerprint([1, 2])).not.toBe(computeContentFingerprint([2, 1]));
    });

    it('ignores undefined object values like JSON.stringify does', () => {
        expect(computeContentFingerprint({ a: 1, b: undefined })).toBe(computeContentFingerprint({ a: 1 }));
    });
});

describe('isValTuple', () => {
    it('handles ratio edge cases', () => {
        expect(isValTuple('t', 'g', 'v', 0)).toBe(false);
        expect(isValTuple('t', 'g', 'v', 1)).toBe(true);
    });

    it('is deterministic per tuple', () => {
        for (let i = 0; i < 20; i++) {
            expect(isValTuple(`t-${i}`, 'g', 'v', DEFAULT_VAL_RATIO))
                .toBe(isValTuple(`t-${i}`, 'g', 'v', DEFAULT_VAL_RATIO));
        }
    });

    it('allocates per tuple, not per target — one target can split across views', () => {
        const views = Array.from({ length: 40 }, (_, i) => `view-${i}`);
        const allocated = views.filter(v => isValTuple('one-target', 'gen', v, DEFAULT_VAL_RATIO));
        expect(allocated.length).toBeGreaterThan(0);
        expect(allocated.length).toBeLessThan(views.length);
    });

    it('distinguishes generator and view, not just their concatenation', () => {
        // Without a separator, ("ab","c") and ("a","bc") would hash identically.
        expect(isValTuple('t', 'ab', 'c', 0.5)).not.toBe(isValTuple('t', 'a', 'bc', 0.5));
    });

    it('approximates the requested ratio over many tuples', () => {
        let count = 0;
        const total = 10000;
        for (let i = 0; i < total; i++) {
            if (isValTuple(`target-${i % 250}`, 'gen', `view-${i % 40}`, DEFAULT_VAL_RATIO)) count++;
        }
        expect(count / total).toBeGreaterThan(0.22);
        expect(count / total).toBeLessThan(0.28);
    });

    it('does not correlate with the sample seed of the same tuple', () => {
        // Both hash the same parts with the same function; the salt must keep
        // val membership independent of the draw it would produce.
        const agreements = Array.from({ length: 500 }, (_, i) => {
            const key = computeSampleKey({
                targetId: `t-${i}`, generatorId: 'g', viewId: 'v',
                split: 'train', mode: 'question', instanceIdx: 0
            });
            const seedIsLow = computeSampleSeed(key, 1) % 10000 < DEFAULT_VAL_RATIO * 10000;
            return seedIsLow === isValTuple(`t-${i}`, 'g', 'v', DEFAULT_VAL_RATIO);
        }).filter(Boolean).length;
        // Independent predicates agree on ~62.5% of draws (0.25² + 0.75²)
        expect(agreements / 500).toBeGreaterThan(0.55);
        expect(agreements / 500).toBeLessThan(0.70);
    });
});

describe('buildRenderPayload', () => {
    it('maps mode to isSolutionView and carries the seed', () => {
        const problem = { type: 'writing' as const, data: {} };
        const q = buildRenderPayload({ problem, viewId: 'v', labels: ['l'], mode: 'question', seed: 7 });
        expect(q.isSolutionView).toBe(false);
        expect(q.seed).toBe(7);
        const s = buildRenderPayload({ problem, viewId: 'v', labels: ['l'], mode: 'solution', seed: 7 });
        expect(s.isSolutionView).toBe(true);
    });
});

describe('loadTargets', () => {
    const FIXTURE_ROOT = resolve(__dirname, '../../temp/test-load-targets');

    afterEach(() => {
        if (existsSync(FIXTURE_ROOT)) rmSync(FIXTURE_ROOT, { recursive: true, force: true });
    });

    function writeFixture(moduleDir: string, fileName: string, contents: string) {
        const dir = resolve(FIXTURE_ROOT, moduleDir);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, fileName), contents, 'utf-8');
        return dir;
    }

    it('ignores todos and beyondScope — only the spec export feeds the pipeline', async () => {
        const dir = writeFixture('with-todos', 'a.ts', `
            export const spec = [{ id: 'real-target', labels: [] }];
            export const implementationTodos = [{ id: 'todo-target', labels: [], explanation: 'not supported yet' }];
            export const ontologyTodos = [{ standardId: 'X', title: 'x', description: 'x' }];
            export const beyondScope = [{ standardId: 'Y', title: 'y', description: 'y' }];
        `);
        const targets = await loadTargets('with-todos', FIXTURE_ROOT);
        expect(targets.map(t => t.id)).toEqual(['real-target']);
        void dir;
    });

    it('loads todo and beyond-scope declarations without feeding them to generation', async () => {
        writeFixture('with-dispositions', 'a.ts', `
            export const spec = [];
            export const implementationTodos = [{ id: 'todo-target', labels: [] }];
            export const ontologyTodos = [{ standardId: 'X', title: 'x', description: 'x' }];
            export const beyondScope = [{ standardId: 'Y', title: 'y', description: 'y' }];
        `);

        const dispositions = await loadSpecTodos('with-dispositions', FIXTURE_ROOT);
        expect(dispositions.implementationTodos).toHaveLength(1);
        expect(dispositions.ontologyTodos).toHaveLength(1);
        expect(dispositions.beyondScope).toEqual([
            { standardId: 'Y', title: 'y', description: 'y' }
        ]);
    });

    it('merges the spec export of every file in a spec directory, in sorted file order', async () => {
        writeFixture('multi-file', 'b.ts', `export const spec = [{ id: 'from-b', labels: [] }];`);
        writeFixture('multi-file', 'a.ts', `export const spec = [{ id: 'from-a', labels: [] }];`);
        const targets = await loadTargets('multi-file', FIXTURE_ROOT);
        expect(targets.map(t => t.id)).toEqual(['from-a', 'from-b']);
    });

    it('throws when a spec file has no "spec" export', async () => {
        writeFixture('no-spec-export', 'a.ts', `export const notSpec = [{ id: 'x', labels: [] }];`);
        await expect(loadTargets('no-spec-export', FIXTURE_ROOT)).rejects.toThrow(/does not export a "spec"/);
    });

    it('loads duplicate target ids untouched — spec-validator is the uniqueness gatekeeper', async () => {
        writeFixture('dup-ids', 'a.ts', `export const spec = [{ id: 'dup', labels: [] }];`);
        writeFixture('dup-ids', 'b.ts', `export const spec = [{ id: 'dup', labels: [] }];`);
        const targets = await loadTargets('dup-ids', FIXTURE_ROOT);
        expect(targets.map(t => t.id)).toEqual(['dup', 'dup']);
    });

    it('loads the completed real ccss target set without duplicate ids', async () => {
        const targets = await loadTargets('ccss');
        expect(targets.length).toBeGreaterThan(0);
        expect(targets.some(t => t.id.startsWith('K.CC.A.1-count-to-100'))).toBe(true);
        expect(targets.some(t => t.id.startsWith('K.OA.A.4-make-ten'))).toBe(true);
        const ids = targets.map(t => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    }, 30000);
});

describe('catalogs and end-to-end matching (integration)', () => {
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
        expect(viewsFor('1.NBT.B.3-compare-two-digit')).toEqual(new Set([
            'numbers-compare'
        ]));
    }, 30000);

    it('loads catalogs, matches the test spec and replays a sample by key', async () => {
        const [generatorCatalog, viewCatalog, targets] = await Promise.all([
            loadGeneratorCatalog(),
            loadViewCatalog(),
            loadTargets('test')
        ]);

        expect(generatorCatalog.length).toBeGreaterThan(0);
        expect(viewCatalog.length).toBeGreaterThan(0);
        expect(targets.length).toBeGreaterThan(0);

        // Every generator/view carries the labels and type info matching needs
        for (const gen of generatorCatalog) {
            expect(gen.generatorId).toBeTruthy();
            expect(Array.isArray(gen.labels)).toBe(true);
        }

        const { tuples, rejections } = matchTargets(targets, generatorCatalog, viewCatalog);
        expect(tuples.length).toBeGreaterThan(0);

        // No tuple may pair a generator and view of different problem types
        for (const tuple of tuples) {
            const gen = generatorCatalog.find(g => g.generatorId === tuple.generatorId)!;
            const view = viewCatalog.find(v => v.viewId === tuple.viewId)!;
            if (gen.problemType != null && view.problemType != null) {
                expect(isProblemTypeCompatible(gen.problemType, view.problemType)).toBe(true);
            }
        }

        // Rejections carry actionable reasons
        for (const rejection of rejections) {
            expect(['unsupported-label', 'rejected-label']).toContain(rejection.verdict.reason);
        }

        // Replaying a sample by key reproduces the direct draw exactly
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

        // Q and S modes exist for every (view, split, instance) combination
        const questionCount = first.filter(s => s.identity.mode === 'question').length;
        const solutionCount = first.filter(s => s.identity.mode === 'solution').length;
        expect(questionCount).toBe(solutionCount);

        // Sample keys are unique
        const keys = new Set(first.map(s => s.sampleKey));
        expect(keys.size).toBe(first.length);
    }, 60000);
});

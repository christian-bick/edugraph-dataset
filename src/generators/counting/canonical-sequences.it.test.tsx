import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {computeSampleKey, computeSampleSeed} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import {matchTargets} from '../../lib/matching.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {getRandomState, setRandomState, setSeed} from '../../lib/random.ts';
import {extractConfig} from '../../lib/utils.ts';
import type {CountingOneOffsetProblem, CountingSequenceProblem} from '../../types/problems.ts';
import {CountingIncDecGenerator} from './counting-inc-dec/generator.ts';
import {CountingSequenceGenerator} from './counting-sequence/generator.ts';

describe('canonical counting source and projection contracts', () => {
    it('retains each source competency and validates every admitted native sequence/one-step selection', async () => {
        vi.stubGlobal('window', {});
        const {CountingNumberSequence} = await import('../../visuals/views/counting/counting-number-sequence/view.tsx');
        const {CountingIncDec} = await import('../../visuals/views/counting/counting-inc-dec/view.tsx');
        try {
            const [targets, generators, views] = await Promise.all([
                loadMatchingTargets('ccss'),
                loadGeneratorModelCatalog(undefined, undefined, new Map([
                    ['counting-sequence', fileURLToPath(new URL('./counting-sequence/spec.ts', import.meta.url))],
                    ['counting-inc-dec', fileURLToPath(new URL('./counting-inc-dec/spec.ts', import.meta.url))]
                ])),
                loadViewModelCatalog(undefined, undefined, new Map([
                    ['counting-number-sequence', fileURLToPath(new URL('../../visuals/views/counting/counting-number-sequence/spec.ts', import.meta.url))],
                    ['counting-inc-dec', fileURLToPath(new URL('../../visuals/views/counting/counting-inc-dec/spec.ts', import.meta.url))]
                ]))
            ]);
            const routes = matchTargets(targets, generators, views).tuples;
            const evaluator = createLabelDependencyEvaluator();
            expect(routes.length).toBeGreaterThan(31);
            for (const route of routes) {
                const producer = route.generatorId === 'counting-sequence' ? new CountingSequenceGenerator() : new CountingIncDecGenerator();
                const view = views.find(view => view.viewId === route.viewId)!;
                const enumeration = enumerateDependencyAuditSelections(route.plan);
                expect(enumeration.status).toBe('complete');
                expect(enumeration.selections.length).toBeGreaterThan(0);
                for (const selected of enumeration.selections) {
                    const evaluation = evaluator.evaluate(selected.labels);
                    expect(evaluation.conflicts).toEqual([]);
                    expect(evaluation.errors).toEqual([]);
                    expect(evaluation.assessments.filter(item => item.status === 'missing')).toEqual([]);
                    for (const mode of ['question', 'solution'] as const) {
                        const sampleKey = computeSampleKey({...route.plan.identity, split: 'train', mode, instanceIdx: 0});
                        const seed = computeSampleSeed(sampleKey, 1);
                        const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                            selection: createGenerationSelectionReceipt(route.plan, selected.choices)};
                        const origin = {plan: route.plan, sampleKey, seed, attempt: 1, replay, viewSchema: view.schema};
                        const resolved = resolvePlannedConfigurations({...origin, generatorSchema: producer.schema});
                        setSeed(seed);
                        const direct = extractConfig(producer.schema, selected.labels);
                        expect(direct.config).toEqual(resolved.generatorConfig);
                        // Direct fallback selection and the native planner have separate choice entropy.
                        // Compare mathematical draws from the same prepared mathematical state.
                        setRandomState(resolved.generatorRandomState);
                        const directStub = producer.generate(direct.config), continuation = getRandomState();
                        const draw = generatePlannedDraw({...origin, generator: producer});
                        expect(draw.stub).not.toBeNull();
                        expect(draw.stub!.data).toEqual(directStub!.data);
                        expect(getRandomState()).toBe(continuation);
                        expect(generatePlannedDraw({...origin, generator: producer})).toEqual(draw);
                        const data = draw.stub!.data as CountingSequenceProblem | CountingOneOffsetProblem;
                        const quantities = 'sequence' in data ? data.sequence : [data.numObjects, data.stepSize, data.incDecAnswer];
                        const range = producer.schema.range[1](selected.labels);
                        if (!range) throw new Error('A complete native selection must resolve its canonical range.');
                        expect(resolved.generatorConfig.range).toEqual(range);
                        expect(hasCanonicalRangeWitness(quantities, range)).toBe(true);
                        const payload = {problem: {type: 'counting', labels: draw.labels, data}, seed,
                            viewId: route.viewId, isSolutionView: mode === 'solution', preparedView: draw.view};
                        const markup = renderToStaticMarkup(createElement(route.viewId === 'counting-number-sequence'
                            ? CountingNumberSequence : CountingIncDec, {payload} as never));
                        expect(markup).toContain('class=');
                        if ('sequence' in data) expect(markup).toContain(String(data.sequence[0]));
                        else expect(markup).toContain('Starting objects');
                    }
                }
            }
        } finally {
            vi.unstubAllGlobals();
        }
    });
});

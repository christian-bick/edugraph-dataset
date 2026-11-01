import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {computeSampleKey, computeSampleSeed} from '../../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as gradeSix} from '../../../spec/ccss/grade-06.ts';
import type {PercentQuantityProblem} from '../../../types/problems.ts';
import {PercentOfQuantityBody, PercentWholeInversionBody} from '../../../visuals/views/ratio/percent-quantity-view.tsx';
import {PercentQuantityRelationsGenerator} from './generator.ts';
import {PercentQuantityRelationsGeneratorSchema, spec} from './spec.ts';

describe('native percent range plans and their observable quantities', () => {
    it('retains both source targets and validates all eight final selections on both resolution paths', async () => {
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([[spec.generatorId,
                fileURLToPath(new URL('./spec.ts', import.meta.url))]])),
            loadViewModelCatalog(undefined, undefined, new Map([
                ['percent-of-quantity', fileURLToPath(new URL('../../../visuals/views/ratio/percent-of-quantity/spec.ts', import.meta.url))],
                ['percent-whole-inversion', fileURLToPath(new URL('../../../visuals/views/ratio/percent-whole-inversion/spec.ts', import.meta.url))]
            ]))
        ]);
        const targets = gradeSix.filter(target => target.id.startsWith('6.RP.A.3c-'));
        expect(targets.map(target => target.id).sort()).toEqual([
            '6.RP.A.3c-percent-of-quantity~86ad85ea', '6.RP.A.3c-whole-from-percent~bfdb1b5d'
        ]);
        const generator = generators[0]!, producer = new PercentQuantityRelationsGenerator();
        const evaluator = createLabelDependencyEvaluator();
        let routes = 0, selections = 0;
        for (const target of targets) for (const view of views) {
            const match = matchTarget(target, generator, view);
            const forward = view.viewId === 'percent-of-quantity';
            expect(match.matched).toBe(target.id.includes('percent-of-quantity') === forward);
            if (!match.matched) continue;
            routes++;
            const enumeration = enumerateDependencyAuditSelections(match.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(4);
            for (const selected of enumeration.selections) {
                selections++;
                const evaluation = evaluator.evaluate(selected.labels);
                expect(evaluation.errors).toEqual([]);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.filter(item => item.status === 'missing')).toEqual([]);
                for (const mode of ['question', 'solution'] as const) {
                    const sampleKey = computeSampleKey({...match.plan.identity, split: 'train', mode, instanceIdx: 0});
                    const seed = computeSampleSeed(sampleKey, 1);
                    const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                        selection: createGenerationSelectionReceipt(match.plan, selected.choices)};
                    const origin = {plan: match.plan, sampleKey, seed, attempt: 1, replay, viewSchema: view.schema};
                    const resolved = resolvePlannedConfigurations({...origin, generatorSchema: producer.schema});
                    setSeed(seed);
                    const direct = extractConfig(PercentQuantityRelationsGeneratorSchema, selected.labels);
                    expect(direct.config).toEqual(resolved.generatorConfig);
                    const directStub = producer.generate(direct.config), continuation = getRandomState();
                    const draw = generatePlannedDraw({...origin, generator: producer});
                    expect(draw.stub!.data).toEqual(directStub.data);
                    expect(getRandomState()).toBe(continuation);
                    expect(generatePlannedDraw({...origin, generator: producer})).toEqual(draw);
                    const data = draw.stub!.data as PercentQuantityProblem;
                    const markup = renderToStaticMarkup(createElement(forward ? PercentOfQuantityBody : PercentWholeInversionBody,
                        {data, isSolutionView: mode === 'solution'}));
                    expect(markup).toContain('A percent is a rate per hundred');
                    expect(markup).toContain('/100');
                    expect(markup).toContain(String(data.percent));
                }
            }
        }
        expect(routes).toBe(2);
        expect(selections).toBe(8);
    });
});

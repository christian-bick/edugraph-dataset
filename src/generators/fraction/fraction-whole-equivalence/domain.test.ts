import {Scope} from 'edugraph-ts';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as random from '../../../lib/random.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {spec as wholeSpec} from '../../../visuals/views/fractions/fractions-whole-equivalence/spec.ts';
import {spec as explanationSpec} from '../../../visuals/views/numbers/numbers-fraction-line-explanation/spec.ts';
import {spec as formalizationSpec} from '../../../visuals/views/numbers/numbers-fraction-line-formalization/spec.ts';
import {wholeFractionCandidates} from './domain.ts';
import {FractionWholeEquivalenceGenerator} from './generator.ts';
import {FractionWholeEquivalenceGeneratorSchema as schema, spec} from './spec.ts';

const bands = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;
let wholeView: typeof import('../../../visuals/views/fractions/fractions-whole-equivalence/view.tsx').FractionsWholeEquivalence;
let explanationView: typeof import('../../../visuals/views/numbers/numbers-fraction-line-explanation/view.tsx').NumbersFractionLineExplanation;
let formalizationView: typeof import('../../../visuals/views/numbers/numbers-fraction-line-formalization/view.tsx').NumbersFractionLineFormalization;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    wholeView = (await import('../../../visuals/views/fractions/fractions-whole-equivalence/view.tsx')).FractionsWholeEquivalence;
    explanationView = (await import('../../../visuals/views/numbers/numbers-fraction-line-explanation/view.tsx')).NumbersFractionLineExplanation;
    formalizationView = (await import('../../../visuals/views/numbers/numbers-fraction-line-formalization/view.tsx')).NumbersFractionLineFormalization;
});
afterAll(() => vi.unstubAllGlobals());
afterEach(() => vi.restoreAllMocks());

describe('whole-number equivalence numerator-count ranges', () => {
    it('partitions all fifteen original equally likely pairs with no support loss or duplicate', () => {
        const expected = new Set([1, 2, 3].flatMap(whole => [2, 3, 4, 6, 8].map(denominator => `${whole}:${denominator}`)));
        const seen = new Set<string>();
        const generator = new FractionWholeEquivalenceGenerator();
        const draw = vi.spyOn(random, 'random');
        const counts: number[] = [];
        for (const [, upper] of bands) {
            const range = createCanonicalNumericRange(upper);
            const candidates = wholeFractionCandidates(range);
            counts.push(candidates.length);
            for (const [index, pair] of candidates.entries()) {
                const key = `${pair.wholeNumber}:${pair.denominator}`;
                expect(expected.has(key)).toBe(true);
                expect(seen.has(key)).toBe(false);
                seen.add(key);
                draw.mockClear().mockReturnValue((index + 0.5) / candidates.length);
                const {data} = generator.generate({range});
                expect(draw).toHaveBeenCalledTimes(1);
                expect(data).toEqual({task: 'represent-whole-as-fraction', wholeNumber: pair.wholeNumber,
                    fraction: {numerator: pair.wholeNumber * pair.denominator, denominator: pair.denominator}, relation: 'equal'});
                expect(hasCanonicalRangeWitness([pair.wholeNumber, 1, pair.denominator, data.fraction.numerator, 1 / pair.denominator], range)).toBe(true);
            }
        }
        expect(counts).toEqual([4, 6, 4, 1]);
        expect(seen).toEqual(expected);
    });

    it('resolves every range and verifies all three actual question/solution consumers', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const generator = new FractionWholeEquivalenceGenerator();
        for (const [label, upper] of bands) for (const [view, component] of [
            [wholeSpec, wholeView], [explanationSpec, explanationView], [formalizationSpec, formalizationView]
        ] as const) {
            const labels = [...spec.generalLabels, ...view.generalLabels, label];
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {range: [label]});
            expect(planned).toEqual(direct);
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
            const target = {id: 'whole-fraction-band', labels};
            const match = planModelCompatibility(target, {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view});
            expect(match.supported).toBe(true);
            if (!match.supported) throw new Error('Expected whole-fraction band match');
            const input = {generator, generatorSpec: spec, viewSchema: {}, viewSpec: view, plan: match.plan,
                sampleKey: `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed: 42, attempt: 1};
            const draw = generatePlannedDraw(input);
            expect(draw.labels).toContain(label);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            const question = renderToStaticMarkup(React.createElement(component, {payload: {problem: {type: 'fraction', data: draw.stub!.data, labels: draw.labels},
                viewId: view.viewId, targetLabels: labels, isSolutionView: false, seed: 42, preparedView: draw.view}}));
            const solution = renderToStaticMarkup(React.createElement(component, {payload: {problem: {type: 'fraction', data: draw.stub!.data, labels: draw.labels},
                viewId: view.viewId, targetLabels: labels, isSolutionView: true, seed: 42, preparedView: draw.view}}));
            expect(question).toContain(view === wholeSpec ? 'Count the numerator parts needed' : 'Complete');
            expect(solution).not.toEqual(question);
        }
    });

    it('rejects malformed configurations before consuming randomness', () => {
        const generator = new FractionWholeEquivalenceGenerator();
        const draw = vi.spyOn(random, 'random');
        for (const range of [null, createCanonicalNumericRange(120), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => generator.generate({range} as never)).toThrow();
        expect(() => generator.generate({})).toThrow(/range/);
        expect(() => generator.generate({range: createCanonicalNumericRange(5), extra: true} as never)).toThrow(/Unexpected/);
        expect(draw).not.toHaveBeenCalled();
    });
});

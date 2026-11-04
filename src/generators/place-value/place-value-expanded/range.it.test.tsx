import {Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from '../../../lib/label-dependency-annotation-resolution.ts';
import {resolveInferredLabels} from '../../../lib/inferred-labels.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, random, setRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, extractSchemaLabels, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import type {PlaceValueExpandedProblem} from '../../../types/problems.ts';
import {spec as viewSpec} from '../../../visuals/views/place-value/place-value-expanded-form/spec.ts';
import {spec as gradeTwo} from '../../../spec/ccss/grade-02.ts';
import {spec as gradeFour} from '../../../spec/ccss/grade-04.ts';
import {expandedNumbers} from './domain.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';
import {PlaceValueExpandedGeneratorSchema as schema, spec, type PlaceValueExpandedGeneratorConfig} from './spec.ts';

const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];
const termsOf = (number: number) => [...String(number)].map((digit, index, digits) =>
    Number(digit) * 10 ** (digits.length - index - 1)).filter(Boolean);
// Authored expectations independent of the production capability/feasibility helper.
const cells = [
    [120, [0, 5, 10, 20], [0, 5]],
    [1000, [0, 5, 10, 20], [0, 5]],
    [10000, [0, 5, 10, 20, 100, 120], [0, 5, 10, 20]],
    [100000, [0, 5, 10, 20, 100, 120, 1000], [0, 5, 10, 20, 100, 120]],
    [1000000, [0, 5, 10, 20, 100, 120, 1000, 10000], [0, 5, 10, 20, 100, 120, 1000]]
] as const;
const profiles = cells.flatMap(([upper, two, three]) => [
    ...two.map(lower => ({upper, lower, cardinality: Scope.TwoOperands, count: 2})),
    ...three.map(lower => ({upper, lower, cardinality: Scope.ThreeOperands, count: 3}))
]);
const targets = [...gradeTwo, ...gradeFour].filter(target =>
    target.id.startsWith('2.NBT.A.3-expanded-form~') || target.id.startsWith('4.NBT.A.2-expanded-form~'));
const generatorModel = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
const viewModel = {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec};
const generatorMatchModel = {...generatorModel, labels: [...spec.generalLabels, ...extractSchemaLabels(schema)],
    problemType: 'PlaceValueExpandedProblem'};
const viewMatchModel = {...viewModel, supportedLabels: [...viewSpec.generalLabels], problemType: 'PlaceValueExpandedProblem'};
const generator = new PlaceValueExpandedGenerator();
const labelsFor = (upper: number, lower: number) => ['http://edugraph.io/edu/NumbersSmaller' + upper,
    ...(lower ? ['http://edugraph.io/edu/NumbersLarger' + lower] : [])];

function assertQuantities(data: PlaceValueExpandedProblem, range: CanonicalNumericRange) {
    const terms = termsOf(data.number), minimum = Math.min(data.number, ...terms);
    expect(data.terms).toEqual(terms);
    expect(data.terms.reduce((a, b) => a + b, 0)).toBe(data.number);
    expect(minimum).toBeGreaterThan(0);
    expect(minimum).toBeGreaterThanOrEqual(range.min);
    expect(minimum).toBeLessThan(thresholds.find(bound => bound > range.min)!);
    expect(data.number).toBeLessThanOrEqual(range.max);
    expect(data.number).toBeGreaterThan(thresholds[thresholds.indexOf(range.max) - 1]!);
}

let View: typeof import('../../../visuals/views/place-value/place-value-expanded-form/view.tsx')['PlaceValueExpandedForm'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({PlaceValueExpandedForm: View} = await import('../../../visuals/views/place-value/place-value-expanded-form/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

describe('expanded-form range resolution and projections', () => {
    it('declares fifty nonempty profiles and keeps every schema fallback inspectable', () => {
        expect(profiles).toHaveLength(50);
        expect(targets).toHaveLength(7);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(spec.inferredLabels).toBeUndefined();
        expect(spec.generalLabels).toContain(Scope.NumbersWithoutZero);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
    });

    it.each(profiles)('resolves, replays and renders the complete $cardinality/$lower..$upper profile', ({upper, lower, cardinality}) => {
        const rangeLabels = labelsFor(upper, lower);
        const labels = [...spec.generalLabels, ...viewSpec.generalLabels, cardinality, ...rangeLabels];
        const match = planModelCompatibility({id: 'expanded-profile', labels}, generatorModel, viewModel);
        expect(match.supported).toBe(true);
        const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels,
            {operandCardinality: [cardinality], range: rangeLabels});
        expect(planned.config).toEqual(direct.config);
        expect([...planned.resolvedLabels].sort()).toEqual([...direct.resolvedLabels].sort());
        expect(direct.config.range).toEqual(createCanonicalNumericRange(upper, lower));
        expect(resolveInferredLabels({spec, schema, config: direct.config, labels: [], owner: 'generator'})).toEqual([]);
        setSeed(17);
        const result = generator.generate(direct.config), continuation = getRandomState();
        setSeed(17);
        expect(generator.generate(planned.config)).toEqual(result);
        expect(getRandomState()).toBe(continuation);
        assertQuantities(result.data, direct.config.range!);
        for (const isSolutionView of [false, true]) {
            const html = renderToStaticMarkup(createElement(View, {payload: {problem: {type: 'arithmetic', data: result.data, labels},
                viewId: viewSpec.viewId, targetLabels: labels, seed: 0, isSolutionView,
                preparedView: {version: 1, viewId: viewSpec.viewId, planHash: 'expanded-proof', variantHash: 'empty', config: {}, labels: [], randomState: 1}}}));
            expect(html).not.toMatch(/NaN|undefined|Rendering Error/);
            expect(html).toContain('sum of');
            if (upper > 1000) {
                expect(html).toContain('Hundred');
                const equation = result.data.number.toLocaleString('en-US') + ' = '
                    + result.data.terms.map(term => term.toLocaleString('en-US')).join(' + ');
                expect(html.includes(equation)).toBe(isSolutionView);
            }
        }
    });

    it.each([
        [120, 10], [1000, 20], [10000, 100], [100000, 1000], [1000000, 10000]
    ])('rejects the infeasible ThreeOperands/%s/%s domain at direct and planned boundaries', (upper, lower) => {
        const labels = [...spec.generalLabels, ...viewSpec.generalLabels, Scope.ThreeOperands, ...labelsFor(upper!, lower!)];
        expect(planModelCompatibility({id: 'impossible-expanded-profile', labels}, generatorModel, viewModel).supported).toBe(false);
        expect(() => extractConfig(schema, labels)).toThrow();
    });

    it.each([
        [120, 10], [1000, 20], [10000, 100], [100000, 1000], [1000000, 10000]
    ])('resolves the two-term fallback when only it can satisfy upper%s/lower%s', (upper, lower) => {
        for (let seed = 0; seed < 8; seed++) {
            setSeed(seed);
            const config = extractConfig(schema, labelsFor(upper!, lower!)).config;
            expect(config.operandCardinality).toBe(Scope.TwoOperands);
            expect(expandedNumbers(config.range!, 2).length).toBeGreaterThan(0);
        }
    });

    it.each(targets)('retains every admitted source binding and exact receipt replay for $id', target => {
        const matched = matchTarget(target, generatorMatchModel, viewMatchModel);
        if (!matched.matched) throw Error('An expanded-form source lost coverage');
        const expected = profiles.filter(profile => target.labels.includes(labelsFor(profile.upper, 0)[0]!)
            && (![Scope.TwoOperands, Scope.ThreeOperands].some(cardinality => target.labels.includes(cardinality))
                || target.labels.includes(profile.cardinality)));
        const actual: string[] = [];
        for (const selection of enumerateDependencyAuditSelections(matched.plan).selections) {
            const annotation = resolveDependencyAuditAnnotation({id: selection.variantHash, plan: matched.plan, selection,
                generator: {schema, spec}, view: {schema: {}, spec: viewSpec}});
            expect(annotation.annotationResolution.status).toBe('not_required');
            const sampleKey = [target.id, spec.generatorId, viewSpec.viewId, 'train', 'question', 'inst:0'].join('#');
            const receipt = createGenerationSelectionReceipt(matched.plan, selection.choices);
            for (let seed = 0; seed < 8; seed++) {
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1, selection: receipt};
                const input = {generatorSchema: schema, viewSchema: {}, generatorSpec: spec, viewSpec,
                    plan: matched.plan, sampleKey, seed, attempt: 1, replay};
                const resolved = resolvePlannedConfigurations(input);
                const config = resolved.generatorConfig as PlaceValueExpandedGeneratorConfig;
                const count = config.operandCardinality === Scope.TwoOperands ? 2 : 3;
                if (seed === 0) actual.push([config.range!.max, config.range!.min, config.operandCardinality].join(':'));
                expect(resolved.labels).toContain(Scope.NumbersWithoutZero);
                expect(resolved.labels).not.toContain(Scope.NumbersWithZero);
                const rows = expandedNumbers(config.range!, count);
                setRandomState(resolved.generatorRandomState);
                const expectedNumber = rows[Math.floor(random() * rows.length)], expectedContinuation = getRandomState();
                const first = generatePlannedDraw({...input, generator});
                expect(first.stub).not.toBeNull();
                expect(first.stub!.data.number).toBe(expectedNumber);
                expect(getRandomState()).toBe(expectedContinuation);
                expect(first.replay.selection).toEqual(receipt);
                expect(generatePlannedDraw({...input, generator})).toEqual(first);
                assertQuantities(first.stub!.data as PlaceValueExpandedProblem, config.range!);
            }
        }
        expect(actual.sort()).toEqual(expected.map(profile => [profile.upper, profile.lower, profile.cardinality].join(':')).sort());
    });

    it.each([
        [3100, 10000, 100, Scope.TwoOperands],
        [1110, 10000, 10, Scope.ThreeOperands],
        [321000, 1000000, 1000, Scope.ThreeOperands]
    ] as const)('withholds the independently requested sum for %s and preserves its original strip in both modes', (number, upper, lower, cardinality) => {
        const data: PlaceValueExpandedProblem = {task: 'multi-digit-expanded-form', number, terms: termsOf(number),
            placeValues: [...String(number)].map((digit, index, digits) => {
                const exponent = ([0, 1, 2, 3, 4, 5, 6] as const)[digits.length - index - 1]!;
                const names = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'] as const;
                return {digit: Number(digit), exponent, name: names[exponent]!, value: Number(digit) * 10 ** exponent};
            })};
        const labels = [...spec.generalLabels, ...viewSpec.generalLabels, cardinality, ...labelsFor(upper, lower)];
        assertQuantities(data, createCanonicalNumericRange(upper, lower));
        const equation = number.toLocaleString('en-US') + ' = ' + data.terms.map(term => term.toLocaleString('en-US')).join(' + ');
        for (const isSolutionView of [false, true]) {
            const html = renderToStaticMarkup(createElement(View, {payload: {problem: {type: 'arithmetic', data, labels},
                viewId: viewSpec.viewId, targetLabels: labels, seed: 0, isSolutionView,
                preparedView: {version: 1, viewId: viewSpec.viewId, planHash: 'expanded-fixture', variantHash: 'empty',
                    config: {}, labels: [], randomState: 1}}}));
            expect(html).not.toMatch(/Rendering Error|NaN|undefined/);
            expect(html).toContain('Write the numeral as a sum of its nonzero place values.');
            expect(html).toContain('>0</div>');
            expect(html.includes(equation)).toBe(isSolutionView);
            if (!isSolutionView) expect(html.match(/border-dashed/g)).toHaveLength(data.terms.length);
        }
    });
});

import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {resolveInferredLabels} from '../../../lib/inferred-labels.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {expandedNumbers} from './domain.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {PlaceValueExpandedGeneratorSchema, spec} from './spec.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';
import {spec as expandedView} from '../../../visuals/views/place-value/place-value-expanded-form/spec.ts';

describe('PlaceValueExpandedGenerator spec integration', () => {
    const generator = new PlaceValueExpandedGenerator();

    it.each([
        [[Scope.NumbersLarger5], Scope.NumbersSmaller1000, Scope.TwoOperands, false],
        [[Scope.NumbersLarger5], Scope.NumbersSmaller1000, Scope.ThreeOperands, false],
        [[], Scope.NumbersSmaller1000000, Scope.TwoOperands, true],
        [[], Scope.NumbersSmaller1000000, Scope.ThreeOperands, true]
    ] as const)('preserves positive quantities and the existing payload branch for %s/%s/%s', (minimum, maximum, cardinality, large) => {
        for (let seed = 0; seed < 24; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [...minimum, maximum, cardinality]);
            expect(stub).not.toBeNull();
            expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.NumbersWithoutZero);
            expect([...spec.generalLabels, ...stub!.labels]).not.toContain(Scope.NumbersWithZero);
            expect(stub!.data.number).toBeGreaterThan(0);
            expect(stub!.data.terms.every(value => value > 0)).toBe(true);
            expect('task' in stub!.data).toBe(large);
            if ('task' in stub!.data) {
                expect(stub!.data.task).toBe('multi-digit-expanded-form');
                // A zero digit is a representation, not a zero-valued operand.
                expect(stub!.data.placeValues.some(place => place.digit === 0)).toBe(true);
            }
        }
    });

    it('declares zero absence invariantly and retires the redundant configuration-only inference API', () => {
        expect(spec.inferredLabels).toBeUndefined();
        expect(spec.generalLabels).toContain(Scope.NumbersWithoutZero);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
        for (const config of [
            {range: createCanonicalNumericRange(1000), operandCardinality: Scope.TwoOperands},
            {range: createCanonicalNumericRange(10000, 100), operandCardinality: Scope.TwoOperands},
            {range: createCanonicalNumericRange(1000000), operandCardinality: undefined},
            {range: undefined, operandCardinality: Scope.TwoOperands},
            {range: undefined, operandCardinality: undefined}
        ]) {
            expect(resolveInferredLabels({spec, schema: PlaceValueExpandedGeneratorSchema,
                config, labels: [], owner: 'generator'})).toEqual([]);
        }
        expect(expandedNumbers(createCanonicalNumericRange(120), 2)).toContain(101);
        expect(() => generator.generate({range: createCanonicalNumericRange(10000), operandCardinality: undefined})).toThrow();
    });

    it('matches explicit zero-absence claims and rejects zero-quantity requests despite the passive strip zeros', () => {
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema,
            labels: [...spec.generalLabels, ...extractSchemaLabels(generator.schema)], problemType: 'PlaceValueExpandedProblem', spec};
        const view = {viewId: expandedView.viewId, generalLabels: expandedView.generalLabels, schema: {},
            supportedLabels: [...expandedView.generalLabels], problemType: 'PlaceValueExpandedProblem', spec: expandedView};
        const base = [Area.PlaceValue, Area.Sum, Scope.NumbersSmaller10000, Scope.TwoOperands, ...expandedView.generalLabels];
        expect(matchTarget({id: 'expanded-positive-quantities', labels: [...base, Scope.NumbersWithoutZero]}, model, view).matched).toBe(true);
        expect(matchTarget({id: 'expanded-zero-quantity', labels: [...base, Scope.NumbersWithZero]}, model, view))
            .toMatchObject({matched: false, reason: 'unsupported-label', label: Scope.NumbersWithZero});
    });

    it('preserves all legacy mathematical configurations, draws and continuation when retiring inference', () => {
        const formerSpec = {...spec, inferredLabels: [{produces: [Scope.NumbersWithoutZero],
            infer: () => [Scope.NumbersWithoutZero]}]};
        for (const upper of [120, 1000]) for (const lower of [0, 5, 10, 20]) {
            for (const cardinality of [Scope.TwoOperands, Scope.ThreeOperands]) {
                if (cardinality === Scope.ThreeOperands && lower >= 10) continue;
                const labels = ['http://edugraph.io/edu/NumbersSmaller' + upper, cardinality,
                    ...(lower ? ['http://edugraph.io/edu/NumbersLarger' + lower] : [])];
                for (const seed of [0, 17, 2026]) {
                    const draws = [formerSpec, spec].map(owner => {
                        setSeed(seed);
                        const resolved = extractConfig(PlaceValueExpandedGeneratorSchema, labels, {spec: owner, owner: 'generator'});
                        const configState = getRandomState();
                        return {config: resolved.config, configState, stub: generator.generate(resolved.config), continuation: getRandomState()};
                    });
                    expect(draws[1]).toEqual(draws[0]);
                }
            }
        }
    });

    it.each([
        [Scope.TwoOperands, 2],
        [Scope.ThreeOperands, 3]
    ] as const)('resolves %s labels', (operandCardinality, expectedLength) => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue, Area.Sum, Scope.ArabicNumerals, Scope.Base10,
            Scope.NumbersLarger5, Scope.NumbersSmaller1000, operandCardinality, Ability.Formalization
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.terms).toHaveLength(expectedLength);
        expect(stub!.labels).toContain(operandCardinality);
    });

    it('resolves the Grade 4 all-nonzero-place expansion without an operand count', () => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue, Area.Sum, Scope.ArabicNumerals, Scope.Base10,
            Scope.NumbersSmaller1000000, Ability.Formalization
        ]);
        expect(stub).not.toBeNull();
        expect('task' in stub!.data && stub!.data.task).toBe('multi-digit-expanded-form');
        expect(stub!.labels).toContain(Scope.NumbersSmaller1000000);
    });

    it.each([
        [Scope.NumbersSmaller10000, Scope.NumbersLarger100, Scope.TwoOperands, 10000, 100],
        [Scope.NumbersSmaller10000, Scope.NumbersLarger120, Scope.TwoOperands, 10000, 120],
        [Scope.NumbersSmaller10000, Scope.NumbersLarger10, Scope.ThreeOperands, 10000, 10],
        [Scope.NumbersSmaller100000, Scope.NumbersLarger100, Scope.ThreeOperands, 100000, 100],
        [Scope.NumbersSmaller1000000, Scope.NumbersLarger1000, Scope.ThreeOperands, 1000000, 1000],
        [Scope.NumbersSmaller1000000, Scope.NumbersLarger10000, Scope.TwoOperands, 1000000, 10000]
    ] as const)('resolves independently assessed high-floor sum quantities for %s/%s/%s', (upperLabel, lowerLabel, cardinality, upper, lower) => {
        for (let seed = 0; seed < 8; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [upperLabel, lowerLabel, cardinality]);
            expect(stub).not.toBeNull();
            const quantities = [stub!.data.number, ...stub!.data.terms];
            expect(Math.min(...quantities)).toBeGreaterThanOrEqual(lower);
            expect(Math.max(...quantities)).toBeLessThanOrEqual(upper);
            expect(stub!.labels).toEqual(expect.arrayContaining([upperLabel, lowerLabel, cardinality]));
            expect(stub!.data.terms.every(term => term > 0)).toBe(true);
        }
    });

    it.each([
        [Scope.NumbersSmaller120, Scope.NumbersLarger10],
        [Scope.NumbersSmaller1000, Scope.NumbersLarger20],
        [Scope.NumbersSmaller10000, Scope.NumbersLarger100],
        [Scope.NumbersSmaller100000, Scope.NumbersLarger1000],
        [Scope.NumbersSmaller1000000, Scope.NumbersLarger10000]
    ] as const)('rejects infeasible three-term upper/floor claims %s/%s', (upper, lower) => {
        expect(() => generateWithLabels(generator, [upper, lower, Scope.ThreeOperands])).toThrow();
    });
});

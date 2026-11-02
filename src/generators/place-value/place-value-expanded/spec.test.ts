import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {resolveInferredLabels} from '../../../lib/inferred-labels.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {expandedNumbers} from './domain.ts';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueExpandedGeneratorSchema, spec} from './spec.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';

describe('PlaceValueExpandedGenerator spec integration', () => {
    const generator = new PlaceValueExpandedGenerator();

    it.each([
        [[Scope.NumbersLarger5], Scope.NumbersSmaller1000, Scope.TwoOperands, Scope.NumbersWithoutZero],
        [[Scope.NumbersLarger5], Scope.NumbersSmaller1000, Scope.ThreeOperands, Scope.NumbersWithoutZero],
        [[], Scope.NumbersSmaller1000000, Scope.TwoOperands, Scope.NumbersWithZero],
        [[], Scope.NumbersSmaller1000000, Scope.ThreeOperands, Scope.NumbersWithZero]
    ] as const)('infers zero participation from branch and cardinality: %s / %s / %s', (minimum, maximum, cardinality, expected) => {
        for (let seed = 0; seed < 24; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [...minimum, maximum, cardinality]);
            expect(stub).not.toBeNull();
            expect(stub!.labels).toContain(expected);
            expect(stub!.labels).not.toContain(expected === Scope.NumbersWithZero
                ? Scope.NumbersWithoutZero : Scope.NumbersWithZero);
            expect(stub!.data.number).toBeGreaterThan(0);
            expect(stub!.data.terms.every(value => value > 0)).toBe(true);
            if (expected === Scope.NumbersWithZero) {
                expect('task' in stub!.data && stub!.data.task).toBe('multi-digit-expanded-form');
                if ('task' in stub!.data && stub!.data.task === 'multi-digit-expanded-form') {
                    expect(stub!.data.placeValues.some(place => place.digit === 0)).toBe(true);
                }
            } else {
                expect('task' in stub!.data).toBe(false);
            }
        }
    });

    it('uses the exact existing branch boundary, including a zero glyph without a zero-valued term', () => {
        const config = {range: createCanonicalNumericRange(1000), operandCardinality: Scope.TwoOperands};
        expect(resolveInferredLabels({spec, schema: PlaceValueExpandedGeneratorSchema,
            config, labels: [], owner: 'generator'})).toEqual([Scope.NumbersWithoutZero]);
        expect(expandedNumbers(createCanonicalNumericRange(120), 2)).toContain(101);
        expect(resolveInferredLabels({spec, schema: PlaceValueExpandedGeneratorSchema,
            config: {range: createCanonicalNumericRange(10000), operandCardinality: Scope.TwoOperands},
            labels: [], owner: 'generator'})).toEqual([Scope.NumbersWithZero]);
    });

    it.each([
        {range: createCanonicalNumericRange(1000000), operandCardinality: undefined},
        {range: undefined, operandCardinality: Scope.TwoOperands},
        {range: undefined, operandCardinality: undefined}
    ])('does not infer when the complete configuration provides no universal claim: %j', config => {
        expect(resolveInferredLabels({spec, schema: PlaceValueExpandedGeneratorSchema,
            config, labels: [], owner: 'generator'})).toEqual([]);
    });

    it('leaves direct unconstrained high-range inference empty', () => {
        expect(resolveInferredLabels({spec, schema: PlaceValueExpandedGeneratorSchema,
            config: {range: createCanonicalNumericRange(10000), operandCardinality: undefined},
            labels: [], owner: 'generator'})).toEqual([]);
        expect(() => generator.generate({range: createCanonicalNumericRange(10000), operandCardinality: undefined})).toThrow();
    });

    it.each([
        [Scope.TwoOperands, 2],
        [Scope.ThreeOperands, 3]
    ] as const)('resolves %s labels', (operandCardinality, expectedLength) => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue,
            Area.Sum,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersLarger5,
            Scope.NumbersSmaller1000,
            operandCardinality,
            Ability.Formalization
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.terms).toHaveLength(expectedLength);
        expect(stub!.labels).toContain(operandCardinality);
    });

    it('resolves the Grade 4 all-nonzero-place expansion without an operand count', () => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue,
            Area.Sum,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersSmaller1000000,
            Ability.Formalization
        ]);

        expect(stub).not.toBeNull();
        expect('task' in stub!.data && stub!.data.task).toBe('multi-digit-expanded-form');
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Scope.NumbersSmaller1000000
        ]));
    });
});

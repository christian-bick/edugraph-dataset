import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {ComparisonGenerator} from './generator.ts';
import {ComparisonGeneratorSchema, spec} from './spec.ts';
import {comparisonProfiles} from './profiles.ts';

describe('ComparisonGenerator canonical specification', () => {
    const generator = new ComparisonGenerator();
    const positiveNonzero = [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];

    it('keeps representation capabilities out of the canonical mathematical relation', () => {
        expect(spec.generalLabels).toEqual([Scope.IntegerNumbers]);
    });

    it('resolves every declared profile identically through planned and direct paths', () => {
        for (const {labels, profile} of comparisonProfiles) {
            const direct = extractConfig(ComparisonGeneratorSchema, labels);
            const planned = resolveSchemaChoices(ComparisonGeneratorSchema, labels, {comparison: labels});
            expect(direct.config.comparison).toEqual(profile);
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(labels));
            const stub = generateWithLabels(generator, labels)!;
            expect(stub).not.toBeNull();
            expect(hasCanonicalRangeWitness([stub.data.num1, stub.data.num2], profile.range)).toBe(true);
            expect(stub.labels).not.toContain(Scope.NumbersLargerZero);
        }
    });

    it('selects a strongest lower bound for an upper-only equality request without changing the upper', () => {
        const labels = [Area.NumericEquality, Scope.Equal, Scope.NumbersSmaller100, ...positiveNonzero];
        const choices = normalizeSchemaChoices(ComparisonGeneratorSchema, labels, 'generator')[0].alternatives;
        expect(choices).toHaveLength(1);
        expect(choices[0].labels).toEqual(expect.arrayContaining([Scope.NumbersLarger20, Scope.NumbersSmaller100]));
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const {config, resolvedLabels} = extractConfig(ComparisonGeneratorSchema, labels);
            expect(config.comparison!.range).toMatchObject({min: 20, max: 100});
            expect(resolvedLabels).toContain(Scope.NumbersLarger20);
            expect(resolvedLabels.filter(label => label.includes('NumbersSmaller'))).toEqual([Scope.NumbersSmaller100]);
        }
    });

    it('allows both strongest-lower completions of a partial within-ten inequality request', () => {
        const labels = [Area.NumericInequality, Scope.Less, Scope.NumbersSmaller10, ...positiveNonzero];
        const choices = normalizeSchemaChoices(ComparisonGeneratorSchema, labels, 'generator')[0].alternatives;
        expect(choices).toHaveLength(2);
        expect(choices.every(choice => choice.labels.includes(Scope.NumbersSmaller10))).toBe(true);
        expect(choices.some(choice => choice.labels.includes(Scope.NumbersLarger5))).toBe(true);
        expect(choices.some(choice => !choice.labels.includes(Scope.NumbersLarger5))).toBe(true);
    });

    it('rejects incompatible explicit relation/range/zero requests before generation', () => {
        for (const labels of [
            [Area.NumericEquality, Scope.Less, Scope.NumbersSmaller20, ...positiveNonzero],
            [Area.NumericInequality, Scope.Equal, Scope.NumbersSmaller20, ...positiveNonzero],
            [Scope.Equal, Scope.NumbersLarger10, Scope.NumbersSmaller100, ...positiveNonzero],
            [Scope.Equal, Scope.NumbersSmaller10, Scope.NumbersWithZero],
            [Scope.Less, Scope.NumbersLarger10, Scope.NumbersSmaller20, Scope.NumbersWithZero],
            [Scope.Equal, Scope.NumbersSmaller5, Scope.NumbersWithZero, Scope.NumbersWithNegatives]
        ]) {
            expect(normalizeSchemaChoices(ComparisonGeneratorSchema, labels, 'generator')[0].alternatives).toEqual([]);
            expect(() => generateWithLabels(generator, labels)).toThrow();
        }
    });

    it('completes a missing relation with its concrete Area and preserves the requested upper', () => {
        const stub = generateWithLabels(generator, [Scope.NumbersSmaller20, ...positiveNonzero])!;
        expect(stub).not.toBeNull();
        expect(stub.labels).toContain(Scope.NumbersSmaller20);
        expect(stub.labels).not.toContain(Area.NumericComparison);
        expect(stub.labels.some(label => [Area.NumericEquality, Area.NumericInequality].includes(label as Area))).toBe(true);
    });
});

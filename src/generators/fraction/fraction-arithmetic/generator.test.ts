import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionArithmeticProblem,
    MixedFractionValue
} from '../../../types/problems.ts';
import {FractionArithmeticGenerator} from './generator.ts';
import {
    FractionArithmeticGeneratorConfig,
    FractionArithmeticTaskConfig
} from './spec.ts';

const generator = new FractionArithmeticGenerator();

const generate = (
    seed: string,
    task: FractionArithmeticTaskConfig,
    operation: NonNullable<FractionArithmeticGeneratorConfig['operation']>,
    usesCommonDenominator = operation !== 'multiplication'
): FractionArithmeticProblem => {
    setSeed(seed);
    return generator.generate({task, operation, usesCommonDenominator}).data;
};

const improperNumerator = (value: MixedFractionValue): number =>
    value.whole * value.denominator + value.numerator;

const forbiddenPresentationKeys = new Set([
    'answer',
    'answerStatement',
    'boundsStatement',
    'context',
    'equation',
    'equationChain',
    'explanation',
    'frames',
    'groups',
    'label',
    'model',
    'models',
    'notation',
    'prompt',
    'question',
    'questionEquation',
    'solutionEquation',
    'story',
    'transformationSteps',
    'unknownRole'
]);

const presentationKeys = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(presentationKeys);
    if (typeof value !== 'object' || value === null) return [];
    return Object.entries(value).flatMap(([key, nested]) => [
        ...(forbiddenPresentationKeys.has(key) ? [key] : []),
        ...presentationKeys(nested)
    ]);
};

describe('FractionArithmeticGenerator', () => {
    it('generates canonical like-denominator addition and subtraction relations', () => {
        for (const operation of ['addition', 'subtraction'] as const) {
            for (let index = 0; index < 40; index += 1) {
                const data = generate(`binary-${operation}-${index}`, 'fraction-operation', operation);
                expect(data.task).toBe('fraction-operation');
                if (data.task !== 'fraction-operation') continue;
                expect(data.first.denominator).toBe(data.denominator);
                expect(data.second.denominator).toBe(data.denominator);
                expect(data.result.denominator).toBe(data.denominator);
                expect(data.result.numerator).toBe(operation === 'addition'
                    ? data.first.numerator + data.second.numerator
                    : data.first.numerator - data.second.numerator);
                expect(data.sharedWhole).toBe(1);
                expect(data.referenceId).toBe('same-whole');
            }
        }
    });

    it('retains two distinct mathematical decomposition witnesses for proper and mixed sources', () => {
        for (const [task, sourceKind] of [
            ['decompose-proper', 'proper'],
            ['decompose-mixed', 'mixed']
        ] as const) {
            for (let index = 0; index < 30; index += 1) {
                const data = generate(`decompose-${sourceKind}-${index}`, task, 'addition');
                expect(data.task).toBe('decompose');
                if (data.task !== 'decompose') continue;
                expect(data.source.kind).toBe(sourceKind);
                const sourceNumerator = data.source.kind === 'proper'
                    ? data.source.value.numerator
                    : improperNumerator(data.source.value);
                const numeratorSets = data.decompositions.map(decomposition =>
                    decomposition.terms.map(term => term.numerator));
                expect(numeratorSets).toHaveLength(2);
                expect(numeratorSets[0]).not.toEqual(numeratorSets[1]);
                for (const decomposition of data.decompositions) {
                    expect(decomposition.terms.every(term =>
                        term.denominator === data.denominator && term.numerator > 0
                    )).toBe(true);
                    expect(decomposition.terms.reduce((sum, term) => sum + term.numerator, 0))
                        .toBe(sourceNumerator);
                }
            }
        }
    });

    it('generates normalized mixed-number relations with and without regrouping', () => {
        const seen = new Set<string>();
        for (const operation of ['addition', 'subtraction'] as const) {
            for (let index = 0; index < 100; index += 1) {
                const data = generate(`mixed-${operation}-${index}`, 'mixed-operation', operation);
                expect(data.task).toBe('mixed-operation');
                if (data.task !== 'mixed-operation') continue;
                const expected = operation === 'addition'
                    ? improperNumerator(data.first) + improperNumerator(data.second)
                    : improperNumerator(data.first) - improperNumerator(data.second);
                expect(improperNumerator(data.result)).toBe(expected);
                expect(data.result.numerator).toBeLessThan(data.denominator);
                const regrouping = operation === 'addition'
                    ? data.first.numerator + data.second.numerator >= data.denominator
                    : data.first.numerator < data.second.numerator;
                seen.add(`${operation}-${regrouping}`);
            }
        }
        expect(seen).toEqual(new Set([
            'addition-false',
            'addition-true',
            'subtraction-false',
            'subtraction-true'
        ]));
    });

    it('generates unit-fraction multiples as canonical factor-product relations', () => {
        for (let index = 0; index < 40; index += 1) {
            const data = generate(
                `unit-multiple-${index}`,
                'unit-fraction-multiple',
                'multiplication'
            );
            expect(data.task).toBe('unit-fraction-multiple');
            if (data.task !== 'unit-fraction-multiple') continue;
            expect(data.unitFraction).toEqual({numerator: 1, denominator: data.denominator});
            expect(data.product).toEqual({
                numerator: data.wholeFactor,
                denominator: data.denominator
            });
        }
    });

    it.each([
        ['whole-number-fraction-product-proper', true],
        ['whole-number-fraction-product-improper', false]
    ] as const)('generates %s relations with the requested product class', (task, proper) => {
        for (let index = 0; index < 50; index += 1) {
            const data = generate(`product-${task}-${index}`, task, 'multiplication');
            expect(data.task).toBe('whole-number-fraction-product');
            if (data.task !== 'whole-number-fraction-product') continue;
            expect(data.product.numerator).toBe(
                data.wholeFactor * data.fractionFactor.numerator
            );
            expect(data.product.numerator < data.denominator).toBe(proper);
            expect(data.product.numerator % data.denominator).not.toBe(0);
        }
    });

    it('generates a typed tenths-to-hundredths conversion and addition relation', () => {
        let sawWhole = false;
        for (let index = 0; index < 200; index += 1) {
            const data = generate(
                `tenths-hundredths-${index}`,
                'tenths-hundredths-addition',
                'addition'
            );
            expect(data.task).toBe('tenths-hundredths-addition');
            if (data.task !== 'tenths-hundredths-addition') continue;
            expect(data.convertedFirst.numerator).toBe(
                data.firstTenths.numerator * data.conversionFactor
            );
            expect(data.result.numerator).toBe(
                data.convertedFirst.numerator + data.secondHundredths.numerator
            );
            expect(data.result.numerator).toBeLessThanOrEqual(100);
            sawWhole ||= data.result.numerator === 100;
        }
        expect(sawWhole).toBe(true);
    });

    it('keeps every payload free of learner-facing presentation fields', () => {
        const fixtures = [
            generate('neutral-binary', 'fraction-operation', 'addition'),
            generate('neutral-decompose', 'decompose-mixed', 'addition'),
            generate('neutral-mixed', 'mixed-operation', 'subtraction'),
            generate('neutral-unit', 'unit-fraction-multiple', 'multiplication'),
            generate('neutral-product', 'whole-number-fraction-product-improper', 'multiplication'),
            generate('neutral-hundredths', 'tenths-hundredths-addition', 'addition')
        ];
        expect(fixtures.flatMap(presentationKeys)).toEqual([]);
    });

    it('is deterministic for the same seed and configuration', () => {
        const first = generate('deterministic', 'mixed-operation', 'addition');
        const second = generate('deterministic', 'mixed-operation', 'addition');
        expect(first).toEqual(second);
    });

    it('rejects missing, invalid, and incompatible configurations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({
            task: 'fraction-operation',
            operation: 'division' as never,
            usesCommonDenominator: true
        })).toThrow('Operation must be addition, subtraction, or multiplication.');
        expect(() => generator.generate({
            task: 'fraction-operation',
            operation: 'addition',
            usesCommonDenominator: false
        })).toThrow('CommonDenominator is required');
        expect(() => generator.generate({
            task: 'fraction-operation',
            operation: 'multiplication',
            usesCommonDenominator: false
        })).toThrow('Unsupported multiplication task');
        expect(() => generator.generate({
            task: 'decompose-proper',
            operation: 'subtraction',
            usesCommonDenominator: true
        })).toThrow('Unsupported fraction form');
    });
});

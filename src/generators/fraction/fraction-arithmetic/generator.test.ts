import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionArithmeticProblem,
    MixedFractionValue,
    UnlikeFractionOperationProblem,
    UnlikeMixedOperationProblem
} from '../../../types/problems.ts';
import {
    createUnlikeFractionOperationProblem,
    createUnlikeMixedOperationProblem,
    FractionArithmeticGenerator
} from './generator.ts';
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

const forbiddenPayloadKeys = new Set([
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
    'referenceId',
    'solutionEquation',
    'story',
    'transformationSteps',
    'unknownRole'
]);

const forbiddenKeys = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(forbiddenKeys);
    if (typeof value !== 'object' || value === null) return [];
    return Object.entries(value).flatMap(([key, nested]) => [
        ...(forbiddenPayloadKeys.has(key) ? [key] : []),
        ...forbiddenKeys(nested)
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

    it('keeps every payload free of redundant identity and learner-facing fields', () => {
        const fixtures = [
            generate('neutral-binary', 'fraction-operation', 'addition'),
            generate('neutral-decompose', 'decompose-mixed', 'addition'),
            generate('neutral-mixed', 'mixed-operation', 'subtraction'),
            generate('neutral-unit', 'unit-fraction-multiple', 'multiplication'),
            generate('neutral-product', 'whole-number-fraction-product-improper', 'multiplication'),
            generate('neutral-hundredths', 'tenths-hundredths-addition', 'addition')
        ];
        expect(fixtures.flatMap(forbiddenKeys)).toEqual([]);
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

const gcd = (first: number, second: number): number => {
    let a = first;
    let b = second;
    while (b !== 0) [a, b] = [b, a % b];
    return a;
};

function expectUnlikeRelation(
    data: UnlikeFractionOperationProblem | UnlikeMixedOperationProblem
): void {
    expect(data.sharedWhole).toBe(1);
    expect(data.storyContext).toBe('route-length');
    const first = data.first;
    const second = data.second;
    const common = data.commonDenominator;
    expect(first.denominator).not.toBe(second.denominator);
    expect(common).toBeGreaterThan(0);
    expect(common).toBeLessThanOrEqual(24);
    expect(common % first.denominator).toBe(0);
    expect(common % second.denominator).toBe(0);
    const firstWhole = 'whole' in first ? first.whole : 0;
    const secondWhole = 'whole' in second ? second.whole : 0;
    const firstFactor = common / first.denominator;
    const secondFactor = common / second.denominator;
    expect(data.firstConversion).toEqual({
        factor: firstFactor,
        fractionalNumeratorAtCommonDenominator: first.numerator * firstFactor,
        improperNumeratorAtCommonDenominator:
            (firstWhole * first.denominator + first.numerator) * firstFactor
    });
    expect(data.secondConversion).toEqual({
        factor: secondFactor,
        fractionalNumeratorAtCommonDenominator: second.numerator * secondFactor,
        improperNumeratorAtCommonDenominator:
            (secondWhole * second.denominator + second.numerator) * secondFactor
    });
    const total = data.operation === 'addition'
        ? data.firstConversion.improperNumeratorAtCommonDenominator
            + data.secondConversion.improperNumeratorAtCommonDenominator
        : data.firstConversion.improperNumeratorAtCommonDenominator
            - data.secondConversion.improperNumeratorAtCommonDenominator;
    expect(total).toBeGreaterThanOrEqual(0);
    expect(data.resultAtCommonDenominator).toEqual({
        numerator: total, denominator: common
    });
    if (data.task === 'unlike-fraction-operation') {
        expect(data.result.numerator * common).toBe(total * data.result.denominator);
        expect(gcd(data.result.numerator, data.result.denominator)).toBe(1);
        if (total === 0) expect(data.result).toEqual({numerator: 0, denominator: 1});
    } else {
        expect(data.result.whole).toBe(Math.floor(total / common));
        expect(data.result.numerator).toBeGreaterThanOrEqual(0);
        expect(data.result.numerator).toBeLessThan(data.result.denominator);
        expect(data.result.numerator * common)
            .toBe((total % common) * data.result.denominator);
        expect(gcd(data.result.numerator, data.result.denominator)).toBe(1);
        if (total % common === 0) expect(data.result.denominator).toBe(1);
    }
    expect(forbiddenKeys(data)).toEqual([]);
}

describe('unlike denominator fraction arithmetic', () => {
    it('preserves the standard 2/3 + 5/4 = 8/12 + 15/12 = 23/12 example', () => {
        const data = createUnlikeFractionOperationProblem(
            'addition', {numerator: 2, denominator: 3},
            {numerator: 5, denominator: 4}, 12
        )!;
        expectUnlikeRelation(data);
        expect(data.firstConversion).toEqual({
            factor: 4,
            fractionalNumeratorAtCommonDenominator: 8,
            improperNumeratorAtCommonDenominator: 8
        });
        expect(data.secondConversion).toEqual({
            factor: 3,
            fractionalNumeratorAtCommonDenominator: 15,
            improperNumeratorAtCommonDenominator: 15
        });
        expect(data.resultAtCommonDenominator).toEqual({numerator: 23, denominator: 12});
        expect(data.result).toEqual({numerator: 23, denominator: 12});
    });

    it('uses a valid nonleast denominator and reduces 1/4 + 1/6 = 5/12', () => {
        const data = createUnlikeFractionOperationProblem(
            'addition', {numerator: 1, denominator: 4},
            {numerator: 1, denominator: 6}, 24
        )!;
        expectUnlikeRelation(data);
        expect(data.firstConversion.factor).toBe(6);
        expect(data.secondConversion.factor).toBe(4);
        expect(data.resultAtCommonDenominator).toEqual({numerator: 10, denominator: 24});
        expect(data.result).toEqual({numerator: 5, denominator: 12});
    });

    it('retains mixed whole parts and converts through improper numerators', () => {
        const sum = createUnlikeMixedOperationProblem(
            'addition', {whole: 1, numerator: 3, denominator: 4},
            {whole: 1, numerator: 5, denominator: 6}, 24
        )!;
        expectUnlikeRelation(sum);
        expect(sum.firstConversion).toEqual({
            factor: 6,
            fractionalNumeratorAtCommonDenominator: 18,
            improperNumeratorAtCommonDenominator: 42
        });
        expect(sum.secondConversion).toEqual({
            factor: 4,
            fractionalNumeratorAtCommonDenominator: 20,
            improperNumeratorAtCommonDenominator: 44
        });
        expect(sum.resultAtCommonDenominator).toEqual({numerator: 86, denominator: 24});
        expect(sum.result).toEqual({whole: 3, numerator: 7, denominator: 12});

        const difference = createUnlikeMixedOperationProblem(
            'subtraction', {whole: 2, numerator: 1, denominator: 3},
            {whole: 1, numerator: 3, denominator: 4}, 12
        )!;
        expectUnlikeRelation(difference);
        expect(difference.resultAtCommonDenominator)
            .toEqual({numerator: 7, denominator: 12});
        expect(difference.result).toEqual({whole: 0, numerator: 7, denominator: 12});
    });

    it('normalizes exact zero and whole results with denominator one', () => {
        const zero = createUnlikeFractionOperationProblem(
            'subtraction', {numerator: 1, denominator: 2},
            {numerator: 2, denominator: 4}, 4
        )!;
        expectUnlikeRelation(zero);
        expect(zero.result).toEqual({numerator: 0, denominator: 1});
        const whole = createUnlikeMixedOperationProblem(
            'addition', {whole: 1, numerator: 1, denominator: 2},
            {whole: 1, numerator: 2, denominator: 4}, 4
        )!;
        expectUnlikeRelation(whole);
        expect(whole.result).toEqual({whole: 3, numerator: 0, denominator: 1});
    });

    it('rejects invalid denominators, non-equivalent conversions and negative results', () => {
        const first = {numerator: 1, denominator: 4} as const;
        const second = {numerator: 1, denominator: 6} as const;
        expect(createUnlikeFractionOperationProblem('addition', first, second, 12)).not.toBeNull();
        expect(createUnlikeFractionOperationProblem('addition', first, second, 7)).toBeNull();
        expect(createUnlikeFractionOperationProblem('addition', first, second, 25)).toBeNull();
        expect(createUnlikeFractionOperationProblem('addition', first,
            {numerator: 1, denominator: 4}, 4)).toBeNull();
        expect(createUnlikeFractionOperationProblem('addition',
            {numerator: 1, denominator: 5} as never, second, 30)).toBeNull();
        expect(createUnlikeFractionOperationProblem('addition',
            {numerator: 0, denominator: 4}, second, 12)).toBeNull();
        expect(createUnlikeFractionOperationProblem('addition',
            {numerator: 1.5, denominator: 4}, second, 12)).toBeNull();
        expect(createUnlikeFractionOperationProblem('subtraction', first,
            {numerator: 5, denominator: 6}, 12)).toBeNull();
        expect(createUnlikeFractionOperationProblem('division' as never,
            first, second, 12)).toBeNull();
        expect(createUnlikeMixedOperationProblem('addition',
            {whole: 0, numerator: 1, denominator: 4},
            {whole: 1, numerator: 1, denominator: 6}, 12)).toBeNull();
        expect(createUnlikeMixedOperationProblem('subtraction',
            {whole: 1, numerator: 1, denominator: 4},
            {whole: 2, numerator: 1, denominator: 6}, 12)).toBeNull();
    });

    it('samples all unlike operation forms, nonleast conversions, and regrouping profiles', () => {
        const seen = new Set<string>();
        for (const task of ['unlike-fraction-operation', 'unlike-mixed-operation'] as const) {
            for (const operation of ['addition', 'subtraction'] as const) {
                for (let index = 0; index < 120; index++) {
                    setSeed(`unlike-${task}-${operation}-${index}`);
                    const data = generator.generate({
                        task, operation, usesCommonDenominator: false
                    }).data;
                    expect(data.task).toBe(task);
                    if (data.task !== 'unlike-fraction-operation'
                        && data.task !== 'unlike-mixed-operation') continue;
                    expectUnlikeRelation(data);
                    const least = data.first.denominator * data.second.denominator
                        / gcd(data.first.denominator, data.second.denominator);
                    if (data.commonDenominator > least) seen.add(`${task}-${operation}-nonleast`);
                    if (data.task === 'unlike-fraction-operation') {
                        if (data.first.numerator >= data.first.denominator
                            || data.second.numerator >= data.second.denominator) {
                            seen.add(`${task}-${operation}-improper`);
                        } else seen.add(`${task}-${operation}-proper`);
                    } else {
                        const regroup = operation === 'addition'
                            ? data.firstConversion.fractionalNumeratorAtCommonDenominator
                                + data.secondConversion.fractionalNumeratorAtCommonDenominator
                                    >= data.commonDenominator
                            : data.firstConversion.fractionalNumeratorAtCommonDenominator
                                < data.secondConversion.fractionalNumeratorAtCommonDenominator;
                        seen.add(`${task}-${operation}-${regroup ? 'regroup' : 'straight'}`);
                    }
                }
            }
        }
        for (const task of ['unlike-fraction-operation', 'unlike-mixed-operation']) {
            for (const operation of ['addition', 'subtraction']) {
                expect(seen.has(`${task}-${operation}-nonleast`)).toBe(true);
                for (const profile of task === 'unlike-fraction-operation'
                    ? ['proper', 'improper'] : ['straight', 'regroup']) {
                    expect(seen.has(`${task}-${operation}-${profile}`)).toBe(true);
                }
            }
        }
    });

    it('replays unlike samples and rejects mismatched common-denominator configuration', () => {
        setSeed('unlike-replay');
        const first = generator.generate({
            task: 'unlike-fraction-operation', operation: 'addition',
            usesCommonDenominator: false
        });
        setSeed('unlike-replay');
        expect(generator.generate({
            task: 'unlike-fraction-operation', operation: 'addition',
            usesCommonDenominator: false
        })).toEqual(first);
        expect(() => generator.generate({
            task: 'unlike-mixed-operation', operation: 'subtraction',
            usesCommonDenominator: true
        })).toThrow('cannot also request CommonDenominator');
    });
});

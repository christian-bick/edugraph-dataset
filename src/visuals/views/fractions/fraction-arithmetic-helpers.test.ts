import {describe, expect, it} from 'vitest';
import {FractionArithmeticGenerator} from '../../../generators/fraction/fraction-arithmetic/generator.ts';
import {
    FractionArithmeticGeneratorConfig,
    FractionArithmeticTaskConfig
} from '../../../generators/fraction/fraction-arithmetic/spec.ts';
import {setSeed} from '../../../lib/random.ts';
import {FractionArithmeticProblem} from '../../../types/problems.ts';
import {isValidFractionArithmeticProblem} from './fraction-arithmetic-helpers.ts';

const generator = new FractionArithmeticGenerator();

const generate = (
    seed: string,
    task: FractionArithmeticTaskConfig,
    operation: NonNullable<FractionArithmeticGeneratorConfig['operation']>
): FractionArithmeticProblem => {
    setSeed(seed);
    return generator.generate({
        task,
        usesCommonDenominator: operation !== 'multiplication',
        operation
    }).data;
};

const changed = (
    source: FractionArithmeticProblem,
    update: (data: FractionArithmeticProblem) => void
): FractionArithmeticProblem => {
    const data = structuredClone(source);
    update(data);
    return data;
};

const fixtures = [
    generate('binary-add', 'fraction-operation', 'addition'),
    generate('binary-subtract', 'fraction-operation', 'subtraction'),
    generate('decompose-proper', 'decompose-proper', 'addition'),
    generate('decompose-mixed', 'decompose-mixed', 'addition'),
    ...Array.from({length: 20}, (_, index) =>
        generate(`mixed-add-${index}`, 'mixed-operation', 'addition')),
    ...Array.from({length: 20}, (_, index) =>
        generate(`mixed-subtract-${index}`, 'mixed-operation', 'subtraction')),
    generate('unit-multiple', 'unit-fraction-multiple', 'multiplication'),
    generate('proper-product', 'whole-number-fraction-product-proper', 'multiplication'),
    generate('improper-product', 'whole-number-fraction-product-improper', 'multiplication'),
    generate('tenths', 'tenths-hundredths-addition', 'addition')
];

describe('isValidFractionArithmeticProblem', () => {
    it('accepts every canonical mathematical branch', () => {
        expect(fixtures.map(isValidFractionArithmeticProblem)).toEqual(
            fixtures.map(() => true)
        );
    });

    it('rejects malformed common identity and unsupported discriminants without throwing', () => {
        const source = fixtures[0]!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            data.sharedWhole = 2 as never;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            data.referenceId = 'different-whole' as never;
        }))).toBe(false);
        expect(() => isValidFractionArithmeticProblem(null as never)).not.toThrow();
        expect(isValidFractionArithmeticProblem({task: 'unknown'} as never)).toBe(false);
    });

    it('rejects inconsistent or malformed binary relations', () => {
        const source = fixtures.find(data => data.task === 'fraction-operation')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'fraction-operation') data.result.numerator += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'fraction-operation') {
                data.second.denominator = data.denominator === 2 ? 3 : 2;
            }
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'fraction-operation') data.operation = 'division' as never;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'fraction-operation') data.first = null as never;
        }))).toBe(false);
    });

    it('rejects duplicate, non-positive, and inconsistent decomposition witnesses', () => {
        const source = fixtures.find(data => data.task === 'decompose')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') {
                data.decompositions[1] = structuredClone(data.decompositions[0]);
            }
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') data.decompositions[0].terms[0]!.numerator = 0;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') data.decompositions[0].terms[0]!.numerator += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') data.decompositions = [] as never;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') data.source = null as never;
        }))).toBe(false);
    });

    it('rejects inconsistent mixed-number arithmetic and invalid normalized values', () => {
        const source = fixtures.find(data => data.task === 'mixed-operation')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') data.result.whole += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') data.result.numerator = data.denominator;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') data.first.numerator = 0;
        }))).toBe(false);
    });

    it('rejects contradictory multiplication factors and products', () => {
        const unit = fixtures.find(data => data.task === 'unit-fraction-multiple')!;
        expect(isValidFractionArithmeticProblem(changed(unit, data => {
            if (data.task === 'unit-fraction-multiple') data.unitFraction.numerator = 2;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(unit, data => {
            if (data.task === 'unit-fraction-multiple') data.wholeFactor = 5;
        }))).toBe(false);

        const product = fixtures.find(data => data.task === 'whole-number-fraction-product')!;
        expect(isValidFractionArithmeticProblem(changed(product, data => {
            if (data.task === 'whole-number-fraction-product') data.product.numerator += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(product, data => {
            if (data.task === 'whole-number-fraction-product') {
                data.fractionFactor.numerator = data.denominator;
            }
        }))).toBe(false);
    });

    it('rejects contradictory tenths/hundredths conversions and results', () => {
        const source = fixtures.find(data => data.task === 'tenths-hundredths-addition')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'tenths-hundredths-addition') data.conversionFactor = 2 as never;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'tenths-hundredths-addition') data.convertedFirst.numerator += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'tenths-hundredths-addition') data.result.numerator = 101;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'tenths-hundredths-addition') data.firstTenths = null as never;
        }))).toBe(false);
    });
});

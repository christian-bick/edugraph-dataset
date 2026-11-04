import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorSchema, type PlaceValueArithmeticGeneratorConfig} from './spec.ts';
import {exactPrimaryWidths, primaryWidthRows, primaryWidthSecondInterval} from './width-domain.ts';
import {resolveOriginalSingleDigit, resolveOriginalTwoDigit} from './operand-domain.ts';

const bounds = [5, 10, 20, 100, 120, 1000] as const;
const floors = [-1, 5, 10, 20, 100, 120];
const examples = [
    {operation: 'addition', regrouping: false, zero: false},
    {operation: 'addition', regrouping: true, zero: false},
    {operation: 'subtraction', regrouping: false, zero: false},
    {operation: 'subtraction', regrouping: true, zero: false},
    {operation: 'subtraction', regrouping: false, zero: true}
] as const;
const contexts = examples.flatMap(example => bounds.flatMap((upper, index) => [false, true].map(coefficientZero =>
    ({...example, upper, floor: floors[index]!, coefficientZero}))));
const widthOf = (a: number, b: number) => `${String(Math.max(a, b)).length}${String(Math.min(a, b)).length}`;
const coefficientZero = (a: number, b: number, answer: number) => [a, b, answer].some(value =>
    Math.floor(value / 100) === 0 || Math.floor(value % 100 / 10) === 0 || value % 10 === 0);

describe('exact operand widths retain the independent native proposal', () => {
    it.each([
        [9, '21', 1, 999, [10, 99]], [10, '21', 1, 999, [1, 9]],
        [99, '21', 4, 7, [4, 7]], [100, '21', 1, 999, undefined],
        [9, '31', 1, 99, undefined], [100, '31', 1, 999, [1, 9]],
        [99, '32', 1, 120, [100, 120]], [100, '32', 1, 999, [10, 99]],
        [9, '22', 1, 999, undefined], [10, '22', 15, 25, [15, 25]],
        [999, '33', 1, 500, [100, 500]],
        [1, 'single', 2, 999, [2, 9]], [10, 'single', 1, 999, undefined],
        [1, 'multiple', 1, 9, undefined], [1, 'multiple', 1, 20, [10, 20]],
        [10, 'multiple', 1, 20, [1, 20]], [1, 'legacy', 3, 7, [3, 7]]
    ] as const)('clips first=%i/width=%s to the original second interval', (first, width, minimum, maximum, expected) => {
        expect(primaryWidthSecondInterval(first, width, minimum, maximum)).toEqual(expected);
    });
    it.each(contexts)('$operation/regroup=$regrouping/zero=$zero/U$upper/coefficient=$coefficientZero', context => {
        const maximum = Math.min(999, context.upper);
        const expected = new Map<number, number>();
        // Independent operand proposal and arithmetic guards, without a production
        // width/range/quantity classifier deciding the expected support.
        for (let a = context.operation === 'addition' || context.zero ? 1 : 2;
            a <= (context.operation === 'addition' ? maximum - 1 : maximum); a++) {
            const last = context.zero ? a : context.operation === 'addition' ? maximum - a : a - 1;
            for (let b = context.zero ? a : 1; b <= last; b++) {
                const answer = context.operation === 'addition' ? a + b : a - b;
                if ((context.operation === 'addition' ? answer : a) <= context.floor
                    || coefficientZero(a, b, answer) !== context.coefficientZero) continue;
                if (context.operation === 'addition') {
                    if ((a % 10 + b % 10 >= 10) !== context.regrouping) continue;
                } else if (!context.zero) {
                    const borrow = a % 10 < b % 10;
                    if (borrow !== context.regrouping
                        || Math.floor(a % 100 / 10) - Number(borrow) < Math.floor(b % 100 / 10)
                        || Math.floor(a / 100) < Math.floor(b / 100)) continue;
                }
                expected.set(a * 1000 + b, context.zero ? maximum : (maximum - 1) * last);
            }
        }
        const expectedSize = expected.size;
        let visited = 0, defects = 0;
        for (const width of exactPrimaryWidths) {
            const rows = primaryWidthRows({operation: context.operation, minimum: 1, maximum,
                maximumAbove: context.floor, regrouping: context.regrouping,
                zeroResult: context.zero, coefficientZero: context.coefficientZero}, width);
            for (const row of rows) for (const b of row.seconds) {
                const key = row.first * 1000 + b, denominator = expected.get(key);
                if (!denominator || widthOf(row.first, b) !== width
                    || Math.abs(row.weight / row.seconds.length * denominator - 1) > 1e-12) defects++;
                expected.delete(key);
                visited++;
            }
        }
        expect({defects, missing: expected.size, visited}).toEqual({defects: 0, missing: 0, visited: expectedSize});
    });
});

const legacyCases = (['two-digit-single-digit', 'two-digit-multiple-of-ten', 'multiples-of-ten'] as const)
    .flatMap(profile => [false, true].flatMap(regrouping => [false, true].flatMap(zero => bounds.flatMap((upper, index) => {
        const maximum = Math.min(999, upper), floor = floors[index]!, pairs: [number, number][] = [];
        if (profile === 'two-digit-single-digit' && !zero) {
            for (let a = 10; a <= Math.min(99, maximum); a++) for (let b = 1; b <= 9; b++)
                if (a + b <= maximum && a + b > floor && (a % 10 + b >= 10) === regrouping) pairs.push([a, b]);
        } else if (profile === 'two-digit-multiple-of-ten' && !zero && !regrouping) {
            for (let a = 10; a <= Math.min(99, maximum); a++) for (let b = 10; b <= Math.min(90, maximum); b += 10)
                if (a + b <= maximum && a + b > floor) pairs.push([a, b]);
        } else if (profile === 'multiples-of-ten' && !regrouping) {
            for (let a = 10; a <= Math.min(90, maximum); a += 10) for (let b = 10; b <= a; b += 10)
                if (a > floor && (a === b) === zero) pairs.push([a, b]);
        }
        return pairs.length ? [{profile, regrouping, zero, upper, pairs}] : [];
    }))));

describe('legacy domains remain independent of annotation completion', () => {
    it('retains all fourteen nonempty original contexts', () => expect(legacyCases).toHaveLength(14));
    it.each(legacyCases)('$profile/regroup=$regrouping/zero=$zero/U$upper keeps the one-draw seed continuation', context => {
        const config: PlaceValueArithmeticGeneratorConfig = {
            operation: context.profile === 'multiples-of-ten' ? Area.Subtraction : Area.Addition,
            requireRegrouping: context.regrouping, requireZero: context.zero,
            requireSingleDigitSmallest: context.profile === 'two-digit-single-digit',
            requireTwoDigitLargest: context.profile !== 'multiples-of-ten',
            requireMultipleOf10: context.profile !== 'two-digit-single-digit',
            coefficientPresence: context.profile === 'multiples-of-ten' ? context.zero : true,
            range: {min: 0, max: context.upper},
            largestOperandProfile: context.profile === 'two-digit-single-digit' ? '21' : '22'
        };
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const expected = context.pairs[Math.floor(random() * context.pairs.length)]!;
            const expectedState = getRandomState();
            setSeed(seed);
            const actual = new PlaceValueArithmeticGenerator().generate(config)!;
            expect([actual.data.num1, actual.data.num2]).toEqual(expected);
            expect(getRandomState()).toBe(expectedState);
        }
    });
    it('does not turn a lone exact largest-width request into a legacy domain', () => {
        expect(resolveOriginalTwoDigit([Scope.TwoDigitLargestOperand])).toBe(false);
        expect(resolveOriginalSingleDigit([Scope.SingleDigitSmallestOperand])).toBe(false);
        const labels = [Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller100];
        const {config} = extractConfig(PlaceValueArithmeticGeneratorSchema, labels);
        expect(config.requireTwoDigitLargest).toBe(false);
        expect(config.requireSingleDigitSmallest).toBe(false);
        expect(new PlaceValueArithmeticGenerator().generate(config)!.data.operandProfile).toBe('general');
    });
    it.each([Area.Subtraction, Area.SubtractionPlaceValuePartitioning])(
        'keeps explicit%s with exact21 in the general subtraction domain', operation => {
            const labels = [operation, Scope.TwoDigitLargestOperand, Scope.SingleDigitSmallestOperand,
                Scope.NumbersSmaller100];
            const {config} = extractConfig(PlaceValueArithmeticGeneratorSchema, labels);
            expect(config.requireSingleDigitSmallest).toBe(false);
            expect(config.requireTwoDigitLargest).toBe(false);
            const data = new PlaceValueArithmeticGenerator().generate(config)!.data;
            expect(data.operandProfile).toBe('general');
            expect(data.operation).toBe('subtraction');
            expect(widthOf(data.num1, data.num2)).toBe('21');
        });
    it.each([false, true])('retains exact22 whole-tens subtraction with zero=$0', zero => {
        const {config} = extractConfig(PlaceValueArithmeticGeneratorSchema, [Area.Subtraction,
            Scope.TwoDigitLargestOperand, Scope.TwoDigitSmallestOperand, Scope.MultiplesOf10,
            Scope.NumbersSmaller100, zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero]);
        expect(config.requireTwoDigitLargest).toBe(false);
        const data = new PlaceValueArithmeticGenerator().generate(config)!.data;
        expect(data.operandProfile).toBe('multiples-of-ten');
        expect(widthOf(data.num1, data.num2)).toBe('22');
        expect(data.answer === 0).toBe(zero);
    });
});

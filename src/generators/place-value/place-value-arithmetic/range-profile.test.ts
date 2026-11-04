import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {hasStaticResolution} from '../../../lib/static-resolvers.ts';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {primaryWidthRows} from './width-domain.ts';
import {grade1AdditionPairs, grade1SubtractionPairs} from './pair-domain.ts';
import {maximumAbove, resolvePlaceValueRange} from './range-profile.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';

const uppers = [5, 10, 20, 100, 120, 1000];
const digits = (number: number) => [Math.floor(number / 100), Math.floor(number % 100 / 10), number % 10];
// Frozen counts from the independent positive-operand arithmetic enumeration.
// Every case checks its count as well as the complete canonical-band partition.
const generalContexts = [
    {operation: 'addition', regrouping: false, zeroResult: false, coefficientZero: false, expectedCount: 82944},
    {operation: 'addition', regrouping: false, zeroResult: false, coefficientZero: true, expectedCount: 192807},
    {operation: 'addition', regrouping: true, zeroResult: false, coefficientZero: false, expectedCount: 81648},
    {operation: 'addition', regrouping: true, zeroResult: false, coefficientZero: true, expectedCount: 141102},
    {operation: 'subtraction', regrouping: false, zeroResult: false, coefficientZero: false, expectedCount: 46656},
    {operation: 'subtraction', regrouping: false, zeroResult: false, coefficientZero: true, expectedCount: 117720},
    {operation: 'subtraction', regrouping: false, zeroResult: true, coefficientZero: false, expectedCount: 0},
    {operation: 'subtraction', regrouping: false, zeroResult: true, coefficientZero: true, expectedCount: 999},
    {operation: 'subtraction', regrouping: true, zeroResult: false, coefficientZero: false, expectedCount: 36288},
    {operation: 'subtraction', regrouping: true, zeroResult: false, coefficientZero: true, expectedCount: 75087}
] as const;
function quantities(a: number, b: number, addition: boolean, regrouping: boolean) {
    const result = addition ? a + b : a - b;
    return [a, b, result, ...digits(a), ...digits(b), ...digits(result),
        a - a % 10, b - b % 10, result - result % 10,
        ...(addition ? [a % 10 + b % 10] : []),
        ...(regrouping ? [1, 10, addition ? a % 10 + b % 10 - 10 : a % 10 + 10] : [])];
}

describe('canonical place-value arithmetic domains', () => {
    it.each(generalContexts)('partitions every original $operation pair/regrouping=$regrouping/zero=$zeroResult/coefficient=$coefficientZero without endpoint loss',
        ({operation, regrouping, zeroResult, coefficientZero, expectedCount}) => {
            let errors = 0;
            const base = {operation, minimum: 1, maximum: 999, regrouping, zeroResult, coefficientZero};
            const original = new Set(primaryWidthRows(base, 'legacy').flatMap(row => row.seconds.map(b => row.first * 1000 + b)));
            expect(original.size).toBe(expectedCount);
            const retained = new Set<number>();
            for (const upper of uppers) {
                const range = createCanonicalNumericRange(upper);
                const rows = primaryWidthRows({...base, maximum: Math.min(999, upper), maximumAbove: maximumAbove(upper)}, 'legacy');
                for (const row of rows) for (const second of row.seconds) {
                    const key = row.first * 1000 + second;
                    if (retained.has(key) || !hasCanonicalRangeWitness(quantities(row.first, second,
                        operation === 'addition', regrouping), range)) errors++;
                    retained.add(key);
                }
            }
            if (original.size !== retained.size || [...original].some(key => !retained.has(key))) errors++;
            expect(errors).toBe(0);
        });

    it('retains the aggregate original general support across every independent context', () => {
        const total = generalContexts.reduce((sum, context) => sum + context.expectedCount, 0);
        expect(total).toBeGreaterThan(500000);
        expect(total).toBe(775251);
    });

    it('retains every original fixed-width addition and whole-tens subtraction across the bands', () => {
        for (const profile of ['two-digit-single-digit', 'two-digit-multiple-of-ten'] as const) {
            for (const regrouping of [false, true]) {
                const old = grade1AdditionPairs(profile, 1, 999, regrouping).map(pair => pair.join(','));
                const current = uppers.flatMap(upper => grade1AdditionPairs(profile, 1, Math.min(999, upper), regrouping)
                    .filter(([a, b]) => a + b > maximumAbove(upper)).map(pair => pair.join(',')));
                expect(new Set(current)).toEqual(new Set(old));
                expect(current.length).toBe(old.length);
            }
        }
        for (const equality of [false, true]) {
            const old = grade1SubtractionPairs(1, 999, equality).map(pair => pair.join(','));
            const current = uppers.flatMap(upper => grade1SubtractionPairs(1, Math.min(999, upper), equality)
                .filter(([a]) => a > maximumAbove(upper)).map(pair => pair.join(',')));
            expect(new Set(current)).toEqual(new Set(old));
            for (const pair of current) {
                const [a, b] = pair.split(',').map(Number) as [number, number];
                const upper = uppers.find(bound => a <= bound)!;
                expect(hasCanonicalRangeWitness([a, b, a - b, a / 10, b / 10, (a - b) / 10], createCanonicalNumericRange(upper))).toBe(true);
            }
        }
    });

    it('completes supported broad requests without dropping static annotation readiness', () => {
        expect(hasStaticResolution(resolvePlaceValueRange)).toBe(true);
        for (const upper of uppers) for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [`http://edugraph.io/edu/NumbersSmaller${upper}`])!;
            expect(stub).not.toBeNull();
            expect(hasCanonicalRangeWitness(quantities(stub.data.num1, stub.data.num2,
                stub.data.operation === 'addition', stub.data.regrouping.kind !== 'none'), createCanonicalNumericRange(upper))).toBe(true);
        }
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [Area.Subtraction,
                Scope.MultiplesOf10, Scope.NumbersSmaller20, zero])!;
            expect(stub.data.num1).toBe(20);
            expect(stub.data.num2).toBe(zero === Scope.NumbersWithZero ? 20 : 10);
        }
        for (let seed = 0; seed < 64; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [Area.PlaceValue,
                Scope.MultiplesOf10, Scope.NumbersSmaller20])!;
            expect(stub.data.num1).toBe(20);
            expect(stub.data.num2).toBe(10);
        }
        for (const profile of [[Scope.SingleDigitSmallestOperand], [Scope.MultiplesOf10]]) {
            for (let seed = 0; seed < 64; seed++) {
                setSeed(`fixed-addition:${profile[0]}:${seed}`);
                const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [Area.PlaceValue,
                    Scope.TwoDigitLargestOperand, Scope.NumbersSmaller100, ...profile])!;
                expect(stub.data.operation).toBe('addition');
                expect(stub.data.num1).toBeGreaterThanOrEqual(10);
                expect(stub.data.num1).toBeLessThan(100);
            }
        }
    });
});

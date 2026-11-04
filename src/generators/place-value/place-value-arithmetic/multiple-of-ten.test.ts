import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import * as rng from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorSchema, spec, type PlaceValueArithmeticGeneratorConfig} from './spec.ts';
import {grade1AdditionPairs, grade1SubtractionPairs} from './pair-domain.ts';
import {exactPrimaryWidths, matchesMultipleOf10Presence, primaryWidthRows} from './width-domain.ts';

const bounds = [5, 10, 20, 100, 120, 1000] as const;
const floors = [-1, 5, 10, 20, 100, 120] as const;
const cases = [
    {operation: 'addition', regrouping: false, zeroResult: false},
    {operation: 'addition', regrouping: true, zeroResult: false},
    {operation: 'subtraction', regrouping: false, zeroResult: false},
    {operation: 'subtraction', regrouping: true, zeroResult: false},
    {operation: 'subtraction', regrouping: false, zeroResult: true}
] as const;
const contexts = cases.flatMap(example => bounds.flatMap((upper, index) => [false, true].map(coefficientZero =>
    ({...example, upper, maximumAbove: floors[index]!, coefficientZero}))));
const bothTen = (a: number, b: number) => a % 10 === 0 && b % 10 === 0;
const widthOf = (a: number, b: number) => `${String(Math.max(a, b)).length}${String(Math.min(a, b)).length}`;
const hasZero = (a: number, b: number, answer: number) => [a, b, answer].some(value =>
    Math.floor(value / 100) === 0 || Math.floor(value % 100 / 10) === 0 || value % 10 === 0);

describe('both-primary-operand multiples of ten', () => {
    it.each([[10, 20, true], [34, 20, false], [10, 3, false], [11, 2, false], [100, 10, true], [10, 10, true]] as const)(
        'classifies %i and %i independently of answer or visible blank position', (a, b, expected) => {
            expect(matchesMultipleOf10Presence(a, b, true)).toBe(expected);
            expect(matchesMultipleOf10Presence(a, b, false)).toBe(!expected);
            expect(matchesMultipleOf10Presence(a, b)).toBe(true);
        });
    it.each(contexts)('$operation/regroup=$regrouping/zero=$zeroResult/U$upper/coefficient=$coefficientZero partitions native support and mass', context => {
        const maximum = Math.min(999, context.upper), expected = new Map<number, number>();
        // Independent native proposal: no production classifier creates the oracle.
        for (let a = context.operation === 'addition' || context.zeroResult ? 1 : 2;
            a <= (context.operation === 'addition' ? maximum - 1 : maximum); a++) {
            const last = context.zeroResult ? a : context.operation === 'addition' ? maximum - a : a - 1;
            for (let b = context.zeroResult ? a : 1; b <= last; b++) {
                const answer = context.operation === 'addition' ? a + b : a - b;
                if ((context.operation === 'addition' ? answer : a) <= context.maximumAbove
                    || hasZero(a, b, answer) !== context.coefficientZero) continue;
                if (context.operation === 'addition') {
                    if ((a % 10 + b % 10 >= 10) !== context.regrouping) continue;
                } else if (!context.zeroResult) {
                    const borrow = a % 10 < b % 10;
                    if (borrow !== context.regrouping
                        || Math.floor(a % 100 / 10) - Number(borrow) < Math.floor(b % 100 / 10)
                        || Math.floor(a / 100) < Math.floor(b / 100)) continue;
                }
                expected.set(a * 1000 + b, context.zeroResult ? maximum : (maximum - 1) * last);
            }
        }
        const originalCount = expected.size;
        let visited = 0, defects = 0;
        const domain = {...context, minimum: 1, maximum};
        for (const width of exactPrimaryWidths) for (const presence of [false, true]) {
            const rows = primaryWidthRows({...domain, multipleOf10Presence: presence}, width);
            let previous = 0;
            for (const row of rows) {
                if (row.first <= previous) defects++;
                previous = row.first;
                for (const [index, b] of row.seconds.entries()) {
                    const key = row.first * 1000 + b, denominator = expected.get(key);
                    if (!denominator || bothTen(row.first, b) !== presence || widthOf(row.first, b) !== width
                        || index > 0 && b <= row.seconds[index - 1]!
                        || Math.abs(row.weight / row.seconds.length * denominator - 1) > 1e-12) defects++;
                    expected.delete(key);
                    visited++;
                }
            }
        }
        expect({defects, missing: expected.size, visited}).toEqual({defects: 0, missing: 0, visited: originalCount});
    });

    it('retains 34+20 in the native legacy arm while correcting its semantic label', () => {
        const config: PlaceValueArithmeticGeneratorConfig = {operation: Area.Addition, requireRegrouping: false,
            requireSingleDigitSmallest: false, requireTwoDigitLargest: true, requireMultipleOf10: true,
            requireZero: false, range: {min: 0, max: 100}, largestOperandProfile: '22', coefficientPresence: true};
        const old = grade1AdditionPairs('two-digit-multiple-of-ten', 1, 100, false).filter(([a, b]) => a + b > 20);
        const index = old.findIndex(([a, b]) => a === 34 && b === 20);
        const spy = vi.spyOn(rng, 'random');
        try {
            spy.mockReturnValueOnce((index + .5) / old.length);
            expect(new PlaceValueArithmeticGenerator().generate(config)!.data).toMatchObject({num1: 34, num2: 20, answer: 54});
            const absent = old.filter(([a, b]) => !bothTen(a, b));
            spy.mockReturnValueOnce((absent.findIndex(([a, b]) => a === 34 && b === 20) + .5) / absent.length);
            expect(new PlaceValueArithmeticGenerator().generate({...config, multipleOf10Presence: false})!.data)
                .toMatchObject({num1: 34, num2: 20, answer: 54});
            for (let seed = 0; seed < 32; seed++) {
                rng.setSeed(seed);
                const data = new PlaceValueArithmeticGenerator().generate({...config, multipleOf10Presence: true})!.data;
                expect(bothTen(data.num1, data.num2)).toBe(true);
            }
        } finally {spy.mockRestore();}
    });
    it('keeps a determined hidden operand in the producer-level semantic contract', () => {
        const {config, resolvedLabels} = extractConfig(PlaceValueArithmeticGeneratorSchema, [Area.Addition,
            Scope.MultiplesOf10, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller20]);
        const data = new PlaceValueArithmeticGenerator().generate(config)!.data;
        expect([data.num1, data.num2, data.answer]).toEqual([10, 10, 20]);
        expect(data.answer - data.num1).toBe(10);
        expect(resolvedLabels).toContain(Scope.MultiplesOf10);
        expect(config.multipleOf10Presence).toBe(true);
    });
    it('rejects a malformed semantic profile before consuming entropy', () => {
        const {config} = extractConfig(PlaceValueArithmeticGeneratorSchema, [Area.Addition, Scope.NumbersSmaller20]);
        rng.setSeed(19);
        expect(() => new PlaceValueArithmeticGenerator().generate({...config, multipleOf10Presence: 'yes'} as never)).toThrow(/multiple-of-ten presence/);
        expect(rng.getRandomState()).toBe(19);
    });
    it('keeps every old whole-tens equality and positive pair in the true arm', () => {
        for (const zero of [false, true]) for (const [a, b] of grade1SubtractionPairs(1, 100, zero)) {
            expect(matchesMultipleOf10Presence(a, b, true)).toBe(true);
        }
    });
});

const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
    schema: PlaceValueArithmeticGeneratorSchema, spec};
const consumer = {viewId: 'neutral', generalLabels: [], schema: {}, spec: {viewId: 'neutral', generalLabels: []}};
describe('semantic selection remains separate from original domains', () => {
    it.each([
        [Area.Addition, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Area.Addition], [Area.Subtraction], [Area.SubtractionPlaceValuePartitioning]
    ].map(labels => ({labels})))('direct resolution produces truthful full mathematics for $labels', ({labels}) => {
        const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [...labels, Scope.NumbersSmaller100])!;
        expect(stub).not.toBeNull();
        expect(stub.labels.includes(Scope.MultiplesOf10)).toBe(bothTen(stub.data.num1, stub.data.num2));
        expect(stub.labels).toContain(stub.data.operation === 'addition' ? Area.AdditionPlaceValuePartitioning : Area.SubtractionPlaceValuePartitioning);
        expect(stub.labels).toContain(stub.data.operation === 'addition' ? Area.Addition : Area.Subtraction);
    });
    it('retains both truthful general branches while explicit Mul10 conditions the original request', () => {
        const labels = [Area.Addition, Scope.TwoDigitSmallestOperand, Scope.NumbersSmaller100];
        const broad = planModelCompatibility({id: 'broad', labels}, model, consumer);
        expect(broad.supported).toBe(true);
        if (!broad.supported) throw new Error(broad.reason);
        const enumeration = enumerateDependencyAuditSelections(broad.plan);
        expect(enumeration.status).toBe('complete');
        const choices = new Set(enumeration.selections.map(selection => selection.labels.includes(Scope.MultiplesOf10)));
        expect(choices).toEqual(new Set([false, true]));
        const explicit = planModelCompatibility({id: 'explicit', labels: [...labels, Scope.MultiplesOf10]}, model, consumer);
        expect(explicit.supported).toBe(false); // no original TwoDigitLargest conjunction: the old unsupported Add domain stays unsupported
    });
});

const legacyContexts = (['two-digit-single-digit', 'two-digit-multiple-of-ten', 'multiples-of-ten'] as const)
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

describe('semantic conditioning retains the ordered legacy proposal', () => {
    it('covers all fourteen original native contexts', () => expect(legacyContexts).toHaveLength(14));
    it.each(legacyContexts)('$profile/regroup=$regrouping/zero=$zero/U$upper retains every conditional ticket and one draw', context => {
        const config: PlaceValueArithmeticGeneratorConfig = {
            operation: context.profile === 'multiples-of-ten' ? Area.Subtraction : Area.Addition,
            requireRegrouping: context.regrouping, requireZero: context.zero,
            requireSingleDigitSmallest: context.profile === 'two-digit-single-digit',
            requireTwoDigitLargest: context.profile !== 'multiples-of-ten',
            requireMultipleOf10: context.profile !== 'two-digit-single-digit',
            coefficientPresence: context.profile === 'multiples-of-ten' ? context.zero : true,
            range: {min: 0, max: context.upper}, largestOperandProfile: context.profile === 'two-digit-single-digit' ? '21' : '22'
        };
        for (const presence of [false, true]) {
            const admitted = context.pairs.filter(([a, b]) => bothTen(a, b) === presence);
            if (!admitted.length) {
                rng.setSeed(17);
                expect(new PlaceValueArithmeticGenerator().generate({...config, multipleOf10Presence: presence})).toBeNull();
                expect(rng.getRandomState()).toBe(17);
                continue;
            }
            const spy = vi.spyOn(rng, 'random');
            try {
                for (const [index, pair] of admitted.entries()) {
                    spy.mockReturnValueOnce((index + .5) / admitted.length);
                    const data = new PlaceValueArithmeticGenerator().generate({...config, multipleOf10Presence: presence})!.data;
                    expect([data.num1, data.num2]).toEqual(pair);
                }
                expect(spy).toHaveBeenCalledTimes(admitted.length);
            } finally {spy.mockRestore();}
            for (const seed of [0, 17, 42]) {
                rng.setSeed(seed);
                const expected = admitted[Math.floor(rng.random() * admitted.length)]!, state = rng.getRandomState();
                rng.setSeed(seed);
                const data = new PlaceValueArithmeticGenerator().generate({...config, multipleOf10Presence: presence})!.data;
                expect([data.num1, data.num2]).toEqual(expected);
                expect(rng.getRandomState()).toBe(state);
            }
        }
    });
});

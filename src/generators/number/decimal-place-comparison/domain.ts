import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

type DigitPair = readonly [number, number, number]; // lower digit, higher digit, source probability
type State = Readonly<{position: number; upper: number; previous: number; zero: boolean; small: boolean; large: boolean; whole: boolean}>;
export type DecimalComparisonRangeCase = Readonly<{
    decidingIndex: number;
    shorter: boolean;
    weight: number;
    sample: (draw: () => number) => readonly [readonly number[], readonly number[]];
}>;
export type DecimalEqualityRangeBlock = Readonly<{
    wholes: readonly number[];
    tenths: readonly number[];
    hundredths: readonly number[];
    weight: number;
}>;
const digits = Array.from({length: 10}, (_, value) => value);
const positive = digits.slice(1);
const small = positive.slice(0, 5), large = positive.slice(5);
const comparisonCache = new Map<string, readonly DecimalComparisonRangeCase[]>();
const equalityCache = new Map<string, readonly DecimalEqualityRangeBlock[]>();
const transitionCache = new Map<string, readonly DigitPair[]>();
const numberDigits = (value: number) => String(value * 1000).padStart(6, '0').split('').map(Number);

function validateRange(range: CanonicalNumericRange): void {
    if (!range || ![5, 10, 20, 100, 120, 1000].includes(range.max) || ![0, 5].includes(range.min)
        || range.min === 5 && range.max !== 1000) throw new Error('Unsupported decimal comparison range.');
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid decimal comparison range witnesses.');
}

/** Marginalize discarded source draws, retaining the triangular unequal digits,
 * shorter-numeral override, and redistribution of the rejected (0,0) final pair. */
function transitions(deciding: number, shorter: boolean, position: number, whole: boolean): readonly DigitPair[] {
    const key = `${deciding}:${shorter}:${position}:${whole}`;
    const existing = transitionCache.get(key);
    if (existing) return existing;
    const result: DigitPair[] = [];
    if (position < deciding) for (const digit of digits) {
        const remaining = 10 ** (2 - position);
        const weight = position >= 3 ? 0.1 : (whole ? remaining : remaining - Number(digit === 0))
            / (whole ? remaining * 10 : remaining * 10 - 1);
        if (weight) result.push([digit, digit, weight]);
    } else if (position === deciding) {
        const minimum = deciding < 3 && !whole ? 1 : 0;
        for (let low = minimum; low < 9; low++) for (let high = low + 1; high < 10; high++)
            result.push([low, high, 1 / (9 - minimum) / (9 - low)]);
    } else if (shorter && position === 5) for (const high of positive) result.push([0, high, 1 / 9]);
    else if (shorter && position === 4 && deciding < 4) for (const high of digits) result.push([0, high, 0.1]);
    else for (const low of digits) for (const high of digits) {
        if (position === 5 && low === 0 && high === 0) continue;
        result.push([low, high, position === 5 && low === 0 ? 1 / 90 : 1 / 100]);
    }
    transitionCache.set(key, result);
    return result;
}

/** A six-position weighted digit automaton conditions the original source law.
 * Its state records only bound comparisons and required coefficient witnesses;
 * no payloads, labels, generated images or random draws are inspected. */
export function decimalComparisonRangeCases(requireZero: boolean, range: CanonicalNumericRange): readonly DecimalComparisonRangeCase[] {
    validateRange(range);
    if (typeof requireZero !== 'boolean') throw new Error('The decimal comparison zero profile must be Boolean.');
    const key = `${requireZero}:${range.min}:${range.max}`;
    const existing = comparisonCache.get(key);
    if (existing) return existing;
    const cases: DecimalComparisonRangeCase[] = [];
    const upperDigits = numberDigits(range.max), previousDigits = numberDigits(Math.max(0, range.maximumAbove));
    const compare = (prior: number, digit: number, boundary: number) => prior || Math.sign(digit - boundary);
    for (let decidingIndex = 0; decidingIndex < 6; decidingIndex++) for (const shorter of decidingIndex < 5 ? [true, false] : [false]) {
        const memo = new Map<string, number>();
        const initial: State = {position: 0, upper: range.max === 1000 ? -1 : 0, previous: range.maximumAbove < 0 ? 1 : 0,
            zero: false, small: false, large: false, whole: false};
        const advance = (state: State, pair: DigitPair): State | null => {
            const [low, high] = pair;
            if ((!requireZero && (low === 0 || high === 0)) || range.min === 5 && (low < 5 || high < 5)
                || low > range.max || high > range.max) return null;
            const upper = compare(state.upper, high, upperDigits[state.position]!);
            if (upper > 0) return null;
            return {position: state.position + 1, upper, previous: compare(state.previous, high, previousDigits[state.position]!),
                zero: state.zero || low === 0 || high === 0, small: state.small || low < 5 || high < 5,
                large: state.large || low > range.maximumAbove || high > range.maximumAbove,
                whole: state.whole || state.position < 3 && low !== 0};
        };
        const mass = (state: State): number => {
            if (state.position === 6) return Number(state.zero === requireZero && (range.min === 5 || state.small)
                && (state.previous > 0 || state.large));
            const stateKey = `${state.position}:${state.upper}:${state.previous}:${+state.zero}:${+state.small}:${+state.large}:${+state.whole}`;
            const cached = memo.get(stateKey);
            if (cached !== undefined) return cached;
            let total = 0;
            for (const pair of transitions(decidingIndex, shorter, state.position, state.whole)) {
                const next = advance(state, pair);
                if (next) total += pair[2] * mass(next);
            }
            memo.set(stateKey, total);
            return total;
        };
        const accepted = mass(initial);
        if (!accepted) continue;
        cases.push({decidingIndex, shorter, weight: accepted * (decidingIndex === 5 ? 0.5 : 0.1) * (decidingIndex < 5 ? 0.5 : 1),
            sample: draw => {
                const low: number[] = [], high: number[] = [];
                let state = initial;
                for (let position = 0; position < 6; position++) {
                    const choices = transitions(decidingIndex, shorter, position, state.whole).flatMap(pair => {
                        const next = advance(state, pair);
                        return next ? [{pair, next, weight: pair[2] * mass(next)}].filter(choice => choice.weight > 0) : [];
                    });
                    let remaining = draw() * choices.reduce((sum, choice) => sum + choice.weight, 0);
                    const choice = choices.find(choice => (remaining -= choice.weight) < 0) ?? choices[choices.length - 1]!;
                    low.push(choice.pair[0]); high.push(choice.pair[1]); state = choice.next;
                }
                return [low, high];
            }});
    }
    comparisonCache.set(key, cases);
    return cases;
}

export function decimalEqualityRangeBlocks(range: CanonicalNumericRange): readonly DecimalEqualityRangeBlock[] {
    validateRange(range);
    const key = `${range.min}:${range.max}`;
    const existing = equalityCache.get(key);
    if (existing) return existing;
    if (range.min > 0) return [];
    const result: DecimalEqualityRangeBlock[] = [];
    for (const pattern of [0, 1]) {
        const append = (first: number, last: number, tenths: readonly number[], hundredths: readonly number[]) => {
            const wholes = Array.from({length: 999}, (_, index) => index + 1).filter(whole => whole >= first && whole <= last);
            if (!wholes.length) return;
            const sourceFractionCount = pattern ? 90 : 9;
            result.push({wholes, tenths, hundredths, weight: (pattern ? 0.4 : 0.6) * wholes.length / 999
                * tenths.length * hundredths.length / sourceFractionCount});
        };
        if (range.max === 5) append(1, 4, pattern ? [0, ...small] : small, pattern ? small : [0]);
        else if (range.max === 10) {
            append(5, 9, pattern ? digits : positive, pattern ? positive : [0]);
            if (!pattern) append(1, 4, large, [0]);
            else {
                append(1, 4, large, positive);
                append(1, 4, [0, ...small], large);
            }
        } else append(range.maximumAbove, range.max - 1, pattern ? digits : positive, pattern ? positive : [0]);
    }
    equalityCache.set(key, result);
    return result;
}

import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

type DigitPair = readonly [number, number, number]; // lower digit, higher digit, source probability
type State = Readonly<{position: number; minimum: number; below: number; maximum: number; above: number; whole: boolean}>;
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
const comparisonCache = new Map<string, readonly DecimalComparisonRangeCase[]>();
const equalityCache = new Map<string, readonly DecimalEqualityRangeBlock[]>();
const transitionCache = new Map<string, readonly DigitPair[]>();
const numberDigits = (value: number) => String(value * 1000).padStart(6, '0').split('').map(Number);

function validateRange(range: CanonicalNumericRange): void {
    if (!range || ![5, 10, 20, 100, 120, 1000].includes(range.max)
        || ![0, 5, 10, 20, 100, 120].includes(range.min) || range.min >= range.max)
        throw new Error('Unsupported decimal comparison range.');
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
 * Its state compares the complete lower/higher represented values with the four
 * canonical bounds. Digit glyphs, including zero padding, are not quantities;
 * no payloads, labels, generated images or random draws are inspected. */
export function decimalComparisonRangeCases(range: CanonicalNumericRange): readonly DecimalComparisonRangeCase[] {
    validateRange(range);
    const key = `${range.min}:${range.max}`;
    const existing = comparisonCache.get(key);
    if (existing) return existing;
    const cases: DecimalComparisonRangeCase[] = [];
    const minimumDigits = numberDigits(range.min), belowDigits = numberDigits(range.minimumBelow);
    const maximumDigits = numberDigits(range.max), aboveDigits = numberDigits(Math.max(0, range.maximumAbove));
    const compare = (prior: number, digit: number, boundary: number) => prior || Math.sign(digit - boundary);
    for (let decidingIndex = 0; decidingIndex < 6; decidingIndex++) for (const shorter of decidingIndex < 5 ? [true, false] : [false]) {
        const memo = new Map<string, number>();
        const initial: State = {position: 0, minimum: 0, below: range.minimumBelow === 1000 ? -1 : 0,
            maximum: range.max === 1000 ? -1 : 0, above: range.maximumAbove < 0 ? 1 : 0, whole: false};
        const advance = (state: State, pair: DigitPair): State | null => {
            const [low, high] = pair;
            const minimum = compare(state.minimum, low, minimumDigits[state.position]!);
            const below = compare(state.below, low, belowDigits[state.position]!);
            const maximum = compare(state.maximum, high, maximumDigits[state.position]!);
            const above = compare(state.above, high, aboveDigits[state.position]!);
            if (minimum < 0 || below > 0 || maximum > 0 || above < 0) return null;
            return {position: state.position + 1, minimum, below, maximum, above,
                whole: state.whole || state.position < 3 && low !== 0};
        };
        const mass = (state: State): number => {
            if (state.position === 6) return Number(state.below < 0 && state.above > 0);
            const stateKey = `${state.position}:${state.minimum}:${state.below}:${state.maximum}:${state.above}:${+state.whole}`;
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
    // Equal positive nonintegral values occupy only adjacent scalar bands.
    if (range.min !== Math.max(0, range.maximumAbove)) return [];
    const result: DecimalEqualityRangeBlock[] = [];
    for (const pattern of [0, 1]) {
        const wholes = Array.from({length: range.max - Math.max(1, range.min)}, (_, index) => Math.max(1, range.min) + index);
        result.push({wholes, tenths: pattern ? digits : positive, hundredths: pattern ? positive : [0],
            weight: (pattern ? 0.4 : 0.6) * wholes.length / 999});
    }
    equalityCache.set(key, result);
    return result;
}

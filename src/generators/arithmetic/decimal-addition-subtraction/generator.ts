import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    DecimalAddSubtractColumnStep,
    DecimalAddSubtractModelStep,
    DecimalAddSubtractNumber,
    DecimalAddSubtractPlace,
    DecimalAddSubtractProblem,
    DecimalAddSubtractUnitCounts
} from '../../../types/problems.ts';
import {
    DecimalAdditionSubtractionGeneratorSchema,
    type DecimalAdditionSubtractionGeneratorConfig
} from './spec.ts';
import {hasDecimalUnitZero} from './zero-profile.ts';

type Operation = DecimalAddSubtractProblem['operation'];
type Pair = readonly [number, number];
type AdditionProfile = 'hundredths-carry' | 'tenths-carry' | 'double-carry' | 'zero-placeholder';
type SubtractionProfile = 'hundredths-borrow' | 'tenths-borrow' | 'double-borrow'
    | 'zero-cascade' | 'zero-placeholder';

const MAX_OPERAND = 249;
const ADDITION_PROFILES: readonly AdditionProfile[] = [
    'hundredths-carry', 'tenths-carry', 'double-carry', 'zero-placeholder'
];
const SUBTRACTION_PROFILES: readonly SubtractionProfile[] = [
    'hundredths-borrow', 'tenths-borrow', 'double-borrow', 'zero-cascade', 'zero-placeholder'
];
const PLACES: readonly [DecimalAddSubtractPlace, DecimalAddSubtractPlace,
    DecimalAddSubtractPlace] = ['hundredths', 'tenths', 'ones'];

const randomItem = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
const digitAt = (value: number, placeValue: 1 | 10 | 100): number =>
    Math.floor(value / placeValue) % 10;
const countsOf = (value: number): DecimalAddSubtractUnitCounts => ({
    ones: digitAt(value, 100),
    tenths: digitAt(value, 10),
    hundredths: digitAt(value, 1)
});
const sameCounts = (left: DecimalAddSubtractUnitCounts,
    right: DecimalAddSubtractUnitCounts): boolean =>
    left.ones === right.ones && left.tenths === right.tenths
    && left.hundredths === right.hundredths;

const makeNumber = (valueInHundredths: number): DecimalAddSubtractNumber => {
    const whole = Math.floor(valueInHundredths / 100);
    const fraction = String(valueInHundredths % 100).padStart(2, '0')
        .replace(/0+$/, '');
    return {
        valueInHundredths,
        canonicalNumeral: fraction === '' ? String(whole) : `${whole}.${fraction}`,
        alignedDigits: [whole, digitAt(valueInHundredths, 10), digitAt(valueInHundredths, 1)]
    };
};

const makeAdditionColumn = (
    place: DecimalAddSubtractPlace,
    firstDigit: number,
    secondDigit: number,
    regroupIn: 0 | 1
): DecimalAddSubtractColumnStep => {
    const workingUnits = firstDigit + secondDigit + regroupIn;
    const regroupOut = (workingUnits >= 10 ? 1 : 0) as 0 | 1;
    return {
        place, firstDigit, secondDigit, regroupIn, regroupOut,
        workingUnits, resultDigit: workingUnits - regroupOut * 10
    };
};

const makeSubtractionColumn = (
    place: DecimalAddSubtractPlace,
    firstDigit: number,
    secondDigit: number,
    regroupIn: 0 | 1
): DecimalAddSubtractColumnStep => {
    const available = firstDigit - regroupIn;
    const regroupOut = (available < secondDigit ? 1 : 0) as 0 | 1;
    const workingUnits = available + regroupOut * 10;
    return {
        place, firstDigit, secondDigit, regroupIn, regroupOut,
        workingUnits, resultDigit: workingUnits - secondDigit
    };
};

const makeColumns = (
    operation: Operation,
    first: DecimalAddSubtractNumber,
    second: DecimalAddSubtractNumber
): DecimalAddSubtractProblem['columns'] => {
    const column = operation === 'addition' ? makeAdditionColumn : makeSubtractionColumn;
    const hundredths = column(PLACES[0], first.alignedDigits[2],
        second.alignedDigits[2], 0);
    const tenths = column(PLACES[1], first.alignedDigits[1],
        second.alignedDigits[1], hundredths.regroupOut);
    const ones = column(PLACES[2], first.alignedDigits[0],
        second.alignedDigits[0], tenths.regroupOut);
    return [hundredths, tenths, ones];
};

const exchange = (
    kind: 'compose-ten' | 'decompose-one',
    lowerPlace: 'hundredths' | 'tenths',
    before: DecimalAddSubtractUnitCounts
): DecimalAddSubtractModelStep => {
    const delta = kind === 'compose-ten' ? 1 : -1;
    const after = lowerPlace === 'hundredths'
        ? {...before, hundredths: before.hundredths - 10 * delta,
            tenths: before.tenths + delta}
        : {...before, tenths: before.tenths - 10 * delta,
            ones: before.ones + delta};
    return {kind, lowerPlace, before, after};
};

const makeModel = (
    operation: Operation,
    first: DecimalAddSubtractNumber,
    second: DecimalAddSubtractNumber,
    columns: DecimalAddSubtractProblem['columns']
): DecimalAddSubtractProblem['model'] => {
    const initial = countsOf(first.valueInHundredths);
    const secondCounts = countsOf(second.valueInHundredths);
    const steps: DecimalAddSubtractModelStep[] = [];
    let current = initial;

    if (operation === 'addition') {
        const after: DecimalAddSubtractUnitCounts = {
            ones: current.ones + secondCounts.ones,
            tenths: current.tenths + secondCounts.tenths,
            hundredths: current.hundredths + secondCounts.hundredths
        };
        steps.push({kind: 'join-second', before: current, after});
        current = after;
        for (const column of columns.slice(0, 2)) {
            if (column.regroupOut === 0) continue;
            const step = exchange('compose-ten', column.place as 'hundredths' | 'tenths', current);
            steps.push(step);
            current = step.after;
        }
    } else {
        // A zero-tenths cascade must first trade one whole for ten tenths,
        // then trade one of those tenths for ten hundredths.
        for (const column of [columns[1], columns[0]]) {
            if (column.regroupOut === 0) continue;
            const step = exchange('decompose-one', column.place as 'hundredths' | 'tenths', current);
            steps.push(step);
            current = step.after;
        }
        const after: DecimalAddSubtractUnitCounts = {
            ones: current.ones - secondCounts.ones,
            tenths: current.tenths - secondCounts.tenths,
            hundredths: current.hundredths - secondCounts.hundredths
        };
        steps.push({kind: 'remove-second', before: current, after});
        current = after;
    }

    return {initial, steps, final: current};
};

/** Construct one exact relation with written columns and equivalent unit trades. */
export function createDecimalAddSubtractProblem(
    operation: Operation,
    firstValueInHundredths: number,
    secondValueInHundredths: number
): DecimalAddSubtractProblem | null {
    if ((operation !== 'addition' && operation !== 'subtraction')
        || !Number.isInteger(firstValueInHundredths)
        || !Number.isInteger(secondValueInHundredths)
        || firstValueInHundredths < 0 || firstValueInHundredths > 999
        || secondValueInHundredths < 0 || secondValueInHundredths > 999) return null;
    const resultValue = operation === 'addition'
        ? firstValueInHundredths + secondValueInHundredths
        : firstValueInHundredths - secondValueInHundredths;
    if (resultValue < 0 || resultValue > 999) return null;

    const first = makeNumber(firstValueInHundredths);
    const second = makeNumber(secondValueInHundredths);
    const result = makeNumber(resultValue);
    const columns = makeColumns(operation, first, second);
    const model = makeModel(operation, first, second, columns);
    if (columns[2].regroupOut !== 0 || !sameCounts(model.final, countsOf(resultValue))) {
        return null;
    }
    return {
        kind: 'decimal-add-subtract', base: 10, scale: 100,
        operation, first, second, result, columns, model
    };
}

const additionPools: Record<AdditionProfile, Pair[]> = {
    'hundredths-carry': [],
    'tenths-carry': [],
    'double-carry': [],
    'zero-placeholder': []
};
const subtractionPools: Record<SubtractionProfile, Pair[]> = {
    'hundredths-borrow': [],
    'tenths-borrow': [],
    'double-borrow': [],
    'zero-cascade': [],
    'zero-placeholder': []
};

// Enumerating a bounded candidate set avoids retry bias and guarantees that
// every sampled problem has meaningful hundredths and at least one exchange.
for (let first = 1; first <= MAX_OPERAND; first++) {
    for (let second = 1; second <= MAX_OPERAND; second++) {
        if (first % 10 === 0 && second % 10 === 0) continue;
        const firstHundredths = digitAt(first, 1);
        const secondHundredths = digitAt(second, 1);
        const firstTenths = digitAt(first, 10);
        const secondTenths = digitAt(second, 10);
        const placeholder = (firstHundredths === 0) !== (secondHundredths === 0);
        const carryHundredths = firstHundredths + secondHundredths >= 10;
        const carryTenths = firstTenths + secondTenths + Number(carryHundredths) >= 10;
        const pair: Pair = [first, second];

        if (carryHundredths && carryTenths) additionPools['double-carry'].push(pair);
        else if (carryHundredths) additionPools['hundredths-carry'].push(pair);
        else if (carryTenths) additionPools['tenths-carry'].push(pair);
        if (placeholder && (carryHundredths || carryTenths)) {
            additionPools['zero-placeholder'].push(pair);
        }

        if (first <= second) continue;
        const borrowHundredths = firstHundredths < secondHundredths;
        const borrowTenths = firstTenths - Number(borrowHundredths) < secondTenths;
        if (borrowHundredths && borrowTenths) subtractionPools['double-borrow'].push(pair);
        else if (borrowHundredths) subtractionPools['hundredths-borrow'].push(pair);
        else if (borrowTenths) subtractionPools['tenths-borrow'].push(pair);
        if (borrowHundredths && borrowTenths && firstTenths === 0) {
            subtractionPools['zero-cascade'].push(pair);
        }
        if (placeholder && (borrowHundredths || borrowTenths)) {
            subtractionPools['zero-placeholder'].push(pair);
        }
    }
}

interface ZeroPool {
    readonly profile: string;
    readonly pairs: readonly Pair[];
    readonly originalCount: number;
    readonly weight: number;
}
const zeroPools = new Map<string, readonly ZeroPool[]>();

/** Condition the original uniform-scenario/uniform-pair law, retaining overlap weights. */
export function decimalZeroPools(operation: Operation, presence: boolean): readonly ZeroPool[] {
    const key = `${operation}:${presence}`;
    const cached = zeroPools.get(key);
    if (cached) return cached;
    const original = operation === 'addition' ? ADDITION_PROFILES.map(profile => ({profile, pairs: additionPools[profile]}))
        : SUBTRACTION_PROFILES.map(profile => ({profile, pairs: subtractionPools[profile]}));
    const pools = original.map(pool => {
        const pairs = pool.pairs.filter(pair => hasDecimalUnitZero(createDecimalAddSubtractProblem(operation, pair[0], pair[1])!) === presence);
        return {profile: pool.profile, pairs, originalCount: pool.pairs.length,
            weight: pairs.length / pool.pairs.length / original.length};
    }).filter(pool => pool.pairs.length > 0);
    zeroPools.set(key, pools);
    return pools;
}

const sampleZeroPair = (operation: Operation, presence: boolean): Pair => {
    const pools = decimalZeroPools(operation, presence);
    let position = random() * pools.reduce((sum, pool) => sum + pool.weight, 0);
    const pool = pools.find(candidate => (position -= candidate.weight) < 0) ?? pools[pools.length - 1]!;
    return randomItem(pool.pairs);
};

export class DecimalAdditionSubtractionGenerator implements ProblemGenerator<
    DecimalAddSubtractProblem,
    DecimalAdditionSubtractionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = DecimalAdditionSubtractionGeneratorSchema;

    generate(
        config: DecimalAdditionSubtractionGeneratorConfig
    ): ProblemStub<DecimalAddSubtractProblem> | null {
        validateConfigFields('decimal-addition-subtraction', config, ['operation', 'zeroPresence']);
        if (Object.keys(config).some(key => key !== 'operation' && key !== 'zeroPresence')) {
            throw new GeneratorValidationError(
                'decimal-addition-subtraction', 'The configuration contains an unexpected field.'
            );
        }
        if (config.operation !== 'addition' && config.operation !== 'subtraction') {
            throw new GeneratorValidationError(
                'decimal-addition-subtraction', 'The operation must be Addition or Subtraction.'
            );
        }
        if (typeof config.zeroPresence !== 'boolean') {
            throw new GeneratorValidationError('decimal-addition-subtraction', 'Zero presence must be a boolean.');
        }
        const pair = sampleZeroPair(config.operation, config.zeroPresence);
        const data = createDecimalAddSubtractProblem(config.operation, pair[0], pair[1]);
        return data === null ? null : {data};
    }
}

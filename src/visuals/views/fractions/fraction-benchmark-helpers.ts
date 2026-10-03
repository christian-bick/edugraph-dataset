import type {
    FractionBenchmarkArithmeticProblem,
    FractionBenchmarkOperand,
    FractionBenchmarkQuarterTick,
    FractionBenchmarkRational
} from '../../../types/problems.ts';

const gcd = (a: number, b: number): number => {
    let left = a;
    let right = b;
    while (right !== 0) [left, right] = [right, left % right];
    return left;
};

const validRational = (value: FractionBenchmarkRational | undefined, positive: boolean): boolean =>
    !!value && Number.isSafeInteger(value.numerator)
    && value.numerator >= (positive ? 1 : 0)
    && Number.isSafeInteger(value.denominator) && value.denominator > 0
    && gcd(value.numerator, value.denominator) === 1;

const compare = (a: FractionBenchmarkRational, b: FractionBenchmarkRational): number => {
    const difference = BigInt(a.numerator) * BigInt(b.denominator)
        - BigInt(b.numerator) * BigInt(a.denominator);
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
};

const tickFraction = (tick: number): FractionBenchmarkRational => ({numerator: tick, denominator: 4});
const validTick = (tick: unknown): tick is FractionBenchmarkQuarterTick =>
    Number.isSafeInteger(tick) && (tick as number) >= 0 && (tick as number) <= 4;

function validOperand(operand: FractionBenchmarkOperand | undefined): boolean {
    if (!operand || !validRational(operand.value, true)
        || compare(operand.value, {numerator: 1, denominator: 1}) >= 0
        || !validTick(operand.lowerTick) || !validTick(operand.upperTick)
        || operand.upperTick < operand.lowerTick || operand.upperTick - operand.lowerTick > 1
        || compare(tickFraction(operand.lowerTick), operand.value) > 0
        || compare(operand.value, tickFraction(operand.upperTick)) > 0) return false;
    const halfRelation = compare(operand.value, {numerator: 1, denominator: 2});
    return operand.relationToHalf === (halfRelation < 0 ? 'less' : halfRelation > 0 ? 'greater' : 'equal');
}

const equalsOperation = (
    result: FractionBenchmarkRational,
    first: FractionBenchmarkRational,
    second: FractionBenchmarkRational,
    operation: 'addition' | 'subtraction'
): boolean => {
    const left = BigInt(first.numerator) * BigInt(second.denominator);
    const right = BigInt(second.numerator) * BigInt(first.denominator);
    const numerator = operation === 'addition' ? left + right : left - right;
    const denominator = BigInt(first.denominator) * BigInt(second.denominator);
    return numerator >= 0n
        && numerator * BigInt(result.denominator) === BigInt(result.numerator) * denominator;
};

const equalsQuarter = (value: FractionBenchmarkRational, numerator: number): boolean =>
    BigInt(value.numerator) * 4n === BigInt(numerator) * BigInt(value.denominator);

const nearestTick = (value: FractionBenchmarkRational): number => {
    const scaled = BigInt(value.numerator) * 4n;
    const denominator = BigInt(value.denominator);
    const lower = scaled / denominator;
    return Number(lower + ((scaled % denominator) * 2n >= denominator ? 1n : 0n));
};

/** Verifies every stored fraction, benchmark relation, bound, and verdict exactly. */
export function isValidFractionBenchmark(data: FractionBenchmarkArithmeticProblem): boolean {
    if (!data || data.kind !== 'fraction-benchmark-arithmetic'
        || (data.operation !== 'addition' && data.operation !== 'subtraction')
        || data.sharedWhole !== 1
        || !validOperand(data.first) || !validOperand(data.second)
        || !validRational(data.exactResult, false)
        || !data.resultBounds
        || !validRational(data.resultBounds.lower, false)
        || !validRational(data.resultBounds.upper, false)
        || !data.candidate || !validRational(data.candidate.value, false)
        || (data.candidate.judgment !== 'reasonable' && data.candidate.judgment !== 'unreasonable')) return false;
    const operation = data.operation;
    if (!equalsOperation(data.exactResult, data.first.value, data.second.value, operation)) return false;
    const lowerTick = operation === 'addition'
        ? data.first.lowerTick + data.second.lowerTick
        : data.first.lowerTick - data.second.upperTick;
    const upperTick = operation === 'addition'
        ? data.first.upperTick + data.second.upperTick
        : data.first.upperTick - data.second.lowerTick;
    if (lowerTick < 0 || upperTick < lowerTick
        || !equalsQuarter(data.resultBounds.lower, lowerTick)
        || !equalsQuarter(data.resultBounds.upper, upperTick)
        || compare(data.resultBounds.lower, data.exactResult) > 0
        || compare(data.exactResult, data.resultBounds.upper) > 0) return false;
    const candidateWithin = compare(data.resultBounds.lower, data.candidate.value) <= 0
        && compare(data.candidate.value, data.resultBounds.upper) <= 0;
    if (data.candidate.judgment === 'reasonable') {
        if (compare(data.candidate.value, data.exactResult) !== 0) return false;
    } else if (candidateWithin) return false;
    if (data.approximation === undefined) return true;
    const approximate = data.approximation;
    if (approximate.kind !== 'nearest-quarter'
        || !validTick(approximate.firstTick) || !validTick(approximate.secondTick)
        || !validRational(approximate.estimatedResult, false)
        || approximate.firstTick !== nearestTick(data.first.value)
        || approximate.secondTick !== nearestTick(data.second.value)
        || (equalsQuarter(data.first.value, approximate.firstTick)
            && equalsQuarter(data.second.value, approximate.secondTick))) return false;
    return equalsQuarter(approximate.estimatedResult,
        operation === 'addition'
            ? approximate.firstTick + approximate.secondTick
            : approximate.firstTick - approximate.secondTick);
}

export const formatBenchmarkFraction = (value: FractionBenchmarkRational): string =>
    value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;

export const formatQuarterTick = (tick: number): string => {
    if (tick === 0) return '0';
    if (tick === 2) return '1/2';
    if (tick === 4) return '1';
    return `${tick}/4`;
};

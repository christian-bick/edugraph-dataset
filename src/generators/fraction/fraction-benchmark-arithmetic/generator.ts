import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    FractionBenchmarkArithmeticProblem,
    FractionBenchmarkOperand,
    FractionBenchmarkQuarterTick,
    FractionBenchmarkRational
} from '../../../types/problems.ts';
import {
    FractionBenchmarkArithmeticGeneratorConfig,
    FractionBenchmarkArithmeticGeneratorSchema
} from './spec.ts';

type Operation = FractionBenchmarkArithmeticProblem['operation'];
type OperandPair = Readonly<{first: FractionBenchmarkOperand; second: FractionBenchmarkOperand}>;

const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12] as const;

const greatestCommonDivisor = (a: number, b: number): number => {
    while (b !== 0) [a, b] = [b, a % b];
    return a;
};

const rational = (numerator: number, denominator: number): FractionBenchmarkRational => {
    const divisor = greatestCommonDivisor(numerator, denominator);
    return {numerator: numerator / divisor, denominator: denominator / divisor};
};

const compare = (a: FractionBenchmarkRational, b: FractionBenchmarkRational): number =>
    Math.sign(a.numerator * b.denominator - b.numerator * a.denominator);

const combine = (a: FractionBenchmarkRational, b: FractionBenchmarkRational,
    operation: Operation): FractionBenchmarkRational => rational(
    a.numerator * b.denominator + (operation === 'addition' ? 1 : -1) * b.numerator * a.denominator,
    a.denominator * b.denominator
);

const fromQuarterTick = (tick: number): FractionBenchmarkRational => rational(tick, 4);

const operand = (numerator: number, denominator: number): FractionBenchmarkOperand => {
    const scaled = 4 * numerator;
    const lowerTick = Math.floor(scaled / denominator) as FractionBenchmarkQuarterTick;
    const upperTick = Math.ceil(scaled / denominator) as FractionBenchmarkQuarterTick;
    const halfDifference = 2 * numerator - denominator;
    return {
        value: {numerator, denominator},
        lowerTick,
        upperTick,
        relationToHalf: halfDifference < 0 ? 'less' : halfDifference > 0 ? 'greater' : 'equal'
    };
};

const OPERANDS: readonly FractionBenchmarkOperand[] = DENOMINATORS.flatMap(denominator =>
    Array.from({length: denominator - 1}, (_, index) => index + 1)
        .filter(numerator => greatestCommonDivisor(numerator, denominator) === 1)
        .map(numerator => operand(numerator, denominator))
);

const hasQuarterGap = ({first, second}: OperandPair): boolean =>
    first.lowerTick !== first.upperTick || second.lowerTick !== second.upperTick;

const PAIRS: Readonly<Record<Operation, readonly OperandPair[]>> = {
    addition: OPERANDS.flatMap(first => OPERANDS.map(second => ({first, second})))
        .filter(hasQuarterGap),
    subtraction: OPERANDS.flatMap(first => OPERANDS
        .filter(second => compare(first.value, second.value) >= 0
            && first.lowerTick >= second.upperTick)
        .map(second => ({first, second})))
        .filter(hasQuarterGap)
};

/** Compare integer distances to adjacent quarters; a midpoint selects the upper tick. */
const nearestQuarterTick = (item: FractionBenchmarkOperand): FractionBenchmarkQuarterTick => {
    if (item.lowerTick === item.upperTick) return item.lowerTick;
    const {numerator, denominator} = item.value;
    const distanceToLower = 4 * numerator - item.lowerTick * denominator;
    const distanceToUpper = item.upperTick * denominator - 4 * numerator;
    return distanceToUpper <= distanceToLower ? item.upperTick : item.lowerTick;
};

function candidate(
    exactResult: FractionBenchmarkRational,
    lower: FractionBenchmarkRational,
    upper: FractionBenchmarkRational
): FractionBenchmarkArithmeticProblem['candidate'] {
    if (random() < 0.5) return {value: exactResult, judgment: 'reasonable'};
    const below = lower.numerator > 0;
    const above = compare(upper, rational(2, 1)) < 0;
    const useBelow = below && (!above || random() < 0.5);
    const quarter = rational(1, 4);
    return {
        value: combine(useBelow ? lower : upper, quarter, useBelow ? 'subtraction' : 'addition'),
        judgment: 'unreasonable'
    };
}

function benchmarkArithmetic(
    operation: Operation,
    requiresApproximation: boolean
): FractionBenchmarkArithmeticProblem {
    const pairs = PAIRS[operation];
    const {first, second} = pairs[Math.floor(random() * pairs.length)]!;
    const exactResult = combine(first.value, second.value, operation);
    const lowerTick = operation === 'addition'
        ? first.lowerTick + second.lowerTick
        : first.lowerTick - second.upperTick;
    const upperTick = operation === 'addition'
        ? first.upperTick + second.upperTick
        : first.upperTick - second.lowerTick;
    const lower = fromQuarterTick(lowerTick);
    const upper = fromQuarterTick(upperTick);
    const approximation = requiresApproximation
        ? (() => {
            const firstTick = nearestQuarterTick(first);
            const secondTick = nearestQuarterTick(second);
            return {
                kind: 'nearest-quarter' as const,
                firstTick,
                secondTick,
                estimatedResult: fromQuarterTick(operation === 'addition'
                    ? firstTick + secondTick
                    : firstTick - secondTick)
            };
        })()
        : undefined;

    return {
        kind: 'fraction-benchmark-arithmetic',
        operation,
        sharedWhole: 1,
        first,
        second,
        exactResult,
        resultBounds: {lower, upper},
        candidate: candidate(exactResult, lower, upper),
        ...(approximation ? {approximation} : {})
    };
}

export class FractionBenchmarkArithmeticGenerator implements ProblemGenerator<
    FractionBenchmarkArithmeticProblem,
    FractionBenchmarkArithmeticGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionBenchmarkArithmeticGeneratorSchema;

    generate(config: FractionBenchmarkArithmeticGeneratorConfig): ProblemStub<FractionBenchmarkArithmeticProblem> {
        validateConfigFields('fraction-benchmark-arithmetic', config, ['operation', 'approximationModel']);
        if (config.operation !== 'addition' && config.operation !== 'subtraction') {
            throw new GeneratorValidationError('fraction-benchmark-arithmetic',
                `Unsupported operation "${config.operation}".`);
        }
        if (config.approximationModel !== 'bounds-only' && config.approximationModel !== 'nearest-quarter') {
            throw new GeneratorValidationError('fraction-benchmark-arithmetic',
                `Unsupported approximation model "${config.approximationModel}".`);
        }
        return {data: benchmarkArithmetic(config.operation,
            config.approximationModel === 'nearest-quarter')};
    }
}

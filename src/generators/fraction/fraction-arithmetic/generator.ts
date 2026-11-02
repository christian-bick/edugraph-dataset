import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionArithmeticOperation,
    FractionArithmeticProblem,
    FractionBinaryOperationProblem,
    FractionDecompositionProblem,
    FractionParts,
    LikeDenominatorFractionValue,
    MixedFractionOperationProblem,
    MixedFractionValue,
    TenthsHundredthsAdditionProblem,
    UnlikeFractionOperand,
    UnlikeFractionOperationProblem,
    UnlikeMixedOperationProblem,
    UnitFractionMultipleProblem,
    WholeNumberFractionProductProblem
} from '../../../types/problems.ts';
import {
    FractionArithmeticGeneratorConfig,
    FractionArithmeticGeneratorSchema
} from './spec.ts';
import {binaryFractionCases, fractionDecompositionCases, mixedFractionCases, unlikeArithmeticMaximum, validateFractionArithmeticRange, wholeFractionProductCases} from './numeric-domain.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

const weighted = <T extends {weight: number}>(rows: readonly T[]): T => {
    if (!rows.length) throw new GeneratorValidationError('fraction-arithmetic', 'No source cases support this task and canonical range.');
    let remaining = random() * rows.reduce((sum, row) => sum + row.weight, 0);
    return rows.find(row => (remaining -= row.weight) < 0) ?? rows[rows.length - 1]!;
};

const makeFraction = (
    numerator: number,
    denominator: FractionParts
): LikeDenominatorFractionValue => ({numerator, denominator});

const makeMixed = (
    whole: number,
    numerator: number,
    denominator: FractionParts
): MixedFractionValue => ({whole, numerator, denominator});

const improperNumerator = (value: MixedFractionValue): number =>
    value.whole * value.denominator + value.numerator;

const makeMixedFromImproper = (
    numerator: number,
    denominator: FractionParts
): MixedFractionValue => makeMixed(
    Math.floor(numerator / denominator),
    numerator % denominator,
    denominator
);

const TENTHS_HUNDREDTHS_ADDITION_SAMPLES = Array.from({length: 9}, (_, index) => index + 1)
    .flatMap(tenthsNumerator => {
        const maximumHundredths = 100 - tenthsNumerator * 10;
        return Array.from({length: maximumHundredths}, (_, hundredthsIndex) => ({
            tenthsNumerator,
            hundredthsNumerator: hundredthsIndex + 1
        }));
    });

const generateTenthsHundredthsAddition = (): TenthsHundredthsAdditionProblem => {
    const {tenthsNumerator, hundredthsNumerator} = pick(TENTHS_HUNDREDTHS_ADDITION_SAMPLES);
    const convertedNumerator = tenthsNumerator * 10;
    return {
        task: 'tenths-hundredths-addition',
        operation: 'addition',
        denominator: 100,
        sharedWhole: 1,
        firstTenths: {numerator: tenthsNumerator, denominator: 10},
        secondHundredths: {numerator: hundredthsNumerator, denominator: 100},
        convertedFirst: {numerator: convertedNumerator, denominator: 100},
        result: {numerator: convertedNumerator + hundredthsNumerator, denominator: 100},
        conversionFactor: 10
    };
};

const generateUnitFractionMultiple = (range: CanonicalNumericRange): UnitFractionMultipleProblem => {
    const {denominator, wholeFactor} = weighted(wholeFractionProductCases('unit', range));
    return {
        task: 'unit-fraction-multiple',
        operation: 'multiplication',
        denominator,
        sharedWhole: 1,
        wholeFactor,
        unitFraction: makeFraction(1, denominator),
        product: makeFraction(wholeFactor, denominator)
    };
};

const generateWholeNumberFractionProduct = (
    productKind: 'proper' | 'improper', range: CanonicalNumericRange
): WholeNumberFractionProductProblem => {
    const sample = weighted(wholeFractionProductCases(productKind, range));
    return {
        task: 'whole-number-fraction-product',
        operation: 'multiplication',
        denominator: sample.denominator,
        sharedWhole: 1,
        wholeFactor: sample.wholeFactor,
        fractionFactor: makeFraction(sample.fractionNumerator, sample.denominator),
        product: makeFraction(sample.productNumerator, sample.denominator)
    };
};

const binarySample = (
    operation: FractionArithmeticOperation, range: CanonicalNumericRange
): Pick<FractionBinaryOperationProblem, 'denominator' | 'first' | 'second' | 'result'> => {
    const {denominator, firstNumerator, secondNumerator} = weighted(binaryFractionCases(operation, range));
    return {
        denominator,
        first: makeFraction(firstNumerator, denominator),
        second: makeFraction(secondNumerator, denominator),
        result: makeFraction(operation === 'addition' ? firstNumerator + secondNumerator : firstNumerator - secondNumerator, denominator)
    };
};

const generateBinaryOperation = (
    operation: FractionArithmeticOperation, range: CanonicalNumericRange
): FractionBinaryOperationProblem => ({
    task: 'fraction-operation',
    operation,
    sharedWhole: 1,
    ...binarySample(operation, range)
});

const decompositionTerms = (
    sourceKind: 'proper' | 'mixed',
    totalNumerator: number,
    denominator: FractionParts
): [number[], number[]] => sourceKind === 'proper'
    ? [[1, totalNumerator - 1], [1, 1, totalNumerator - 2]]
    : [[1, totalNumerator - 1], [denominator, denominator, totalNumerator - 2 * denominator]];

const generateDecomposition = (
    sourceKind: 'proper' | 'mixed', range: CanonicalNumericRange
): FractionDecompositionProblem => {
    const {denominator, sourceNumerator} = weighted(fractionDecompositionCases(sourceKind, range));
    const source = sourceKind === 'mixed'
        ? {kind: 'mixed' as const, value: makeMixed(2, sourceNumerator - 2 * denominator, denominator)}
        : {kind: 'proper' as const, value: makeFraction(sourceNumerator, denominator)};
    const totalNumerator = source.kind === 'mixed'
        ? improperNumerator(source.value)
        : source.value.numerator;
    const [firstTerms, secondTerms] = decompositionTerms(
        sourceKind,
        totalNumerator,
        denominator
    );
    const makeTerms = (numerators: number[]) => ({
        terms: numerators.map(numerator => makeFraction(numerator, denominator))
    });
    return {
        task: 'decompose',
        operation: 'addition',
        denominator,
        sharedWhole: 1,
        source,
        decompositions: [makeTerms(firstTerms), makeTerms(secondTerms)]
    };
};

const mixedSample = (
    operation: FractionArithmeticOperation, range: CanonicalNumericRange
): Pick<MixedFractionOperationProblem, 'denominator' | 'first' | 'second' | 'result'> => {
    const {denominator, firstNumerator, secondNumerator} = weighted(mixedFractionCases(operation, range));
    if (operation === 'addition') {
        const first = makeMixed(1, firstNumerator, denominator);
        const second = makeMixed(1, secondNumerator, denominator);
        return {
            denominator,
            first,
            second,
            result: makeMixedFromImproper(
                improperNumerator(first) + improperNumerator(second),
                denominator
            )
        };
    }

    const first = makeMixed(2, firstNumerator, denominator);
    const second = makeMixed(1, secondNumerator, denominator);
    return {
        denominator,
        first,
        second,
        result: makeMixedFromImproper(
            improperNumerator(first) - improperNumerator(second),
            denominator
        )
    };
};

const generateMixedOperation = (
    operation: FractionArithmeticOperation, range: CanonicalNumericRange
): MixedFractionOperationProblem => ({
    task: 'mixed-operation',
    operation,
    sharedWhole: 1,
    ...mixedSample(operation, range)
});

type UnlikeFractionSample = Readonly<{
    first: UnlikeFractionOperand;
    second: UnlikeFractionOperand;
    commonDenominator: number;
}>;
type UnlikeMixedSample = Readonly<{
    first: MixedFractionValue;
    second: MixedFractionValue;
    commonDenominator: number;
}>;
type FractionProfile = 'proper' | 'improper' | 'nonleast';
type MixedProfile = 'straight' | 'regroup' | 'nonleast';

const FRACTION_PROFILES: readonly FractionProfile[] = ['proper', 'improper', 'nonleast'];
const MIXED_PROFILES: readonly MixedProfile[] = ['straight', 'regroup', 'nonleast'];

const gcd = (first: number, second: number): number => {
    let a = first;
    let b = second;
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
};

const commonDenominators = (first: FractionParts, second: FractionParts): number[] => {
    const least = first * second / gcd(first, second);
    return [least, 2 * least].filter(value => value <= 24);
};

const validUnlikeDenominators = (
    first: FractionParts,
    second: FractionParts,
    common: number
): boolean => DENOMINATORS.includes(first)
    && DENOMINATORS.includes(second)
    && first !== second
    && Number.isSafeInteger(common)
    && common >= 2 && common <= 24
    && common % first === 0 && common % second === 0;

const validUnlikeOperation = (operation: string): operation is FractionArithmeticOperation =>
    operation === 'addition' || operation === 'subtraction';

const conversion = (whole: number, numerator: number, denominator: FractionParts,
    commonDenominator: number) => {
    const factor = commonDenominator / denominator;
    return {
        factor,
        fractionalNumeratorAtCommonDenominator: numerator * factor,
        improperNumeratorAtCommonDenominator: (whole * denominator + numerator) * factor
    };
};

/** Retain both original denominators and every exact equivalent-fraction factor. */
export function createUnlikeFractionOperationProblem(
    operation: FractionArithmeticOperation,
    first: UnlikeFractionOperand,
    second: UnlikeFractionOperand,
    commonDenominator: number
): UnlikeFractionOperationProblem | null {
    if (!validUnlikeOperation(operation) || !first || !second
        || !validUnlikeDenominators(first.denominator, second.denominator, commonDenominator)
        || !Number.isSafeInteger(first.numerator) || !Number.isSafeInteger(second.numerator)
        || first.numerator < 1 || second.numerator < 1
        || first.numerator >= 2 * first.denominator
        || second.numerator >= 2 * second.denominator) return null;
    const firstConversion = conversion(0, first.numerator, first.denominator, commonDenominator);
    const secondConversion = conversion(0, second.numerator, second.denominator, commonDenominator);
    const numerator = operation === 'addition'
        ? firstConversion.improperNumeratorAtCommonDenominator
            + secondConversion.improperNumeratorAtCommonDenominator
        : firstConversion.improperNumeratorAtCommonDenominator
            - secondConversion.improperNumeratorAtCommonDenominator;
    if (numerator < 0) return null;
    const reduction = gcd(numerator, commonDenominator);
    return {
        task: 'unlike-fraction-operation', operation, sharedWhole: 1,
        first, second, commonDenominator, firstConversion, secondConversion,
        resultAtCommonDenominator: {numerator, denominator: commonDenominator},
        result: {numerator: numerator / reduction, denominator: commonDenominator / reduction},
        storyContext: 'route-length'
    };
}

/** Convert normalized mixed operands through improper fractions before arithmetic. */
export function createUnlikeMixedOperationProblem(
    operation: FractionArithmeticOperation,
    first: MixedFractionValue,
    second: MixedFractionValue,
    commonDenominator: number
): UnlikeMixedOperationProblem | null {
    if (!validUnlikeOperation(operation) || !first || !second
        || !validUnlikeDenominators(first.denominator, second.denominator, commonDenominator)
        || !Number.isSafeInteger(first.whole) || !Number.isSafeInteger(second.whole)
        || first.whole < 1 || second.whole < 1 || first.whole > 2 || second.whole > 2
        || !Number.isSafeInteger(first.numerator) || !Number.isSafeInteger(second.numerator)
        || first.numerator < 1 || second.numerator < 1
        || first.numerator >= first.denominator || second.numerator >= second.denominator) return null;
    const firstConversion = conversion(
        first.whole, first.numerator, first.denominator, commonDenominator
    );
    const secondConversion = conversion(
        second.whole, second.numerator, second.denominator, commonDenominator
    );
    const numerator = operation === 'addition'
        ? firstConversion.improperNumeratorAtCommonDenominator
            + secondConversion.improperNumeratorAtCommonDenominator
        : firstConversion.improperNumeratorAtCommonDenominator
            - secondConversion.improperNumeratorAtCommonDenominator;
    if (numerator < 0) return null;
    const whole = Math.floor(numerator / commonDenominator);
    const fractionNumerator = numerator % commonDenominator;
    const reduction = gcd(fractionNumerator, commonDenominator);
    return {
        task: 'unlike-mixed-operation', operation, sharedWhole: 1,
        first, second, commonDenominator, firstConversion, secondConversion,
        resultAtCommonDenominator: {numerator, denominator: commonDenominator},
        result: {
            whole,
            numerator: fractionNumerator / reduction,
            denominator: commonDenominator / reduction
        },
        storyContext: 'route-length'
    };
}

const fractionPools: Record<FractionArithmeticOperation, Record<FractionProfile, UnlikeFractionSample[]>> = {
    addition: {proper: [], improper: [], nonleast: []},
    subtraction: {proper: [], improper: [], nonleast: []}
};
const mixedPools: Record<FractionArithmeticOperation, Record<MixedProfile, UnlikeMixedSample[]>> = {
    addition: {straight: [], regroup: [], nonleast: []},
    subtraction: {straight: [], regroup: [], nonleast: []}
};

// Enumerated candidates keep every sample positive and within a few reference
// wholes, while allowing either an LCM or a valid larger common denominator.
for (const firstDenominator of DENOMINATORS) {
    for (const secondDenominator of DENOMINATORS) {
        if (firstDenominator === secondDenominator) continue;
        const least = firstDenominator * secondDenominator
            / gcd(firstDenominator, secondDenominator);
        for (const commonDenominator of commonDenominators(firstDenominator, secondDenominator)) {
            for (let firstNumerator = 1; firstNumerator < 2 * firstDenominator; firstNumerator++) {
                for (let secondNumerator = 1; secondNumerator < 2 * secondDenominator; secondNumerator++) {
                    const first = makeFraction(firstNumerator, firstDenominator);
                    const second = makeFraction(secondNumerator, secondDenominator);
                    const firstAtCommon = firstNumerator * commonDenominator / firstDenominator;
                    const secondAtCommon = secondNumerator * commonDenominator / secondDenominator;
                    for (const operation of ['addition', 'subtraction'] as const) {
                        const total = operation === 'addition'
                            ? firstAtCommon + secondAtCommon : firstAtCommon - secondAtCommon;
                        if (total <= 0 || total > 3 * commonDenominator) continue;
                        const sample = {first, second, commonDenominator};
                        if (firstNumerator < firstDenominator
                            && secondNumerator < secondDenominator) {
                            fractionPools[operation].proper.push(sample);
                        } else {
                            fractionPools[operation].improper.push(sample);
                        }
                        if (commonDenominator > least) {
                            fractionPools[operation].nonleast.push(sample);
                        }
                    }
                }
            }
            for (let firstNumerator = 1; firstNumerator < firstDenominator; firstNumerator++) {
                for (let secondNumerator = 1; secondNumerator < secondDenominator; secondNumerator++) {
                    for (const operation of ['addition', 'subtraction'] as const) {
                        const first = makeMixed(operation === 'addition' ? 1 : 2,
                            firstNumerator, firstDenominator);
                        const second = makeMixed(1, secondNumerator, secondDenominator);
                        const firstPartAtCommon = firstNumerator * commonDenominator / firstDenominator;
                        const secondPartAtCommon = secondNumerator * commonDenominator / secondDenominator;
                        const firstAtCommon = first.whole * commonDenominator + firstPartAtCommon;
                        const secondAtCommon = second.whole * commonDenominator + secondPartAtCommon;
                        const total = operation === 'addition'
                            ? firstAtCommon + secondAtCommon : firstAtCommon - secondAtCommon;
                        if (total <= 0 || total > 4 * commonDenominator) continue;
                        const sample = {first, second, commonDenominator};
                        const regroup = operation === 'addition'
                            ? firstPartAtCommon + secondPartAtCommon >= commonDenominator
                            : firstPartAtCommon < secondPartAtCommon;
                        mixedPools[operation][regroup ? 'regroup' : 'straight'].push(sample);
                        if (commonDenominator > least) mixedPools[operation].nonleast.push(sample);
                    }
                }
            }
        }
    }
}

/** Preserve overlapping original pool paths when conditioning on an evidenced input class. */
export function unlikeFractionMagnitudeRows(operation: FractionArithmeticOperation, magnitude?: 'proper' | 'improper', range?: CanonicalNumericRange) {
    if (range) validateFractionArithmeticRange(range);
    return FRACTION_PROFILES.map(profile => {
            const original = fractionPools[operation][profile];
            const retained = original.filter(candidate => {
                const proper = candidate.first.numerator < candidate.first.denominator
                    || candidate.second.numerator < candidate.second.denominator;
                const maximum = unlikeArithmeticMaximum(operation, candidate.first, candidate.second, candidate.commonDenominator);
                return (!magnitude || proper === (magnitude === 'proper'))
                    && (!range || maximum <= range.max && maximum > range.maximumAbove);
            });
            return {profile, originalCount: original.length, retained, weight: retained.length / original.length};
        }).filter(pool => pool.retained.length > 0);
}

/** Keep the straight/regroup/nonleast overlap with its original pool mass. */
export function unlikeMixedRangeRows(operation: FractionArithmeticOperation, range?: CanonicalNumericRange) {
    if (range) validateFractionArithmeticRange(range);
    return MIXED_PROFILES.map(profile => {
        const original = mixedPools[operation][profile];
        const retained = original.filter(candidate => {
            const maximum = unlikeArithmeticMaximum(operation, candidate.first, candidate.second, candidate.commonDenominator);
            return !range || maximum <= range.max && maximum > range.maximumAbove;
        });
        return {profile, originalCount: original.length, retained, weight: retained.length / original.length};
    }).filter(pool => pool.retained.length > 0);
}

const generateUnlikeFractionOperation = (
    operation: FractionArithmeticOperation,
    magnitude?: 'proper' | 'improper', range?: CanonicalNumericRange
): UnlikeFractionOperationProblem => {
    let sample: UnlikeFractionSample;
    if (magnitude || range) {
        const pools = unlikeFractionMagnitudeRows(operation, magnitude, range);
        if (!pools.length) throw new GeneratorValidationError('fraction-arithmetic', 'No unlike source cases support this canonical range.');
        let position = random() * pools.reduce((sum, pool) => sum + pool.weight, 0);
        const pool = pools.find(candidate => (position -= candidate.weight) < 0) ?? pools[pools.length - 1]!;
        sample = pick(pool.retained);
    } else sample = pick(fractionPools[operation][pick(FRACTION_PROFILES)]);
    return createUnlikeFractionOperationProblem(
        operation, sample.first, sample.second, sample.commonDenominator
    )!;
};

const generateUnlikeMixedOperation = (
    operation: FractionArithmeticOperation, range?: CanonicalNumericRange
): UnlikeMixedOperationProblem => {
    const sample = range ? pick(weighted(unlikeMixedRangeRows(operation, range)).retained)
        : pick(mixedPools[operation][pick(MIXED_PROFILES)]);
    return createUnlikeMixedOperationProblem(
        operation, sample.first, sample.second, sample.commonDenominator
    )!;
};

export class FractionArithmeticGenerator implements ProblemGenerator<
    FractionArithmeticProblem,
    FractionArithmeticGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionArithmeticGeneratorSchema;

    generate(config: FractionArithmeticGeneratorConfig): ProblemStub<FractionArithmeticProblem> {
        validateConfigFields('fraction-arithmetic', config, [
            'task',
            'usesCommonDenominator',
            'operation',
            'range'
        ]);

        const operation = config.operation!;
        if (operation !== 'addition'
            && operation !== 'subtraction'
            && operation !== 'multiplication') {
            throw new GeneratorValidationError(
                'fraction-arithmetic',
                'Operation must be addition, subtraction, or multiplication.'
            );
        }
        if (operation === 'multiplication') {
            if (config.task === 'unit-fraction-multiple') {
                return {data: generateUnitFractionMultiple(config.range!)};
            }
            if (config.task === 'whole-number-fraction-product-proper') {
                return {data: generateWholeNumberFractionProduct('proper', config.range!)};
            }
            if (config.task === 'whole-number-fraction-product-improper') {
                return {data: generateWholeNumberFractionProduct('improper', config.range!)};
            }
            throw new GeneratorValidationError(
                'fraction-arithmetic',
                'Unsupported multiplication task and fraction-result combination.'
            );
        }
        if (config.task === 'unlike-fraction-operation'
            || config.task === 'unlike-fraction-operation-proper'
            || config.task === 'unlike-fraction-operation-improper'
            || config.task === 'unlike-fraction-operation-proper-equivalence'
            || config.task === 'unlike-fraction-operation-improper-equivalence'
            || config.task === 'unlike-mixed-operation'
            || config.task === 'unlike-mixed-operation-equivalence') {
            // Preserve the existing direct-only unconstrained API. Matched
            // source selections always resolve a canonical range capability.
            const range = config.range!.min === 0 && config.range!.max === Number.MAX_SAFE_INTEGER ? undefined : config.range!;
            if (config.usesCommonDenominator) {
                throw new GeneratorValidationError(
                    'fraction-arithmetic',
                    'Unlike original denominators cannot also request CommonDenominator.'
                );
            }
            return {data: config.task.startsWith('unlike-mixed-operation') ? generateUnlikeMixedOperation(operation, range)
                : generateUnlikeFractionOperation(operation, config.task === 'unlike-fraction-operation' ? undefined
                    : config.task.includes('-proper') ? 'proper' : 'improper', range)};
        }
        if (!config.usesCommonDenominator) {
            throw new GeneratorValidationError(
                'fraction-arithmetic',
                'CommonDenominator is required for like-denominator fraction arithmetic.'
            );
        }
        if (config.task === 'tenths-hundredths-addition' && operation === 'addition') {
            validateFractionArithmeticRange(config.range!);
            if (config.range!.max !== 100) throw new GeneratorValidationError('fraction-arithmetic', 'Tenths-to-hundredths scaling requires upper100.');
            return {data: generateTenthsHundredthsAddition()};
        }
        if (config.task === 'fraction-operation') {
            return {data: generateBinaryOperation(operation, config.range!)};
        }
        if (config.task === 'decompose-proper' && operation === 'addition') {
            return {data: generateDecomposition('proper', config.range!)};
        }
        if (config.task === 'decompose-mixed' && operation === 'addition') {
            return {data: generateDecomposition('mixed', config.range!)};
        }
        if (config.task === 'mixed-operation') {
            return {data: generateMixedOperation(operation, config.range!)};
        }
        throw new GeneratorValidationError(
            'fraction-arithmetic',
            'Unsupported fraction form, operation, and task combination.'
        );
    }
}

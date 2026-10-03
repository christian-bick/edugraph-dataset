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

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const NON_BINARY_DENOMINATORS = [3, 4, 6, 8] as const satisfies readonly FractionParts[];
const DECOMPOSITION_DENOMINATORS = [4, 6, 8] as const satisfies readonly FractionParts[];
const PRODUCT_DENOMINATORS = [3, 4, 6, 8] as const satisfies readonly FractionParts[];

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

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

type FractionProductSample = {
    denominator: FractionParts;
    wholeFactor: number;
    fractionNumerator: number;
    productNumerator: number;
};

const productSamples = (productKind: 'proper' | 'improper'): FractionProductSample[] =>
    PRODUCT_DENOMINATORS.flatMap(denominator =>
        Array.from({length: denominator - 2}, (_, index) => index + 2).flatMap(
            fractionNumerator => Array.from({length: 3}, (_, index) => index + 2)
                .map(wholeFactor => ({
                    denominator,
                    wholeFactor,
                    fractionNumerator,
                    productNumerator: wholeFactor * fractionNumerator
                }))
                .filter(sample => sample.productNumerator <= 4 * denominator
                    && sample.productNumerator % denominator !== 0
                    && (productKind === 'proper'
                        ? sample.productNumerator < denominator
                        : sample.productNumerator >= denominator))
        )
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

const generateUnitFractionMultiple = (): UnitFractionMultipleProblem => {
    const denominator = pick(DENOMINATORS);
    const wholeFactor = randomInteger(2, 4);
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
    productKind: 'proper' | 'improper'
): WholeNumberFractionProductProblem => {
    const sample = pick(productSamples(productKind));
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
    operation: FractionArithmeticOperation
): Pick<FractionBinaryOperationProblem, 'denominator' | 'first' | 'second' | 'result'> => {
    const denominator = pick(DENOMINATORS);
    if (operation === 'addition') {
        const firstNumerator = randomInteger(1, denominator - 1);
        const secondNumerator = randomInteger(1, denominator - firstNumerator);
        return {
            denominator,
            first: makeFraction(firstNumerator, denominator),
            second: makeFraction(secondNumerator, denominator),
            result: makeFraction(firstNumerator + secondNumerator, denominator)
        };
    }
    const firstNumerator = randomInteger(2, denominator);
    const secondNumerator = randomInteger(1, firstNumerator - 1);
    return {
        denominator,
        first: makeFraction(firstNumerator, denominator),
        second: makeFraction(secondNumerator, denominator),
        result: makeFraction(firstNumerator - secondNumerator, denominator)
    };
};

const generateBinaryOperation = (
    operation: FractionArithmeticOperation
): FractionBinaryOperationProblem => ({
    task: 'fraction-operation',
    operation,
    sharedWhole: 1,
    ...binarySample(operation)
});

const decompositionTerms = (
    sourceKind: 'proper' | 'mixed',
    totalNumerator: number,
    denominator: FractionParts
): [number[], number[]] => sourceKind === 'proper'
    ? [[1, totalNumerator - 1], [1, 1, totalNumerator - 2]]
    : [[1, totalNumerator - 1], [denominator, denominator, totalNumerator - 2 * denominator]];

const generateDecomposition = (
    sourceKind: 'proper' | 'mixed'
): FractionDecompositionProblem => {
    const denominator = sourceKind === 'proper'
        ? pick(DECOMPOSITION_DENOMINATORS)
        : pick(DENOMINATORS);
    const source = sourceKind === 'mixed'
        ? {kind: 'mixed' as const, value: makeMixed(2, randomInteger(1, denominator - 1), denominator)}
        : {kind: 'proper' as const, value: makeFraction(randomInteger(3, denominator - 1), denominator)};
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
    operation: FractionArithmeticOperation
): Pick<MixedFractionOperationProblem, 'denominator' | 'first' | 'second' | 'result'> => {
    const regroup = random() < 0.5;
    const denominator = pick(NON_BINARY_DENOMINATORS);
    if (operation === 'addition') {
        const firstNumerator = regroup
            ? randomInteger(2, denominator - 1)
            : randomInteger(1, denominator - 2);
        const secondNumerator = regroup
            ? randomInteger(denominator - firstNumerator + 1, denominator - 1)
            : randomInteger(1, denominator - firstNumerator - 1);
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

    const firstNumerator = regroup
        ? randomInteger(1, denominator - 2)
        : randomInteger(2, denominator - 1);
    const secondNumerator = regroup
        ? randomInteger(firstNumerator + 1, denominator - 1)
        : randomInteger(1, firstNumerator - 1);
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
    operation: FractionArithmeticOperation
): MixedFractionOperationProblem => ({
    task: 'mixed-operation',
    operation,
    sharedWhole: 1,
    ...mixedSample(operation)
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

const generateUnlikeFractionOperation = (
    operation: FractionArithmeticOperation
): UnlikeFractionOperationProblem => {
    const sample = pick(fractionPools[operation][pick(FRACTION_PROFILES)]);
    return createUnlikeFractionOperationProblem(
        operation, sample.first, sample.second, sample.commonDenominator
    )!;
};

const generateUnlikeMixedOperation = (
    operation: FractionArithmeticOperation
): UnlikeMixedOperationProblem => {
    const sample = pick(mixedPools[operation][pick(MIXED_PROFILES)]);
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
            'operation'
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
                return {data: generateUnitFractionMultiple()};
            }
            if (config.task === 'whole-number-fraction-product-proper') {
                return {data: generateWholeNumberFractionProduct('proper')};
            }
            if (config.task === 'whole-number-fraction-product-improper') {
                return {data: generateWholeNumberFractionProduct('improper')};
            }
            throw new GeneratorValidationError(
                'fraction-arithmetic',
                'Unsupported multiplication task and fraction-result combination.'
            );
        }
        if (config.task === 'unlike-fraction-operation'
            || config.task === 'unlike-mixed-operation') {
            if (config.usesCommonDenominator) {
                throw new GeneratorValidationError(
                    'fraction-arithmetic',
                    'Unlike original denominators cannot also request CommonDenominator.'
                );
            }
            return {data: config.task === 'unlike-fraction-operation'
                ? generateUnlikeFractionOperation(operation)
                : generateUnlikeMixedOperation(operation)};
        }
        if (!config.usesCommonDenominator) {
            throw new GeneratorValidationError(
                'fraction-arithmetic',
                'CommonDenominator is required for like-denominator fraction arithmetic.'
            );
        }
        if (config.task === 'tenths-hundredths-addition' && operation === 'addition') {
            return {data: generateTenthsHundredthsAddition()};
        }
        if (config.task === 'fraction-operation') {
            return {data: generateBinaryOperation(operation)};
        }
        if (config.task === 'decompose-proper' && operation === 'addition') {
            return {data: generateDecomposition('proper')};
        }
        if (config.task === 'decompose-mixed' && operation === 'addition') {
            return {data: generateDecomposition('mixed')};
        }
        if (config.task === 'mixed-operation') {
            return {data: generateMixedOperation(operation)};
        }
        throw new GeneratorValidationError(
            'fraction-arithmetic',
            'Unsupported fraction form, operation, and task combination.'
        );
    }
}

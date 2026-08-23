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
        referenceId: 'same-whole',
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
        referenceId: 'same-whole',
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
        referenceId: 'same-whole',
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
    referenceId: 'same-whole',
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
        referenceId: 'same-whole',
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
    referenceId: 'same-whole',
    ...mixedSample(operation)
});

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

import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionArithmeticModel,
    FractionArithmeticModelGroup,
    FractionArithmeticOperation,
    FractionArithmeticProblem,
    FractionArithmeticStory,
    FractionBinaryOperationProblem,
    FractionDecomposition,
    FractionDecompositionProblem,
    FractionMultiplicationWordProblem,
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
import {toDecimalFraction, toTenthsHundredthsGrid} from '../tenths-hundredths.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const NON_BINARY_DENOMINATORS = [3, 4, 6, 8] as const satisfies readonly FractionParts[];
const DECOMPOSITION_DENOMINATORS = [4, 6, 8] as const satisfies readonly FractionParts[];

type GroupSeed = Omit<FractionArithmeticModelGroup, 'startPart'>;

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const operationSymbol = (operation: FractionArithmeticOperation): '+' | '−' =>
    operation === 'addition' ? '+' : '−';

const makeFraction = (
    numerator: number,
    denominator: FractionParts
): LikeDenominatorFractionValue => ({
    numerator,
    denominator,
    notation: `${numerator}/${denominator}`
});

const makeMixed = (
    whole: number,
    numerator: number,
    denominator: FractionParts
): MixedFractionValue => {
    const improperNumerator = whole * denominator + numerator;
    return {
        whole,
        numerator,
        denominator,
        notation: whole > 0 ? `${whole} ${numerator}/${denominator}` : `${numerator}/${denominator}`,
        improperNumerator,
        improperNotation: `${improperNumerator}/${denominator}`
    };
};

const makeMixedFromImproper = (
    improperNumerator: number,
    denominator: FractionParts
): MixedFractionValue => {
    const whole = Math.floor(improperNumerator / denominator);
    const numerator = improperNumerator % denominator;
    return makeMixed(whole, numerator, denominator);
};

const makeModel = (
    display: string,
    denominator: FractionParts,
    totalNumerator: number,
    seeds: readonly GroupSeed[]
): FractionArithmeticModel => {
    const frameCount = Math.max(1, Math.ceil(totalNumerator / denominator));

    let startPart = 0;
    const groups = seeds.map(seed => {
        const group = {...seed, startPart};
        startPart += seed.partCount;
        return group;
    });

    const frames = Array.from({length: frameCount}, (_, frameIndex) => ({
        frameIndex,
        cells: Array.from({length: denominator}, (_, cellIndex) => {
            const partIndex = frameIndex * denominator + cellIndex;
            return {
                partIndex,
                groupId: groups.find(group =>
                    partIndex >= group.startPart
                    && partIndex < group.startPart + group.partCount
                )?.id ?? null
            };
        })
    }));

    return {
        denominator,
        display,
        totalNumerator,
        frameCount: frameCount as 1 | 2 | 3 | 4,
        groups,
        frames
    };
};

const singleGroupModel = (
    display: string,
    denominator: FractionParts,
    totalNumerator: number,
    id: string,
    role: GroupSeed['role']
): FractionArithmeticModel => makeModel(display, denominator, totalNumerator, [{
    id,
    role,
    label: display,
    partCount: totalNumerator
}]);

type FractionProductSample = {
    denominator: FractionParts;
    wholeFactor: number;
    fractionNumerator: number;
    productNumerator: number;
};

const PRODUCT_DENOMINATORS = [3, 4, 6, 8] as const satisfies readonly FractionParts[];

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

const fractionGroupModels = (
    groupCount: number,
    fraction: LikeDenominatorFractionValue,
    role: 'unit-part' | 'fraction-group'
): FractionArithmeticModel[] => Array.from({length: groupCount}, (_, groupIndex) =>
    singleGroupModel(
        fraction.notation,
        fraction.denominator,
        fraction.numerator,
        `group-${groupIndex}`,
        role
    ));

const fractionGroupAggregate = (
    product: LikeDenominatorFractionValue,
    groupCount: number,
    partsPerGroup: number,
    groupLabel: string,
    role: 'unit-part' | 'fraction-group'
): FractionArithmeticModel => makeModel(
    product.notation,
    product.denominator,
    product.numerator,
    Array.from({length: groupCount}, (_, groupIndex) => ({
        id: `group-${groupIndex}`,
        role,
        label: groupLabel,
        partCount: partsPerGroup
    }))
);

const unitMultipleStory = (
    unitFraction: LikeDenominatorFractionValue,
    product: LikeDenominatorFractionValue
): FractionArithmeticStory => ({
    storyKind: 'ribbon-unit-multiple',
    context: `A ribbon is divided into ${unitFraction.denominator} equal parts. The highlighted amount is ${product.notation} of the ribbon, and each equal part is ${unitFraction.notation} of the same ribbon.`,
    question: `How many copies of ${unitFraction.notation} make ${product.notation}? Complete the equation.`,
    wholeLabel: 'one ribbon',
    unitLabel: 'of the ribbon',
    givenDisplays: [product.notation, unitFraction.notation],
    unknownRole: 'multiplier'
});

const productStory = (
    task: WholeNumberFractionProductProblem['task'] | FractionMultiplicationWordProblem['task'],
    wholeFactor: number,
    fractionFactor: LikeDenominatorFractionValue
): FractionArithmeticStory => ({
    storyKind: 'equal-fraction-groups',
    context: `${wholeFactor} craft kits each use ${fractionFactor.notation} meter of ribbon from the same kind of roll.`,
    question: task === 'whole-number-fraction-product'
        ? 'Use unit-fraction groups to determine the total ribbon used.'
        : 'How many meters of ribbon do the craft kits use altogether?',
    wholeLabel: 'one meter',
    unitLabel: 'meters of ribbon',
    givenDisplays: [`${wholeFactor} craft kits`, fractionFactor.notation],
    unknownRole: 'product'
});

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
    const resultNumerator = convertedNumerator + hundredthsNumerator;
    const firstTenths = toDecimalFraction(tenthsNumerator, 10);
    const secondHundredths = toDecimalFraction(hundredthsNumerator, 100);
    const convertedFirst = toDecimalFraction(convertedNumerator, 100);
    const result = toDecimalFraction(resultNumerator, 100);
    const conversionEquation = `${firstTenths.notation} = ${convertedFirst.notation}`;
    const solutionEquation = `${convertedFirst.notation} + ${secondHundredths.notation} = ${result.notation}`;

    return {
        task: 'tenths-hundredths-addition',
        operation: 'addition',
        denominator: 100,
        sharedWhole: 1,
        referenceId: 'same-whole',
        story: {
            storyKind: 'hundred-grid-addition',
            context: `A mosaic uses ${firstTenths.notation} of a unit square in blue and a non-overlapping ${secondHundredths.notation} of the same-sized unit square in gold.`,
            question: 'How much of one unit square is used altogether when the amount is expressed in hundredths?',
            wholeLabel: 'one unit square',
            unitLabel: 'of a unit square',
            givenDisplays: [firstTenths.notation, secondHundredths.notation],
            unknownRole: 'result'
        },
        firstTenths,
        secondHundredths,
        convertedFirst,
        result,
        conversion: {
            factor: 10,
            numeratorEquation: `${tenthsNumerator} × 10 = ${convertedNumerator}`,
            denominatorEquation: '10 × 10 = 100',
            equation: conversionEquation
        },
        prompt: 'Express the tenths as hundredths, then add.',
        questionEquation: `${firstTenths.notation} + ${secondHundredths.notation} = ?/100`,
        conversionEquation,
        solutionEquation,
        equationChain: `${firstTenths.notation} + ${secondHundredths.notation} = ${convertedFirst.notation} + ${secondHundredths.notation} = ${result.notation}`,
        questionModels: {
            firstTenths: toTenthsHundredthsGrid(tenthsNumerator, 10, [{
                source: 'first-addend',
                label: firstTenths.notation,
                startCell: 0,
                cellCount: tenthsNumerator
            }]),
            secondHundredths: toTenthsHundredthsGrid(hundredthsNumerator, 100, [{
                source: 'second-addend',
                label: secondHundredths.notation,
                startCell: 0,
                cellCount: hundredthsNumerator
            }])
        },
        solutionModels: {
            convertedFirst: toTenthsHundredthsGrid(convertedNumerator, 100, [{
                source: 'first-addend',
                label: convertedFirst.notation,
                startCell: 0,
                cellCount: convertedNumerator
            }]),
            result: toTenthsHundredthsGrid(resultNumerator, 100, [{
                source: 'first-addend',
                label: convertedFirst.notation,
                startCell: 0,
                cellCount: convertedNumerator
            }, {
                source: 'second-addend',
                label: secondHundredths.notation,
                startCell: convertedNumerator,
                cellCount: hundredthsNumerator
            }])
        },
        answer: String(resultNumerator),
        answerStatement: `${firstTenths.notation} + ${secondHundredths.notation} = ${result.notation}.`,
        explanation: `${conversionEquation} because multiplying its numerator and denominator by 10 makes hundredths without changing the amount. Then ${solutionEquation}.`
    };
};

const generateUnitFractionMultiple = (): UnitFractionMultipleProblem => {
    const denominator = pick(DENOMINATORS);
    const wholeFactor = randomInteger(2, 4);
    const unitFraction = makeFraction(1, denominator);
    const product = makeFraction(wholeFactor, denominator);
    const productKind = wholeFactor < denominator ? 'proper' as const : 'improper' as const;
    const story = unitMultipleStory(unitFraction, product);
    const solutionEquation = `${product.notation} = ${wholeFactor} × (${unitFraction.notation})`;
    const unitSizeStatement = `Each equal part is ${unitFraction.notation} of the ribbon.`;

    return {
        task: 'unit-fraction-multiple',
        operation: 'multiplication',
        denominator,
        sharedWhole: 1,
        referenceId: 'same-whole',
        story,
        productKind,
        wholeFactor,
        wholeFactorDisplay: `${wholeFactor}`,
        unitFraction,
        product,
        groupCount: wholeFactor,
        partsPerGroup: 1,
        totalUnitParts: wholeFactor,
        questionModel: singleGroupModel(
            product.notation,
            denominator,
            product.numerator,
            'given-product',
            'result'
        ),
        solutionModel: fractionGroupAggregate(
            product,
            wholeFactor,
            1,
            unitFraction.notation,
            'unit-part'
        ),
        prompt: story.question,
        questionEquation: `${product.notation} = ? × (${unitFraction.notation})`,
        solutionEquation,
        equationChain: solutionEquation,
        unitSizeStatement,
        unitMultipleEquation: solutionEquation,
        answer: `${wholeFactor}`,
        answerStatement: `${product.notation} is ${wholeFactor} copies of ${unitFraction.notation}, so ${solutionEquation}.`,
        explanation: `Each copy is one of ${denominator} equal parts of the same whole. ${wholeFactor} copies make ${wholeFactor} unit parts, so ${solutionEquation}.`
    };
};

const generateWholeNumberFractionProduct = (
    task: WholeNumberFractionProductProblem['task'] | FractionMultiplicationWordProblem['task'],
    productKind: 'proper' | 'improper'
): WholeNumberFractionProductProblem | FractionMultiplicationWordProblem => {
    const sample = pick(productSamples(productKind));
    const {denominator, wholeFactor, fractionNumerator, productNumerator} = sample;
    const unitFraction = makeFraction(1, denominator);
    const fractionFactor = makeFraction(fractionNumerator, denominator);
    const product = makeFraction(productNumerator, denominator);
    const story = productStory(task, wholeFactor, fractionFactor);
    const fractionAsUnitMultipleEquation = `${fractionFactor.notation} = ${fractionNumerator} × (${unitFraction.notation})`;
    const iteratedUnitEquation = `${wholeFactor} × (${fractionFactor.notation}) = ${productNumerator} × (${unitFraction.notation})`;
    const solutionEquation = `${wholeFactor} × (${fractionFactor.notation}) = ${product.notation}`;
    const equationChain = `${wholeFactor} × (${fractionFactor.notation}) = (${wholeFactor} × ${fractionNumerator}) × (${unitFraction.notation}) = ${productNumerator} × (${unitFraction.notation}) = ${product.notation}`;
    const common = {
        operation: 'multiplication' as const,
        denominator,
        sharedWhole: 1 as const,
        referenceId: 'same-whole' as const,
        story,
        productKind,
        wholeFactor,
        wholeFactorDisplay: `${wholeFactor}`,
        fractionFactor,
        unitFraction,
        product,
        groupCount: wholeFactor,
        partsPerGroup: fractionNumerator,
        totalUnitParts: productNumerator,
        questionGroupModels: fractionGroupModels(
            wholeFactor,
            fractionFactor,
            'fraction-group'
        ),
        solutionModel: fractionGroupAggregate(
            product,
            wholeFactor,
            fractionNumerator,
            fractionFactor.notation,
            'fraction-group'
        ),
        fractionAsUnitMultipleEquation,
        iteratedUnitEquation,
        prompt: task === 'whole-number-fraction-product'
            ? `Use unit fractions to calculate ${wholeFactor} × (${fractionFactor.notation}).`
            : story.question,
        questionEquation: `${wholeFactor} × (${fractionFactor.notation}) = ?/${denominator}`,
        solutionEquation,
        equationChain,
        answer: product.notation,
        answerStatement: task === 'whole-number-fraction-product'
            ? `The product is ${product.notation}.`
            : `The craft kits use ${product.notation} meters of ribbon.`,
        explanation: `${fractionAsUnitMultipleEquation}. There are ${wholeFactor} groups of ${fractionNumerator} unit parts, giving ${productNumerator} unit parts in all. Therefore, ${equationChain}.`
    };

    if (task === 'whole-number-fraction-product') {
        return {task, ...common};
    }

    const lowerWhole = Math.floor(productNumerator / denominator);
    const upperWhole = Math.ceil(productNumerator / denominator);
    return {
        task,
        ...common,
        lowerWhole,
        upperWhole,
        boundsStatement: `${lowerWhole} < ${product.notation} < ${upperWhole}`
    };
};

const posterStory = (
    operation: FractionArithmeticOperation,
    first: LikeDenominatorFractionValue,
    second: LikeDenominatorFractionValue,
    unknownRole: 'operation' | 'result'
): FractionArithmeticStory => operation === 'addition'
    ? {
        storyKind: 'poster-join',
        context: `A poster is divided into ${first.denominator} equal parts. ${first.notation} of the same poster is colored blue and ${second.notation} is colored gold.`,
        question: unknownRole === 'operation'
            ? 'Which joining operation and equation describe the colored parts?'
            : 'What fraction of the poster is colored altogether?',
        wholeLabel: 'one poster',
        unitLabel: 'of the poster',
        givenDisplays: [first.notation, second.notation],
        unknownRole
    }
    : {
        storyKind: 'poster-separate',
        context: `A poster is divided into ${first.denominator} equal parts. ${first.notation} of the same poster is colored, and then ${second.notation} is erased.`,
        question: unknownRole === 'operation'
            ? 'Which separating operation and equation describe the change?'
            : 'What fraction of the poster remains colored?',
        wholeLabel: 'one poster',
        unitLabel: 'of the poster',
        givenDisplays: [first.notation, second.notation],
        unknownRole
    };

const binarySample = (
    operation: FractionArithmeticOperation
): {
    denominator: FractionParts;
    first: LikeDenominatorFractionValue;
    second: LikeDenominatorFractionValue;
    result: LikeDenominatorFractionValue;
} => {
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
    task: FractionBinaryOperationProblem['task'],
    operation: FractionArithmeticOperation
): FractionBinaryOperationProblem => {
    const {denominator, first, second, result} = binarySample(operation);
    const symbol = operationSymbol(operation);
    const action = operation === 'addition' ? 'join' as const : 'separate' as const;
    const isInterpretation = task === 'interpret-operation';
    const story = posterStory(operation, first, second, isInterpretation ? 'operation' : 'result');
    const solutionEquation = `${first.notation} ${symbol} ${second.notation} = ${result.notation}`;
    const solutionModel = operation === 'addition'
        ? makeModel(result.notation, denominator, result.numerator, [
            {
                id: 'first',
                role: 'first-addend',
                label: first.notation,
                partCount: first.numerator
            },
            {
                id: 'second',
                role: 'second-addend',
                label: second.notation,
                partCount: second.numerator
            }
        ])
        : makeModel(first.notation, denominator, first.numerator, [
            {
                id: 'remaining',
                role: 'remaining',
                label: result.notation,
                partCount: result.numerator
            },
            {
                id: 'removed',
                role: 'removed',
                label: second.notation,
                partCount: second.numerator
            }
        ]);
    const explanation = operation === 'addition'
        ? `The fractions refer to the same whole and have denominator ${denominator}. Joining ${first.numerator} parts and ${second.numerator} parts gives ${result.numerator} parts, so ${solutionEquation}.`
        : `The fractions refer to the same whole and have denominator ${denominator}. Separating ${second.numerator} parts from ${first.numerator} parts leaves ${result.numerator} parts, so ${solutionEquation}.`;

    return {
        task,
        operation,
        denominator,
        sharedWhole: 1,
        referenceId: 'same-whole',
        story,
        symbol,
        action,
        first,
        second,
        result,
        prompt: isInterpretation
            ? `Interpret the model as ${action === 'join' ? 'joining' : 'separating'} equal parts of the same whole.`
            : story.question,
        questionEquation: isInterpretation
            ? `${first.notation} ? ${second.notation} = ?`
            : `${first.notation} ${symbol} ${second.notation} = ?/${denominator}`,
        questionModels: [
            singleGroupModel(first.notation, denominator, first.numerator, 'first', 'first-addend'),
            singleGroupModel(second.notation, denominator, second.numerator, 'second', 'second-addend')
        ],
        solutionEquation,
        solutionModel,
        answer: isInterpretation ? solutionEquation : result.notation,
        answerStatement: isInterpretation
            ? `The ${action === 'join' ? 'joining' : 'separating'} operation is ${operation}: ${solutionEquation}.`
            : `The answer is ${result.notation} ${story.unitLabel}.`,
        explanation
    };
};

const decompositionTerms = (
    sourceKind: FractionDecompositionProblem['sourceKind'],
    totalNumerator: number,
    denominator: FractionParts
): [number[], number[]] => sourceKind === 'proper'
    ? [[1, totalNumerator - 1], [1, 1, totalNumerator - 2]]
    : [[1, totalNumerator - 1], [denominator, denominator, totalNumerator - 2 * denominator]];

const makeDecomposition = (
    sourceDisplay: string,
    sourceImproperDisplay: string,
    sourceKind: FractionDecompositionProblem['sourceKind'],
    denominator: FractionParts,
    numerators: number[],
    decompositionIndex: number
): FractionDecomposition => {
    const terms = numerators.map(numerator => makeFraction(numerator, denominator));
    const sum = terms.map(term => term.notation).join(' + ');
    const equation = sourceKind === 'mixed'
        ? `${sourceDisplay} = ${sourceImproperDisplay} = ${sum}`
        : `${sourceDisplay} = ${sum}`;
    return {
        terms,
        equation,
        model: makeModel(sourceDisplay, denominator, numerators.reduce((sumValue, value) =>
            sumValue + value, 0), numerators.map((numerator, index) => ({
            id: `decomposition-${decompositionIndex}-part-${index}`,
            role: 'decomposition-part',
            label: `${numerator}/${denominator}`,
            partCount: numerator
        })))
    };
};

const generateDecomposition = (
    sourceKind: FractionDecompositionProblem['sourceKind']
): FractionDecompositionProblem => {
    const denominator = sourceKind === 'proper'
        ? pick(DECOMPOSITION_DENOMINATORS)
        : pick(DENOMINATORS);
    const sourceMixed = sourceKind === 'mixed'
        ? makeMixed(2, randomInteger(1, denominator - 1), denominator)
        : null;
    const sourceFraction = sourceMixed
        ? makeFraction(sourceMixed.improperNumerator, denominator)
        : makeFraction(randomInteger(3, denominator - 1), denominator);
    const sourceDisplay = sourceMixed?.notation ?? sourceFraction.notation;
    const [firstTerms, secondTerms] = decompositionTerms(
        sourceKind,
        sourceFraction.numerator,
        denominator
    );
    const firstDecomposition = makeDecomposition(
        sourceDisplay,
        sourceFraction.notation,
        sourceKind,
        denominator,
        firstTerms,
        0
    );
    const secondDecomposition = makeDecomposition(
        sourceDisplay,
        sourceFraction.notation,
        sourceKind,
        denominator,
        secondTerms,
        1
    );
    const story: FractionArithmeticStory = {
        storyKind: 'mosaic-decomposition',
        context: `A mosaic design uses panels divided into ${denominator} equal columns. The tiled amount is ${sourceDisplay} panels.`,
        question: 'What are two different same-denominator decompositions of this amount?',
        wholeLabel: 'one panel',
        unitLabel: 'panels',
        givenDisplays: [sourceDisplay],
        unknownRole: 'decompositions'
    };
    const solutionEquations: [string, string] = [
        firstDecomposition.equation,
        secondDecomposition.equation
    ];

    return {
        task: 'decompose',
        operation: 'addition',
        denominator,
        sharedWhole: 1,
        referenceId: 'same-whole',
        sourceKind,
        sourceFraction,
        sourceMixed,
        sourceDisplay,
        sourceModel: singleGroupModel(
            sourceDisplay,
            denominator,
            sourceFraction.numerator,
            'source',
            'result'
        ),
        decompositions: [firstDecomposition, secondDecomposition],
        story,
        prompt: `Decompose ${sourceDisplay} in two different ways using positive fractions with denominator ${denominator}.`,
        questionEquation: `${sourceDisplay} = ?`,
        solutionEquations,
        answer: solutionEquations.join('; '),
        answerStatement: `Two decompositions are ${solutionEquations[0]} and ${solutionEquations[1]}.`,
        explanation: `Each decomposition uses positive addends with denominator ${denominator}, and each set of numerators totals ${sourceFraction.numerator}, so both equations represent the same amount.`
    };
};

const mixedStory = (
    operation: FractionArithmeticOperation,
    first: MixedFractionValue,
    second: MixedFractionValue
): FractionArithmeticStory => operation === 'addition'
    ? {
        storyKind: 'route-combination',
        context: `One trail section is ${first.notation} miles long and a second section is ${second.notation} miles long. Both distances use the same mile unit.`,
        question: 'How many miles long are the two sections altogether?',
        wholeLabel: 'one mile',
        unitLabel: 'miles',
        givenDisplays: [first.notation, second.notation],
        unknownRole: 'result'
    }
    : {
        storyKind: 'route-difference',
        context: `A route is ${first.notation} miles long, and ${second.notation} miles have been completed. Both distances use the same mile unit.`,
        question: 'How many miles remain?',
        wholeLabel: 'one mile',
        unitLabel: 'miles',
        givenDisplays: [first.notation, second.notation],
        unknownRole: 'result'
    };

const mixedSample = (
    operation: FractionArithmeticOperation
): {
    denominator: FractionParts;
    strategy: MixedFractionOperationProblem['strategy'];
    first: MixedFractionValue;
    second: MixedFractionValue;
    result: MixedFractionValue;
} => {
    const regroup = random() < 0.5;
    const denominator = pick(NON_BINARY_DENOMINATORS);
    if (operation === 'addition') {
        let firstNumerator: number;
        let secondNumerator: number;
        if (regroup) {
            firstNumerator = randomInteger(2, denominator - 1);
            secondNumerator = randomInteger(denominator - firstNumerator + 1, denominator - 1);
        } else {
            firstNumerator = randomInteger(1, denominator - 2);
            secondNumerator = randomInteger(1, denominator - firstNumerator - 1);
        }
        const first = makeMixed(1, firstNumerator, denominator);
        const second = makeMixed(1, secondNumerator, denominator);
        return {
            denominator,
            strategy: regroup ? 'addition-with-carry' : 'addition-without-carry',
            first,
            second,
            result: makeMixedFromImproper(
                first.improperNumerator + second.improperNumerator,
                denominator
            )
        };
    }

    let firstNumerator: number;
    let secondNumerator: number;
    if (regroup) {
        firstNumerator = randomInteger(1, denominator - 2);
        secondNumerator = randomInteger(firstNumerator + 1, denominator - 1);
    } else {
        secondNumerator = randomInteger(1, denominator - 2);
        firstNumerator = randomInteger(secondNumerator + 1, denominator - 1);
    }
    const first = makeMixed(2, firstNumerator, denominator);
    const second = makeMixed(1, secondNumerator, denominator);
    return {
        denominator,
        strategy: regroup ? 'subtraction-with-borrow' : 'subtraction-without-borrow',
        first,
        second,
        result: makeMixedFromImproper(
            first.improperNumerator - second.improperNumerator,
            denominator
        )
    };
};

const generateMixedOperation = (
    operation: FractionArithmeticOperation
): MixedFractionOperationProblem => {
    const {denominator, strategy, first, second, result} = mixedSample(operation);
    const symbol = operationSymbol(operation);
    const requiresRegrouping = strategy === 'addition-with-carry'
        || strategy === 'subtraction-with-borrow';
    const operandConversionEquations: [string, string] = [
        `${first.notation} = ${first.improperNotation}`,
        `${second.notation} = ${second.improperNotation}`
    ];
    const regroupingEquation = strategy === 'addition-with-carry'
        ? `${first.whole + second.whole} ${first.numerator + second.numerator}/${denominator} = ${result.notation}`
        : strategy === 'subtraction-with-borrow'
            ? `${first.notation} = ${first.whole - 1} ${denominator + first.numerator}/${denominator}`
            : null;
    const resultImproperNotation = `${result.improperNumerator}/${denominator}`;
    const improperOperationEquation = `${first.improperNotation} ${symbol} ${second.improperNotation} = ${resultImproperNotation}`;
    const normalizationEquation = `${resultImproperNotation} = ${result.notation}`;
    const transformationSteps = [
        ...operandConversionEquations,
        ...(regroupingEquation ? [regroupingEquation] : []),
        improperOperationEquation,
        normalizationEquation
    ];
    const solutionEquation = `${first.notation} ${symbol} ${second.notation} = ${result.notation}`;
    const story = mixedStory(operation, first, second);

    return {
        task: 'mixed-operation',
        operation,
        denominator,
        sharedWhole: 1,
        referenceId: 'same-whole',
        story,
        symbol,
        strategy,
        requiresRegrouping,
        first,
        second,
        result,
        questionModels: [
            singleGroupModel(
                first.notation,
                denominator,
                first.improperNumerator,
                'first',
                'first-addend'
            ),
            singleGroupModel(
                second.notation,
                denominator,
                second.improperNumerator,
                'second',
                'second-addend'
            )
        ],
        operandConversionEquations,
        regroupingEquation,
        improperOperationEquation,
        normalizationEquation,
        transformationSteps,
        prompt: `Calculate ${first.notation} ${symbol} ${second.notation} using like-denominator mixed-number reasoning.`,
        questionEquation: `${first.notation} ${symbol} ${second.notation} = ?`,
        solutionEquation,
        solutionModel: singleGroupModel(
            result.notation,
            denominator,
            result.improperNumerator,
            'result',
            'result'
        ),
        answer: result.notation,
        answerStatement: `The answer is ${result.notation}.`,
        explanation: `${transformationSteps.join(' Then ')} Therefore, ${solutionEquation}.`
    };
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
                return {data: generateWholeNumberFractionProduct(
                    'whole-number-fraction-product',
                    'proper'
                )};
            }
            if (config.task === 'whole-number-fraction-product-improper') {
                return {data: generateWholeNumberFractionProduct(
                    'whole-number-fraction-product',
                    'improper'
                )};
            }
            if (config.task === 'fraction-multiplication-problem-proper') {
                return {data: generateWholeNumberFractionProduct(
                    'fraction-multiplication-problem',
                    'proper'
                )};
            }
            if (config.task === 'fraction-multiplication-problem-improper') {
                return {data: generateWholeNumberFractionProduct(
                    'fraction-multiplication-problem',
                    'improper'
                )};
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
        if (config.task === 'interpret-operation') {
            return {data: generateBinaryOperation('interpret-operation', operation)};
        }

        if (config.task === 'fraction-operation') {
            return {data: generateBinaryOperation('fraction-operation', operation)};
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
            'Unsupported task ability, fraction form, and operation combination.'
        );
    }
}

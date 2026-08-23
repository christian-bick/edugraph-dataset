import {
    DecimalFractionValue,
    FractionArithmeticOperation,
    FractionArithmeticProblem,
    FractionBinaryOperationProblem,
    FractionDecompositionProblem,
    FractionParts,
    LikeDenominatorFractionValue,
    MixedFractionOperationProblem,
    MixedFractionValue,
    TenthsHundredthsAdditionProblem,
    TenthsHundredthsGridGroup,
    TenthsHundredthsGridModel,
    UnitFractionMultipleProblem,
    WholeNumberFractionProductProblem
} from '../../../types/problems.ts';

export type FractionArithmeticPresentation =
    | 'interpretation'
    | 'understanding'
    | 'execution-model'
    | 'execution-word';

export type PresentedFractionValue = LikeDenominatorFractionValue & {notation: string};

export type PresentedMixedFractionValue = MixedFractionValue & {
    notation: string;
    improperNumerator: number;
    improperNotation: string;
};

export type FractionArithmeticModelGroupRole =
    | 'first-addend'
    | 'second-addend'
    | 'remaining'
    | 'removed'
    | 'decomposition-part'
    | 'unit-part'
    | 'fraction-group'
    | 'result';

export type FractionArithmeticModelGroup = {
    id: string;
    role: FractionArithmeticModelGroupRole;
    label: string;
    startPart: number;
    partCount: number;
};

export type FractionArithmeticModel = {
    denominator: FractionParts;
    display: string;
    totalNumerator: number;
    frameCount: 1 | 2 | 3 | 4;
    groups: FractionArithmeticModelGroup[];
    frames: Array<{
        frameIndex: number;
        cells: Array<{partIndex: number; groupId: string | null}>;
    }>;
};

export type FractionArithmeticStory = {
    storyKind:
        | 'poster-join'
        | 'poster-separate'
        | 'mosaic-decomposition'
        | 'route-combination'
        | 'route-difference'
        | 'ribbon-unit-multiple'
        | 'equal-fraction-groups'
        | 'hundred-grid-addition';
    context: string;
    question: string;
    wholeLabel: string;
    unitLabel: string;
    givenDisplays: [string] | [string, string];
    unknownRole: 'operation' | 'decompositions' | 'result' | 'product' | 'multiplier';
};

type PresentationCommon = {
    denominator: FractionParts;
    sharedWhole: 1;
    story: FractionArithmeticStory;
    prompt: string;
    questionEquation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type FractionBinaryOperationPresentation = PresentationCommon & {
    task: 'interpret-operation' | 'fraction-operation';
    operation: FractionArithmeticOperation;
    symbol: '+' | '−';
    action: 'join' | 'separate';
    first: PresentedFractionValue;
    second: PresentedFractionValue;
    result: PresentedFractionValue;
    questionModels: [FractionArithmeticModel, FractionArithmeticModel];
    solutionEquation: string;
    solutionModel: FractionArithmeticModel;
};

export type FractionDecompositionPresentation = PresentationCommon & {
    task: 'decompose';
    operation: 'addition';
    sourceKind: 'proper' | 'mixed';
    sourceFraction: PresentedFractionValue;
    sourceMixed: PresentedMixedFractionValue | null;
    sourceDisplay: string;
    sourceModel: FractionArithmeticModel;
    decompositions: [
        {terms: PresentedFractionValue[]; equation: string; model: FractionArithmeticModel},
        {terms: PresentedFractionValue[]; equation: string; model: FractionArithmeticModel}
    ];
    solutionEquations: [string, string];
};

export type MixedFractionOperationStrategy =
    | 'addition-with-carry'
    | 'addition-without-carry'
    | 'subtraction-with-borrow'
    | 'subtraction-without-borrow';

export type MixedFractionOperationPresentation = PresentationCommon & {
    task: 'mixed-operation';
    operation: FractionArithmeticOperation;
    symbol: '+' | '−';
    strategy: MixedFractionOperationStrategy;
    requiresRegrouping: boolean;
    first: PresentedMixedFractionValue;
    second: PresentedMixedFractionValue;
    result: PresentedMixedFractionValue;
    questionModels: [FractionArithmeticModel, FractionArithmeticModel];
    operandConversionEquations: [string, string];
    regroupingEquation: string | null;
    improperOperationEquation: string;
    normalizationEquation: string;
    transformationSteps: string[];
    solutionEquation: string;
    solutionModel: FractionArithmeticModel;
};

type FractionMultiplicationPresentationCommon = PresentationCommon & {
    operation: 'multiplication';
    productKind: 'proper' | 'improper';
    wholeFactor: number;
    wholeFactorDisplay: string;
    unitFraction: PresentedFractionValue;
    product: PresentedFractionValue;
    groupCount: number;
    partsPerGroup: number;
    totalUnitParts: number;
    solutionModel: FractionArithmeticModel;
    solutionEquation: string;
    equationChain: string;
};

export type UnitFractionMultiplePresentation = FractionMultiplicationPresentationCommon & {
    task: 'unit-fraction-multiple';
    partsPerGroup: 1;
    questionModel: FractionArithmeticModel;
    unitSizeStatement: string;
    unitMultipleEquation: string;
};

export type WholeNumberFractionProductPresentation = FractionMultiplicationPresentationCommon & {
    task: 'whole-number-fraction-product' | 'fraction-multiplication-problem';
    fractionFactor: PresentedFractionValue;
    questionGroupModels: FractionArithmeticModel[];
    fractionAsUnitMultipleEquation: string;
    iteratedUnitEquation: string;
    lowerWhole: number;
    upperWhole: number;
    boundsStatement: string;
};

export type TenthsHundredthsAdditionPresentation = Omit<PresentationCommon, 'denominator'> & {
    task: 'tenths-hundredths-addition';
    operation: 'addition';
    denominator: 100;
    firstTenths: DecimalFractionValue & {denominator: 10};
    secondHundredths: DecimalFractionValue & {denominator: 100};
    convertedFirst: DecimalFractionValue & {denominator: 100};
    result: DecimalFractionValue & {denominator: 100};
    conversion: {
        factor: 10;
        numeratorEquation: string;
        denominatorEquation: string;
        equation: string;
    };
    conversionEquation: string;
    solutionEquation: string;
    equationChain: string;
    questionModels: {
        firstTenths: TenthsHundredthsGridModel;
        secondHundredths: TenthsHundredthsGridModel;
    };
    solutionModels: {
        convertedFirst: TenthsHundredthsGridModel;
        result: TenthsHundredthsGridModel;
    };
};

export type FractionArithmeticPresentationProblem =
    | FractionBinaryOperationPresentation
    | FractionDecompositionPresentation
    | MixedFractionOperationPresentation
    | UnitFractionMultiplePresentation
    | WholeNumberFractionProductPresentation
    | TenthsHundredthsAdditionPresentation;

type GroupSeed = Omit<FractionArithmeticModelGroup, 'startPart'>;

const operationSymbol = (operation: FractionArithmeticOperation): '+' | '−' =>
    operation === 'addition' ? '+' : '−';

const countedNoun = (count: number, singular: string): string =>
    count === 1 ? singular : `${singular}s`;

const presentFraction = (value: LikeDenominatorFractionValue): PresentedFractionValue => ({
    ...value,
    notation: `${value.numerator}/${value.denominator}`
});

const presentDecimalFraction = <Denominator extends 10 | 100>(
    value: {numerator: number; denominator: Denominator}
): DecimalFractionValue & {denominator: Denominator} => ({
    ...value,
    notation: `${value.numerator}/${value.denominator}`
});

const presentMixed = (value: MixedFractionValue): PresentedMixedFractionValue => {
    const improperNumerator = value.whole * value.denominator + value.numerator;
    return {
        ...value,
        notation: value.whole > 0
            ? `${value.whole} ${value.numerator}/${value.denominator}`
            : `${value.numerator}/${value.denominator}`,
        improperNumerator,
        improperNotation: `${improperNumerator}/${value.denominator}`
    };
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
    return {
        denominator,
        display,
        totalNumerator,
        frameCount: frameCount as 1 | 2 | 3 | 4,
        groups,
        frames: Array.from({length: frameCount}, (_, frameIndex) => ({
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
        }))
    };
};

const singleGroupModel = (
    value: PresentedFractionValue | PresentedMixedFractionValue,
    totalNumerator: number,
    id: string,
    role: FractionArithmeticModelGroupRole
): FractionArithmeticModel => makeModel(
    value.notation,
    value.denominator,
    totalNumerator,
    [{id, role, label: value.notation, partCount: totalNumerator}]
);

const fractionGroupModels = (
    groupCount: number,
    fraction: PresentedFractionValue
): FractionArithmeticModel[] => Array.from({length: groupCount}, (_, groupIndex) =>
    singleGroupModel(fraction, fraction.numerator, `group-${groupIndex}`, 'fraction-group')
);

const fractionGroupAggregate = (
    product: PresentedFractionValue,
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

const makeGrid = (
    value: DecimalFractionValue,
    groups: readonly TenthsHundredthsGridGroup[]
): TenthsHundredthsGridModel => {
    const rows = value.denominator === 10 ? 1 as const : 10 as const;
    const heightPercent = value.denominator === 10 ? 100 as const : 10 as const;
    return {
        display: value.notation,
        rows,
        columns: 10,
        partCount: value.denominator,
        shadedCount: value.numerator,
        groups: [...groups],
        cells: Array.from({length: value.denominator}, (_, index) => {
            const row = value.denominator === 10 ? 0 : index % 10;
            const column = value.denominator === 10 ? index : Math.floor(index / 10);
            return {
                index,
                row,
                column,
                tenthGroupIndex: column,
                xPercent: column * 10,
                yPercent: row * heightPercent,
                widthPercent: 10 as const,
                heightPercent,
                shaded: index < value.numerator,
                source: groups.find(group =>
                    index >= group.startCell && index < group.startCell + group.cellCount
                )?.source ?? null
            };
        })
    };
};

const posterStory = (
    operation: FractionArithmeticOperation,
    first: PresentedFractionValue,
    second: PresentedFractionValue,
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

const presentBinary = (
    data: FractionBinaryOperationProblem,
    interpretation: boolean
): FractionBinaryOperationPresentation => {
    const first = presentFraction(data.first);
    const second = presentFraction(data.second);
    const result = presentFraction(data.result);
    const symbol = operationSymbol(data.operation);
    const action = data.operation === 'addition' ? 'join' as const : 'separate' as const;
    const story = posterStory(data.operation, first, second, interpretation ? 'operation' : 'result');
    const solutionEquation = `${first.notation} ${symbol} ${second.notation} = ${result.notation}`;
    const solutionModel = data.operation === 'addition'
        ? makeModel(result.notation, data.denominator, result.numerator, [
            {id: 'first', role: 'first-addend', label: first.notation, partCount: first.numerator},
            {id: 'second', role: 'second-addend', label: second.notation, partCount: second.numerator}
        ])
        : makeModel(first.notation, data.denominator, first.numerator, [
            {id: 'remaining', role: 'remaining', label: result.notation, partCount: result.numerator},
            {id: 'removed', role: 'removed', label: second.notation, partCount: second.numerator}
        ]);
    const explanation = data.operation === 'addition'
        ? `The fractions refer to the same whole and have denominator ${data.denominator}. Joining ${first.numerator} ${countedNoun(first.numerator, 'part')} and ${second.numerator} ${countedNoun(second.numerator, 'part')} gives ${result.numerator} ${countedNoun(result.numerator, 'part')}, so ${solutionEquation}.`
        : `The fractions refer to the same whole and have denominator ${data.denominator}. Separating ${second.numerator} ${countedNoun(second.numerator, 'part')} from ${first.numerator} ${countedNoun(first.numerator, 'part')} leaves ${result.numerator} ${countedNoun(result.numerator, 'part')}, so ${solutionEquation}.`;
    const actionWord = action === 'join' ? 'joining' : 'separating';
    return {
        task: interpretation ? 'interpret-operation' : 'fraction-operation',
        operation: data.operation,
        denominator: data.denominator,
        sharedWhole: data.sharedWhole,
        story,
        symbol,
        action,
        first,
        second,
        result,
        prompt: interpretation
            ? `Interpret the model as ${actionWord} equal parts of the same whole.`
            : story.question,
        questionEquation: interpretation
            ? `${first.notation} ? ${second.notation} = ?`
            : `${first.notation} ${symbol} ${second.notation} = ?/${data.denominator}`,
        questionModels: [
            singleGroupModel(first, first.numerator, 'first', 'first-addend'),
            singleGroupModel(second, second.numerator, 'second', 'second-addend')
        ],
        solutionEquation,
        solutionModel,
        answer: interpretation ? solutionEquation : result.notation,
        answerStatement: interpretation
            ? `The ${actionWord} operation is ${data.operation}: ${solutionEquation}.`
            : `The answer is ${result.notation} ${story.unitLabel}.`,
        explanation
    };
};

const presentDecomposition = (
    data: FractionDecompositionProblem
): FractionDecompositionPresentation => {
    const sourceKind = data.source.kind;
    const sourceMixed = sourceKind === 'mixed' ? presentMixed(data.source.value) : null;
    const sourceFraction = sourceKind === 'mixed'
        ? presentFraction({
            numerator: sourceMixed!.improperNumerator,
            denominator: data.denominator
        })
        : presentFraction(data.source.value);
    const sourceDisplay = sourceMixed?.notation ?? sourceFraction.notation;
    const decompositions = data.decompositions.map((decomposition, decompositionIndex) => {
        const terms = decomposition.terms.map(presentFraction);
        const sum = terms.map(term => term.notation).join(' + ');
        const equation = sourceKind === 'mixed'
            ? `${sourceDisplay} = ${sourceFraction.notation} = ${sum}`
            : `${sourceDisplay} = ${sum}`;
        return {
            terms,
            equation,
            model: makeModel(
                sourceDisplay,
                data.denominator,
                sourceFraction.numerator,
                terms.map((term, termIndex) => ({
                    id: `decomposition-${decompositionIndex}-part-${termIndex}`,
                    role: 'decomposition-part' as const,
                    label: term.notation,
                    partCount: term.numerator
                }))
            )
        };
    }) as FractionDecompositionPresentation['decompositions'];
    const solutionEquations = decompositions.map(({equation}) => equation) as [string, string];
    const story: FractionArithmeticStory = {
        storyKind: 'mosaic-decomposition',
        context: `A mosaic design uses panels divided into ${data.denominator} equal columns. The tiled amount is ${sourceDisplay} panels.`,
        question: 'What are two different same-denominator decompositions of this amount?',
        wholeLabel: 'one panel',
        unitLabel: 'panels',
        givenDisplays: [sourceDisplay],
        unknownRole: 'decompositions'
    };
    return {
        task: 'decompose',
        operation: 'addition',
        denominator: data.denominator,
        sharedWhole: data.sharedWhole,
        sourceKind,
        sourceFraction,
        sourceMixed,
        sourceDisplay,
        sourceModel: singleGroupModel(
            sourceMixed ?? sourceFraction,
            sourceFraction.numerator,
            'source',
            'result'
        ),
        decompositions,
        story,
        prompt: `Decompose ${sourceDisplay} in two different ways using positive fractions with denominator ${data.denominator}.`,
        questionEquation: `${sourceDisplay} = ?`,
        solutionEquations,
        answer: solutionEquations.join('; '),
        answerStatement: `Two decompositions are ${solutionEquations[0]} and ${solutionEquations[1]}.`,
        explanation: `Each decomposition uses positive addends with denominator ${data.denominator}, and each set of numerators totals ${sourceFraction.numerator}, so both equations represent the same amount.`
    };
};

const mixedStory = (
    operation: FractionArithmeticOperation,
    first: PresentedMixedFractionValue,
    second: PresentedMixedFractionValue
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

const presentMixedOperation = (
    data: MixedFractionOperationProblem
): MixedFractionOperationPresentation => {
    const first = presentMixed(data.first);
    const second = presentMixed(data.second);
    const result = presentMixed(data.result);
    const symbol = operationSymbol(data.operation);
    const requiresRegrouping = data.operation === 'addition'
        ? first.numerator + second.numerator >= data.denominator
        : first.numerator < second.numerator;
    const strategy: MixedFractionOperationStrategy = data.operation === 'addition'
        ? requiresRegrouping ? 'addition-with-carry' : 'addition-without-carry'
        : requiresRegrouping ? 'subtraction-with-borrow' : 'subtraction-without-borrow';
    const operandConversionEquations: [string, string] = [
        `${first.notation} = ${first.improperNotation}`,
        `${second.notation} = ${second.improperNotation}`
    ];
    const regroupingEquation = strategy === 'addition-with-carry'
        ? `${first.whole + second.whole} ${first.numerator + second.numerator}/${data.denominator} = ${result.notation}`
        : strategy === 'subtraction-with-borrow'
            ? `${first.notation} = ${first.whole - 1} ${data.denominator + first.numerator}/${data.denominator}`
            : null;
    const resultImproperNotation = `${result.improperNumerator}/${data.denominator}`;
    const improperOperationEquation = `${first.improperNotation} ${symbol} ${second.improperNotation} = ${resultImproperNotation}`;
    const normalizationEquation = `${resultImproperNotation} = ${result.notation}`;
    const transformationSteps = [
        ...operandConversionEquations,
        ...(regroupingEquation ? [regroupingEquation] : []),
        improperOperationEquation,
        normalizationEquation
    ];
    const solutionEquation = `${first.notation} ${symbol} ${second.notation} = ${result.notation}`;
    return {
        task: 'mixed-operation',
        operation: data.operation,
        denominator: data.denominator,
        sharedWhole: data.sharedWhole,
        story: mixedStory(data.operation, first, second),
        symbol,
        strategy,
        requiresRegrouping,
        first,
        second,
        result,
        questionModels: [
            singleGroupModel(first, first.improperNumerator, 'first', 'first-addend'),
            singleGroupModel(second, second.improperNumerator, 'second', 'second-addend')
        ],
        operandConversionEquations,
        regroupingEquation,
        improperOperationEquation,
        normalizationEquation,
        transformationSteps,
        prompt: `Calculate ${first.notation} ${symbol} ${second.notation} using like-denominator mixed-number reasoning.`,
        questionEquation: `${first.notation} ${symbol} ${second.notation} = ?`,
        solutionEquation,
        solutionModel: singleGroupModel(result, result.improperNumerator, 'result', 'result'),
        answer: result.notation,
        answerStatement: `The answer is ${result.notation}.`,
        explanation: `${transformationSteps.join(' Then ')} Therefore, ${solutionEquation}.`
    };
};

const presentUnitFractionMultiple = (
    data: UnitFractionMultipleProblem
): UnitFractionMultiplePresentation => {
    const unitFraction = presentFraction(data.unitFraction);
    const product = presentFraction(data.product);
    const story: FractionArithmeticStory = {
        storyKind: 'ribbon-unit-multiple',
        context: `A ribbon is divided into ${data.denominator} equal parts. The highlighted amount is ${product.notation} of the ribbon, and each equal part is ${unitFraction.notation} of the same ribbon.`,
        question: `How many copies of ${unitFraction.notation} make ${product.notation}? Complete the equation.`,
        wholeLabel: 'one ribbon',
        unitLabel: 'of the ribbon',
        givenDisplays: [product.notation, unitFraction.notation],
        unknownRole: 'multiplier'
    };
    const solutionEquation = `${product.notation} = ${data.wholeFactor} × (${unitFraction.notation})`;
    return {
        task: 'unit-fraction-multiple',
        operation: 'multiplication',
        denominator: data.denominator,
        sharedWhole: data.sharedWhole,
        story,
        productKind: product.numerator < product.denominator ? 'proper' : 'improper',
        wholeFactor: data.wholeFactor,
        wholeFactorDisplay: `${data.wholeFactor}`,
        unitFraction,
        product,
        groupCount: data.wholeFactor,
        partsPerGroup: 1,
        totalUnitParts: data.wholeFactor,
        questionModel: singleGroupModel(product, product.numerator, 'given-product', 'result'),
        solutionModel: fractionGroupAggregate(
            product,
            data.wholeFactor,
            1,
            unitFraction.notation,
            'unit-part'
        ),
        prompt: story.question,
        questionEquation: `${product.notation} = ? × (${unitFraction.notation})`,
        solutionEquation,
        equationChain: solutionEquation,
        unitSizeStatement: `Each equal part is ${unitFraction.notation} of the ribbon.`,
        unitMultipleEquation: solutionEquation,
        answer: `${data.wholeFactor}`,
        answerStatement: `${product.notation} is ${data.wholeFactor} copies of ${unitFraction.notation}, so ${solutionEquation}.`,
        explanation: `Each copy is one of ${data.denominator} equal parts of the same whole. ${data.wholeFactor} copies make ${data.wholeFactor} unit parts, so ${solutionEquation}.`
    };
};

const presentWholeNumberFractionProduct = (
    data: WholeNumberFractionProductProblem,
    wordProblem: boolean
): WholeNumberFractionProductPresentation => {
    const fractionFactor = presentFraction(data.fractionFactor);
    const unitFraction = presentFraction({numerator: 1, denominator: data.denominator});
    const product = presentFraction(data.product);
    const fractionAsUnitMultipleEquation = `${fractionFactor.notation} = ${fractionFactor.numerator} × (${unitFraction.notation})`;
    const iteratedUnitEquation = `${data.wholeFactor} × (${fractionFactor.notation}) = ${product.numerator} × (${unitFraction.notation})`;
    const solutionEquation = `${data.wholeFactor} × (${fractionFactor.notation}) = ${product.notation}`;
    const equationChain = `${data.wholeFactor} × (${fractionFactor.notation}) = (${data.wholeFactor} × ${fractionFactor.numerator}) × (${unitFraction.notation}) = ${product.numerator} × (${unitFraction.notation}) = ${product.notation}`;
    const lowerWhole = Math.floor(product.numerator / data.denominator);
    const upperWhole = Math.ceil(product.numerator / data.denominator);
    const question = wordProblem
        ? 'How many meters of ribbon do the craft kits use altogether?'
        : 'Use unit-fraction groups to determine the total ribbon used.';
    const story: FractionArithmeticStory = {
        storyKind: 'equal-fraction-groups',
        context: `${data.wholeFactor} craft kits each use ${fractionFactor.notation} meter of ribbon from the same kind of roll.`,
        question,
        wholeLabel: 'one meter',
        unitLabel: 'meters of ribbon',
        givenDisplays: [`${data.wholeFactor} craft kits`, fractionFactor.notation],
        unknownRole: 'product'
    };
    return {
        task: wordProblem ? 'fraction-multiplication-problem' : 'whole-number-fraction-product',
        operation: 'multiplication',
        denominator: data.denominator,
        sharedWhole: data.sharedWhole,
        story,
        productKind: product.numerator < product.denominator ? 'proper' : 'improper',
        wholeFactor: data.wholeFactor,
        wholeFactorDisplay: `${data.wholeFactor}`,
        fractionFactor,
        unitFraction,
        product,
        groupCount: data.wholeFactor,
        partsPerGroup: fractionFactor.numerator,
        totalUnitParts: product.numerator,
        questionGroupModels: fractionGroupModels(data.wholeFactor, fractionFactor),
        solutionModel: fractionGroupAggregate(
            product,
            data.wholeFactor,
            fractionFactor.numerator,
            fractionFactor.notation,
            'fraction-group'
        ),
        fractionAsUnitMultipleEquation,
        iteratedUnitEquation,
        lowerWhole,
        upperWhole,
        boundsStatement: `${lowerWhole} < ${product.notation} < ${upperWhole}`,
        prompt: wordProblem
            ? question
            : `Use unit fractions to calculate ${data.wholeFactor} × (${fractionFactor.notation}).`,
        questionEquation: `${data.wholeFactor} × (${fractionFactor.notation}) = ?/${data.denominator}`,
        solutionEquation,
        equationChain,
        answer: product.notation,
        answerStatement: wordProblem
            ? `The craft kits use ${product.notation} meters of ribbon.`
            : `The product is ${product.notation}.`,
        explanation: `${fractionAsUnitMultipleEquation}. There are ${data.wholeFactor} groups of ${fractionFactor.numerator} ${countedNoun(fractionFactor.numerator, 'unit part')}, giving ${product.numerator} ${countedNoun(product.numerator, 'unit part')} in all. Therefore, ${equationChain}.`
    };
};

const presentTenthsHundredthsAddition = (
    data: TenthsHundredthsAdditionProblem
): TenthsHundredthsAdditionPresentation => {
    const firstTenths = presentDecimalFraction(data.firstTenths);
    const secondHundredths = presentDecimalFraction(data.secondHundredths);
    const convertedFirst = presentDecimalFraction(data.convertedFirst);
    const result = presentDecimalFraction(data.result);
    const conversionEquation = `${firstTenths.notation} = ${convertedFirst.notation}`;
    const solutionEquation = `${convertedFirst.notation} + ${secondHundredths.notation} = ${result.notation}`;
    const firstGroup: TenthsHundredthsGridGroup = {
        source: 'first-addend',
        label: firstTenths.notation,
        startCell: 0,
        cellCount: firstTenths.numerator
    };
    const secondGroup: TenthsHundredthsGridGroup = {
        source: 'second-addend',
        label: secondHundredths.notation,
        startCell: 0,
        cellCount: secondHundredths.numerator
    };
    const convertedGroup: TenthsHundredthsGridGroup = {
        source: 'first-addend',
        label: convertedFirst.notation,
        startCell: 0,
        cellCount: convertedFirst.numerator
    };
    return {
        task: 'tenths-hundredths-addition',
        operation: 'addition',
        denominator: 100,
        sharedWhole: data.sharedWhole,
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
            factor: data.conversionFactor,
            numeratorEquation: `${firstTenths.numerator} × ${data.conversionFactor} = ${convertedFirst.numerator}`,
            denominatorEquation: `10 × ${data.conversionFactor} = 100`,
            equation: conversionEquation
        },
        prompt: 'Express the tenths as hundredths, then add.',
        questionEquation: `${firstTenths.notation} + ${secondHundredths.notation} = ?/100`,
        conversionEquation,
        solutionEquation,
        equationChain: `${firstTenths.notation} + ${secondHundredths.notation} = ${convertedFirst.notation} + ${secondHundredths.notation} = ${result.notation}`,
        questionModels: {
            firstTenths: makeGrid(firstTenths, [firstGroup]),
            secondHundredths: makeGrid(secondHundredths, [secondGroup])
        },
        solutionModels: {
            convertedFirst: makeGrid(convertedFirst, [convertedGroup]),
            result: makeGrid(result, [
                convertedGroup,
                {...secondGroup, startCell: convertedFirst.numerator}
            ])
        },
        answer: String(result.numerator),
        answerStatement: `${firstTenths.notation} + ${secondHundredths.notation} = ${result.notation}.`,
        explanation: `${conversionEquation} because multiplying its numerator and denominator by ${data.conversionFactor} makes hundredths without changing the amount. Then ${solutionEquation}.`
    };
};

export const presentFractionArithmeticProblem = (
    data: FractionArithmeticProblem,
    presentation: FractionArithmeticPresentation
): FractionArithmeticPresentationProblem | null => {
    if (data.task === 'fraction-operation') {
        if (presentation === 'interpretation') return presentBinary(data, true);
        return presentation === 'execution-model' || presentation === 'execution-word'
            ? presentBinary(data, false)
            : null;
    }
    if (data.task === 'decompose') {
        return presentation === 'understanding' ? presentDecomposition(data) : null;
    }
    if (data.task === 'mixed-operation') {
        return presentation === 'execution-model' || presentation === 'execution-word'
            ? presentMixedOperation(data)
            : null;
    }
    if (data.task === 'unit-fraction-multiple') {
        return presentation === 'interpretation' ? presentUnitFractionMultiple(data) : null;
    }
    if (data.task === 'whole-number-fraction-product') {
        if (presentation === 'understanding' || presentation === 'execution-model') {
            return presentWholeNumberFractionProduct(data, false);
        }
        return presentation === 'execution-word'
            ? presentWholeNumberFractionProduct(data, true)
            : null;
    }
    return presentation === 'execution-model' || presentation === 'execution-word'
        ? presentTenthsHundredthsAddition(data)
        : null;
};

import {
    FractionArithmeticModel,
    FractionArithmeticModelGroup,
    FractionArithmeticProblem,
    FractionArithmeticStory,
    FractionBinaryOperationProblem,
    FractionDecompositionProblem,
    FractionMultiplicationWordProblem,
    FractionParts,
    LikeDenominatorFractionValue,
    MixedFractionOperationProblem,
    MixedFractionValue,
    UnitFractionMultipleProblem,
    WholeNumberFractionProductCommon,
    WholeNumberFractionProductProblem
} from '../../../types/problems.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const;

const validDenominator = (value: number): value is FractionParts =>
    DENOMINATORS.includes(value as FractionParts);

const validFraction = (
    fraction: LikeDenominatorFractionValue,
    denominator: FractionParts
): boolean => typeof fraction === 'object'
    && fraction !== null
    && Number.isInteger(fraction.numerator)
    && fraction.numerator > 0
    && fraction.denominator === denominator
    && fraction.notation === `${fraction.numerator}/${denominator}`;

const validMixed = (
    value: MixedFractionValue,
    denominator: FractionParts,
    requireMixedWhole: boolean
): boolean => typeof value === 'object'
    && value !== null
    && Number.isInteger(value.whole)
    && value.whole >= (requireMixedWhole ? 1 : 0)
    && Number.isInteger(value.numerator)
    && value.numerator > 0
    && value.numerator < denominator
    && value.denominator === denominator
    && value.notation === (value.whole > 0
        ? `${value.whole} ${value.numerator}/${denominator}`
        : `${value.numerator}/${denominator}`)
    && value.improperNumerator === value.whole * denominator + value.numerator
    && value.improperNotation === `${value.improperNumerator}/${denominator}`;

const sameGroups = (
    actual: FractionArithmeticModelGroup[],
    expected: readonly Omit<FractionArithmeticModelGroup, 'startPart'>[]
): boolean => actual.length === expected.length
    && actual.every((group, index) => {
        const expectedGroup = expected[index]!;
        const startPart = expected.slice(0, index)
            .reduce((sum, prior) => sum + prior.partCount, 0);
        return group.id === expectedGroup.id
            && group.role === expectedGroup.role
            && group.label === expectedGroup.label
            && group.startPart === startPart
            && group.partCount === expectedGroup.partCount;
    });

const validModel = (
    model: FractionArithmeticModel,
    denominator: FractionParts,
    display: string,
    totalNumerator: number,
    expectedGroups: readonly Omit<FractionArithmeticModelGroup, 'startPart'>[]
): boolean => {
    if (typeof model !== 'object'
        || model === null
        || !Array.isArray(model.groups)
        || !Array.isArray(model.frames)
        || model.denominator !== denominator
        || model.display !== display
        || model.totalNumerator !== totalNumerator
        || !Number.isInteger(totalNumerator)
        || totalNumerator <= 0
        || totalNumerator > 32
        || Math.ceil(totalNumerator / denominator) > 4
        || ![1, 2, 3, 4].includes(model.frameCount)
        || model.frameCount !== Math.max(1, Math.ceil(totalNumerator / denominator))
        || model.frames.length !== model.frameCount
        || !sameGroups(model.groups, expectedGroups)
        || expectedGroups.reduce((sum, group) => sum + group.partCount, 0) !== totalNumerator) {
        return false;
    }

    const groupByPart = new Map<number, string>();
    for (const group of model.groups) {
        if (!Number.isInteger(group.partCount) || group.partCount <= 0) return false;
        for (let offset = 0; offset < group.partCount; offset += 1) {
            const partIndex = group.startPart + offset;
            if (groupByPart.has(partIndex)) return false;
            groupByPart.set(partIndex, group.id);
        }
    }

    return model.frames.every((frame, frameIndex) => frame.frameIndex === frameIndex
        && frame.cells.length === denominator
        && frame.cells.every((cell, cellIndex) => {
            const partIndex = frameIndex * denominator + cellIndex;
            return cell.partIndex === partIndex
                && cell.groupId === (groupByPart.get(partIndex) ?? null);
        }));
};

const singleGroup = (
    model: FractionArithmeticModel,
    denominator: FractionParts,
    display: string,
    totalNumerator: number,
    id: string,
    role: FractionArithmeticModelGroup['role']
): boolean => validModel(model, denominator, display, totalNumerator, [{
    id,
    role,
    label: display,
    partCount: totalNumerator
}]);

const posterStory = (
    operation: FractionBinaryOperationProblem['operation'],
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

const sameStory = (actual: FractionArithmeticStory, expected: FractionArithmeticStory): boolean =>
    typeof actual === 'object'
    && actual !== null
    && actual.storyKind === expected.storyKind
    && actual.context === expected.context
    && actual.question === expected.question
    && actual.wholeLabel === expected.wholeLabel
    && actual.unitLabel === expected.unitLabel
    && actual.unknownRole === expected.unknownRole
    && Array.isArray(actual.givenDisplays)
    && actual.givenDisplays.length === expected.givenDisplays.length
    && actual.givenDisplays.every((display, index) => display === expected.givenDisplays[index]);

const validBinary = (data: FractionBinaryOperationProblem): boolean => {
    const {denominator, first, second, result} = data;
    if (!['addition', 'subtraction'].includes(data.operation)
        || !Array.isArray(data.questionModels)
        || data.questionModels.length !== 2
        || !validFraction(first, denominator)
        || !validFraction(second, denominator)
        || !validFraction(result, denominator)) return false;

    const isAddition = data.operation === 'addition';
    const resultNumerator = isAddition
        ? first.numerator + second.numerator
        : first.numerator - second.numerator;
    const symbol = isAddition ? '+' : '−';
    const action = isAddition ? 'join' : 'separate';
    const interpretation = data.task === 'interpret-operation';
    const solutionEquation = `${first.notation} ${symbol} ${second.notation} = ${result.notation}`;
    const expectedStory = posterStory(
        data.operation,
        first,
        second,
        interpretation ? 'operation' : 'result'
    );
    const expectedExplanation = isAddition
        ? `The fractions refer to the same whole and have denominator ${denominator}. Joining ${first.numerator} parts and ${second.numerator} parts gives ${result.numerator} parts, so ${solutionEquation}.`
        : `The fractions refer to the same whole and have denominator ${denominator}. Separating ${second.numerator} parts from ${first.numerator} parts leaves ${result.numerator} parts, so ${solutionEquation}.`;

    return resultNumerator === result.numerator
        && resultNumerator > 0
        && data.symbol === symbol
        && data.action === action
        && sameStory(data.story, expectedStory)
        && data.prompt === (interpretation
            ? `Interpret the model as ${action === 'join' ? 'joining' : 'separating'} equal parts of the same whole.`
            : expectedStory.question)
        && data.questionEquation === (interpretation
            ? `${first.notation} ? ${second.notation} = ?`
            : `${first.notation} ${symbol} ${second.notation} = ?/${denominator}`)
        && singleGroup(data.questionModels[0], denominator, first.notation, first.numerator, 'first', 'first-addend')
        && singleGroup(data.questionModels[1], denominator, second.notation, second.numerator, 'second', 'second-addend')
        && data.solutionEquation === solutionEquation
        && (isAddition
            ? validModel(data.solutionModel, denominator, result.notation, result.numerator, [
                {id: 'first', role: 'first-addend', label: first.notation, partCount: first.numerator},
                {id: 'second', role: 'second-addend', label: second.notation, partCount: second.numerator}
            ])
            : validModel(data.solutionModel, denominator, first.notation, first.numerator, [
                {id: 'remaining', role: 'remaining', label: result.notation, partCount: result.numerator},
                {id: 'removed', role: 'removed', label: second.notation, partCount: second.numerator}
            ]))
        && data.answer === (interpretation ? solutionEquation : result.notation)
        && data.answerStatement === (interpretation
            ? `The ${action === 'join' ? 'joining' : 'separating'} operation is ${data.operation}: ${solutionEquation}.`
            : `The answer is ${result.notation} ${data.story.unitLabel}.`)
        && data.explanation === expectedExplanation;
};

const validDecomposition = (data: FractionDecompositionProblem): boolean => {
    const {denominator, sourceFraction, sourceMixed} = data;
    if (!['proper', 'mixed'].includes(data.sourceKind)
        || !Array.isArray(data.decompositions)
        || data.decompositions.length !== 2
        || !Array.isArray(data.solutionEquations)
        || data.solutionEquations.length !== 2
        || data.operation !== 'addition'
        || !validFraction(sourceFraction, denominator)
        || (data.sourceKind === 'proper'
            ? sourceMixed !== null || sourceFraction.numerator >= denominator
            : sourceMixed === null
                || !validMixed(sourceMixed, denominator, true)
                || sourceMixed.improperNumerator !== sourceFraction.numerator
                || sourceFraction.numerator < denominator)) return false;

    const sourceDisplay = sourceMixed?.notation ?? sourceFraction.notation;
    if (data.sourceDisplay !== sourceDisplay
        || !singleGroup(
            data.sourceModel,
            denominator,
            sourceDisplay,
            sourceFraction.numerator,
            'source',
            'result'
        )) return false;

    const canonicalTerms: string[] = [];
    for (const [decompositionIndex, decomposition] of data.decompositions.entries()) {
        if (decomposition.terms.length < 2
            || decomposition.terms.some(term => !validFraction(term, denominator))) return false;
        const numeratorSum = decomposition.terms.reduce((sum, term) => sum + term.numerator, 0);
        if (numeratorSum !== sourceFraction.numerator) return false;
        const sum = decomposition.terms.map(term => term.notation).join(' + ');
        const equation = data.sourceKind === 'mixed'
            ? `${sourceDisplay} = ${sourceFraction.notation} = ${sum}`
            : `${sourceDisplay} = ${sum}`;
        if (decomposition.equation !== equation
            || data.solutionEquations[decompositionIndex] !== equation
            || !validModel(
                decomposition.model,
                denominator,
                sourceDisplay,
                sourceFraction.numerator,
                decomposition.terms.map((term, termIndex) => ({
                    id: `decomposition-${decompositionIndex}-part-${termIndex}`,
                    role: 'decomposition-part',
                    label: term.notation,
                    partCount: term.numerator
                }))
            )) return false;
        canonicalTerms.push(decomposition.terms
            .map(term => term.numerator)
            .sort((first, second) => first - second)
            .join(','));
    }
    if (canonicalTerms[0] === canonicalTerms[1]) return false;

    const story: FractionArithmeticStory = {
        storyKind: 'mosaic-decomposition',
        context: `A mosaic design uses panels divided into ${denominator} equal columns. The tiled amount is ${sourceDisplay} panels.`,
        question: 'What are two different same-denominator decompositions of this amount?',
        wholeLabel: 'one panel',
        unitLabel: 'panels',
        givenDisplays: [sourceDisplay],
        unknownRole: 'decompositions'
    };
    return sameStory(data.story, story)
        && data.prompt === `Decompose ${sourceDisplay} in two different ways using positive fractions with denominator ${denominator}.`
        && data.questionEquation === `${sourceDisplay} = ?`
        && data.answer === data.solutionEquations.join('; ')
        && data.answerStatement === `Two decompositions are ${data.solutionEquations[0]} and ${data.solutionEquations[1]}.`
        && data.explanation === `Each decomposition uses positive addends with denominator ${denominator}, and each set of numerators totals ${sourceFraction.numerator}, so both equations represent the same amount.`;
};

const mixedStory = (
    operation: MixedFractionOperationProblem['operation'],
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

const validMixedOperation = (data: MixedFractionOperationProblem): boolean => {
    const {denominator, first, second, result} = data;
    if (!['addition', 'subtraction'].includes(data.operation)
        || !Array.isArray(data.questionModels)
        || data.questionModels.length !== 2
        || !Array.isArray(data.operandConversionEquations)
        || data.operandConversionEquations.length !== 2
        || !Array.isArray(data.transformationSteps)
        || !validMixed(first, denominator, true)
        || !validMixed(second, denominator, true)
        || !validMixed(result, denominator, false)) return false;
    const addition = data.operation === 'addition';
    const resultImproper = addition
        ? first.improperNumerator + second.improperNumerator
        : first.improperNumerator - second.improperNumerator;
    const regroup = addition
        ? first.numerator + second.numerator >= denominator
        : first.numerator < second.numerator;
    const strategy = `${data.operation}-${regroup ? (addition ? 'with-carry' : 'with-borrow') : (addition ? 'without-carry' : 'without-borrow')}`;
    const symbol = addition ? '+' : '−';
    const conversions: [string, string] = [
        `${first.notation} = ${first.improperNotation}`,
        `${second.notation} = ${second.improperNotation}`
    ];
    const regroupingEquation = regroup
        ? addition
            ? `${first.whole + second.whole} ${first.numerator + second.numerator}/${denominator} = ${result.notation}`
            : `${first.notation} = ${first.whole - 1} ${denominator + first.numerator}/${denominator}`
        : null;
    const resultImproperNotation = `${result.improperNumerator}/${denominator}`;
    const improperEquation = `${first.improperNotation} ${symbol} ${second.improperNotation} = ${resultImproperNotation}`;
    const normalizationEquation = `${resultImproperNotation} = ${result.notation}`;
    const steps = [
        ...conversions,
        ...(regroupingEquation ? [regroupingEquation] : []),
        improperEquation,
        normalizationEquation
    ];
    const solutionEquation = `${first.notation} ${symbol} ${second.notation} = ${result.notation}`;
    const story = mixedStory(data.operation, first, second);

    return resultImproper === result.improperNumerator
        && resultImproper > 0
        && data.symbol === symbol
        && data.strategy === strategy
        && data.requiresRegrouping === regroup
        && sameStory(data.story, story)
        && singleGroup(data.questionModels[0], denominator, first.notation, first.improperNumerator, 'first', 'first-addend')
        && singleGroup(data.questionModels[1], denominator, second.notation, second.improperNumerator, 'second', 'second-addend')
        && JSON.stringify(data.operandConversionEquations) === JSON.stringify(conversions)
        && data.regroupingEquation === regroupingEquation
        && data.improperOperationEquation === improperEquation
        && data.normalizationEquation === normalizationEquation
        && JSON.stringify(data.transformationSteps) === JSON.stringify(steps)
        && data.prompt === `Calculate ${first.notation} ${symbol} ${second.notation} using like-denominator mixed-number reasoning.`
        && data.questionEquation === `${first.notation} ${symbol} ${second.notation} = ?`
        && data.solutionEquation === solutionEquation
        && singleGroup(data.solutionModel, denominator, result.notation, result.improperNumerator, 'result', 'result')
        && data.answer === result.notation
        && data.answerStatement === `The answer is ${result.notation}.`
        && data.explanation === `${steps.join(' Then ')} Therefore, ${solutionEquation}.`;
};

const validMultiplicationCommon = (
    data: UnitFractionMultipleProblem | WholeNumberFractionProductCommon,
    expectedPartsPerGroup: number,
    expectedRole: 'unit-part' | 'fraction-group',
    expectedLabel: string
): boolean => {
    const {denominator, wholeFactor, product, unitFraction} = data;
    const expectedTotal = wholeFactor * expectedPartsPerGroup;
    const expectedProductKind = expectedTotal < denominator ? 'proper' : 'improper';
    const expectedGroups = Array.from({length: wholeFactor}, (_, groupIndex) => ({
        id: `group-${groupIndex}`,
        role: expectedRole,
        label: expectedLabel,
        partCount: expectedPartsPerGroup
    }));

    return data.operation === 'multiplication'
        && Number.isInteger(wholeFactor)
        && wholeFactor >= 2
        && wholeFactor <= 4
        && data.wholeFactorDisplay === `${wholeFactor}`
        && validFraction(unitFraction, denominator)
        && unitFraction.numerator === 1
        && validFraction(product, denominator)
        && data.groupCount === wholeFactor
        && data.partsPerGroup === expectedPartsPerGroup
        && data.totalUnitParts === expectedTotal
        && product.numerator === expectedTotal
        && data.productKind === expectedProductKind
        && validModel(
            data.solutionModel,
            denominator,
            product.notation,
            expectedTotal,
            expectedGroups
        );
};

const validUnitFractionMultiple = (data: UnitFractionMultipleProblem): boolean => {
    const {denominator, wholeFactor, product, unitFraction} = data;
    const solutionEquation = `${product.notation} = ${wholeFactor} × (${unitFraction.notation})`;
    const story: FractionArithmeticStory = {
        storyKind: 'ribbon-unit-multiple',
        context: `A ribbon is divided into ${denominator} equal parts. The highlighted amount is ${product.notation} of the ribbon, and each equal part is ${unitFraction.notation} of the same ribbon.`,
        question: `How many copies of ${unitFraction.notation} make ${product.notation}? Complete the equation.`,
        wholeLabel: 'one ribbon',
        unitLabel: 'of the ribbon',
        givenDisplays: [product.notation, unitFraction.notation],
        unknownRole: 'multiplier'
    };

    return validMultiplicationCommon(data, 1, 'unit-part', unitFraction.notation)
        && sameStory(data.story, story)
        && singleGroup(
            data.questionModel,
            denominator,
            product.notation,
            product.numerator,
            'given-product',
            'result'
        )
        && data.prompt === story.question
        && data.questionEquation === `${product.notation} = ? × (${unitFraction.notation})`
        && data.solutionEquation === solutionEquation
        && data.equationChain === solutionEquation
        && data.unitSizeStatement === `Each equal part is ${unitFraction.notation} of the ribbon.`
        && data.unitMultipleEquation === solutionEquation
        && data.answer === `${wholeFactor}`
        && data.answerStatement === `${product.notation} is ${wholeFactor} copies of ${unitFraction.notation}, so ${solutionEquation}.`
        && data.explanation === `Each copy is one of ${denominator} equal parts of the same whole. ${wholeFactor} copies make ${wholeFactor} unit parts, so ${solutionEquation}.`;
};

const validWholeNumberFractionProduct = (
    data: WholeNumberFractionProductProblem | FractionMultiplicationWordProblem
): boolean => {
    const {denominator, wholeFactor, fractionFactor, product, unitFraction} = data;
    if (!validFraction(fractionFactor, denominator)
        || fractionFactor.numerator < 2
        || fractionFactor.numerator >= denominator
        || !Array.isArray(data.questionGroupModels)
        || data.questionGroupModels.length !== wholeFactor) return false;

    const fractionAsUnitMultipleEquation = `${fractionFactor.notation} = ${fractionFactor.numerator} × (${unitFraction.notation})`;
    const iteratedUnitEquation = `${wholeFactor} × (${fractionFactor.notation}) = ${product.numerator} × (${unitFraction.notation})`;
    const solutionEquation = `${wholeFactor} × (${fractionFactor.notation}) = ${product.notation}`;
    const equationChain = `${wholeFactor} × (${fractionFactor.notation}) = (${wholeFactor} × ${fractionFactor.numerator}) × (${unitFraction.notation}) = ${product.numerator} × (${unitFraction.notation}) = ${product.notation}`;
    const story: FractionArithmeticStory = {
        storyKind: 'equal-fraction-groups',
        context: `${wholeFactor} craft kits each use ${fractionFactor.notation} meter of ribbon from the same kind of roll.`,
        question: data.task === 'whole-number-fraction-product'
            ? 'Use unit-fraction groups to determine the total ribbon used.'
            : 'How many meters of ribbon do the craft kits use altogether?',
        wholeLabel: 'one meter',
        unitLabel: 'meters of ribbon',
        givenDisplays: [`${wholeFactor} craft kits`, fractionFactor.notation],
        unknownRole: 'product'
    };
    const validQuestionGroups = data.questionGroupModels.every((model, groupIndex) =>
        singleGroup(
            model,
            denominator,
            fractionFactor.notation,
            fractionFactor.numerator,
            `group-${groupIndex}`,
            'fraction-group'
        ));
    const expectedPrompt = data.task === 'whole-number-fraction-product'
        ? `Use unit fractions to calculate ${wholeFactor} × (${fractionFactor.notation}).`
        : story.question;
    const expectedStatement = data.task === 'whole-number-fraction-product'
        ? `The product is ${product.notation}.`
        : `The craft kits use ${product.notation} meters of ribbon.`;
    const expectedExplanation = `${fractionAsUnitMultipleEquation}. There are ${wholeFactor} groups of ${fractionFactor.numerator} unit parts, giving ${product.numerator} unit parts in all. Therefore, ${equationChain}.`;

    if (!validMultiplicationCommon(
        data,
        fractionFactor.numerator,
        'fraction-group',
        fractionFactor.notation
    )
        || !validQuestionGroups
        || !sameStory(data.story, story)
        || data.fractionAsUnitMultipleEquation !== fractionAsUnitMultipleEquation
        || data.iteratedUnitEquation !== iteratedUnitEquation
        || data.prompt !== expectedPrompt
        || data.questionEquation !== `${wholeFactor} × (${fractionFactor.notation}) = ?/${denominator}`
        || data.solutionEquation !== solutionEquation
        || data.equationChain !== equationChain
        || data.answer !== product.notation
        || data.answerStatement !== expectedStatement
        || data.explanation !== expectedExplanation) return false;

    if (data.task === 'whole-number-fraction-product') return true;
    const lowerWhole = Math.floor(product.numerator / denominator);
    const upperWhole = Math.ceil(product.numerator / denominator);
    return product.numerator % denominator !== 0
        && data.lowerWhole === lowerWhole
        && data.upperWhole === upperWhole
        && data.boundsStatement === `${lowerWhole} < ${product.notation} < ${upperWhole}`;
};

export const isValidFractionArithmeticProblem = (data: FractionArithmeticProblem): boolean =>
    typeof data === 'object'
    && data !== null
    && validDenominator(data.denominator)
    && data.sharedWhole === 1
    && data.referenceId === 'same-whole'
    && (data.task === 'unit-fraction-multiple'
        ? validUnitFractionMultiple(data)
        : data.task === 'whole-number-fraction-product'
            || data.task === 'fraction-multiplication-problem'
            ? validWholeNumberFractionProduct(data)
            : data.task === 'interpret-operation' || data.task === 'fraction-operation'
        ? validBinary(data)
        : data.task === 'decompose'
            ? validDecomposition(data)
            : data.task === 'mixed-operation' && validMixedOperation(data));

import {
    UnlikeFractionOperationProblem,
    UnlikeMixedOperationProblem
} from '../../../types/problems.ts';

type UnlikeProblem = UnlikeFractionOperationProblem | UnlikeMixedOperationProblem;

export type UnlikePartitionGroup = {
    role: 'first' | 'second' | 'remaining' | 'removed';
    count: number;
    label: string;
};

export type UnlikePartitionModel = {
    display: string;
    denominator: number;
    totalParts: number;
    groups: UnlikePartitionGroup[];
};

export type UnlikeOperandPresentation = {
    original: UnlikePartitionModel;
    converted: UnlikePartitionModel;
    originalDisplay: string;
    equivalentDisplay: string;
    factor: number;
    fractionalConversionEquation: string;
    mixedConversionEquation: string | null;
    improperDisplay: string;
};

export type UnlikeFractionArithmeticPresentation = {
    task: UnlikeProblem['task'];
    operation: UnlikeProblem['operation'];
    symbol: '+' | '−';
    sharedWhole: 1;
    commonDenominator: number;
    first: UnlikeOperandPresentation;
    second: UnlikeOperandPresentation;
    resultModel: UnlikePartitionModel;
    resultDisplay: string;
    story: {
        context: string;
        question: string;
        wholeLabel: 'one mile';
        unitLabel: 'miles';
        givenDisplays: [string, string];
        unknownRole: 'result';
    };
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    commonOperationEquation: string;
    normalizationEquation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

const mixedDisplay = (whole: number, numerator: number, denominator: number): string =>
    numerator === 0 ? String(whole)
        : whole === 0 ? `${numerator}/${denominator}`
            : `${whole} ${numerator}/${denominator}`;

const operandPresentation = (
    problem: UnlikeProblem,
    position: 'first' | 'second'
): UnlikeOperandPresentation => {
    const operand = problem[position];
    const conversion = position === 'first' ? problem.firstConversion : problem.secondConversion;
    const whole = 'whole' in operand ? operand.whole : 0;
    const originalDisplay = problem.task === 'unlike-mixed-operation'
        ? mixedDisplay(whole, operand.numerator, operand.denominator)
        : `${operand.numerator}/${operand.denominator}`;
    const convertedPart = conversion.fractionalNumeratorAtCommonDenominator;
    const convertedImproper = conversion.improperNumeratorAtCommonDenominator;
    const equivalentDisplay = problem.task === 'unlike-mixed-operation'
        ? mixedDisplay(whole, convertedPart, problem.commonDenominator)
        : `${convertedPart}/${problem.commonDenominator}`;
    const improperDisplay = `${convertedImproper}/${problem.commonDenominator}`;
    const role = position === 'first' ? 'first' : 'second';
    return {
        original: {
            display: originalDisplay,
            denominator: operand.denominator,
            totalParts: whole * operand.denominator + operand.numerator,
            groups: [{role, count: whole * operand.denominator + operand.numerator, label: originalDisplay}]
        },
        converted: {
            display: equivalentDisplay,
            denominator: problem.commonDenominator,
            totalParts: convertedImproper,
            groups: [{role, count: convertedImproper, label: equivalentDisplay}]
        },
        originalDisplay,
        equivalentDisplay,
        factor: conversion.factor,
        fractionalConversionEquation: `${operand.numerator}/${operand.denominator} × ${conversion.factor}/${conversion.factor} = ${convertedPart}/${problem.commonDenominator}`,
        mixedConversionEquation: problem.task === 'unlike-mixed-operation'
            ? `${originalDisplay} = ${equivalentDisplay} = ${improperDisplay}`
            : null,
        improperDisplay
    };
};

export const presentUnlikeFractionArithmetic = (
    problem: UnlikeProblem
): UnlikeFractionArithmeticPresentation => {
    const first = operandPresentation(problem, 'first');
    const second = operandPresentation(problem, 'second');
    const symbol = problem.operation === 'addition' ? '+' : '−';
    const rawResult = `${problem.resultAtCommonDenominator.numerator}/${problem.commonDenominator}`;
    const resultDisplay = problem.task === 'unlike-mixed-operation'
        ? mixedDisplay(problem.result.whole, problem.result.numerator, problem.result.denominator)
        : problem.result.numerator === 0 ? '0'
            : problem.result.denominator === 1 ? String(problem.result.numerator)
            : `${problem.result.numerator}/${problem.result.denominator}`;
    const firstMeasure = problem.task === 'unlike-fraction-operation'
        ? `${first.originalDisplay} of a mile`
        : `${first.originalDisplay} miles`;
    const secondMeasure = problem.task === 'unlike-fraction-operation'
        ? `${second.originalDisplay} of a mile`
        : `${second.originalDisplay} miles`;
    const commonOperationEquation = `${first.improperDisplay} ${symbol} ${second.improperDisplay} = ${rawResult}`;
    const solutionEquation = `${first.originalDisplay} ${symbol} ${second.originalDisplay} = ${resultDisplay}`;
    const resultModel: UnlikePartitionModel = {
        display: resultDisplay,
        denominator: problem.commonDenominator,
        totalParts: problem.operation === 'addition'
            ? problem.resultAtCommonDenominator.numerator
            : problem.firstConversion.improperNumeratorAtCommonDenominator,
        groups: problem.operation === 'addition' ? [
            {role: 'first', count: problem.firstConversion.improperNumeratorAtCommonDenominator, label: first.equivalentDisplay},
            {role: 'second', count: problem.secondConversion.improperNumeratorAtCommonDenominator, label: second.equivalentDisplay}
        ] : [
            {role: 'remaining', count: problem.resultAtCommonDenominator.numerator, label: `${rawResult} remains`},
            {role: 'removed', count: problem.secondConversion.improperNumeratorAtCommonDenominator, label: `${second.equivalentDisplay} removed`}
        ]
    };
    const story = problem.operation === 'addition' ? {
        context: `A trail has two sections. The first is ${firstMeasure} long and the second is ${secondMeasure} long. Both distances use the same mile as one whole.`,
        question: 'How many miles long are the two sections altogether?',
        wholeLabel: 'one mile' as const,
        unitLabel: 'miles' as const,
        givenDisplays: [first.originalDisplay, second.originalDisplay] as [string, string],
        unknownRole: 'result' as const
    } : {
        context: `A route is ${firstMeasure} long. A traveler has completed ${secondMeasure}. Both distances use the same mile as one whole.`,
        question: 'How many miles remain?',
        wholeLabel: 'one mile' as const,
        unitLabel: 'miles' as const,
        givenDisplays: [first.originalDisplay, second.originalDisplay] as [string, string],
        unknownRole: 'result' as const
    };
    return {
        task: problem.task,
        operation: problem.operation,
        symbol,
        sharedWhole: problem.sharedWhole,
        commonDenominator: problem.commonDenominator,
        first,
        second,
        resultModel,
        resultDisplay,
        story,
        prompt: `Calculate ${first.originalDisplay} ${symbol} ${second.originalDisplay}. Rewrite both amounts with equal-sized parts of the same whole.`,
        questionEquation: `${first.originalDisplay} ${symbol} ${second.originalDisplay} = ______`,
        solutionEquation,
        commonOperationEquation,
        normalizationEquation: `${rawResult} = ${resultDisplay}`,
        answer: resultDisplay,
        answerStatement: problem.operation === 'addition'
            ? `The two sections are ${resultDisplay} miles long altogether.`
            : `${resultDisplay} miles remain.`,
        explanation: `The original amounts use the same mile but different partitions. ${first.fractionalConversionEquation}; ${second.fractionalConversionEquation}. With ${problem.commonDenominator} equal parts per mile, ${commonOperationEquation}, so ${solutionEquation}.`
    };
};

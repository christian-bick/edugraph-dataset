import {
    MeasurementWordProblemGrade4,
    MeasurementWordProblemKind,
    MeasurementWordProblemNumberKind,
    MeasurementWordProblemUnit,
    MeasurementWordProblemValue
} from '../../../../types/problems.ts';

const UNIT_BY_KIND: Record<MeasurementWordProblemKind, MeasurementWordProblemUnit> = {
    length: {id: 'meter', singular: 'meter', plural: 'meters', symbol: 'm', symbolPlacement: 'suffix'},
    time: {id: 'hour', singular: 'hour', plural: 'hours', symbol: 'h', symbolPlacement: 'suffix'},
    'liquid-volume': {id: 'liter', singular: 'liter', plural: 'liters', symbol: 'L', symbolPlacement: 'suffix'},
    weight: {id: 'kilogram', singular: 'kilogram', plural: 'kilograms', symbol: 'kg', symbolPlacement: 'suffix'},
    money: {id: 'dollar', singular: 'dollar', plural: 'dollars', symbol: '$', symbolPlacement: 'prefix'}
};

const isNonEmptyText = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const isSameUnit = (
    actual: MeasurementWordProblemUnit | null | undefined,
    expected: MeasurementWordProblemUnit
): boolean => actual != null
    && typeof actual === 'object'
    && actual.id === expected.id
    && actual.singular === expected.singular
    && actual.plural === expected.plural
    && actual.symbol === expected.symbol
    && actual.symbolPlacement === expected.symbolPlacement;

const isExactValue = (
    value: MeasurementWordProblemValue | null | undefined
): value is MeasurementWordProblemValue => value != null
    && typeof value === 'object'
    && Number.isSafeInteger(value.numerator)
    && value.numerator > 0
    && Number.isSafeInteger(value.denominator)
    && value.denominator > 0
    && isNonEmptyText(value.display)
    && isNonEmptyText(value.quantityText)
    && isNonEmptyText(value.equationTerm);

const greatestCommonDivisor = (left: number, right: number): number => {
    let a = left;
    let b = right;
    while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
};

const sameRational = (
    leftNumerator: number,
    leftDenominator: number,
    right: MeasurementWordProblemValue
): boolean => BigInt(leftNumerator) * BigInt(right.denominator)
    === BigInt(right.numerator) * BigInt(leftDenominator);

const hasNumberKind = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind
): boolean => {
    if (numberKind === 'integer') {
        return value.denominator === 1
            && value.display === String(value.numerator);
    }
    if (numberKind === 'fraction') {
        return value.denominator > 1
            && value.numerator < value.denominator
            && greatestCommonDivisor(value.numerator, value.denominator) === 1
            && value.display === `${value.numerator}/${value.denominator}`;
    }
    if (numberKind !== 'decimal') return false;
    return value.denominator > 1
        && value.numerator % value.denominator !== 0
        && value.display.includes('.');
};

const hasExpectedQuantityText = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind,
    unit: MeasurementWordProblemUnit
): boolean => {
    if (unit.id === 'dollar') {
        if (numberKind === 'fraction') {
            return value.quantityText === `${value.display} of a dollar`;
        }
        return value.quantityText === `$${value.display}`;
    }
    const unitName = value.numerator === value.denominator
        ? unit.singular
        : unit.plural;
    return value.quantityText === `${value.display} ${unitName}`;
};

const hasExpectedDecimalDisplay = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind,
    unit: MeasurementWordProblemUnit
): boolean => {
    if (numberKind !== 'decimal') return true;
    const denominator = unit.id === 'dollar' ? 100 : 10;
    const digits = unit.id === 'dollar' ? 2 : 1;
    return value.denominator === denominator
        && value.display === (value.numerator / denominator).toFixed(digits);
};

const hasExpectedEquationTerm = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind,
    unit: MeasurementWordProblemUnit
): boolean => {
    if (unit.id !== 'dollar') return value.equationTerm === value.quantityText;
    if (numberKind === 'fraction') {
        return value.equationTerm === `${value.display} dollar`;
    }
    return value.equationTerm === `$${value.display}`;
};

const isMeasuredValue = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind,
    unit: MeasurementWordProblemUnit
): boolean => isExactValue(value)
    && hasNumberKind(value, numberKind)
    && hasExpectedDecimalDisplay(value, numberKind, unit)
    && hasExpectedQuantityText(value, numberKind, unit)
    && hasExpectedEquationTerm(value, numberKind, unit);

const expectedOperandLabels = {
    addition: ['First amount', 'Amount added'],
    subtraction: ['Starting amount', 'Amount used'],
    multiplication: ['Equal groups', 'Amount in each group'],
    division: ['Total amount', 'Equal groups']
} as const;

const operationSymbols = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
} as const;

const expectedExplanation = (
    data: MeasurementWordProblemGrade4
): string => {
    if (data.operation === 'addition') {
        return `Add the two measured amounts: ${data.solutionEquation}.`;
    }
    if (data.operation === 'subtraction') {
        return `Subtract the amount used from the starting amount: ${data.solutionEquation}.`;
    }
    if (data.operation === 'multiplication') {
        return `Multiply the number of equal groups by the amount in each group: ${data.solutionEquation}.`;
    }
    return `Divide the total measured amount by the number of equal groups: ${data.solutionEquation}.`;
};

const equationTerms = (
    data: MeasurementWordProblemGrade4
): readonly [string, string] => data.operands.map(operand =>
    operand.role === 'measured' ? operand.value.equationTerm : String(operand.count)
) as [string, string];

export const isValidMeasurementWordProblemGrade4 = (
    data: MeasurementWordProblemGrade4
): boolean => {
    if (data.task !== 'grade4-measurement-word-problem') return false;
    const expectedUnit = UNIT_BY_KIND[data.measurementKind];
    if (!expectedUnit || !isSameUnit(data.unit, expectedUnit)) return false;
    if (!Array.isArray(data.operands) || data.operands.length !== 2) return false;
    const [firstOperand, secondOperand] = data.operands;
    if (firstOperand == null
        || typeof firstOperand !== 'object'
        || secondOperand == null
        || typeof secondOperand !== 'object') return false;
    if (!isNonEmptyText(data.story)
        || !isNonEmptyText(data.question)
        || !isNonEmptyText(data.questionEquation)
        || !isNonEmptyText(data.solutionEquation)
        || !isNonEmptyText(data.answerStatement)
        || !isNonEmptyText(data.explanation)
        || !data.questionEquation.includes('?')
        || data.solutionEquation.includes('?')
        || !isMeasuredValue(data.answer, data.numberKind, data.unit)) return false;

    const labels = expectedOperandLabels[data.operation];
    if (!labels
        || data.operands[0].label !== labels[0]
        || data.operands[1].label !== labels[1]) return false;
    const [leftTerm, rightTerm] = equationTerms(data);
    const leftHandSide = `${leftTerm} ${operationSymbols[data.operation]} ${rightTerm}`;
    const unknownTerm = data.measurementKind === 'money' ? '?' : `? ${data.unit.symbol}`;
    if (data.questionEquation !== `${leftHandSide} = ${unknownTerm}`
        || data.solutionEquation !== `${leftHandSide} = ${data.answer.equationTerm}`
        || data.answerStatement !== `The answer is ${data.answer.quantityText}.`
        || data.explanation !== expectedExplanation(data)) return false;

    if (data.operation === 'addition' || data.operation === 'subtraction') {
        const [left, right] = data.operands;
        if (left.role !== 'measured'
            || right.role !== 'measured'
            || !isNonEmptyText(left.label)
            || !isNonEmptyText(right.label)
            || !isMeasuredValue(left.value, data.numberKind, data.unit)
            || !isMeasuredValue(right.value, data.numberKind, data.unit)) return false;
        const denominator = left.value.denominator * right.value.denominator;
        const leftNumerator = left.value.numerator * right.value.denominator;
        const rightNumerator = right.value.numerator * left.value.denominator;
        const numerator = data.operation === 'addition'
            ? leftNumerator + rightNumerator
            : leftNumerator - rightNumerator;
        return numerator > 0 && sameRational(numerator, denominator, data.answer);
    }

    if (data.operation === 'multiplication') {
        const [groups, measured] = data.operands;
        return groups.role === 'group-count'
            && Number.isSafeInteger(groups.count)
            && groups.count > 0
            && groups.display === `${groups.count} equal groups`
            && isNonEmptyText(groups.label)
            && measured.role === 'measured'
            && isNonEmptyText(measured.label)
            && isMeasuredValue(measured.value, data.numberKind, data.unit)
            && sameRational(
                groups.count * measured.value.numerator,
                measured.value.denominator,
                data.answer
            );
    }

    const [measured, groups] = data.operands;
    return measured.role === 'measured'
        && isNonEmptyText(measured.label)
        && isMeasuredValue(measured.value, data.numberKind, data.unit)
        && groups.role === 'group-count'
        && Number.isSafeInteger(groups.count)
        && groups.count > 0
        && groups.display === `${groups.count} equal groups`
        && isNonEmptyText(groups.label)
        && sameRational(
            measured.value.numerator,
            measured.value.denominator * groups.count,
            data.answer
        );
};

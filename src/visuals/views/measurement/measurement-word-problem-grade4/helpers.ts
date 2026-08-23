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

const OPERAND_LABELS = {
    addition: ['First amount', 'Amount added'],
    subtraction: ['Starting amount', 'Amount used'],
    multiplication: ['Equal groups', 'Amount in each group'],
    division: ['Total amount', 'Equal groups']
} as const;

const OPERATION_SYMBOLS = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
} as const;

type PresentedValue = MeasurementWordProblemValue & {
    display: string;
    quantityText: string;
    equationTerm: string;
};

export type MeasurementWordProblemPresentation = {
    unit: MeasurementWordProblemUnit;
    story: string;
    question: string;
    operands: readonly [
        {role: 'measured' | 'group-count'; label: string; text: string},
        {role: 'measured' | 'group-count'; label: string; text: string}
    ];
    questionEquation: string;
    solutionEquation: string;
    answer: PresentedValue;
    answerStatement: string;
    explanation: string;
};

const greatestCommonDivisor = (left: number, right: number): number => {
    let first = Math.abs(left);
    let second = Math.abs(right);
    while (second !== 0) [first, second] = [second, first % second];
    return first;
};

const isExactValue = (value: MeasurementWordProblemValue | null | undefined): boolean => value != null
    && typeof value === 'object'
    && Number.isSafeInteger(value.numerator)
    && value.numerator > 0
    && Number.isSafeInteger(value.denominator)
    && value.denominator > 0;

const hasNumberKind = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind,
    measurementKind: MeasurementWordProblemKind
): boolean => {
    if (numberKind === 'integer') return value.denominator === 1;
    if (numberKind === 'fraction') {
        return value.denominator > 1
            && value.numerator < value.denominator
            && greatestCommonDivisor(value.numerator, value.denominator) === 1;
    }
    return value.denominator === (measurementKind === 'money' ? 100 : 10)
        && value.numerator % value.denominator !== 0;
};

const sameRational = (
    leftNumerator: number,
    leftDenominator: number,
    right: MeasurementWordProblemValue
): boolean => BigInt(leftNumerator) * BigInt(right.denominator)
    === BigInt(right.numerator) * BigInt(leftDenominator);

export const isValidMeasurementWordProblemGrade4 = (
    data: MeasurementWordProblemGrade4
): boolean => {
    const expectedUnit = UNIT_BY_KIND[data.measurementKind];
    if (!expectedUnit
        || data.unitId !== expectedUnit.id
        || !['integer', 'fraction', 'decimal'].includes(data.numberKind)
        || !isExactValue(data.answer)
        || !hasNumberKind(data.answer, data.numberKind, data.measurementKind)
        || !Array.isArray(data.operands)
        || data.operands.length !== 2
        || data.operands.some(operand => operand == null || typeof operand !== 'object')) return false;

    if (data.operation === 'addition' || data.operation === 'subtraction') {
        const [left, right] = data.operands;
        if (left.role !== 'measured'
            || right.role !== 'measured'
            || !isExactValue(left.value)
            || !isExactValue(right.value)
            || !hasNumberKind(left.value, data.numberKind, data.measurementKind)
            || !hasNumberKind(right.value, data.numberKind, data.measurementKind)) return false;
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
            && groups.count > 1
            && measured.role === 'measured'
            && isExactValue(measured.value)
            && hasNumberKind(measured.value, data.numberKind, data.measurementKind)
            && sameRational(
                groups.count * measured.value.numerator,
                measured.value.denominator,
                data.answer
            );
    }

    if (data.operation !== 'division') return false;
    const [measured, groups] = data.operands;
    return measured.role === 'measured'
        && isExactValue(measured.value)
        && hasNumberKind(measured.value, data.numberKind, data.measurementKind)
        && groups.role === 'group-count'
        && Number.isSafeInteger(groups.count)
        && groups.count > 1
        && sameRational(
            measured.value.numerator,
            measured.value.denominator * groups.count,
            data.answer
        );
};

const formatDisplay = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind
): string => {
    if (numberKind === 'integer') return String(value.numerator);
    if (numberKind === 'fraction') return `${value.numerator}/${value.denominator}`;
    const digits = value.denominator === 100 ? 2 : 1;
    return (value.numerator / value.denominator).toFixed(digits);
};

const presentValue = (
    value: MeasurementWordProblemValue,
    numberKind: MeasurementWordProblemNumberKind,
    unit: MeasurementWordProblemUnit
): PresentedValue => {
    const display = formatDisplay(value, numberKind);
    if (unit.id === 'dollar') {
        const quantityText = numberKind === 'fraction'
            ? `${display} of a dollar`
            : `$${display}`;
        return {
            ...value,
            display,
            quantityText,
            equationTerm: numberKind === 'fraction' ? `${display} dollar` : quantityText
        };
    }
    const unitName = value.numerator === value.denominator ? unit.singular : unit.plural;
    const quantityText = `${display} ${unitName}`;
    return {...value, display, quantityText, equationTerm: quantityText};
};

const context = (
    measurementKind: MeasurementWordProblemKind,
    operation: MeasurementWordProblemGrade4['operation'],
    first: string,
    second: string,
    groupCount?: number
): readonly [string, string] => {
    if (measurementKind === 'length') {
        if (operation === 'addition') return [`A walking route has one section that is ${first} long and another section that is ${second} long.`, 'How long is the route altogether?'];
        if (operation === 'subtraction') return [`A ribbon is ${first} long. A piece that is ${second} long is cut off.`, 'How much ribbon remains?'];
        if (operation === 'multiplication') return [`There are ${groupCount} equal ribbon pieces. Each piece is ${first} long.`, 'How long are the ribbon pieces altogether?'];
        return [`A ribbon that is ${first} long is cut into ${groupCount} equal pieces.`, 'How long is each piece?'];
    }
    if (measurementKind === 'time') {
        if (operation === 'addition') return [`One activity lasts ${first}, and a second activity lasts ${second}.`, 'How much time do the activities take altogether?'];
        if (operation === 'subtraction') return [`A block of time lasts ${first}. After ${second} has passed, the activity continues.`, 'How much time remains?'];
        if (operation === 'multiplication') return [`A practice session lasts ${first}. A class completes ${groupCount} equal sessions.`, 'How much time do the sessions take altogether?'];
        return [`A total time of ${first} is shared equally among ${groupCount} activities.`, 'How much time does each activity receive?'];
    }
    if (measurementKind === 'liquid-volume') {
        if (operation === 'addition') return [`A pitcher contains ${first}. Another ${second} is poured in.`, 'How much liquid is in the pitcher now?'];
        if (operation === 'subtraction') return [`A tank contains ${first}. Then ${second} is poured out.`, 'How much liquid remains?'];
        if (operation === 'multiplication') return [`There are ${groupCount} identical bottles. Each bottle holds ${first}.`, 'How much liquid do the bottles hold altogether?'];
        return [`A total of ${first} is poured equally into ${groupCount} containers.`, 'How much liquid is in each container?'];
    }
    if (measurementKind === 'weight') {
        if (operation === 'addition') return [`One package has a mass of ${first}, and another has a mass of ${second}.`, 'What is the combined mass of the packages?'];
        if (operation === 'subtraction') return [`A supply bag has a mass of ${first}. Material with a mass of ${second} is removed.`, 'What mass remains in the bag?'];
        if (operation === 'multiplication') return [`There are ${groupCount} identical packages. Each package has a mass of ${first}.`, 'What is the total mass of the packages?'];
        return [`Material with a total mass of ${first} is divided equally among ${groupCount} packages.`, 'What is the mass of each package?'];
    }
    if (operation === 'addition') return [`A student saves ${first} and then saves another ${second}.`, 'How much money has the student saved altogether?'];
    if (operation === 'subtraction') return [`A student has ${first} and spends ${second}.`, 'How much money remains?'];
    if (operation === 'multiplication') return [`There are ${groupCount} identical notebooks. Each notebook costs ${first}.`, 'How much do the notebooks cost altogether?'];
    return [`A total of ${first} is shared equally among ${groupCount} students.`, 'How much money does each student receive?'];
};

const explanation = (
    operation: MeasurementWordProblemGrade4['operation'],
    solutionEquation: string
): string => {
    if (operation === 'addition') return `Add the two measured amounts: ${solutionEquation}.`;
    if (operation === 'subtraction') return `Subtract the amount used from the starting amount: ${solutionEquation}.`;
    if (operation === 'multiplication') return `Multiply the number of equal groups by the amount in each group: ${solutionEquation}.`;
    return `Divide the total measured amount by the number of equal groups: ${solutionEquation}.`;
};

export const buildMeasurementWordProblemPresentation = (
    data: MeasurementWordProblemGrade4
): MeasurementWordProblemPresentation | null => {
    if (!isValidMeasurementWordProblemGrade4(data)) return null;
    const unit = UNIT_BY_KIND[data.measurementKind];
    const labels = OPERAND_LABELS[data.operation];
    const presentOperand = (
        operand: MeasurementWordProblemGrade4['operands'][number],
        index: 0 | 1
    ): MeasurementWordProblemPresentation['operands'][number] => {
        if (operand.role === 'group-count') {
            return {
                role: operand.role,
                label: labels[index],
                text: `${operand.count} equal groups`
            };
        }
        return {
            role: operand.role,
            label: labels[index],
            text: presentValue(operand.value, data.numberKind, unit).quantityText
        };
    };
    const presentedOperands: MeasurementWordProblemPresentation['operands'] = [
        presentOperand(data.operands[0], 0),
        presentOperand(data.operands[1], 1)
    ];
    const equationTerms = data.operands.map(operand => operand.role === 'measured'
        ? presentValue(operand.value, data.numberKind, unit).equationTerm
        : String(operand.count)) as [string, string];
    const answer = presentValue(data.answer, data.numberKind, unit);
    const leftHandSide = `${equationTerms[0]} ${OPERATION_SYMBOLS[data.operation]} ${equationTerms[1]}`;
    const questionEquation = `${leftHandSide} = ${unit.symbolPlacement === 'prefix' ? '?' : `? ${unit.symbol}`}`;
    const solutionEquation = `${leftHandSide} = ${answer.equationTerm}`;
    const firstMeasured = presentedOperands.find(operand => operand.role === 'measured')!.text;
    const groupCount = data.operands[0].role === 'group-count'
        ? data.operands[0].count
        : data.operands[1].role === 'group-count'
            ? data.operands[1].count
            : undefined;
    const [story, question] = context(
        data.measurementKind,
        data.operation,
        presentedOperands[0].role === 'measured' ? presentedOperands[0].text : firstMeasured,
        presentedOperands[1].role === 'measured' ? presentedOperands[1].text : presentedOperands[1].text,
        groupCount
    );
    return {
        unit,
        story,
        question,
        operands: presentedOperands,
        questionEquation,
        solutionEquation,
        answer,
        answerStatement: `The answer is ${answer.quantityText}.`,
        explanation: explanation(data.operation, solutionEquation)
    };
};

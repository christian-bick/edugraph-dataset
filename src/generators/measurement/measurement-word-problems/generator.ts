import {Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ArithmeticOperation,
    MeasurementWordProblemGrade4,
    MeasurementWordProblemKind,
    MeasurementWordProblemMeasuredOperand,
    MeasurementWordProblemNumberKind,
    MeasurementWordProblemUnit,
    MeasurementWordProblemValue
} from '../../../types/problems.ts';
import {operationNames} from '../../arithmetic/helpers.ts';
import {
    MeasurementWordProblemsGeneratorConfig,
    MeasurementWordProblemsGeneratorSchema
} from './spec.ts';

type ExactValue = {numerator: number; denominator: number};

type AdditiveSample = {
    operation: 'addition';
    first: ExactValue;
    second: ExactValue;
    answer: ExactValue;
} | {
    operation: 'subtraction';
    first: ExactValue;
    second: ExactValue;
    answer: ExactValue;
};

type MultiplicationSample = {
    operation: 'multiplication';
    groupCount: number;
    measured: ExactValue;
    answer: ExactValue;
};

type DivisionSample = {
    operation: 'division';
    total: ExactValue;
    groupCount: number;
    answer: ExactValue;
};

type MathSample = AdditiveSample | MultiplicationSample | DivisionSample;

const units: Record<MeasurementWordProblemKind, MeasurementWordProblemUnit> = {
    length: {id: 'meter', singular: 'meter', plural: 'meters', symbol: 'm', symbolPlacement: 'suffix'},
    time: {id: 'hour', singular: 'hour', plural: 'hours', symbol: 'h', symbolPlacement: 'suffix'},
    'liquid-volume': {id: 'liter', singular: 'liter', plural: 'liters', symbol: 'L', symbolPlacement: 'suffix'},
    weight: {id: 'kilogram', singular: 'kilogram', plural: 'kilograms', symbol: 'kg', symbolPlacement: 'suffix'},
    money: {id: 'dollar', singular: 'dollar', plural: 'dollars', symbol: '$', symbolPlacement: 'prefix'}
};

const unitTags: Record<MeasurementWordProblemKind, Scope | undefined> = {
    length: Scope.MeterScale,
    time: Scope.HourIntervals,
    'liquid-volume': Scope.LiterScale,
    weight: Scope.KilogramScale,
    money: undefined
};

const integer = (value: number): ExactValue => ({numerator: value, denominator: 1});

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

const randomInteger = (min: number, max: number): number =>
    min + Math.floor(random() * (max - min + 1));

const gcd = (a: number, b: number): number => {
    let first = Math.abs(a);
    let second = Math.abs(b);
    while (second !== 0) {
        [first, second] = [second, first % second];
    }
    return first;
};

const reduced = ({numerator, denominator}: ExactValue): ExactValue => {
    const divisor = gcd(numerator, denominator);
    return {numerator: numerator / divisor, denominator: denominator / divisor};
};

const decimalValue = (tenths: number, measurementKind: MeasurementWordProblemKind): ExactValue =>
    measurementKind === 'money'
        ? {numerator: tenths * 10, denominator: 100}
        : {numerator: tenths, denominator: 10};

const sampleInteger = (operation: ArithmeticOperation): MathSample => {
    if (operation === 'addition') {
        const first = randomInteger(2, 20);
        const second = randomInteger(2, 20);
        return {operation, first: integer(first), second: integer(second), answer: integer(first + second)};
    }
    if (operation === 'subtraction') {
        const second = randomInteger(2, 10);
        const answer = randomInteger(1, 15);
        return {operation, first: integer(second + answer), second: integer(second), answer: integer(answer)};
    }
    if (operation === 'multiplication') {
        const groupCount = randomInteger(2, 6);
        const measured = randomInteger(2, 12);
        return {operation, groupCount, measured: integer(measured), answer: integer(groupCount * measured)};
    }
    const groupCount = randomInteger(2, 6);
    const answer = randomInteger(1, 12);
    return {operation, total: integer(groupCount * answer), groupCount, answer: integer(answer)};
};

const sampleFraction = (operation: ArithmeticOperation): MathSample => {
    if (operation === 'addition') {
        const [first, second] = pick([[1, 2], [1, 6], [3, 2], [5, 2]] as const);
        return {
            operation,
            first: reduced({numerator: first, denominator: 8}),
            second: reduced({numerator: second, denominator: 8}),
            answer: reduced({numerator: first + second, denominator: 8})
        };
    }
    if (operation === 'subtraction') {
        const [answer, second] = pick([[1, 2], [1, 6], [3, 2], [5, 2]] as const);
        return {
            operation,
            first: reduced({numerator: answer + second, denominator: 8}),
            second: reduced({numerator: second, denominator: 8}),
            answer: reduced({numerator: answer, denominator: 8})
        };
    }
    if (operation === 'multiplication') {
        const [groupCount, numerator] = pick([[2, 2], [3, 2], [3, 1]] as const);
        return {
            operation,
            groupCount,
            measured: reduced({numerator, denominator: 8}),
            answer: reduced({numerator: groupCount * numerator, denominator: 8})
        };
    }
    const [groupCount, answerNumerator] = pick([[2, 1], [2, 2], [3, 1], [3, 2]] as const);
    return {
        operation,
        total: reduced({numerator: groupCount * answerNumerator, denominator: 8}),
        groupCount,
        answer: reduced({numerator: answerNumerator, denominator: 8})
    };
};

const sampleDecimal = (
    operation: ArithmeticOperation,
    measurementKind: MeasurementWordProblemKind
): MathSample => {
    if (operation === 'addition') {
        const [first, second] = pick([[12, 15], [23, 14], [31, 26]] as const);
        return {
            operation,
            first: decimalValue(first, measurementKind),
            second: decimalValue(second, measurementKind),
            answer: decimalValue(first + second, measurementKind)
        };
    }
    if (operation === 'subtraction') {
        const [answer, second] = pick([[13, 14], [21, 16], [32, 15]] as const);
        return {
            operation,
            first: decimalValue(answer + second, measurementKind),
            second: decimalValue(second, measurementKind),
            answer: decimalValue(answer, measurementKind)
        };
    }
    if (operation === 'multiplication') {
        const [groupCount, measured] = pick([[2, 13], [3, 12], [4, 11]] as const);
        return {
            operation,
            groupCount,
            measured: decimalValue(measured, measurementKind),
            answer: decimalValue(groupCount * measured, measurementKind)
        };
    }
    const [groupCount, answer] = pick([[2, 13], [3, 12], [4, 11]] as const);
    return {
        operation,
        total: decimalValue(groupCount * answer, measurementKind),
        groupCount,
        answer: decimalValue(answer, measurementKind)
    };
};

const sampleMath = (
    numberKind: MeasurementWordProblemNumberKind,
    operation: ArithmeticOperation,
    measurementKind: MeasurementWordProblemKind
): MathSample => {
    if (numberKind === 'integer') return sampleInteger(operation);
    if (numberKind === 'fraction') return sampleFraction(operation);
    return sampleDecimal(operation, measurementKind);
};

const formatDecimal = (numerator: number, denominator: 10 | 100): string => {
    const digits = denominator === 10 ? 1 : 2;
    const whole = Math.floor(numerator / denominator);
    const remainder = String(numerator % denominator).padStart(digits, '0');
    return `${whole}.${remainder}`;
};

const formatDisplay = (
    exact: ExactValue,
    numberKind: MeasurementWordProblemNumberKind
): string => {
    if (numberKind === 'integer') return String(exact.numerator);
    if (numberKind === 'fraction') return `${exact.numerator}/${exact.denominator}`;
    return formatDecimal(exact.numerator, exact.denominator as 10 | 100);
};

const makeValue = (
    exact: ExactValue,
    numberKind: MeasurementWordProblemNumberKind,
    measurementKind: MeasurementWordProblemKind
): MeasurementWordProblemValue => {
    const display = formatDisplay(exact, numberKind);
    const unit = units[measurementKind];
    if (measurementKind === 'money') {
        const quantityText = numberKind === 'fraction'
            ? `${display} of a dollar`
            : `$${display}`;
        return {
            ...exact,
            display,
            quantityText,
            equationTerm: numberKind === 'fraction' ? `${display} dollar` : quantityText
        };
    }
    const unitName = exact.numerator === exact.denominator ? unit.singular : unit.plural;
    const quantityText = `${display} ${unitName}`;
    return {...exact, display, quantityText, equationTerm: quantityText};
};

const measuredOperand = (
    label: string,
    exact: ExactValue,
    numberKind: MeasurementWordProblemNumberKind,
    measurementKind: MeasurementWordProblemKind
): MeasurementWordProblemMeasuredOperand => ({
    role: 'measured',
    label,
    value: makeValue(exact, numberKind, measurementKind)
});

const context = (
    measurementKind: MeasurementWordProblemKind,
    operation: ArithmeticOperation,
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

const equation = (
    left: string,
    symbol: '+' | '−' | '×' | '÷',
    right: string,
    answer: MeasurementWordProblemValue,
    unit: MeasurementWordProblemUnit
): readonly [string, string] => {
    const unknown = unit.symbolPlacement === 'prefix' ? '?' : `? ${unit.symbol}`;
    const leftSide = `${left} ${symbol} ${right}`;
    return [`${leftSide} = ${unknown}`, `${leftSide} = ${answer.equationTerm}`];
};

const explanation = (operation: ArithmeticOperation, solutionEquation: string): string => {
    if (operation === 'addition') return `Add the two measured amounts: ${solutionEquation}.`;
    if (operation === 'subtraction') return `Subtract the amount used from the starting amount: ${solutionEquation}.`;
    if (operation === 'multiplication') return `Multiply the number of equal groups by the amount in each group: ${solutionEquation}.`;
    return `Divide the total measured amount by the number of equal groups: ${solutionEquation}.`;
};

const buildProblem = (
    sample: MathSample,
    measurementKind: MeasurementWordProblemKind,
    numberKind: MeasurementWordProblemNumberKind
): MeasurementWordProblemGrade4 => {
    const unit = units[measurementKind];
    if (sample.operation === 'addition' || sample.operation === 'subtraction') {
        const first = measuredOperand(
            sample.operation === 'addition' ? 'First amount' : 'Starting amount',
            sample.first,
            numberKind,
            measurementKind
        );
        const second = measuredOperand(
            sample.operation === 'addition' ? 'Amount added' : 'Amount used',
            sample.second,
            numberKind,
            measurementKind
        );
        const answer = makeValue(sample.answer, numberKind, measurementKind);
        const [story, question] = context(
            measurementKind,
            sample.operation,
            first.value.quantityText,
            second.value.quantityText
        );
        const [questionEquation, solutionEquation] = equation(
            first.value.equationTerm,
            sample.operation === 'addition' ? '+' : '−',
            second.value.equationTerm,
            answer,
            unit
        );
        return {
            task: 'grade4-measurement-word-problem',
            measurementKind,
            numberKind,
            operation: sample.operation,
            unit,
            operands: [first, second],
            story,
            question,
            questionEquation,
            solutionEquation,
            answer,
            answerStatement: `The answer is ${answer.quantityText}.`,
            explanation: explanation(sample.operation, solutionEquation)
        };
    }
    if (sample.operation === 'multiplication') {
        const measured = measuredOperand('Amount in each group', sample.measured, numberKind, measurementKind);
        const group = {role: 'group-count' as const, label: 'Equal groups', count: sample.groupCount, display: `${sample.groupCount} equal groups`};
        const answer = makeValue(sample.answer, numberKind, measurementKind);
        const [story, question] = context(
            measurementKind,
            sample.operation,
            measured.value.quantityText,
            group.display,
            group.count
        );
        const [questionEquation, solutionEquation] = equation(
            String(group.count),
            '×',
            measured.value.equationTerm,
            answer,
            unit
        );
        return {
            task: 'grade4-measurement-word-problem',
            measurementKind,
            numberKind,
            operation: sample.operation,
            unit,
            operands: [group, measured],
            story,
            question,
            questionEquation,
            solutionEquation,
            answer,
            answerStatement: `The answer is ${answer.quantityText}.`,
            explanation: explanation(sample.operation, solutionEquation)
        };
    }
    const total = measuredOperand('Total amount', sample.total, numberKind, measurementKind);
    const group = {role: 'group-count' as const, label: 'Equal groups', count: sample.groupCount, display: `${sample.groupCount} equal groups`};
    const answer = makeValue(sample.answer, numberKind, measurementKind);
    const [story, question] = context(
        measurementKind,
        sample.operation,
        total.value.quantityText,
        group.display,
        group.count
    );
    const [questionEquation, solutionEquation] = equation(
        total.value.equationTerm,
        '÷',
        String(group.count),
        answer,
        unit
    );
    return {
        task: 'grade4-measurement-word-problem',
        measurementKind,
        numberKind,
        operation: sample.operation,
        unit,
        operands: [total, group],
        story,
        question,
        questionEquation,
        solutionEquation,
        answer,
        answerStatement: `The answer is ${answer.quantityText}.`,
        explanation: explanation(sample.operation, solutionEquation)
    };
};

export class MeasurementWordProblemsGenerator implements ProblemGenerator<
    MeasurementWordProblemGrade4,
    MeasurementWordProblemsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = MeasurementWordProblemsGeneratorSchema;

    generate(config: MeasurementWordProblemsGeneratorConfig): ProblemStub<MeasurementWordProblemGrade4> {
        validateConfigFields('measurement-word-problems', config, [
            'measurementKind',
            'physicalMeasurement',
            'numberKind',
            'operation'
        ]);

        if (typeof config.measurementKind !== 'string'
            || !['length', 'time', 'liquid-volume', 'weight', 'money'].includes(config.measurementKind)) {
            throw new GeneratorValidationError('measurement-word-problems', `Unsupported measurement kind "${config.measurementKind}".`);
        }
        if (typeof config.numberKind !== 'string'
            || !['integer', 'fraction', 'decimal'].includes(config.numberKind)) {
            throw new GeneratorValidationError('measurement-word-problems', `Unsupported number kind "${config.numberKind}".`);
        }
        const operation = operationNames[config.operation as keyof typeof operationNames];
        if (!operation) {
            throw new GeneratorValidationError('measurement-word-problems', `Unsupported operation "${config.operation}".`);
        }

        const measurementKind = config.measurementKind as MeasurementWordProblemKind;
        if (config.physicalMeasurement !== (measurementKind !== 'money')) {
            throw new GeneratorValidationError(
                'measurement-word-problems',
                'Physical measurement semantics are required for length, time, liquid-volume, and weight, and forbidden for money.'
            );
        }
        const numberKind = config.numberKind as MeasurementWordProblemNumberKind;
        const data = buildProblem(
            sampleMath(numberKind, operation, measurementKind),
            measurementKind,
            numberKind
        );
        const unitTag = unitTags[measurementKind];
        return unitTag ? {data, tags: [unitTag]} : {data};
    }
}

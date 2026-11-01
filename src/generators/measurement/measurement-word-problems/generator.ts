import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ArithmeticOperation,
    MeasurementWordProblemGrade4,
    MeasurementWordProblemKind,
    MeasurementWordProblemNumberKind,
    MeasurementWordProblemValue,
    MeasurementWordProblemUnitId
} from '../../../types/problems.ts';
import {operationNames} from '../../arithmetic/helpers.ts';
import {
    MeasurementWordProblemsGeneratorConfig,
    MeasurementWordProblemsGeneratorSchema
} from './spec.ts';
import {measurementIntegerTuples} from './integer-domain.ts';

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

const unitIds: Record<MeasurementWordProblemKind, MeasurementWordProblemUnitId> = {
    length: 'meter',
    time: 'hour',
    'liquid-volume': 'liter',
    weight: 'kilogram',
    money: 'dollar'
};

const integer = (value: number): ExactValue => ({numerator: value, denominator: 1});

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

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

const sampleInteger = (
    operation: ArithmeticOperation, range: CanonicalNumericRange, largestOperandDigits?: 1 | 2
): MathSample => {
    if (operation === 'addition' || operation === 'subtraction') {
        if (largestOperandDigits === undefined) {
            throw new GeneratorValidationError('measurement-word-problems', `Integer ${operation} requires a largest-operand digit choice.`);
        }
    }
    const tuples = measurementIntegerTuples(operation, range, largestOperandDigits);
    if (!tuples.length) {
        throw new GeneratorValidationError('measurement-word-problems', 'Unsupported integer range/operand-width combination.');
    }
    const [first, second, answer] = pick(tuples);
    if (operation === 'addition' || operation === 'subtraction') {
        return {operation, first: integer(first), second: integer(second),
            answer: integer(answer)};
    }
    if (operation === 'multiplication') {
        return {operation, groupCount: first, measured: integer(second), answer: integer(answer)};
    }
    return {operation, total: integer(first), groupCount: second, answer: integer(answer)};
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
    measurementKind: MeasurementWordProblemKind,
    range: CanonicalNumericRange
): MathSample => {
    if (operation === 'addition') {
        // Compare exact tenths: the selected band must contain the required sum.
        const tuples = ([[12, 15], [23, 14], [31, 26]] as const).filter(([first, second]) =>
            first + second <= range.max * 10 && first + second > range.maximumAbove * 10);
        const [first, second] = pick(tuples);
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
    measurementKind: MeasurementWordProblemKind,
    range: CanonicalNumericRange,
    largestOperandDigits?: 1 | 2
): MathSample => {
    if (numberKind === 'integer') return sampleInteger(operation, range, largestOperandDigits);
    if (numberKind === 'fraction') return sampleFraction(operation);
    return sampleDecimal(operation, measurementKind, range);
};

const makeValue = ({numerator, denominator}: ExactValue): MeasurementWordProblemValue => ({
    numerator,
    denominator
});

const measuredOperand = (exact: ExactValue) => ({
    role: 'measured' as const,
    value: makeValue(exact)
});

const buildProblem = (
    sample: MathSample,
    measurementKind: MeasurementWordProblemKind,
    numberKind: MeasurementWordProblemNumberKind
): MeasurementWordProblemGrade4 => {
    const common = {
        measurementKind,
        numberKind,
        unitId: unitIds[measurementKind],
        answer: makeValue(sample.answer)
    };
    if (sample.operation === 'addition' || sample.operation === 'subtraction') {
        return {
            ...common,
            operation: sample.operation,
            operands: [measuredOperand(sample.first), measuredOperand(sample.second)]
        };
    }
    if (sample.operation === 'multiplication') {
        return {
            ...common,
            operation: sample.operation,
            operands: [
                {role: 'group-count', count: sample.groupCount},
                measuredOperand(sample.measured)
            ]
        };
    }
    return {
        ...common,
        operation: sample.operation,
        operands: [
            measuredOperand(sample.total),
            {role: 'group-count', count: sample.groupCount}
        ]
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
        const numberKind = config.numberKind as MeasurementWordProblemNumberKind;
        const range = config.range;
        const decimalAddition = numberKind === 'decimal' && operation === 'addition';
        if (!range || (numberKind === 'integer' ? ![5, 10, 20, 100].includes(range.max)
            : range.min !== 0 || !(range.max === 5 || decimalAddition && range.max === 10))) {
            throw new GeneratorValidationError('measurement-word-problems', 'Unsupported canonical range choice.');
        }
        let expected: CanonicalNumericRange;
        try {
            expected = createCanonicalNumericRange(range.max, range.min);
        } catch {
            throw new GeneratorValidationError('measurement-word-problems', 'Invalid canonical range choice.');
        }
        if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
            throw new GeneratorValidationError('measurement-word-problems', 'Invalid canonical range witnesses.');
        }
        const operandDigits = config.operandDigits;
        if (operandDigits !== undefined && operandDigits !== false) {
            const valid = operandDigits !== null && (
                (numberKind === 'integer' && (operation === 'addition' || operation === 'subtraction')
                    && operandDigits.role === 'largest' && [1, 2].includes(operandDigits.digits))
                || (operation === 'multiplication' && operandDigits.digits === 1
                    && operandDigits.role === (numberKind === 'integer' ? 'smallest' : 'largest'))
                || (operation === 'division' && operandDigits.role === 'divisor' && operandDigits.digits === 1)
            );
            if (!valid) throw new GeneratorValidationError('measurement-word-problems', 'Unsupported operand digit choice.');
        }
        const data = buildProblem(
            sampleMath(numberKind, operation, measurementKind, range,
                operandDigits && operandDigits.role === 'largest' ? operandDigits.digits : undefined),
            measurementKind,
            numberKind
        );
        return {data};
    }
}

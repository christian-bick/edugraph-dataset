import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ArithmeticOperationTablePatternProblem,
    ArithmeticPatternOperation,
    ArithmeticPatternProblem,
    ArithmeticPatternRecurrence,
    ArithmeticRecurrencePatternProblem
} from '../../../types/problems.ts';
import {ArithmeticPatternsGeneratorConfig, ArithmeticPatternsGeneratorSchema} from './spec.ts';

const TABLE_OPERANDS = [0, 1, 2, 3, 4, 5, 6] as const;

type OperationKind = ArithmeticPatternOperation;
type PatternProperty = 'commutative' | 'associative' | 'distributive';

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const buildTerms = (
    recurrence: Extract<ArithmeticPatternRecurrence, {kind: 'add-constant' | 'multiply-constant'}>,
    count: number
): number[] => {
    const terms = [recurrence.start];
    while (terms.length < count) {
        const previous = terms.at(-1)!;
        terms.push(recurrence.kind === 'add-constant'
            ? previous + recurrence.operand
            : previous * recurrence.operand);
    }
    return terms;
};

const createOperationTable = (operation: OperationKind): ArithmeticOperationTablePatternProblem => {
    const isAddition = operation === 'addition';
    return {
        kind: 'operation-table',
        operation,
        operands: [...TABLE_OPERANDS],
        values: TABLE_OPERANDS.map(row => TABLE_OPERANDS.map(column =>
            isAddition ? row + column : row * column
        ))
    };
};

const createDefaultPattern = (operation: OperationKind): ArithmeticRecurrencePatternProblem => {
    const isAddition = operation === 'addition';
    const recurrence: ArithmeticPatternRecurrence = isAddition
        ? {
            kind: 'add-constant',
            start: randomInteger(1, 10),
            operand: [1, 3, 5][randomInteger(0, 2)]!
        }
        : {
            kind: 'multiply-constant',
            start: 2 * randomInteger(0, 2) + 1,
            operand: [2, 4][randomInteger(0, 1)]!
        };

    return {
        kind: 'recurrence',
        recurrence,
        terms: buildTerms(recurrence, isAddition ? 6 : 5),
        emergentFeature: isAddition
            ? {kind: 'alternating-parity'}
            : {kind: 'even-after-start'}
    };
};

const createCommutativePattern = (operation: OperationKind): ArithmeticRecurrencePatternProblem => {
    const isAddition = operation === 'addition';
    const recurrence: Extract<
        ArithmeticPatternRecurrence,
        {kind: 'add-constant' | 'multiply-constant'}
    > = isAddition
        ? {kind: 'add-constant', start: randomInteger(1, 3), operand: randomInteger(2, 3)}
        : {kind: 'multiply-constant', start: randomInteger(1, 3), operand: randomInteger(2, 3)};
    const terms = buildTerms(recurrence, 5);

    return {
        kind: 'recurrence',
        recurrence,
        terms,
        emergentFeature: {kind: 'operand-order-invariance'},
        lawWitness: {
            law: 'commutative',
            operands: [recurrence.start, recurrence.operand],
            result: terms[1]!
        }
    };
};

const createAssociativePattern = (operation: OperationKind): ArithmeticRecurrencePatternProblem => {
    const isAddition = operation === 'addition';
    const recurrence: Extract<
        ArithmeticPatternRecurrence,
        {kind: 'add-constant' | 'multiply-constant'}
    > = isAddition
        ? {kind: 'add-constant', start: randomInteger(1, 2), operand: randomInteger(2, 3)}
        : {kind: 'multiply-constant', start: randomInteger(1, 2), operand: randomInteger(2, 3)};
    const terms = buildTerms(recurrence, 5);
    const combinedOperand = recurrence.kind === 'add-constant'
        ? recurrence.operand + recurrence.operand
        : recurrence.operand * recurrence.operand;

    return {
        kind: 'recurrence',
        recurrence,
        terms,
        emergentFeature: {kind: 'two-step-recurrence', combinedOperand},
        lawWitness: {
            law: 'associative',
            operands: [recurrence.start, recurrence.operand, recurrence.operand],
            result: terms[2]!
        }
    };
};

const createDistributivePattern = (): ArithmeticRecurrencePatternProblem => {
    const factor = randomInteger(2, 6);
    const terms = TABLE_OPERANDS.map(position => factor * position);
    const column = randomInteger(1, 5);

    return {
        kind: 'recurrence',
        recurrence: {kind: 'position-multiple', factor},
        terms,
        emergentFeature: {kind: 'constant-difference', difference: factor},
        lawWitness: {
            law: 'distributive',
            multiplier: factor,
            addends: [column, 1],
            result: terms[column + 1]!
        }
    };
};

const createRecurrence = (
    operation: OperationKind,
    property?: PatternProperty
): ArithmeticRecurrencePatternProblem => property === 'commutative'
    ? createCommutativePattern(operation)
    : property === 'associative'
        ? createAssociativePattern(operation)
        : property === 'distributive'
            ? createDistributivePattern()
            : createDefaultPattern(operation);

export class ArithmeticPatternsGenerator implements ProblemGenerator<
    ArithmeticPatternProblem,
    ArithmeticPatternsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticPatternsGeneratorSchema;

    generate(config: ArithmeticPatternsGeneratorConfig): ProblemStub<ArithmeticPatternProblem> | null {
        validateConfigFields('arithmetic-patterns', config, [
            'model',
            'operation',
            'useCommutativeLaw',
            'useAssociativeLaw',
            'useDistributiveLaw'
        ]);

        const operation = config.operation;
        if (operation !== 'addition' && operation !== 'multiplication') return null;
        if (config.model !== 'operation-table' && config.model !== 'recurrence') return null;

        const requestedProperties = [
            config.useCommutativeLaw ? 'commutative' : null,
            config.useAssociativeLaw ? 'associative' : null,
            config.useDistributiveLaw ? 'distributive' : null
        ].filter((value): value is PatternProperty => value !== null);
        if (requestedProperties.length > 1) return null;
        if (config.model === 'operation-table' && requestedProperties.length > 0) return null;
        if (requestedProperties[0] === 'distributive' && operation !== 'multiplication') return null;

        return {
            data: config.model === 'operation-table'
                ? createOperationTable(operation)
                : createRecurrence(operation, requestedProperties[0])
        };
    }
}

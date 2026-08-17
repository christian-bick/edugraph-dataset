import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {MeasurementWordProblemsGenerator} from '../../../../generators/measurement/measurement-word-problems/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {
    MeasurementWordProblemGrade4,
    MeasurementWordProblemKind,
    MeasurementWordProblemNumberKind,
    MeasurementWordProblemUnit,
    MeasurementWordProblemValue
} from '../../../../types/problems.ts';
import {isValidMeasurementWordProblemGrade4} from './helpers.ts';

const units: Record<MeasurementWordProblemKind, MeasurementWordProblemUnit> = {
    length: {id: 'meter', singular: 'meter', plural: 'meters', symbol: 'm', symbolPlacement: 'suffix'},
    time: {id: 'hour', singular: 'hour', plural: 'hours', symbol: 'h', symbolPlacement: 'suffix'},
    'liquid-volume': {id: 'liter', singular: 'liter', plural: 'liters', symbol: 'L', symbolPlacement: 'suffix'},
    weight: {id: 'kilogram', singular: 'kilogram', plural: 'kilograms', symbol: 'kg', symbolPlacement: 'suffix'},
    money: {id: 'dollar', singular: 'dollar', plural: 'dollars', symbol: '$', symbolPlacement: 'prefix'}
};

const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const measurementKinds = Object.keys(units) as MeasurementWordProblemKind[];
const numberKinds: MeasurementWordProblemNumberKind[] = ['integer', 'fraction', 'decimal'];

const valueFor = (
    numberKind: MeasurementWordProblemNumberKind,
    unit: MeasurementWordProblemUnit,
    numerator: number,
    denominator: number
): MeasurementWordProblemValue => {
    const display = numberKind === 'integer'
        ? String(numerator)
        : numberKind === 'fraction'
            ? `${numerator}/${denominator}`
            : (numerator / denominator).toFixed(unit.id === 'dollar' ? 2 : 1);
    const quantityText = unit.id === 'dollar'
        ? numberKind === 'fraction' ? `${display} of a dollar` : `$${display}`
        : `${display} ${numerator === denominator ? unit.singular : unit.plural}`;
    const equationTerm = unit.id === 'dollar'
        ? numberKind === 'fraction' ? `${display} dollar` : `$${display}`
        : quantityText;
    return {numerator, denominator, display, quantityText, equationTerm};
};

const valuesFor = (
    numberKind: MeasurementWordProblemNumberKind,
    unit: MeasurementWordProblemUnit,
    operation: typeof operations[number]
): readonly [MeasurementWordProblemValue, MeasurementWordProblemValue | null, MeasurementWordProblemValue] => {
    if (numberKind === 'integer') {
        const values = operation === 'addition' ? [2, 3, 5]
            : operation === 'subtraction' ? [5, 2, 3]
                : operation === 'multiplication' ? [2, 0, 4]
                    : [6, 0, 2];
        return [
            valueFor(numberKind, unit, values[0]!, 1),
            values[1] === 0 ? null : valueFor(numberKind, unit, values[1]!, 1),
            valueFor(numberKind, unit, values[2]!, 1)
        ];
    }
    if (numberKind === 'fraction') {
        const first = operation === 'subtraction' || operation === 'division'
            ? valueFor(numberKind, unit, 3, 4)
            : valueFor(numberKind, unit, 1, 4);
        const second = operation === 'addition' || operation === 'subtraction'
            ? valueFor(numberKind, unit, 1, 4)
            : null;
        const answer = valueFor(numberKind, unit, operation === 'division' ? 1 : 1, operation === 'division' ? 4 : 2);
        return [
            first,
            second,
            answer
        ];
    }
    const denominator = unit.id === 'dollar' ? 100 : 10;
    const scale = unit.id === 'dollar' ? 10 : 1;
    const values = operation === 'addition' ? [12, 23, 35]
        : operation === 'subtraction' ? [35, 12, 23]
            : operation === 'multiplication' ? [12, 0, 24]
                : [36, 0, 12];
    return [
        valueFor(numberKind, unit, values[0]! * scale, denominator),
        values[1] === 0 ? null : valueFor(numberKind, unit, values[1]! * scale, denominator),
        valueFor(numberKind, unit, values[2]! * scale, denominator)
    ];
};

const explanationFor = (
    operation: typeof operations[number],
    solutionEquation: string
): string => {
    if (operation === 'addition') return `Add the two measured amounts: ${solutionEquation}.`;
    if (operation === 'subtraction') return `Subtract the amount used from the starting amount: ${solutionEquation}.`;
    if (operation === 'multiplication') return `Multiply the number of equal groups by the amount in each group: ${solutionEquation}.`;
    return `Divide the total measured amount by the number of equal groups: ${solutionEquation}.`;
};

const problemFor = (
    measurementKind: MeasurementWordProblemKind,
    numberKind: MeasurementWordProblemNumberKind,
    operation: typeof operations[number]
): MeasurementWordProblemGrade4 => {
    const unit = units[measurementKind];
    const [measured, otherMeasured, answer] = valuesFor(numberKind, unit, operation);
    const labels = operation === 'addition' ? ['First amount', 'Amount added']
        : operation === 'subtraction' ? ['Starting amount', 'Amount used']
            : operation === 'multiplication' ? ['Equal groups', 'Amount in each group']
                : ['Total amount', 'Equal groups'];
    const groups = operation === 'division' ? 3 : 2;
    const operands = operation === 'addition' || operation === 'subtraction'
        ? [
            {role: 'measured' as const, label: labels[0]!, value: measured},
            {role: 'measured' as const, label: labels[1]!, value: otherMeasured!}
        ] as const
        : operation === 'multiplication'
            ? [
                {role: 'group-count' as const, label: labels[0]!, count: groups, display: `${groups} equal groups`},
                {role: 'measured' as const, label: labels[1]!, value: measured}
            ] as const
            : [
                {role: 'measured' as const, label: labels[0]!, value: measured},
                {role: 'group-count' as const, label: labels[1]!, count: groups, display: `${groups} equal groups`}
            ] as const;
    const terms = operands.map(operand => operand.role === 'measured'
        ? operand.value.equationTerm
        : String(operand.count));
    const symbol = {addition: '+', subtraction: '−', multiplication: '×', division: '÷'}[operation];
    const lhs = `${terms[0]} ${symbol} ${terms[1]}`;
    const questionEquation = `${lhs} = ${measurementKind === 'money' ? '?' : `? ${unit.symbol}`}`;
    const solutionEquation = `${lhs} = ${answer.equationTerm}`;
    return {
        task: 'grade4-measurement-word-problem',
        measurementKind,
        numberKind,
        unit,
        operation,
        operands,
        story: 'A generator-authored same-unit measurement story.',
        question: 'What is the measured result?',
        questionEquation,
        solutionEquation,
        answer,
        answerStatement: `The answer is ${answer.quantityText}.`,
        explanation: explanationFor(operation, solutionEquation)
    } as MeasurementWordProblemGrade4;
};

const variants = measurementKinds.flatMap(measurementKind =>
    numberKinds.flatMap(numberKind =>
        operations.map(operation => [measurementKind, numberKind, operation] as const)
    )
);

const operationAreas = {
    addition: Area.Addition,
    subtraction: Area.Subtraction,
    multiplication: Area.Multiplication,
    division: Area.Division
} as const;

const generator = new MeasurementWordProblemsGenerator();

describe('measurement-word-problem-grade4 validation', () => {
    it.each(variants)('accepts generated %s / %s / %s', (measurementKind, numberKind, operation) => {
        setSeed(`${measurementKind}-${numberKind}-${operation}`);
        const generated = generator.generate({
            measurementKind,
            physicalMeasurement: measurementKind !== 'money',
            numberKind,
            operation: operationAreas[operation]
        }).data;
        expect(isValidMeasurementWordProblemGrade4(generated)).toBe(true);
    });

    it.each(variants)('accepts %s / %s / %s', (measurementKind, numberKind, operation) => {
        expect(isValidMeasurementWordProblemGrade4(
            problemFor(measurementKind, numberKind, operation)
        )).toBe(true);
    });

    it.each([
        ['wrong task', () => ({...problemFor('length', 'integer', 'addition'), task: 'other'})],
        ['wrong unit metadata', () => {
            const problem = problemFor('time', 'fraction', 'division');
            return {...problem, unit: {...problem.unit, symbol: 'hr'}};
        }],
        ['missing unit object', () => ({...problemFor('length', 'integer', 'addition'), unit: undefined})],
        ['incoherent fraction display', () => {
            const problem = problemFor('weight', 'fraction', 'multiplication');
            return {...problem, answer: {...problem.answer, display: '2/4'}};
        }],
        ['wrong decimal precision', () => {
            const problem = problemFor('money', 'decimal', 'addition');
            return {...problem, answer: {...problem.answer, display: '3.5'}};
        }],
        ['wrong quantity text', () => {
            const problem = problemFor('money', 'fraction', 'subtraction');
            return {...problem, answer: {...problem.answer, quantityText: '$1/2'}};
        }],
        ['missing equation term', () => {
            const problem = problemFor('length', 'decimal', 'addition');
            return {...problem, answer: {...problem.answer, equationTerm: ''}};
        }],
        ['wrong operand label', () => {
            const problem = problemFor('liquid-volume', 'integer', 'division');
            return {...problem, operands: [problem.operands[0], {...problem.operands[1], label: 'Groups'}]};
        }],
        ['wrong group display', () => {
            const problem = problemFor('time', 'decimal', 'multiplication');
            return {...problem, operands: [{...problem.operands[0], display: '2'}, problem.operands[1]]};
        }],
        ['wrong arithmetic result', () => {
            const problem = problemFor('length', 'integer', 'addition');
            return {...problem, answer: {...problem.answer, numerator: 6, display: '6', quantityText: '6 meters', equationTerm: '6 meters'}};
        }],
        ['answer-bearing question equation', () => {
            const problem = problemFor('weight', 'decimal', 'subtraction');
            return {...problem, questionEquation: problem.solutionEquation};
        }],
        ['wrong solution equation', () => ({...problemFor('money', 'integer', 'multiplication'), solutionEquation: '$2 × 2 = $5'})],
        ['wrong answer statement', () => ({...problemFor('time', 'integer', 'division'), answerStatement: 'The answer is known.'})],
        ['wrong explanation', () => ({...problemFor('liquid-volume', 'fraction', 'addition'), explanation: 'Add.'})],
        ['missing operands', () => ({...problemFor('length', 'integer', 'addition'), operands: []})],
        ['malformed nested operand', () => ({...problemFor('length', 'integer', 'addition'), operands: [null, null]})],
        ['missing answer object', () => ({...problemFor('money', 'decimal', 'division'), answer: undefined})]
    ])('rejects %s', (_description, build) => {
        expect(isValidMeasurementWordProblemGrade4(
            build() as MeasurementWordProblemGrade4
        )).toBe(false);
    });
});

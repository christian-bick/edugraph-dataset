import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {MeasurementWordProblemsGenerator} from '../../../../generators/measurement/measurement-word-problems/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {
    MeasurementWordProblemGrade4,
    MeasurementWordProblemKind,
    MeasurementWordProblemNumberKind
} from '../../../../types/problems.ts';
import {
    buildMeasurementWordProblemPresentation,
    isValidMeasurementWordProblemGrade4
} from './helpers.ts';

const generator = new MeasurementWordProblemsGenerator();
const measurementKinds: readonly MeasurementWordProblemKind[] = [
    'length', 'time', 'liquid-volume', 'weight', 'money'
];
const numberKinds: readonly MeasurementWordProblemNumberKind[] = ['integer', 'fraction', 'decimal'];
const operations = [
    ['addition', Area.Addition],
    ['subtraction', Area.Subtraction],
    ['multiplication', Area.Multiplication],
    ['division', Area.Division]
] as const;
const variants = measurementKinds.flatMap(measurementKind =>
    numberKinds.flatMap(numberKind =>
        operations.map(([operation, area]) => [measurementKind, numberKind, operation, area] as const)
    )
);

const generate = (
    measurementKind: MeasurementWordProblemKind,
    numberKind: MeasurementWordProblemNumberKind,
    operation: typeof operations[number][0],
    operationArea: typeof operations[number][1]
): MeasurementWordProblemGrade4 => {
    setSeed(`${measurementKind}-${numberKind}-${operation}`);
    return generator.generate({
        measurementKind,
        physicalMeasurement: measurementKind !== 'money',
        numberKind,
        operation: operationArea
    }).data;
};

describe('measurement-word-problem-grade4 presentation', () => {
    it.each(variants)('projects coherent %s / %s / %s content', (
        measurementKind,
        numberKind,
        operation,
        operationArea
    ) => {
        const data = generate(measurementKind, numberKind, operation, operationArea);
        expect(isValidMeasurementWordProblemGrade4(data)).toBe(true);
        const presentation = buildMeasurementWordProblemPresentation(data);
        expect(presentation).not.toBeNull();
        expect(presentation!.story.length).toBeGreaterThan(20);
        expect(presentation!.question).toMatch(/\?$/);
        expect(presentation!.questionEquation).toContain('?');
        expect(presentation!.solutionEquation).not.toContain('?');
        expect(presentation!.answerStatement).toBe(`The answer is ${presentation!.answer.quantityText}.`);
        expect(presentation!.explanation).toContain(presentation!.solutionEquation);
        expect(presentation!.operands.map(operand => operand.role)).toEqual(
            data.operands.map(operand => operand.role)
        );
        expect(presentation!.story).toContain(
            presentation!.operands.find(operand => operand.role === 'measured')!.text
        );
    });

    it('derives unit-sensitive displays only in the view presentation', () => {
        const moneyFraction = buildMeasurementWordProblemPresentation(
            generate('money', 'fraction', 'addition', Area.Addition)
        )!;
        expect(moneyFraction.answer.quantityText).toMatch(/ of a dollar$/);
        expect(moneyFraction.answer.equationTerm).toMatch(/ dollar$/);

        const moneyDecimal = buildMeasurementWordProblemPresentation(
            generate('money', 'decimal', 'addition', Area.Addition)
        )!;
        expect(moneyDecimal.answer.display).toMatch(/^\d+\.\d{2}$/);
        expect(moneyDecimal.answer.quantityText).toMatch(/^\$/);

        const lengthDecimal = buildMeasurementWordProblemPresentation(
            generate('length', 'decimal', 'addition', Area.Addition)
        )!;
        expect(lengthDecimal.answer.display).toMatch(/^\d+\.\d$/);
        expect(lengthDecimal.answer.quantityText).toMatch(/ meters?$/);
    });

    it.each([
        ['wrong unit identity', () => ({...generate('time', 'integer', 'addition', Area.Addition), unitId: 'meter'})],
        ['unreduced fraction', () => ({...generate('weight', 'fraction', 'addition', Area.Addition), answer: {numerator: 2, denominator: 4}})],
        ['wrong decimal precision', () => ({...generate('money', 'decimal', 'addition', Area.Addition), answer: {numerator: 35, denominator: 10}})],
        ['wrong operand roles', () => {
            const data = generate('length', 'integer', 'addition', Area.Addition);
            return {...data, operands: [{role: 'group-count', count: 2}, data.operands[1]]};
        }],
        ['wrong arithmetic result', () => ({...generate('length', 'integer', 'addition', Area.Addition), answer: {numerator: 999, denominator: 1}})],
        ['invalid group count', () => {
            const data = generate('time', 'decimal', 'multiplication', Area.Multiplication);
            return {...data, operands: [{role: 'group-count', count: 1}, data.operands[1]]};
        }],
        ['missing operands', () => ({...generate('length', 'integer', 'addition', Area.Addition), operands: []})],
        ['malformed answer', () => ({...generate('money', 'decimal', 'division', Area.Division), answer: undefined})]
    ])('rejects %s', (_description, build) => {
        const data = build() as MeasurementWordProblemGrade4;
        expect(isValidMeasurementWordProblemGrade4(data)).toBe(false);
        expect(buildMeasurementWordProblemPresentation(data)).toBeNull();
    });
});

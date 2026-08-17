import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionLinePlotValue, Grade4FractionLinePlotProblem} from '../../../types/problems.ts';
import {MeasurementDataGenerator} from './generator.ts';

const expectReducedValue = (value: FractionLinePlotValue): void => {
    expect(value.denominator).toBeGreaterThan(0);
    expect(value.denominator).toBeLessThanOrEqual(8);
    expect(value.eighths * value.denominator).toBe(value.numerator * 8);
    const commonDivisors = Array.from(
        {length: Math.min(Math.abs(value.numerator), value.denominator) - 1},
        (_, index) => index + 2
    ).filter(divisor => value.numerator % divisor === 0 && value.denominator % divisor === 0);
    expect(commonDivisors).toEqual([]);
    const quantityDisplay = value.display.includes(' ')
        ? value.display.replace(' ', ' and ')
        : value.display;
    expect(value.quantityText).toBe(`${quantityDisplay} ${value.eighths === 8 ? 'inch' : 'inches'}`);
};

const expectCoherentGrade4Plot = (data: Grade4FractionLinePlotProblem): void => {
    expect(data.unit).toBe('in');
    expect(data.subdivisions).toBe(8);
    expect(data.observations).toHaveLength(6);
    expect(data.fractionObservations).toHaveLength(6);
    expect(data.axisTicks).toHaveLength(17);
    expect(data.frequencies).toHaveLength(17);
    expect(data.axisEnd.eighths - data.axisStart.eighths).toBe(16);
    expect(data.interval).toMatchObject({eighths: 1, numerator: 1, denominator: 8, display: '1/8'});
    expect(data.scaleStatement).toBe('Each tick mark represents 1/8 inch.');

    for (const [index, tick] of data.axisTicks.entries()) {
        expect(tick.index).toBe(index);
        expect(tick.value.eighths).toBe(data.axisStart.eighths + index);
        expectReducedValue(tick.value);
        const expectedCount = data.fractionObservations
            .filter(observation => observation.value.eighths === tick.value.eighths).length;
        expect(data.frequencies[index]).toEqual({value: tick.value, count: expectedCount});
    }
    expect(data.frequencies.reduce((sum, frequency) => sum + frequency.count, 0)).toBe(6);
    expect(Math.max(...data.frequencies.map(({count}) => count))).toBeLessThanOrEqual(5);
    expect(Math.max(...data.frequencies.map(({count}) => count))).toBeGreaterThanOrEqual(2);
    for (const [index, observation] of data.fractionObservations.entries()) {
        expect(observation.object).toBe(data.observations[index]!.object);
        expect(data.observations[index]!.length * 8).toBe(observation.value.eighths);
        expect(observation.value.eighths).toBeGreaterThanOrEqual(data.axisStart.eighths);
        expect(observation.value.eighths).toBeLessThanOrEqual(data.axisEnd.eighths);
        expectReducedValue(observation.value);
    }
    const denominators = new Set(data.fractionObservations.map(({value}) => value.denominator));
    expect(denominators.has(8)).toBe(true);
    expect(denominators.has(4)).toBe(true);
    expect(denominators.has(2)).toBe(true);
};

describe('MeasurementDataGenerator', () => {
    it('generates six whole-centimeter observations in a compact range', () => {
        setSeed(42);
        const problem = new MeasurementDataGenerator().generate({numberKind: Scope.IntegerNumbers});

        expect(problem.data.unit).toBe('cm');
        expect(problem.data.subdivisions).toBe(1);
        expect(problem.data.observations).toHaveLength(6);
        expect(new Set(problem.data.observations.map(({object}) => object)).size).toBe(6);
        for (const observation of problem.data.observations) {
            expect(Number.isInteger(observation.length)).toBe(true);
            expect(observation.length).toBeGreaterThanOrEqual(2);
            expect(observation.length).toBeLessThanOrEqual(10);
        }
    });

    it('generates quarter-inch observations including halves and fourths', () => {
        setSeed(42);
        const data = new MeasurementDataGenerator().generate({numberKind: Scope.FractionNumbers}).data;
        const quarterUnits = data.observations.map(({length}) => length * 4);

        expect(data.unit).toBe('in');
        expect(data.subdivisions).toBe(4);
        expect(quarterUnits.every(Number.isInteger)).toBe(true);
        expect(quarterUnits.every(value => value >= 8 && value <= 32)).toBe(true);
        expect(quarterUnits.some(value => value % 4 === 2)).toBe(true);
        expect(quarterUnits.some(value => value % 2 === 1)).toBe(true);
    });

    it('is deterministic for the same seed', () => {
        const generator = new MeasurementDataGenerator();
        setSeed(7);
        const first = generator.generate({numberKind: Scope.IntegerNumbers});
        setSeed(7);
        expect(generator.generate({numberKind: Scope.IntegerNumbers})).toEqual(first);
    });

    it('preserves the exact legacy payload shape when no single frame is requested', () => {
        setSeed(42);
        const integer = new MeasurementDataGenerator().generate({numberKind: Scope.IntegerNumbers});
        expect(Object.keys(integer.data).sort()).toEqual(['observations', 'subdivisions', 'unit']);
        setSeed(42);
        const fraction = new MeasurementDataGenerator().generate({numberKind: Scope.FractionNumbers});
        expect(Object.keys(fraction.data).sort()).toEqual(['observations', 'subdivisions', 'unit']);
    });

    it('constructs a complete exact eighth-inch line-plot payload', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(`construct-fraction-line-plot-${seed}`);
            const data = new MeasurementDataGenerator().generate({
                numberKind: Scope.FractionNumbers,
                linePlotFeatures: [Scope.SingleFrameOfReference]
            }).data;
            if (!('task' in data)) throw new Error('Expected Grade 4 construction data.');
            expect(data.task).toBe('construct-fraction-line-plot');
            if (data.task !== 'construct-fraction-line-plot') throw new Error('Expected construction data.');
            expectCoherentGrade4Plot(data);
            expect(data.prompt).toBe('Construct a line plot for these six object lengths.');
            expect(data.answerStatement).toBe('The completed line plot contains 6 X marks.');
            expect(data.explanation).toBe('Place one X above the matching tick for each object length. A repeated measurement receives one X for each object.');
        }
    });

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('solves exact %s from plotted extrema', (operation, expectedOperation) => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(`${expectedOperation}-fraction-line-plot-${seed}`);
            const data = new MeasurementDataGenerator().generate({
                numberKind: Scope.FractionNumbers,
                linePlotFeatures: [Scope.SingleFrameOfReference, Area.FractionArithmetic],
                operation
            }).data;
            if (!('task' in data)) throw new Error('Expected Grade 4 arithmetic data.');
            expect(data.task).toBe('fraction-line-plot-arithmetic');
            if (data.task !== 'fraction-line-plot-arithmetic') throw new Error('Expected arithmetic data.');
            expectCoherentGrade4Plot(data);
            expect(data.operation).toBe(expectedOperation);
            expect(data.shortest.eighths).toBe(Math.min(...data.fractionObservations.map(({value}) => value.eighths)));
            expect(data.longest.eighths).toBe(Math.max(...data.fractionObservations.map(({value}) => value.eighths)));
            expect(data.shortest.denominator).toBe(8);
            expect(data.leftOperand).toEqual(operation === Area.Addition ? data.shortest : data.longest);
            expect(data.rightOperand).toEqual(operation === Area.Addition ? data.longest : data.shortest);
            expect(data.answer.eighths).toBe(operation === Area.Addition
                ? data.leftOperand.eighths + data.rightOperand.eighths
                : data.leftOperand.eighths - data.rightOperand.eighths);
            expect(data.answer.eighths).toBeGreaterThan(0);
            expect(data.questionEquation).toBe(operation === Area.Addition
                ? 'shortest + longest = ?'
                : 'longest − shortest = ?');
            expect(data.solutionEquation).toBe(`${data.leftOperand.display} ${operation === Area.Addition ? '+' : '−'} ${data.rightOperand.display} = ${data.answer.display}`);
            expect(data.answerStatement).toBe(`${operation === Area.Addition ? 'The combined length' : 'The difference'} is ${data.answer.quantityText}.`);
            expectReducedValue(data.answer);
        }
    });

    it('strictly rejects incomplete Grade 4 line-plot configurations', () => {
        const generator = new MeasurementDataGenerator();
        expect(() => generator.generate({
            numberKind: Scope.IntegerNumbers,
            linePlotFeatures: [Scope.SingleFrameOfReference]
        })).toThrow('require fractional measurements');
        expect(() => generator.generate({
            numberKind: Scope.FractionNumbers,
            linePlotFeatures: [Scope.SingleFrameOfReference, Area.FractionArithmetic]
        })).toThrow('requires addition or subtraction');
        expect(() => generator.generate({
            numberKind: Scope.FractionNumbers,
            linePlotFeatures: [Scope.SingleFrameOfReference],
            operation: Area.Addition
        })).toThrow('requires FractionArithmetic');
        expect(() => generator.generate({
            numberKind: Scope.FractionNumbers,
            linePlotFeatures: [Area.FractionArithmetic],
            operation: Area.Addition
        })).toThrow('requires SingleFrameOfReference');
    });

    it('rejects a missing configuration object', () => {
        expect(() => new MeasurementDataGenerator().generate(null as never)).toThrow();
    });
});

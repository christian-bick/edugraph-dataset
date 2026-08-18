import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    DecimalNotationProblem,
    DecimalScaleTick,
    TenthsHundredthsGridModel
} from '../../../types/problems.ts';
import {DecimalNotationGenerator} from './generator.ts';

const generator = new DecimalNotationGenerator();

const expectedDecimal = (numerator: number, denominator: 10 | 100): string =>
    denominator === 10 ? `0.${numerator}` : `0.${String(numerator).padStart(2, '0')}`;

const expectGrid = (
    model: TenthsHundredthsGridModel,
    numerator: number,
    denominator: 10 | 100
): void => {
    expect(model).toMatchObject({
        display: `${numerator}/${denominator}`,
        rows: denominator === 10 ? 1 : 10,
        columns: 10,
        partCount: denominator,
        shadedCount: numerator,
        groups: []
    });
    expect(model.cells).toHaveLength(denominator);
    model.cells.forEach((cell, index) => {
        const column = denominator === 10 ? index : Math.floor(index / 10);
        const row = denominator === 10 ? 0 : index % 10;
        expect(cell).toEqual({
            index,
            row,
            column,
            tenthGroupIndex: column,
            xPercent: column * 10,
            yPercent: row * (denominator === 10 ? 100 : 10),
            widthPercent: 10,
            heightPercent: denominator === 10 ? 100 : 10,
            shaded: index < numerator,
            source: null
        });
    });
};

const expectTicks = (
    ticks: DecimalScaleTick[],
    denominator: 10 | 100
): void => {
    expect(ticks).toHaveLength(denominator + 1);
    ticks.forEach((tick, index) => {
        const endpoint = index === 0 || index === denominator;
        const major = denominator === 10 || index % 10 === 0;
        const label = index === 0
            ? '0'
            : index === denominator
                ? '1'
                : denominator === 10
                    ? `0.${index}`
                    : index % 10 === 0 ? `0.${index / 10}` : '';
        expect(tick).toEqual({
            index,
            xPercent: denominator === 10 ? index * 10 : index,
            kind: endpoint ? 'endpoint' : major ? 'major' : 'minor',
            label
        });
    });
};

const expectExactProblem = (problem: DecimalNotationProblem): void => {
    const {value} = problem;
    const {numerator, denominator} = value;
    const decimal = expectedDecimal(numerator, denominator);
    const placeName = denominator === 10 ? 'tenths' : 'hundredths';
    const countedPlace = numerator === 1
        ? denominator === 10 ? 'tenth' : 'hundredth'
        : placeName;
    const hundredthsNumerator = denominator === 10 ? numerator * 10 : numerator;
    const xPercent = denominator === 10 ? numerator * 10 : numerator;

    expect(problem.task).toBe('decimal-notation');
    expect(problem.sharedWhole).toBe(1);
    expect(problem.relation).toBe('equal');
    expect(numerator).toBeGreaterThan(0);
    expect(numerator).toBeLessThan(denominator);
    if (denominator === 100) expect(numerator % 10).not.toBe(0);
    expect(value).toEqual({
        numerator,
        denominator,
        fractionNotation: `${numerator}/${denominator}`,
        decimalNotation: decimal,
        precision: denominator === 10 ? 'tenths' : 'hundredths',
        wholeDigit: 0,
        tenthsDigit: denominator === 10 ? numerator : Math.floor(numerator / 10),
        hundredthsDigit: denominator === 10 ? null : numerator % 10,
        hundredthsNumerator
    });
    expect(problem.equality).toBe(`${numerator}/${denominator} = ${decimal}`);
    expect(problem.placeValue.columns).toEqual([{
        place: 'ones', digit: 0, unitFraction: '1'
    }, {
        place: 'tenths', digit: value.tenthsDigit, unitFraction: '1/10'
    }, {
        place: 'hundredths', digit: value.hundredthsDigit ?? 0, unitFraction: '1/100'
    }]);
    expect(problem.placeValue.placeValueEquation).toBe(denominator === 10
        ? `${decimal} = 0 × 1 + ${numerator} × 1/10`
        : `${decimal} = 0 × 1 + ${value.tenthsDigit} × 1/10 + ${value.hundredthsDigit} × 1/100`);
    expectGrid(problem.models.fractionGrid, numerator, denominator);
    expectGrid(problem.models.hundredthsGrid, hundredthsNumerator, 100);

    expect(problem.notationTasks.fractionToDecimal).toEqual({
        unknown: 'decimal',
        prompt: `Write ${value.fractionNotation} using decimal notation.`,
        questionEquation: `${value.fractionNotation} = ?`,
        solutionEquation: `${value.fractionNotation} = ${decimal}`,
        answer: decimal,
        answerStatement: `${value.fractionNotation} is ${decimal} in decimal notation.`,
        explanation: `${value.fractionNotation} means ${numerator} ${countedPlace}, so its decimal notation is ${decimal}.`
    });
    expect(problem.notationTasks.decimalToFraction).toEqual({
        unknown: 'fraction',
        prompt: `Write ${decimal} as a fraction with denominator ${denominator}.`,
        questionEquation: `${decimal} = ?`,
        solutionEquation: `${decimal} = ${value.fractionNotation}`,
        answer: value.fractionNotation,
        answerStatement: `${decimal} is ${value.fractionNotation} in fraction notation.`,
        explanation: `${decimal} has ${numerator} ${countedPlace}, so it is ${value.fractionNotation}.`
    });

    expectTicks(problem.numberLine.ticks, denominator);
    expect(problem.numberLine).toMatchObject({
        prompt: `Locate ${decimal} on the number line from 0 to 1.`,
        start: 0,
        end: 1,
        subdivisionCount: denominator,
        point: {tickIndex: numerator, xPercent, label: decimal},
        answerStatement: `${decimal} is located at tick ${numerator} of ${denominator} equal parts between 0 and 1.`,
        explanation: `The interval from 0 to 1 is divided into ${denominator} equal parts. Moving ${numerator} ${countedPlace} from 0 reaches ${decimal}.`
    });
    expect(problem.measurement.ticks).not.toBe(problem.numberLine.ticks);
    expect(problem.measurement.ticks).toEqual(problem.numberLine.ticks);
    expect(problem.measurement).toMatchObject({
        prompt: 'Write the measured length using decimal notation.',
        unit: 'meter',
        unitSymbol: 'm',
        start: 0,
        end: 1,
        subdivisionCount: denominator,
        measuredEndpoint: {tickIndex: numerator, xPercent},
        fractionalMeasure: `${value.fractionNotation} of a meter`,
        decimalMeasure: `${decimal} meters`,
        questionEquation: `${value.fractionNotation} of a meter = ? meters`,
        solutionEquation: `${value.fractionNotation} of a meter = ${decimal} meters`,
        answer: `${decimal} meters`,
        answerStatement: `The measured length is ${decimal} meters.`,
        explanation: `${value.fractionNotation} of a meter is ${numerator} ${countedPlace} of one meter, which is ${decimal} meters.`
    });

    expect(numerator * 100).toBe(hundredthsNumerator * denominator);
};

describe('DecimalNotationGenerator', () => {
    it('validates its invariant empty configuration', () => {
        expect(() => generator.generate(null as never)).toThrow('Configuration object');
        expect(() => generator.generate({unexpected: true} as never))
            .toThrow('does not accept configuration fields');
    });

    it('generates exact tenths and nontrivial hundredths across all supplied subcontracts', () => {
        const denominators = new Set<number>();
        let sawLeadingZero = false;
        let sawHighHundredths = false;
        for (let seed = 0; seed < 300; seed++) {
            setSeed(`decimal-notation-${seed}`);
            const problem = generator.generate({}).data;
            expectExactProblem(problem);
            denominators.add(problem.value.denominator);
            sawLeadingZero ||= problem.value.denominator === 100 && problem.value.numerator < 10;
            sawHighHundredths ||= problem.value.denominator === 100
                && problem.value.numerator > 90;
        }
        expect(denominators).toEqual(new Set([10, 100]));
        expect(sawLeadingZero).toBe(true);
        expect(sawHighHundredths).toBe(true);
    });

    it('is deterministic for the same repository seed', () => {
        setSeed('decimal-notation-determinism');
        const first = generator.generate({});
        setSeed('decimal-notation-determinism');
        expect(generator.generate({})).toEqual(first);
    });
});

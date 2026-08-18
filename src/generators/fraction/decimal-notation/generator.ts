import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    DecimalNotationProblem,
    DecimalNotationTask,
    DecimalNotationValue,
    DecimalScaleTick
} from '../../../types/problems.ts';
import {toTenthsHundredthsGrid} from '../tenths-hundredths.ts';
import {
    DecimalNotationGeneratorConfig,
    DecimalNotationGeneratorSchema
} from './spec.ts';

const HUNDREDTH_NUMERATORS = Array.from({length: 99}, (_, index) => index + 1)
    .filter(numerator => numerator % 10 !== 0);

const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

const decimalString = (numerator: number, denominator: 10 | 100): string =>
    denominator === 10
        ? `0.${numerator}`
        : `0.${String(numerator).padStart(2, '0')}`;

const makeValue = (): DecimalNotationValue => {
    const denominator = random() < 0.5 ? 10 as const : 100 as const;
    const numerator = denominator === 10
        ? Math.floor(random() * 9) + 1
        : pick(HUNDREDTH_NUMERATORS);
    const tenthsDigit = denominator === 10 ? numerator : Math.floor(numerator / 10);
    const hundredthsDigit = denominator === 10 ? null : numerator % 10;

    return {
        numerator,
        denominator,
        fractionNotation: `${numerator}/${denominator}`,
        decimalNotation: decimalString(numerator, denominator),
        precision: denominator === 10 ? 'tenths' : 'hundredths',
        wholeDigit: 0,
        tenthsDigit,
        hundredthsDigit,
        hundredthsNumerator: denominator === 10 ? numerator * 10 : numerator
    };
};

const makeNotationTasks = (
    value: DecimalNotationValue
): DecimalNotationProblem['notationTasks'] => {
    const placeName = value.denominator === 10 ? 'tenths' : 'hundredths';
    const countedPlaceName = value.numerator === 1
        ? value.denominator === 10 ? 'tenth' : 'hundredth'
        : placeName;
    const fractionToDecimal: DecimalNotationTask & {unknown: 'decimal'} = {
        unknown: 'decimal',
        prompt: `Write ${value.fractionNotation} using decimal notation.`,
        questionEquation: `${value.fractionNotation} = ?`,
        solutionEquation: `${value.fractionNotation} = ${value.decimalNotation}`,
        answer: value.decimalNotation,
        answerStatement: `${value.fractionNotation} is ${value.decimalNotation} in decimal notation.`,
        explanation: `${value.fractionNotation} means ${value.numerator} ${countedPlaceName}, so its decimal notation is ${value.decimalNotation}.`
    };
    const decimalToFraction: DecimalNotationTask & {unknown: 'fraction'} = {
        unknown: 'fraction',
        prompt: `Write ${value.decimalNotation} as a fraction with denominator ${value.denominator}.`,
        questionEquation: `${value.decimalNotation} = ?`,
        solutionEquation: `${value.decimalNotation} = ${value.fractionNotation}`,
        answer: value.fractionNotation,
        answerStatement: `${value.decimalNotation} is ${value.fractionNotation} in fraction notation.`,
        explanation: `${value.decimalNotation} has ${value.numerator} ${countedPlaceName}, so it is ${value.fractionNotation}.`
    };
    return {fractionToDecimal, decimalToFraction};
};

const tickLabel = (index: number, denominator: 10 | 100): string => {
    if (index === 0) return '0';
    if (index === denominator) return '1';
    if (denominator === 10) return `0.${index}`;
    if (index % 10 === 0) return `0.${index / 10}`;
    return '';
};

const makeTicks = (denominator: 10 | 100): DecimalScaleTick[] =>
    Array.from({length: denominator + 1}, (_, index) => ({
        index,
        xPercent: denominator === 10 ? index * 10 : index,
        kind: index === 0 || index === denominator
            ? 'endpoint' as const
            : denominator === 10 || index % 10 === 0
                ? 'major' as const
                : 'minor' as const,
        label: tickLabel(index, denominator)
    }));

const placeValueEquation = (value: DecimalNotationValue): string =>
    value.denominator === 10
        ? `${value.decimalNotation} = 0 × 1 + ${value.tenthsDigit} × 1/10`
        : `${value.decimalNotation} = 0 × 1 + ${value.tenthsDigit} × 1/10 + ${value.hundredthsDigit} × 1/100`;

export class DecimalNotationGenerator implements ProblemGenerator<
    DecimalNotationProblem,
    DecimalNotationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = DecimalNotationGeneratorSchema;

    generate(config: DecimalNotationGeneratorConfig): ProblemStub<DecimalNotationProblem> {
        validateConfigFields('decimal-notation', config, []);
        if (Object.keys(config).length !== 0) {
            throw new GeneratorValidationError(
                'decimal-notation',
                'This generator does not accept configuration fields.'
            );
        }

        const value = makeValue();
        const ticks = makeTicks(value.denominator);
        const xPercent = value.denominator === 10 ? value.numerator * 10 : value.numerator;
        const placeName = value.denominator === 10 ? 'tenths' : 'hundredths';
        const countedPlaceName = value.numerator === 1
            ? value.denominator === 10 ? 'tenth' : 'hundredth'
            : placeName;
        const fractionalMeasure = `${value.fractionNotation} of a meter`;
        const decimalMeasure = `${value.decimalNotation} meters`;

        return {
            data: {
                task: 'decimal-notation',
                sharedWhole: 1,
                relation: 'equal',
                value,
                equality: `${value.fractionNotation} = ${value.decimalNotation}`,
                placeValue: {
                    columns: [{
                        place: 'ones',
                        digit: 0,
                        unitFraction: '1'
                    }, {
                        place: 'tenths',
                        digit: value.tenthsDigit,
                        unitFraction: '1/10'
                    }, {
                        place: 'hundredths',
                        digit: value.hundredthsDigit ?? 0,
                        unitFraction: '1/100'
                    }],
                    placeValueEquation: placeValueEquation(value)
                },
                models: {
                    fractionGrid: toTenthsHundredthsGrid(value.numerator, value.denominator),
                    hundredthsGrid: toTenthsHundredthsGrid(value.hundredthsNumerator, 100)
                },
                notationTasks: makeNotationTasks(value),
                numberLine: {
                    prompt: `Locate ${value.decimalNotation} on the number line from 0 to 1.`,
                    start: 0,
                    end: 1,
                    subdivisionCount: value.denominator,
                    ticks,
                    point: {
                        tickIndex: value.numerator,
                        xPercent,
                        label: value.decimalNotation
                    },
                    answerStatement: `${value.decimalNotation} is located at tick ${value.numerator} of ${value.denominator} equal parts between 0 and 1.`,
                    explanation: `The interval from 0 to 1 is divided into ${value.denominator} equal parts. Moving ${value.numerator} ${countedPlaceName} from 0 reaches ${value.decimalNotation}.`
                },
                measurement: {
                    prompt: 'Write the measured length using decimal notation.',
                    unit: 'meter',
                    unitSymbol: 'm',
                    start: 0,
                    end: 1,
                    subdivisionCount: value.denominator,
                    ticks: ticks.map(tick => ({...tick})),
                    measuredEndpoint: {
                        tickIndex: value.numerator,
                        xPercent
                    },
                    fractionalMeasure,
                    decimalMeasure,
                    questionEquation: `${fractionalMeasure} = ? meters`,
                    solutionEquation: `${fractionalMeasure} = ${decimalMeasure}`,
                    answer: decimalMeasure,
                    answerStatement: `The measured length is ${decimalMeasure}.`,
                    explanation: `${value.fractionNotation} of a meter is ${value.numerator} ${countedPlaceName} of one meter, which is ${decimalMeasure}.`
                }
            }
        };
    }
}

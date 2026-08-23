import {
    DecimalNotationProblem,
    DecimalNotationValue,
    TenthsHundredthsGridModel
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export type DecimalPlaceValueColumn = {
    place: 'ones' | 'tenths' | 'hundredths';
    digit: number;
    unitFraction: '1' | '1/10' | '1/100';
};

export type DecimalScaleTick = {
    index: number;
    xPercent: number;
    kind: 'endpoint' | 'major' | 'minor';
    label: string;
};

export type DecimalNotationTask = {
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type DecimalNotationPresentation = {
    fractionNotation: string;
    decimalNotation: string;
    precision: 'tenths' | 'hundredths';
    equality: string;
    placeValue: {
        columns: [DecimalPlaceValueColumn, DecimalPlaceValueColumn, DecimalPlaceValueColumn];
        equation: string;
    };
    models: {
        fractionGrid: TenthsHundredthsGridModel;
        hundredthsGrid: TenthsHundredthsGridModel;
    };
    notationTasks: {
        fractionToDecimal: DecimalNotationTask;
        decimalToFraction: DecimalNotationTask;
    };
    numberLine: {
        prompt: string;
        subdivisionCount: 10 | 100;
        ticks: DecimalScaleTick[];
        point: {tickIndex: number; xPercent: number; label: string};
        answerStatement: string;
        explanation: string;
    };
    measurement: {
        prompt: string;
        unitSymbol: 'm';
        subdivisionCount: 10 | 100;
        ticks: DecimalScaleTick[];
        measuredEndpoint: {tickIndex: number; xPercent: number};
        fractionalMeasure: string;
        decimalMeasure: string;
        questionEquation: string;
        solutionEquation: string;
        answerStatement: string;
        explanation: string;
    };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const decimalNotation = (value: DecimalNotationValue): string =>
    value.denominator === 10
        ? `0.${value.numerator}`
        : `0.${String(value.numerator).padStart(2, '0')}`;

const countedPlaceName = (value: DecimalNotationValue): string => {
    const placeName = value.denominator === 10 ? 'tenths' : 'hundredths';
    return value.numerator === 1
        ? value.denominator === 10 ? 'tenth' : 'hundredth'
        : placeName;
};

const toGridModel = (
    numerator: number,
    denominator: 10 | 100
): TenthsHundredthsGridModel => {
    const rows = denominator === 10 ? 1 as const : 10 as const;
    const heightPercent = denominator === 10 ? 100 as const : 10 as const;
    return {
        display: `${numerator}/${denominator}`,
        rows,
        columns: 10,
        partCount: denominator,
        shadedCount: numerator,
        groups: [],
        cells: Array.from({length: denominator}, (_, index) => {
            const row = denominator === 10 ? 0 : index % 10;
            const column = denominator === 10 ? index : Math.floor(index / 10);
            return {
                index,
                row,
                column,
                tenthGroupIndex: column,
                xPercent: column * 10,
                yPercent: row * heightPercent,
                widthPercent: 10 as const,
                heightPercent,
                shaded: index < numerator,
                source: null
            };
        })
    };
};

const tickLabel = (index: number, denominator: 10 | 100): string => {
    if (index === 0) return '0';
    if (index === denominator) return '1';
    if (denominator === 10) return `0.${index}`;
    return index % 10 === 0 ? `0.${index / 10}` : '';
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

export const isValidDecimalNotationProblem = (data: DecimalNotationProblem): boolean => {
    if (!isRecord(data)
        || data.task !== 'decimal-notation'
        || data.sharedWhole !== 1
        || data.relation !== 'equal'
        || !isRecord(data.value)) return false;

    const {value} = data;
    if ((value.denominator !== 10 && value.denominator !== 100)
        || !Number.isInteger(value.numerator)
        || value.numerator < 1
        || value.numerator >= value.denominator
        || (value.denominator === 100 && value.numerator % 10 === 0)) return false;

    return value.wholeDigit === 0
        && value.tenthsDigit === (value.denominator === 10
            ? value.numerator
            : Math.floor(value.numerator / 10))
        && value.hundredthsDigit === (value.denominator === 10
            ? null
            : value.numerator % 10)
        && value.hundredthsNumerator === (value.denominator === 10
            ? value.numerator * 10
            : value.numerator);
};

export const getDecimalNotationPresentation = (
    data: DecimalNotationProblem
): DecimalNotationPresentation => {
    const {value} = data;
    const fraction = `${value.numerator}/${value.denominator}`;
    const decimal = decimalNotation(value);
    const countedPlace = countedPlaceName(value);
    const ticks = makeTicks(value.denominator);
    const xPercent = value.denominator === 10
        ? value.numerator * 10
        : value.numerator;
    const fractionalMeasure = `${fraction} of a meter`;
    const decimalMeasure = `${decimal} meters`;
    const columns: DecimalNotationPresentation['placeValue']['columns'] = [{
        place: 'ones', digit: 0, unitFraction: '1'
    }, {
        place: 'tenths', digit: value.tenthsDigit, unitFraction: '1/10'
    }, {
        place: 'hundredths', digit: value.hundredthsDigit ?? 0, unitFraction: '1/100'
    }];

    return {
        fractionNotation: fraction,
        decimalNotation: decimal,
        precision: value.denominator === 10 ? 'tenths' : 'hundredths',
        equality: `${fraction} = ${decimal}`,
        placeValue: {
            columns,
            equation: value.denominator === 10
                ? `${decimal} = 0 × 1 + ${value.tenthsDigit} × 1/10`
                : `${decimal} = 0 × 1 + ${value.tenthsDigit} × 1/10 + ${value.hundredthsDigit} × 1/100`
        },
        models: {
            fractionGrid: toGridModel(value.numerator, value.denominator),
            hundredthsGrid: toGridModel(value.hundredthsNumerator, 100)
        },
        notationTasks: {
            fractionToDecimal: {
                prompt: `Write ${fraction} using decimal notation.`,
                questionEquation: `${fraction} = ?`,
                solutionEquation: `${fraction} = ${decimal}`,
                answer: decimal,
                answerStatement: `${fraction} is ${decimal} in decimal notation.`,
                explanation: `${fraction} means ${value.numerator} ${countedPlace}, so its decimal notation is ${decimal}.`
            },
            decimalToFraction: {
                prompt: `Write ${decimal} as a fraction with denominator ${value.denominator}.`,
                questionEquation: `${decimal} = ?`,
                solutionEquation: `${decimal} = ${fraction}`,
                answer: fraction,
                answerStatement: `${decimal} is ${fraction} in fraction notation.`,
                explanation: `${decimal} has ${value.numerator} ${countedPlace}, so it is ${fraction}.`
            }
        },
        numberLine: {
            prompt: `Locate ${decimal} on the number line from 0 to 1.`,
            subdivisionCount: value.denominator,
            ticks,
            point: {tickIndex: value.numerator, xPercent, label: decimal},
            answerStatement: `${decimal} is located at tick ${value.numerator} of ${value.denominator} equal parts between 0 and 1.`,
            explanation: `The interval from 0 to 1 is divided into ${value.denominator} equal parts. Moving ${value.numerator} ${countedPlace} from 0 reaches ${decimal}.`
        },
        measurement: {
            prompt: 'Write the measured length using decimal notation.',
            unitSymbol: 'm',
            subdivisionCount: value.denominator,
            ticks: ticks.map(tick => ({...tick})),
            measuredEndpoint: {tickIndex: value.numerator, xPercent},
            fractionalMeasure,
            decimalMeasure,
            questionEquation: `${fractionalMeasure} = ? meters`,
            solutionEquation: `${fractionalMeasure} = ${decimalMeasure}`,
            answerStatement: `The measured length is ${decimalMeasure}.`,
            explanation: `${fractionalMeasure} is ${value.numerator} ${countedPlace} of one meter, which is ${decimalMeasure}.`
        }
    };
};

export const pointLabelTransform = (xPercent: number): string =>
    xPercent <= 8 ? 'translateX(0)' : xPercent >= 92 ? 'translateX(-100%)' : 'translateX(-50%)';

export const validateDecimalNotationData = (
    viewId: string,
    data: DecimalNotationProblem
): void => {
    validateProblemData(viewId, data, ['task', 'sharedWhole', 'relation', 'value']);
    if (!isValidDecimalNotationProblem(data)) {
        throw new ViewValidationError(
            viewId,
            'Decimal notation data must contain one coherent fraction-decimal equivalence.'
        );
    }
};

import type {NumericalDataProblem, NumericalDataScalar, NumericalDataStudy} from '../../../types/problems.ts';
import type {NumericalDataBuildInput} from '../../../generators/statistics/numerical-data-helpers.ts';

export const summaryScalar = (numerator: number, denominator = 1): NumericalDataScalar => ({numerator, denominator});
const q = summaryScalar;
type Values = readonly [NumericalDataScalar, NumericalDataScalar, NumericalDataScalar, NumericalDataScalar, ...NumericalDataScalar[]];
const length: NumericalDataStudy['attribute'] = {id: 'length', name: 'Recorded length', kind: 'length', unit: 'centimeters', method: 'ruler', precision: q(1)};

/** Literal observations only; the adapter creates source identities, never statistics. */
export function summaryLiteralInput(values: Values, relations: NumericalDataBuildInput['relations'], attribute: NumericalDataStudy['attribute'] = length): NumericalDataBuildInput {
    const rows = values.map((value, index) => ({id: `literal-r${index + 1}`, unitId: `literal-u${index + 1}`, occasionId: 'literal-o', value}));
    return {study: {id: 'literal-summary', populationName: 'The recorded collection', observationalUnitName: 'sampled object',
        units: [{id: rows[0].unitId, name: 'Sample 1'}, ...rows.slice(1).map((row, index) => ({id: row.unitId, name: `Sample ${index + 2}`}))],
        occasions: [{id: 'literal-o', name: 'The measurement occasion'}], selection: 'distinct-units', attribute, goal: {kind: 'describe-recorded-collection'}},
        records: [rows[0], rows[1], rows[2], rows[3], ...rows.slice(4)],
        axes: {value: {minimum: q(-4), maximum: q(20), step: q(4), ticks: [q(-4), q(0), q(4), q(8), q(12), q(16), q(20)], zeroIndex: 1},
            count: {minimum: q(0), maximum: q(20), step: q(20), ticks: [q(0), q(20)], zeroIndex: 0}},
        histogramEdges: [q(-4), q(8), q(20)], quartileConvention: 'median-of-halves-excluding-odd-center',
        whiskerConvention: 'observed-minimum-maximum', departureCriterion: null, relations};
}

export const summarySixInput = summaryLiteralInput([q(1), q(2), q(2), q(3), q(4), q(6)], ['arithmetic-mean']);
export const summaryOddInput = summaryLiteralInput([q(1), q(2), q(3), q(4), q(9)], ['interquartile-range']);
export const summaryMadInput = summaryLiteralInput([q(2), q(2), q(3), q(3), q(3), q(4), q(4), q(15)], ['mean-absolute-deviation']);
export const summaryConstantInput = summaryLiteralInput([q(3), q(3), q(3), q(3)], ['median']);
export const summaryZeroIqrInput = summaryLiteralInput([q(0), q(1), q(1), q(1), q(1), q(1), q(1), q(4)], ['interquartile-range']);
export const summaryCelsiusInput = summaryLiteralInput([q(-3, 2), q(-1), q(-1, 2), q(0), q(5, 2)], ['arithmetic-mean'],
    {id: 'temperature', name: 'Recorded temperature', kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(1, 2)});

/** Independent expected values: no production summarizer/formatter derives these oracles. */
export const summaryMeaningOracles: Readonly<Record<string, Partial<NumericalDataProblem['summary']>>> = {
    six: {count: 6, sum: q(18), mean: q(3), mad: q(4, 3), iqr: q(2)},
    odd: {count: 5, sum: q(19), mean: q(19, 5), mad: q(54, 25), iqr: q(5)},
    mad: {count: 8, sum: q(36), mean: q(9, 2), mad: q(21, 8), iqr: q(3, 2)},
    constant: {count: 4, mean: q(3), mad: q(0), iqr: q(0)},
    celsius: {count: 5, sum: q(-1, 2), mean: q(-1, 10), mad: q(27, 25), iqr: q(5, 2)}
};

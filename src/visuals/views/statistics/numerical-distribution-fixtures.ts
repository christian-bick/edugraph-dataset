import type {NumericalDataProblem, NumericalDataScalar, NumericalDataStudy} from '../../../types/problems.ts';
import type {NumericalDataBuildInput} from '../../../generators/statistics/numerical-data-helpers.ts';
import {makeSignedRationalAxis} from '../../../generators/number/signed-rational-axis-helpers.ts';

export const distributionScalar = (numerator: number, denominator = 1): NumericalDataScalar => ({numerator, denominator});
const q = distributionScalar;
type Values = readonly [NumericalDataScalar, NumericalDataScalar, NumericalDataScalar, NumericalDataScalar, ...NumericalDataScalar[]];

/** Source literals only: no statistic or selected proof is calculated by this fixture adapter. */
function source(values: Values, attribute: NumericalDataStudy['attribute']): Pick<NumericalDataBuildInput, 'study' | 'records'> {
    const units: NumericalDataStudy['units'] = [{id: 'unit-1', name: 'Sample 1'}, ...values.slice(1).map((_, index) => ({id: `unit-${index + 2}`, name: `Sample ${index + 2}`}))];
    const rows = values.map((value, index) => ({id: `record-${index + 1}`, unitId: units[index].id, occasionId: 'occasion', value}));
    return {
        study: {id: 'literal-study', populationName: 'Recorded measurements in one study', observationalUnitName: 'one sampled object', units,
            occasions: [{id: 'occasion', name: 'Recorded occasion'}], selection: 'distinct-units', attribute, goal: {kind: 'describe-recorded-collection'}},
        records: [rows[0], rows[1], rows[2], rows[3], ...rows.slice(4)]
    };
}

const lengthAttribute: NumericalDataStudy['attribute'] = {id: 'length', name: 'Length', kind: 'length', unit: 'centimeters', method: 'ruler', precision: q(1)};
const conventions = {quartileConvention: 'median-of-halves-excluding-odd-center', whiskerConvention: 'observed-minimum-maximum'} as const;

/** Independent oracle: N6,sum18,mean3,median5/2,MAD4/3,Q1=2,Q3=4,IQR2. */
export const literalSixRecordInput: NumericalDataBuildInput = {
    ...source([q(1), q(2), q(2), q(3), q(4), q(6)], lengthAttribute),
    axes: {value: makeSignedRationalAxis(q(1), 0, 6), count: makeSignedRationalAxis(q(1), 0, 6)},
    histogramEdges: [q(0), q(2), q(4), q(6)], ...conventions, departureCriterion: null,
    relations: ['empirical-shape', 'observed-variability', 'arithmetic-mean', 'mean-absolute-deviation']
};

/** Independent oracle: Q1=3/2,Q3=13/2,median3,IQR5. */
export const literalOddRecordInput: NumericalDataBuildInput = {
    ...source([q(1), q(2), q(3), q(4), q(9)], lengthAttribute),
    axes: {value: makeSignedRationalAxis(q(1), 0, 9), count: makeSignedRationalAxis(q(1), 0, 5)},
    histogramEdges: [q(0), q(3), q(6), q(9)], ...conventions, departureCriterion: null,
    relations: ['empirical-shape', 'observed-variability', 'median', 'interquartile-range']
};

/** Independent oracle: band[2,4] contains7/8;15 is11 from nearest ordinary value4. */
export const literalDepartureInput: NumericalDataBuildInput = {
    ...source([q(2), q(2), q(3), q(3), q(3), q(4), q(4), q(15)], lengthAttribute),
    axes: {value: makeSignedRationalAxis(q(2), 0, 8), count: makeSignedRationalAxis(q(1), 0, 8)},
    histogramEdges: [q(0), q(4), q(8), q(12), q(16)], ...conventions,
    departureCriterion: {kind: 'separated-from-routine-majority', lower: q(2), upper: q(4), minimumSeparation: q(3), referenceSource: 'study-reference-range'},
    relations: ['empirical-shape', 'criterion-backed-departure']
};

/** Constant and half-integer signed literals exercise broad off-target members. */
export const literalConstantInput: NumericalDataBuildInput = {
    ...source([q(3), q(3), q(3), q(3)], lengthAttribute),
    axes: {value: makeSignedRationalAxis(q(1), 0, 6), count: makeSignedRationalAxis(q(1), 0, 4)},
    histogramEdges: [q(0), q(2), q(4), q(6)], ...conventions, departureCriterion: null,
    relations: ['arithmetic-mean']
};
export const literalCelsiusInput: NumericalDataBuildInput = {
    ...source([q(-3, 2), q(-1, 2), q(1, 2), q(3, 2)], {id: 'temperature', name: 'Temperature', kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(1, 2)}),
    axes: {value: makeSignedRationalAxis(q(1), -2, 2), count: makeSignedRationalAxis(q(2), 0, 2)},
    histogramEdges: [q(-2), q(-1), q(0), q(1), q(2)], ...conventions, departureCriterion: null,
    relations: ['empirical-shape', 'observed-variability', 'arithmetic-mean', 'mean-absolute-deviation']
};

export const literalAllRelationInput: NumericalDataBuildInput = {
    ...literalDepartureInput,
    relations: ['arithmetic-mean', 'median', 'quartiles', 'mean-absolute-deviation', 'interquartile-range', 'frequency-partition',
        'sample-cardinality', 'variable-recording', 'empirical-shape', 'observed-variability', 'criterion-backed-departure', 'single-record-replacement'],
    replacement: {recordId: 'record-8', value: q(3), referenceSource: 'documented-routine-value'}
};

/** Twenty observations remain twenty separate dots even with only0/20 scale anchors. */
export const literalTallStackInput: NumericalDataBuildInput = {
    ...source([q(3), q(3), q(3), q(3), ...Array.from({length: 16}, () => q(3))], lengthAttribute),
    axes: {value: makeSignedRationalAxis(q(1), 0, 6), count: {minimum: q(0), maximum: q(20), step: q(20), ticks: [q(0), q(20)], zeroIndex: 0}},
    histogramEdges: [q(0), q(2), q(4), q(6)], ...conventions, departureCriterion: null, relations: ['arithmetic-mean']
};

export const literalSummaryOracles: Readonly<Record<string, Partial<NumericalDataProblem['summary']>>> = {
    six: {count: 6, sum: q(18), mean: q(3), mad: q(4, 3), iqr: q(2)},
    departure: {count: 8, sum: q(36), mean: q(9, 2), mad: q(21, 8), iqr: q(3, 2)},
    constant: {count: 4, sum: q(12), mean: q(3), mad: q(0), iqr: q(0)},
    celsius: {count: 4, sum: q(0), mean: q(0), mad: q(1), iqr: q(2)}
};

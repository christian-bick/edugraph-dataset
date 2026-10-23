import type {NumericalDataStudy} from '../../../types/problems.ts';
import type {NumericalDataBuildInput} from '../../../generators/statistics/numerical-data-helpers.ts';
import {distributionScalar as q, literalAllRelationInput, literalCelsiusInput, literalConstantInput} from './numerical-distribution-fixtures.ts';
import {makeSignedRationalAxis} from '../../../generators/number/signed-rational-axis-helpers.ts';

const comparison = ['arithmetic-mean', 'median', 'mean-absolute-deviation', 'interquartile-range', 'empirical-shape', 'single-record-replacement'] as const;
const conventions = {quartileConvention: 'median-of-halves-excluding-odd-center', whiskerConvention: 'observed-minimum-maximum'} as const;
const minutes: NumericalDataStudy['attribute'] = {id: 'duration', name: 'Duration', kind: 'duration', unit: 'minutes', method: 'timer', precision: q(1)};
const longNumerator = 2251799813685245, longDenominator = 2251799813685246;
const longRows = literalCelsiusInput.records.map(row => ({...row, value: q(longNumerator, longDenominator)}));
/** Four a/d records, one replaced by(a−4)/d; all supplied statistics remain safely representable. */
const longRationalInput: NumericalDataBuildInput = {...literalCelsiusInput,
    study: {...literalCelsiusInput.study, attribute: {id: 'length', name: 'Recorded length', kind: 'length', unit: 'centimeters', method: 'ruler', precision: q(1, longDenominator)}},
    records: [longRows[0], longRows[1], longRows[2], longRows[3]],
    axes: {value: {minimum: q(0), maximum: q(2), step: q(2), ticks: [q(0), q(2)], zeroIndex: 0},
        count: {minimum: q(0), maximum: q(4), step: q(4), ticks: [q(0), q(4)], zeroIndex: 0}},
    histogramEdges: [q(0), q(2)], relations: comparison,
    replacement: {recordId: longRows[0].id, value: q(longNumerator - 4, longDenominator), referenceSource: 'documented-routine-value'}};
function source(values: readonly [number, number, number, number, ...number[]], attribute: NumericalDataStudy['attribute'], goal: NumericalDataStudy['goal']): Pick<NumericalDataBuildInput, 'study' | 'records'> {
    const units: NumericalDataStudy['units'] = [{id: 'unit-1', name: 'Member 1'}, ...values.slice(1).map((_, index) => ({id: `unit-${index + 2}`, name: `Member ${index + 2}`}))];
    const rows = values.map((value, index) => ({id: `observation-${index + 1}`, unitId: units[index].id, occasionId: 'occasion', value: q(value)}));
    return {study: {id: 'selection-study', populationName: 'The recorded collection', observationalUnitName: 'one recorded member', units,
        occasions: [{id: 'occasion', name: 'Recorded occasion'}], selection: 'distinct-units', attribute, goal}, records: [rows[0], rows[1], rows[2], rows[3], ...rows.slice(4)]};
}

/** All values and replacements are literal inputs; the expected summaries below are independent oracles. */
export const selectionFixtures = {
    tokens: {...source([0, 2, 2, 4, 7], {id: 'tokens', name: 'Token count', kind: 'count', unit: 'items', method: 'counted', countedObject: 'tokens'}, {kind: 'equally-allocated-total'}),
        ...conventions, axes: {value: makeSignedRationalAxis(q(1), 0, 8), count: makeSignedRationalAxis(q(1), 0, 5)}, histogramEdges: [q(0), q(2), q(4), q(6), q(8)],
        departureCriterion: null, relations: comparison, replacement: {recordId: 'observation-5', value: q(2), referenceSource: 'documented-routine-value'}},
    waiting: {...source([2, 2, 3, 3, 3, 4, 4, 15], minutes, {kind: 'routine-member'}),
        ...conventions, axes: {value: makeSignedRationalAxis(q(2), 0, 8), count: makeSignedRationalAxis(q(1), 0, 8)}, histogramEdges: [q(0), q(4), q(8), q(12), q(16)],
        departureCriterion: {kind: 'separated-from-routine-majority', lower: q(2), upper: q(4), minimumSeparation: q(3), referenceSource: 'study-reference-range'},
        relations: comparison, replacement: {recordId: 'observation-8', value: q(3), referenceSource: 'documented-routine-value'}},
    journeys: {...source([1, 2, 4, 5], minutes, {kind: 'describe-recorded-collection'}),
        ...conventions, axes: {value: makeSignedRationalAxis(q(1), 0, 6), count: makeSignedRationalAxis(q(1), 0, 4)}, histogramEdges: [q(0), q(2), q(4), q(6)],
        departureCriterion: null, relations: comparison, replacement: {recordId: 'observation-4', value: q(3), referenceSource: 'documented-routine-value'}},
    zeroIqr: {...source([0, 2, 2, 2, 2, 4], minutes, {kind: 'describe-recorded-collection'}),
        ...conventions, axes: {value: makeSignedRationalAxis(q(1), 0, 4), count: makeSignedRationalAxis(q(1), 0, 6)}, histogramEdges: [q(0), q(2), q(4)],
        departureCriterion: null, relations: ['interquartile-range']},
    celsius: literalCelsiusInput,
    constant: literalConstantInput,
    longRational: longRationalInput,
    all: literalAllRelationInput
} satisfies Record<string, NumericalDataBuildInput>;

export const selectionOracles = {
    tokens: {original: [q(3), q(2), q(2), q(9, 2)], modified: [q(2), q(2), q(4, 5), q(2)], changes: [q(1), q(0), q(6, 5), q(5, 2)], center: 'greater', spread: 'less'},
    waiting: {original: [q(9, 2), q(3), q(21, 8), q(3, 2)], modified: [q(3), q(3), q(1, 2), q(1)], changes: [q(3, 2), q(0), q(17, 8), q(1, 2)], center: 'greater', spread: 'greater'},
    journeys: {original: [q(3), q(3), q(3, 2), q(3)], modified: [q(5, 2), q(5, 2), q(1), q(2)], changes: [q(1, 2), q(1, 2), q(1, 2), q(1)], center: 'equal', spread: 'less'}
} as const;

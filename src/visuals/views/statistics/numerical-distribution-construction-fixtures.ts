import type {NumericalDataBuildInput} from '../../../generators/statistics/numerical-data-helpers.ts';
import {distributionScalar as q, literalAllRelationInput, literalCelsiusInput, literalConstantInput, literalOddRecordInput,
    literalSixRecordInput, literalTallStackInput} from './numerical-distribution-fixtures.ts';

// Source literals are shared with package 23; all plot-specific expected values below are independent oracles.
const longDenominator = 9007199254740991;
const longNumerator = 2251799813685247;
const longValue = q(-longNumerator, longDenominator);
const longRows = literalCelsiusInput.records.map(row => ({...row, value: longValue}));
const longFirstAnchor: NumericalDataBuildInput = {
    ...literalCelsiusInput,
    study: {...literalCelsiusInput.study, attribute: {id: 'long-temperature', name: 'Recorded temperature',
        kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(longNumerator, longDenominator)}},
    records: [longRows[0], longRows[1], longRows[2], longRows[3]],
    axes: {value: {minimum: longValue, maximum: q(0), step: q(longNumerator, longDenominator), ticks: [longValue, q(0)], zeroIndex: 1},
        count: {minimum: q(0), maximum: q(4), step: q(4), ticks: [q(0), q(4)], zeroIndex: 0}},
    histogramEdges: [longValue, q(0)], relations: ['arithmetic-mean']
};

export const numericalConstructionFixtures = {
    six: {...literalSixRecordInput, relations: ['frequency-partition']},
    odd: {...literalOddRecordInput, relations: ['quartiles', 'median']},
    constant: literalConstantInput,
    celsius: literalCelsiusInput,
    all: literalAllRelationInput,
    tall: literalTallStackInput,
    longFirstAnchor,
    emptyBins: {...literalConstantInput, histogramEdges: [q(0), q(2), q(4), q(6)], relations: ['frequency-partition']}
} satisfies Record<string, NumericalDataBuildInput>;

export const numericalConstructionOracles = {
    sixBinCounts: [1, 3, 2],
    sixOrderedValues: ['1', '2', '2', '3', '4', '6'],
    oddFiveNumbers: [q(1), q(3, 2), q(3), q(13, 2), q(9)],
    celsiusFiveNumbers: [q(-3, 2), q(-1), q(0), q(1), q(3, 2)],
    constantBinCounts: [0, 4, 0]
} as const;

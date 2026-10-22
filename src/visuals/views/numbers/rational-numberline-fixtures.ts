import type {RationalNumberlineValuesProblem} from '../../../types/problems.ts';

export const integerLineOracle: RationalNumberlineValuesProblem = {
    kind: 'rational-numberline-values',
    axis: {
        minimum: {numerator: -3, denominator: 1}, maximum: {numerator: 1, denominator: 1}, step: {numerator: 1, denominator: 1}, zeroIndex: 3,
        ticks: [-3, -2, -1, 0, 1].map(numerator => ({numerator, denominator: 1})),
        tickNotations: ['-3', '-2', '-1', '0', '1'].map(numeral => ({kind: 'integer', numeral})), stepNotation: {kind: 'integer', numeral: '1'}
    },
    point: {value: {numerator: -2, denominator: 1}, magnitude: {numerator: 2, denominator: 1}, sign: -1, tickIndex: 1, notation: {kind: 'integer', numeral: '-2'}}
};

export const fractionLineOracle: RationalNumberlineValuesProblem = {
    kind: 'rational-numberline-values',
    axis: {
        minimum: {numerator: -5, denominator: 4}, maximum: {numerator: 5, denominator: 4}, step: {numerator: 1, denominator: 4}, zeroIndex: 5,
        ticks: [{numerator: -5, denominator: 4}, {numerator: -1, denominator: 1}, {numerator: -3, denominator: 4}, {numerator: -1, denominator: 2}, {numerator: -1, denominator: 4}, {numerator: 0, denominator: 1},
            {numerator: 1, denominator: 4}, {numerator: 1, denominator: 2}, {numerator: 3, denominator: 4}, {numerator: 1, denominator: 1}, {numerator: 5, denominator: 4}],
        tickNotations: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(numerator => ({kind: 'fraction', numerator, denominator: 4})),
        stepNotation: {kind: 'fraction', numerator: 1, denominator: 4}
    },
    point: {value: {numerator: -3, denominator: 4}, magnitude: {numerator: 3, denominator: 4}, sign: -1, tickIndex: 2, notation: {kind: 'fraction', numerator: -6, denominator: 8}}
};

export const decimalLineOracle: RationalNumberlineValuesProblem = {
    kind: 'rational-numberline-values',
    axis: {
        minimum: {numerator: -1, denominator: 1}, maximum: {numerator: 1, denominator: 1}, step: {numerator: 1, denominator: 4}, zeroIndex: 4,
        ticks: [{numerator: -1, denominator: 1}, {numerator: -3, denominator: 4}, {numerator: -1, denominator: 2}, {numerator: -1, denominator: 4}, {numerator: 0, denominator: 1},
            {numerator: 1, denominator: 4}, {numerator: 1, denominator: 2}, {numerator: 3, denominator: 4}, {numerator: 1, denominator: 1}],
        tickNotations: [
            {kind: 'decimal', coefficient: -100, scale: 2, numeral: '-1.00'}, {kind: 'decimal', coefficient: -75, scale: 2, numeral: '-0.75'},
            {kind: 'decimal', coefficient: -50, scale: 2, numeral: '-0.50'}, {kind: 'decimal', coefficient: -25, scale: 2, numeral: '-0.25'},
            {kind: 'decimal', coefficient: 0, scale: 2, numeral: '0.00'}, {kind: 'decimal', coefficient: 25, scale: 2, numeral: '0.25'},
            {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'}, {kind: 'decimal', coefficient: 75, scale: 2, numeral: '0.75'}, {kind: 'decimal', coefficient: 100, scale: 2, numeral: '1.00'}
        ], stepNotation: {kind: 'decimal', coefficient: 25, scale: 2, numeral: '0.25'}
    },
    point: {value: {numerator: -3, denominator: 4}, magnitude: {numerator: 3, denominator: 4}, sign: -1, tickIndex: 1, notation: {kind: 'decimal', coefficient: -750, scale: 3, numeral: '-0.750'}}
};

/** Three mixed-form ticks make every possible hidden label recoverable from two remaining anchors. */
export const threeTickLineOracle: RationalNumberlineValuesProblem = {
    kind: 'rational-numberline-values',
    axis: {
        minimum: {numerator: 0, denominator: 1}, maximum: {numerator: 1, denominator: 1}, step: {numerator: 1, denominator: 2}, zeroIndex: 0,
        ticks: [{numerator: 0, denominator: 1}, {numerator: 1, denominator: 2}, {numerator: 1, denominator: 1}],
        tickNotations: [{kind: 'integer', numeral: '0'}, {kind: 'fraction', numerator: 2, denominator: 4}, {kind: 'decimal', coefficient: 100, scale: 2, numeral: '1.00'}],
        stepNotation: {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'}
    },
    point: {value: {numerator: 0, denominator: 1}, magnitude: {numerator: 0, denominator: 1}, sign: 0, tickIndex: 0, notation: {kind: 'fraction', numerator: 0, denominator: 7}}
};

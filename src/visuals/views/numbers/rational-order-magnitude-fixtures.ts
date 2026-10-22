import type {RationalMagnitudeContextProblem, RationalMagnitudeRelationProblem, RationalOrderContextProblem, RationalOrderRelationProblem, SignedRationalAxis} from '../../../types/problems.ts';

export const quarterOrderAxis: SignedRationalAxis = {
    minimum: {numerator: -2, denominator: 1}, maximum: {numerator: 0, denominator: 1}, step: {numerator: 1, denominator: 4}, zeroIndex: 8,
    ticks: [{numerator: -2, denominator: 1}, {numerator: -7, denominator: 4}, {numerator: -3, denominator: 2}, {numerator: -5, denominator: 4},
        {numerator: -1, denominator: 1}, {numerator: -3, denominator: 4}, {numerator: -1, denominator: 2}, {numerator: -1, denominator: 4}, {numerator: 0, denominator: 1}]
};
export const orderLineOracle: RationalOrderRelationProblem = {
    kind: 'rational-order-relations', axis: quarterOrderAxis,
    first: {value: {numerator: -3, denominator: 2}, magnitude: {numerator: 3, denominator: 2}, sign: -1, tickIndex: 2},
    second: {value: {numerator: -7, denominator: 4}, magnitude: {numerator: 7, denominator: 4}, sign: -1, tickIndex: 1}, relation: 'greater'
};
export const magnitudeLineOracle: RationalMagnitudeRelationProblem = {
    kind: 'rational-magnitude-relations', axis: quarterOrderAxis,
    point: {value: {numerator: -7, denominator: 4}, magnitude: {numerator: 7, denominator: 4}, sign: -1, tickIndex: 1},
    distance: {fromTickIndex: 8, toTickIndex: 1, length: {numerator: 7, denominator: 4}}
};
export const zeroMagnitudeOracle: RationalMagnitudeRelationProblem = {
    kind: 'rational-magnitude-relations', axis: {minimum: {numerator: 0, denominator: 1}, maximum: {numerator: 1, denominator: 1}, step: {numerator: 1, denominator: 1}, ticks: [{numerator: 0, denominator: 1}, {numerator: 1, denominator: 1}], zeroIndex: 0},
    point: {value: {numerator: 0, denominator: 1}, magnitude: {numerator: 0, denominator: 1}, sign: 0, tickIndex: 0},
    distance: {fromTickIndex: 0, toTickIndex: 0, length: {numerator: 0, denominator: 1}}
};
export const temperatureOrderOracle: RationalOrderContextProblem = {
    kind: 'rational-order-contexts', context: {kind: 'temperature', reference: 'celsius-zero', unit: 'degrees-celsius'},
    first: {id: 'A', value: {numerator: -3, denominator: 2}, magnitude: {numerator: 3, denominator: 2}, sign: -1},
    second: {id: 'B', value: {numerator: -7, denominator: 4}, magnitude: {numerator: 7, denominator: 4}, sign: -1}, relation: 'greater'
};
export const debtMagnitudeOracle: RationalMagnitudeContextProblem = {
    kind: 'rational-magnitude-contexts', context: {kind: 'balance', reference: 'settled-balance', unit: 'dollars'},
    first: {id: 'A', value: {numerator: -40, denominator: 1}, magnitude: {numerator: 40, denominator: 1}, sign: -1},
    second: {id: 'B', value: {numerator: -30, denominator: 1}, magnitude: {numerator: 30, denominator: 1}, sign: -1}, signedRelation: 'less', magnitudeRelation: 'greater'
};
export const oppositeMagnitudesOracle: RationalMagnitudeContextProblem = {
    kind: 'rational-magnitude-contexts', context: {kind: 'elevation', reference: 'sea-level', unit: 'meters'},
    first: {id: 'A', value: {numerator: -7, denominator: 4}, magnitude: {numerator: 7, denominator: 4}, sign: -1},
    second: {id: 'B', value: {numerator: 7, denominator: 4}, magnitude: {numerator: 7, denominator: 4}, sign: 1}, signedRelation: 'less', magnitudeRelation: 'equal'
};
export const zeroContextMagnitudeOracle: RationalMagnitudeContextProblem = {
    kind: 'rational-magnitude-contexts', context: {kind: 'temperature', reference: 'celsius-zero', unit: 'degrees-celsius'},
    first: {id: 'A', value: {numerator: 0, denominator: 1}, magnitude: {numerator: 0, denominator: 1}, sign: 0},
    second: {id: 'B', value: {numerator: 1, denominator: 2}, magnitude: {numerator: 1, denominator: 2}, sign: 1}, signedRelation: 'less', magnitudeRelation: 'less'
};

import type {RationalOppositeRelationProblem, SignedRational, SignedRationalContextProblem, SignedRationalLocation} from '../../../types/problems.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const location = (numerator: number, denominator: number, tickIndex: number, sign: -1 | 0 | 1, magnitude: number): SignedRationalLocation =>
    ({value: r(numerator, denominator), tickIndex, sign, magnitude: r(magnitude, denominator)});

/** Independent exact half-step oracle: positions and magnitudes are literal inputs. */
export const oppositeOracle: RationalOppositeRelationProblem = {
    kind: 'rational-opposite-relations',
    axis: {minimum: r(-2), maximum: r(2), step: r(1, 2), ticks: [r(-2), r(-3, 2), r(-1), r(-1, 2), r(0), r(1, 2), r(1), r(3, 2), r(2)], zeroIndex: 4},
    original: location(-3, 2, 1, -1, 3), opposite: location(3, 2, 7, 1, 3), doubleOpposite: location(-3, 2, 1, -1, 3),
    zeroFixedPoint: {value: r(0), opposite: r(0), tickIndex: 4, oppositeTickIndex: 4},
    oppositePair: {negative: location(-3, 2, 1, -1, 3), positive: location(3, 2, 7, 1, 3), commonMagnitude: r(3, 2)},
    unequalSignedPair: {negative: location(-1, 2, 3, -1, 1), positive: location(3, 2, 7, 1, 3), equalMagnitude: false}
};
export const zeroOppositeOracle: RationalOppositeRelationProblem = {...oppositeOracle,
    original: location(0, 1, 4, 0, 0), opposite: location(0, 1, 4, 0, 0), doubleOpposite: location(0, 1, 4, 0, 0)};
export const positiveOppositeOracle: RationalOppositeRelationProblem = {...oppositeOracle,
    original: oppositeOracle.opposite, opposite: oppositeOracle.original, doubleOpposite: oppositeOracle.opposite};

export const balanceOracle: SignedRationalContextProblem = {
    kind: 'signed-rational-contexts', context: {kind: 'balance', reference: 'settled-balance', unit: 'dollars'},
    observations: [{id: 'A', value: r(-3, 2), magnitude: r(3, 2), sign: -1}, {id: 'B', value: r(5, 4), magnitude: r(5, 4), sign: 1}]
};
export const seaLevelOracle: SignedRationalContextProblem = {
    kind: 'signed-rational-contexts', context: {kind: 'elevation', reference: 'sea-level', unit: 'meters'},
    observations: [{id: 'A', value: r(0), magnitude: r(0), sign: 0}]
};
export const chargeOracle: SignedRationalContextProblem = {
    kind: 'signed-rational-contexts', context: {kind: 'charge', reference: 'neutral-net-charge', unit: 'coulombs'},
    observations: [{id: 'A', value: r(-2, 3), magnitude: r(2, 3), sign: -1}, {id: 'B', value: r(2, 3), magnitude: r(2, 3), sign: 1}, {id: 'C', value: r(0), magnitude: r(0), sign: 0}]
};

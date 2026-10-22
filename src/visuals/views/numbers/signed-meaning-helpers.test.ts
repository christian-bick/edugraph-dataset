import {describe, expect, it} from 'vitest';
import {buildRationalOppositeRelationProblem} from '../../../generators/number/rational-opposite-relations/generator.ts';
import {buildSignedRationalContextProblem} from '../../../generators/number/signed-rational-contexts/generator.ts';
import {balanceOracle, chargeOracle, oppositeOracle, positiveOppositeOracle, seaLevelOracle, zeroOppositeOracle} from './signed-meaning-fixtures.ts';
import {formatSignedRational, isRationalOppositeRelation, isSignedRational, isSignedRationalContext} from './signed-meaning-helpers.ts';

describe('exact signed meaning validators', () => {
    it('accepts canonical signed fractions and rejects unsafe, unreduced and negative-zero forms', () => {
        for (const value of [{numerator: 0, denominator: 1}, {numerator: -3, denominator: 2}, {numerator: Number.MAX_SAFE_INTEGER, denominator: 1}]) expect(isSignedRational(value)).toBe(true);
        for (const value of [null, {}, {numerator: -0, denominator: 1}, {numerator: 0, denominator: 2}, {numerator: 2, denominator: 4},
            {numerator: 1, denominator: -2}, {numerator: 1.5, denominator: 2}, {numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1}]) expect(isSignedRational(value)).toBe(false);
        expect(formatSignedRational({numerator: 3, denominator: 2}, true)).toBe('+3/2');
        expect(formatSignedRational({numerator: 0, denominator: 1}, true)).toBe('0');
    });
    it('validates coherent context data without imposing canonical observation profiles or local sampling bounds', () => {
        for (const data of [balanceOracle, seaLevelOracle, chargeOracle]) expect(isSignedRationalContext(data)).toBe(true);
        for (const context of ['temperature', 'elevation', 'balance', 'charge'] as const) {
            expect(isSignedRationalContext(buildSignedRationalContextProblem(context, [{numerator: 101, denominator: 7}]))).toBe(true);
        }
        const invalid = [undefined, {...balanceOracle, context: {...balanceOracle.context, reference: 'sea-level'}}, {...balanceOracle, observations: []},
            {...balanceOracle, observations: [balanceOracle.observations[0], balanceOracle.observations[0]]},
            {...balanceOracle, observations: [{...balanceOracle.observations[0], id: ' '}]},
            {...balanceOracle, observations: [{...balanceOracle.observations[0], sign: 1}]},
            {...seaLevelOracle, observations: [{...seaLevelOracle.observations[0], sign: -0}]},
            {...balanceOracle, observations: [{...balanceOracle.observations[0], magnitude: {numerator: -3, denominator: 2}}]}];
        invalid.forEach(data => expect(isSignedRationalContext(data)).toBe(false));
    });
    it('accepts negative, positive and coincident-zero primary relations and general exact step denominators', () => {
        for (const data of [oppositeOracle, positiveOppositeOracle, zeroOppositeOracle]) expect(isRationalOppositeRelation(data)).toBe(true);
        const thirds = buildRationalOppositeRelationProblem({step: {numerator: 1, denominator: 3}, radiusTicks: 2, originalTick: 0, oppositeMagnitudeTick: 1, unequalMagnitudeTicks: [1, 2]});
        expect(isRationalOppositeRelation(thirds)).toBe(true);
    });
    it('rejects corrupted scale, location, fixed-point and distance witnesses independently', () => {
        const invalid = [null, {...oppositeOracle, axis: {...oppositeOracle.axis, step: {numerator: 1, denominator: 3}}},
            {...oppositeOracle, axis: {...oppositeOracle.axis, zeroIndex: 3}}, {...oppositeOracle, axis: {...oppositeOracle.axis, ticks: oppositeOracle.axis.ticks.slice(0, 4)}},
            {...oppositeOracle, axis: {...oppositeOracle.axis, maximum: {numerator: 3, denominator: 1}}},
            {...oppositeOracle, original: {...oppositeOracle.original, tickIndex: 2}}, {...oppositeOracle, opposite: oppositeOracle.original},
            {...oppositeOracle, doubleOpposite: oppositeOracle.opposite},
            {...oppositeOracle, zeroFixedPoint: {...oppositeOracle.zeroFixedPoint, oppositeTickIndex: 5}},
            {...oppositeOracle, oppositePair: {...oppositeOracle.oppositePair, commonMagnitude: {numerator: 1, denominator: 2}}},
            {...oppositeOracle, unequalSignedPair: {...oppositeOracle.unequalSignedPair, negative: oppositeOracle.oppositePair.negative}},
            {...oppositeOracle, unequalSignedPair: {...oppositeOracle.unequalSignedPair, equalMagnitude: true}}];
        invalid.forEach(data => expect(isRationalOppositeRelation(data)).toBe(false));
    });
    it('rejects sparse array holes and inherited metadata names without throwing', () => {
        for (const kind of ['constructor', 'toString', '__proto__']) expect(isSignedRationalContext({...balanceOracle, context: {kind}})).toBe(false);
        expect(isSignedRationalContext({...balanceOracle, observations: new Array(1)})).toBe(false);
        for (const index of [0, 3, 8]) {
            const ticks = [...oppositeOracle.axis.ticks];
            delete ticks[index];
            expect(isRationalOppositeRelation({...oppositeOracle, axis: {...oppositeOracle.axis, ticks}})).toBe(false);
        }
    });
});

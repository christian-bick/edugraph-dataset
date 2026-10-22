import {describe, expect, it} from 'vitest';
import {buildCoordinateReflectionRelationProblem} from '../../../generators/coordinate/coordinate-reflection-relations/generator.ts';
import {coordinateOracle, decimalCoordinateOracle, fixedReflectionOracle, reflectionOracle, unreducedCoordinateOracle} from './rational-coordinate-fixtures.ts';
import {formatCoordinatePair, isCoordinateNotation, isCoordinatePoints, isCoordinateReflection, isCoordinateScalar, isRationalCoordinateAxis} from './rational-coordinate-helpers.ts';

describe('exact coordinate contracts', () => {
    it('preserves equivalent unreduced fraction spelling and trailing decimal precision', () => {
        expect(isCoordinatePoints(unreducedCoordinateOracle)).toBe(true);
        expect(formatCoordinatePair(unreducedCoordinateOracle.points[0])).toBe('(2/4, 4/2)');
        expect(isCoordinatePoints(decimalCoordinateOracle)).toBe(true);
        expect(formatCoordinatePair(decimalCoordinateOracle.points[0])).toBe('(1.50, 0.25)');
        expect(isCoordinateNotation({kind: 'fraction', numerator: 0, denominator: 4}, {numerator: 0, denominator: 1})).toBe(true);
        expect(isCoordinateNotation({kind: 'integer', numeral: '-12'}, {numerator: -12, denominator: 1})).toBe(true);
    });
    it('rejects invalid scalar/notation encodings by exact arithmetic rather than tolerance', () => {
        for (const value of [{numerator: -0, denominator: 1}, {numerator: 0, denominator: 2}, {numerator: 2, denominator: 4}, {numerator: 1, denominator: -2}, {numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1}]) expect(isCoordinateScalar(value)).toBe(false);
        const half = {numerator: 1, denominator: 2};
        for (const form of [{kind: 'integer', numeral: '1'}, {kind: 'integer', numeral: '01'}, {kind: 'fraction', numerator: 2, denominator: 5},
            {kind: 'fraction', numerator: 1, denominator: 0}, {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.5'},
            {kind: 'decimal', coefficient: 5000000000000001, scale: 16, numeral: '0.5000000000000001'}, {kind: 'toString'}]) expect(isCoordinateNotation(form, half)).toBe(false);
        expect(isCoordinateNotation({kind: 'decimal', coefficient: -0, scale: 2, numeral: '-0.00'}, {numerator: 0, denominator: 1})).toBe(false);
    });
    it('accepts unequal axis steps/counts/extents and nonnegative endpoint zero without opposite-only restrictions', () => {
        expect(isCoordinatePoints(coordinateOracle)).toBe(true);
        expect(isCoordinatePoints(decimalCoordinateOracle)).toBe(true);
        const short = {minimum: {numerator: 0, denominator: 1}, maximum: {numerator: 1, denominator: 1}, step: {numerator: 1, denominator: 1},
            ticks: [{numerator: 0, denominator: 1}, {numerator: 1, denominator: 1}], zeroIndex: 0,
            tickNotations: [{kind: 'integer', numeral: '0'}, {kind: 'integer', numeral: '1'}], stepNotation: {kind: 'integer', numeral: '1'}};
        expect(isRationalCoordinateAxis(short)).toBe(true);
    });
    it('rejects corrupted scale/location facts and sparse arrays without an incidental TypeError', () => {
        const ticks = [...coordinateOracle.axes.x.ticks]; delete ticks[1];
        const forms = [...coordinateOracle.axes.x.tickNotations]; delete forms[2];
        const invalid = [{...coordinateOracle, points: []}, {...coordinateOracle, points: new Array(1)}, {...coordinateOracle, points: [coordinateOracle.points[0], coordinateOracle.points[0]]},
            {...coordinateOracle, points: [{...coordinateOracle.points[0], locationTag: 'origin'}]},
            {...coordinateOracle, points: [{...coordinateOracle.points[0], x: {...coordinateOracle.points[0].x, tickIndex: 2}}]},
            {...coordinateOracle, axes: {...coordinateOracle.axes, x: {...coordinateOracle.axes.x, ticks}}},
            {...coordinateOracle, axes: {...coordinateOracle.axes, x: {...coordinateOracle.axes.x, tickNotations: forms}}},
            {...coordinateOracle, axes: {...coordinateOracle.axes, x: {...coordinateOracle.axes.x, step: {numerator: 1, denominator: 3}}}}];
        invalid.forEach(data => expect(isCoordinatePoints(data)).toBe(false));
    });
    it('accepts one/two reflections, both orders, repeated axes and coincident fixed points', () => {
        expect(isCoordinateReflection(reflectionOracle)).toBe(true);
        expect(isCoordinateReflection(fixedReflectionOracle)).toBe(true);
        for (const reflectionAxes of [['x'], ['y'], ['x', 'y'], ['y', 'x'], ['x', 'x'], ['y', 'y']] as const) {
            for (const [xTickIndex, yTickIndex] of [[1, 4], [4, 3], [5, 3]]) expect(isCoordinateReflection(buildCoordinateReflectionRelationProblem({axes: coordinateOracle.axes, xTickIndex: xTickIndex!, yTickIndex: yTickIndex!, reflectionAxes}))).toBe(true);
        }
    });
    it('requires exact connected point notation, not only equal numeric coordinates', () => {
        const data = buildCoordinateReflectionRelationProblem({axes: coordinateOracle.axes, xTickIndex: 5, yTickIndex: 4, reflectionAxes: ['x', 'y']});
        const before = {...data.steps[0].before, x: {...data.steps[0].before.x, notation: {kind: 'fraction', numerator: 2, denominator: 4}}};
        expect(isCoordinateReflection({...data, steps: [{...data.steps[0], before}, data.steps[1]]})).toBe(false);
        const intermediate = {...data.steps[1]!.before, x: {...data.steps[1]!.before.x, notation: {kind: 'fraction', numerator: 2, denominator: 4}}};
        expect(isCoordinateReflection({...data, steps: [data.steps[0], {...data.steps[1], before: intermediate}]})).toBe(false);
    });
    it('rejects broken chains, wrong mirror feet/distances, swapped components and false zero-change claims', () => {
        const first = reflectionOracle.steps[0];
        const invalid = [{...reflectionOracle, steps: new Array(1)}, {...reflectionOracle, steps: [{...first, axis: 'toString'}]},
            {...reflectionOracle, steps: [{...first, unchanged: {component: 'y', value: {numerator: -3, denominator: 2}}}]},
            {...reflectionOracle, steps: [{...first, mirror: {...first.mirror, afterDistance: {numerator: 2, denominator: 1}}}]},
            {...reflectionOracle, steps: [{...first, mirror: {...first.mirror, foot: first.before}}]},
            {...reflectionOracle, steps: [first, {...reflectionOracle.steps[1], before: reflectionOracle.original}]},
            {...fixedReflectionOracle, steps: [{...fixedReflectionOracle.steps[0], negated: {...fixedReflectionOracle.steps[0].negated, valueChanged: true}}]}];
        invalid.forEach(data => expect(isCoordinateReflection(data)).toBe(false));
    });
});

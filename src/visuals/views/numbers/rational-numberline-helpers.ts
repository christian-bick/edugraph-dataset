import type {RationalNumberlineValuesProblem} from '../../../types/problems.ts';
import {isCoordinateNotation, isCoordinateScalar, isRationalCoordinateAxis} from '../coordinate/rational-coordinate-helpers.ts';

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);

/** The family needs two remaining scale anchors when the marked tick's label is withheld. */
export function isRationalNumberlineValues(value: unknown): value is RationalNumberlineValuesProblem {
    if (!record(value) || value.kind !== 'rational-numberline-values' || !isRationalCoordinateAxis(value.axis) || value.axis.ticks.length < 3 || !record(value.point)) return false;
    const axis = value.axis, point = value.point;
    if (!isCoordinateScalar(point.value) || !isCoordinateScalar(point.magnitude) || !integer(point.tickIndex) || point.tickIndex < 0 || point.tickIndex >= axis.ticks.length || !integer(point.sign)) return false;
    const tick = axis.ticks[point.tickIndex]!;
    return point.value.numerator === tick.numerator && point.value.denominator === tick.denominator &&
        point.magnitude.numerator === Math.abs(point.value.numerator) && point.magnitude.denominator === point.value.denominator &&
        point.sign === Math.sign(point.value.numerator) && isCoordinateNotation(point.notation, point.value);
}

import {GeneratorValidationError} from '../../lib/errors.ts';
import type {CoordinateAbsoluteDifference, CoordinateAlignedSeparation, CoordinateMetricContext, CoordinateRouteProblem,
    RationalCoordinateAxes, RationalCoordinatePoint, SignedRational} from '../../types/problems.ts';
import {absoluteSignedRational, compareSignedRationals, isCanonicalSignedRational, makeSignedRational} from '../number/signed-rational-helpers.ts';
import {isRationalCoordinateAxes, isRationalCoordinatePoint} from './coordinate-helpers.ts';

const helperId = 'coordinate-metric-relations';
const fail = (message: string): never => { throw new GeneratorValidationError(helperId, message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const validId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const copy = (value: SignedRational): SignedRational => ({...value});
const roles = ['entrance', 'bench', 'fountain', 'tree', 'corner'] as const;

/** Reduce before conversion: safe input components can have unsafe cross-products. */
function rational(numerator: bigint, denominator: bigint): SignedRational {
    let first = numerator < 0n ? -numerator : numerator;
    let second = denominator;
    while (second !== 0n) [first, second] = [second, first % second];
    const n = Number(numerator / first);
    const d = Number(denominator / first);
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) fail('The reduced exact result exceeds safe rational components.');
    return makeSignedRational(n, d);
}

function operands(first: SignedRational, second: SignedRational): void {
    if (!isCanonicalSignedRational(first) || !isCanonicalSignedRational(second)) fail('Canonical exact rational operands are required.');
}

export function addCoordinateValues(first: SignedRational, second: SignedRational): SignedRational {
    operands(first, second);
    return rational(BigInt(first.numerator) * BigInt(second.denominator) + BigInt(second.numerator) * BigInt(first.denominator),
        BigInt(first.denominator) * BigInt(second.denominator));
}

export function subtractCoordinateValues(minuend: SignedRational, subtrahend: SignedRational): SignedRational {
    operands(minuend, subtrahend);
    return rational(BigInt(minuend.numerator) * BigInt(subtrahend.denominator) - BigInt(subtrahend.numerator) * BigInt(minuend.denominator),
        BigInt(minuend.denominator) * BigInt(subtrahend.denominator));
}

function separationPoint(value: unknown): value is RationalCoordinatePoint {
    return record(value) && validId(value.id) && record(value.x) && record(value.y)
        && isCanonicalSignedRational(value.x.value) && isCanonicalSignedRational(value.y.value);
}

/** Exact alignment, orientation and upper-minus-lower separation are independent of the learner task. */
export function makeCoordinateAlignedSeparation(from: RationalCoordinatePoint, to: RationalCoordinatePoint,
    varyingAxis?: 'x' | 'y'): CoordinateAlignedSeparation {
    if (!separationPoint(from) || !separationPoint(to)) fail('Two named exact coordinate points are required.');
    const equalX = compareSignedRationals(from.x.value, to.x.value) === 0;
    const equalY = compareSignedRationals(from.y.value, to.y.value) === 0;
    const axis = varyingAxis === undefined ? equalY ? 'x' : 'y' : varyingAxis;
    if ((axis !== 'x' && axis !== 'y') || (axis === 'x' ? !equalY : !equalX)
        || (from.id === to.id && !(equalX && equalY))) fail('The named points must share the fixed coordinate and a consistent identity.');
    const fixed = axis === 'x' ? 'y' : 'x';
    const comparison = compareSignedRationals(from[axis].value, to[axis].value);
    const lower = comparison <= 0 ? from[axis].value : to[axis].value;
    const upper = comparison <= 0 ? to[axis].value : from[axis].value;
    const distance = subtractCoordinateValues(upper, lower);
    return {fromId: from.id, toId: to.id, varyingAxis: axis, fixedCoordinate: copy(from[fixed].value),
        fromCoordinate: copy(from[axis].value), toCoordinate: copy(to[axis].value),
        direction: comparison < 0 ? 'increasing' : comparison > 0 ? 'decreasing' : 'stationary',
        lower: copy(lower), upper: copy(upper), orderedDifference: copy(distance), distance};
}

export function makeCoordinateAbsoluteDifference(separation: CoordinateAlignedSeparation,
    order: 'upper-lower' | 'to-from' = 'upper-lower'): CoordinateAbsoluteDifference {
    if (!record(separation) || (order !== 'upper-lower' && order !== 'to-from')) fail('An exact separation and supported subtraction order are required.');
    const minuend = order === 'upper-lower' ? separation.upper : separation.toCoordinate;
    const subtrahend = order === 'upper-lower' ? separation.lower : separation.fromCoordinate;
    const difference = subtractCoordinateValues(minuend, subtrahend);
    const magnitude = absoluteSignedRational(difference);
    if (!isCanonicalSignedRational(separation.distance) || compareSignedRationals(magnitude, separation.distance) !== 0) {
        fail('The absolute difference must equal the supplied separation distance.');
    }
    return {minuend: copy(minuend), subtrahend: copy(subtrahend), difference, magnitude};
}

/** Roles are semantic metadata; several vertices can each be a distinct corner. */
export function makeCoordinateMetricContext(points: readonly RationalCoordinatePoint[],
    selectedRoles?: readonly CoordinateMetricContext['landmarks'][number]['role'][]): CoordinateMetricContext {
    if (!Array.isArray(points) || points.length === 0 || !Array.from(points).every(point => record(point) && validId(point.id))
        || new Set(points.map(point => point.id)).size !== points.length) fail('A nonempty collection of uniquely named points is required.');
    if (selectedRoles !== undefined && (!Array.isArray(selectedRoles) || selectedRoles.length !== points.length
        || !Array.from(selectedRoles).every(role => roles.includes(role)))) fail('Supply exactly one valid semantic role per point.');
    return {kind: 'survey-map', reference: 'survey-origin', lengthUnit: 'meters', positiveX: 'east', positiveY: 'north',
        landmarks: points.map((point, index) => ({pointId: point.id, role: selectedRoles === undefined ? roles[index % roles.length]! : selectedRoles[index]!}))};
}

export type CoordinateMetricBounds = {
    axes: RationalCoordinateAxes;
    points: readonly RationalCoordinatePoint[];
    separations?: readonly CoordinateAlignedSeparation[];
    additionalValues?: readonly SignedRational[];
    range: number;
    signDomain?: 'nonnegative' | 'signed';
};

/** Bound every supplied mathematical value, including auxiliary work and complete route prefixes. */
export function assertCoordinateMetricBounds(options: CoordinateMetricBounds): void {
    if (!record(options) || !isRationalCoordinateAxes(options.axes) || !Number.isSafeInteger(options.range) || options.range <= 0
        || (options.signDomain !== undefined && options.signDomain !== 'nonnegative' && options.signDomain !== 'signed')
        || !Array.isArray(options.points) || !Array.from(options.points).every(point => isRationalCoordinatePoint(point, options.axes))
        || new Set(options.points.map(point => point.id)).size !== options.points.length
        || (options.separations !== undefined && !Array.isArray(options.separations))
        || (options.additionalValues !== undefined && !Array.isArray(options.additionalValues))) fail('A coherent frame, unique points and positive inclusive bound are required.');
    const values: unknown[] = [options.axes.x, options.axes.y].flatMap(axis => [axis.minimum, axis.maximum, axis.step, ...axis.ticks]);
    values.push(...options.points.flatMap(point => [point.x.value, point.y.value, point.x.magnitude, point.y.magnitude]));
    for (const separation of Array.from(options.separations ?? [])) {
        if (!record(separation)) fail('Separation evidence must be dense exact records.');
        values.push(separation.fixedCoordinate, separation.fromCoordinate, separation.toCoordinate,
            separation.lower, separation.upper, separation.orderedDifference, separation.distance);
    }
    values.push(...Array.from(options.additionalValues ?? []));
    const cap = makeSignedRational(options.range, 1);
    if (!values.every(value => isCanonicalSignedRational(value)
        && compareSignedRationals(absoluteSignedRational(value), cap) <= 0
        && (options.signDomain !== 'nonnegative' || value.numerator >= 0))) fail('Every coordinate, magnitude and working result must respect the selected numeric domain.');
}

export function makeCoordinateRouteEvidence(axes: RationalCoordinateAxes, landmarks: readonly RationalCoordinatePoint[],
    path: readonly string[]): Pick<CoordinateRouteProblem, 'legs' | 'cumulativeLengths' | 'totalLength'> {
    assertCoordinateMetricBounds({axes, points: landmarks, range: Number.MAX_SAFE_INTEGER});
    if (landmarks.length < 2 || !Array.isArray(path) || path.length < 2) fail('A route requires at least two landmarks and two visits.');
    const points = new Map(landmarks.map(point => [point.id, point]));
    if (!Array.from(path).every(id => typeof id === 'string' && points.has(id))) fail('Every dense route visit must reference a known landmark.');
    const legs = path.slice(1).map((id, index) => makeCoordinateAlignedSeparation(points.get(path[index]!)!, points.get(id)!));
    const cumulativeLengths = [makeSignedRational(0, 1)];
    for (const leg of legs) cumulativeLengths.push(addCoordinateValues(cumulativeLengths[cumulativeLengths.length - 1]!, leg.distance));
    return {legs: [legs[0]!, ...legs.slice(1)], cumulativeLengths: [cumulativeLengths[0]!, ...cumulativeLengths.slice(1)],
        totalLength: copy(cumulativeLengths[cumulativeLengths.length - 1]!)};
}

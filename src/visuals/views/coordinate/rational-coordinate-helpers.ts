import type {CoordinatePointsProblem, CoordinateReflectionRelationProblem, CoordinateLocationTag, RationalCoordinateAxes, RationalCoordinateAxis, RationalCoordinatePoint, SignedRational, SignedRationalNotation} from '../../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
function gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) [a, b] = [b, a % b];
    return a;
}
export function isCoordinateScalar(value: unknown): value is SignedRational {
    return record(value) && integer(value.numerator) && integer(value.denominator) && value.denominator > 0 && gcd(BigInt(Math.abs(value.numerator)), BigInt(value.denominator)) === 1n;
}
const equal = (a: SignedRational, b: SignedRational) => a.numerator === b.numerator && a.denominator === b.denominator;
const equivalent = (numerator: number, denominator: number, value: SignedRational) => BigInt(numerator) * BigInt(value.denominator) === BigInt(value.numerator) * BigInt(denominator);

function decimalNumeral(coefficient: number, scale: number): string {
    const digits = String(Math.abs(coefficient)).padStart(scale + 1, '0');
    return `${coefficient < 0 ? '-' : ''}${scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`}`;
}
export function isCoordinateNotation(notation: unknown, value: SignedRational): notation is SignedRationalNotation {
    if (!record(notation)) return false;
    if (notation.kind === 'integer') {
        if (typeof notation.numeral !== 'string' || !/^(0|-?[1-9]\d*)$/.test(notation.numeral)) return false;
        const number = Number(notation.numeral);
        return integer(number) && equivalent(number, 1, value);
    }
    if (notation.kind === 'fraction') return integer(notation.numerator) && integer(notation.denominator) && notation.denominator > 0 && equivalent(notation.numerator, notation.denominator, value);
    return notation.kind === 'decimal' && integer(notation.coefficient) && integer(notation.scale) && notation.scale >= 0 && Number.isSafeInteger(10 ** notation.scale) &&
        notation.numeral === decimalNumeral(notation.coefficient, notation.scale) && equivalent(notation.coefficient, 10 ** notation.scale, value);
}
export function formatCoordinateNotation(notation: SignedRationalNotation): string {
    return notation.kind === 'fraction' ? `${notation.numerator}/${notation.denominator}` : notation.numeral;
}
export function formatCoordinateScalar(value: SignedRational): string {
    return value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
}
export function formatCoordinatePair(point: RationalCoordinatePoint): string {
    return `(${formatCoordinateNotation(point.x.notation)}, ${formatCoordinateNotation(point.y.notation)})`;
}

export function isRationalCoordinateAxis(value: unknown): value is RationalCoordinateAxis {
    if (!record(value) || !isCoordinateScalar(value.minimum) || !isCoordinateScalar(value.maximum) || !isCoordinateScalar(value.step) || value.step.numerator <= 0 ||
        !Array.isArray(value.ticks) || value.ticks.length < 2 || !Array.from(value.ticks).every(isCoordinateScalar) || !integer(value.zeroIndex) ||
        value.zeroIndex < 0 || value.zeroIndex >= value.ticks.length || !Array.isArray(value.tickNotations) || value.tickNotations.length !== value.ticks.length) return false;
    const ticks: SignedRational[] = value.ticks;
    const step = value.step;
    if (!equal(ticks[0]!, value.minimum) || !equal(ticks.at(-1)!, value.maximum) || ticks[value.zeroIndex]!.numerator !== 0 || !isCoordinateNotation(value.stepNotation, step)) return false;
    if (!Array.from(value.tickNotations).every((notation, index) => isCoordinateNotation(notation, ticks[index]!))) return false;
    return ticks.slice(1).every((tick, index) => {
        const previous = ticks[index]!;
        return (BigInt(tick.numerator) * BigInt(previous.denominator) - BigInt(previous.numerator) * BigInt(tick.denominator)) * BigInt(step.denominator) ===
            BigInt(step.numerator) * BigInt(tick.denominator) * BigInt(previous.denominator);
    });
}
function isAxes(value: unknown): value is RationalCoordinateAxes {
    return record(value) && isRationalCoordinateAxis(value.x) && isRationalCoordinateAxis(value.y);
}
function locationTag(x: number, y: number): CoordinateLocationTag {
    if (x === 0 && y === 0) return 'origin';
    if (y === 0) return 'x-axis';
    if (x === 0) return 'y-axis';
    return x > 0 ? y > 0 ? 'quadrant-I' : 'quadrant-IV' : y > 0 ? 'quadrant-II' : 'quadrant-III';
}
function isPoint(value: unknown, axes: RationalCoordinateAxes): value is RationalCoordinatePoint {
    if (!record(value) || typeof value.id !== 'string' || !value.id || value.id.trim() !== value.id) return false;
    for (const component of ['x', 'y'] as const) {
        const part = value[component];
        if (!record(part) || !isCoordinateScalar(part.value) || !isCoordinateScalar(part.magnitude) || !integer(part.tickIndex) || part.tickIndex < 0 || part.tickIndex >= axes[component].ticks.length ||
            !equal(part.value, axes[component].ticks[part.tickIndex]!) || !integer(part.sign) || part.sign !== Math.sign(part.value.numerator) ||
            part.magnitude.numerator !== Math.abs(part.value.numerator) || part.magnitude.denominator !== part.value.denominator || !isCoordinateNotation(part.notation, part.value)) return false;
    }
    return value.locationTag === locationTag((value.x as RationalCoordinatePoint['x']).sign, (value.y as RationalCoordinatePoint['y']).sign);
}
export function isCoordinatePoints(value: unknown): value is CoordinatePointsProblem {
    if (!record(value) || value.kind !== 'coordinate-points' || !isAxes(value.axes) || !Array.isArray(value.points) || value.points.length === 0) return false;
    const axes = value.axes;
    const ids = new Set<string>();
    return Array.from(value.points).every(point => {
        if (!isPoint(point, axes) || ids.has(point.id)) return false;
        ids.add(point.id);
        return true;
    });
}
function sameNotation(a: SignedRationalNotation, b: SignedRationalNotation): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'integer' && b.kind === 'integer') return a.numeral === b.numeral;
    if (a.kind === 'fraction' && b.kind === 'fraction') return a.numerator === b.numerator && a.denominator === b.denominator;
    return a.kind === 'decimal' && b.kind === 'decimal' && a.coefficient === b.coefficient && a.scale === b.scale && a.numeral === b.numeral;
}
const samePoint = (a: RationalCoordinatePoint, b: RationalCoordinatePoint) => a.id === b.id &&
    (['x', 'y'] as const).every(component => equal(a[component].value, b[component].value) && equal(a[component].magnitude, b[component].magnitude) &&
        a[component].tickIndex === b[component].tickIndex && a[component].sign === b[component].sign && sameNotation(a[component].notation, b[component].notation));
export function isCoordinateReflection(value: unknown): value is CoordinateReflectionRelationProblem {
    if (!record(value) || value.kind !== 'coordinate-reflection-relations' || !isAxes(value.axes) || !isPoint(value.original, value.axes) ||
        !Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 2) return false;
    const axes = value.axes;
    let previous = value.original;
    const identities = new Map<string, RationalCoordinatePoint>([[previous.id, previous]]);
    return Array.from(value.steps).every(step => {
        if (!record(step) || (step.axis !== 'x' && step.axis !== 'y') || !isPoint(step.before, axes) || !isPoint(step.after, axes) || !samePoint(step.before, previous) ||
            !record(step.unchanged) || !record(step.negated) || !record(step.mirror) || !isPoint(step.mirror.foot, axes)) return false;
        const unchanged = step.axis;
        const negated = step.axis === 'x' ? 'y' : 'x';
        const before = step.before;
        const after = step.after;
        const mirror = step.mirror;
        const foot = step.mirror.foot;
        if (step.unchanged.component !== unchanged || !isCoordinateScalar(step.unchanged.value) || !equal(step.unchanged.value, before[unchanged].value) || !equal(before[unchanged].value, after[unchanged].value) ||
            step.negated.component !== negated || !isCoordinateScalar(step.negated.before) || !isCoordinateScalar(step.negated.after) || !equal(step.negated.before, before[negated].value) ||
            !equal(step.negated.after, after[negated].value) || before[negated].value.numerator !== -after[negated].value.numerator || before[negated].value.denominator !== after[negated].value.denominator ||
            step.negated.valueChanged !== (before[negated].value.numerator !== 0) || !isCoordinateScalar(mirror.beforeDistance) || !isCoordinateScalar(mirror.afterDistance) ||
            !equal(mirror.beforeDistance, before[negated].magnitude) || !equal(mirror.afterDistance, after[negated].magnitude) ||
            !equal(foot[unchanged].value, before[unchanged].value) || foot[negated].value.numerator !== 0) return false;
        for (const point of [before, after, foot]) {
            const existing = identities.get(point.id);
            if (existing && !samePoint(existing, point)) return false;
            identities.set(point.id, point);
        }
        previous = after;
        return true;
    });
}

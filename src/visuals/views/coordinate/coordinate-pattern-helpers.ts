import type {ArithmeticPairedPatternSequence, CoordinatePatternPairsProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export const GRID_LEFT = 48;
export const GRID_TOP = 22;
export const GRID_SIZE = 340;
export const GRID_BOTTOM = GRID_TOP + GRID_SIZE;

const safeNonnegativeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) >= 0;

function validSequence(sequence: ArithmeticPairedPatternSequence): boolean {
    if (!sequence || typeof sequence !== 'object' || !sequence.rule
        || sequence.rule.kind !== 'add-constant'
        || !safeNonnegativeInteger(sequence.start)
        || !Number.isSafeInteger(sequence.rule.increment)
        || sequence.rule.increment <= 0
        || !Array.isArray(sequence.terms)
        || sequence.terms.length < 4
        || sequence.terms.length > 8
        || sequence.terms.some(term => !safeNonnegativeInteger(term))) return false;

    return sequence.terms[0] === sequence.start
        && sequence.terms.slice(1).every((term, index) =>
            term === sequence.terms[index]! + sequence.rule.increment);
}

/** Checks the source sequences, the exact zipped pairs, and the supported drawing range. */
export function validateCoordinatePattern(viewId: string, data: CoordinatePatternPairsProblem): void {
    if (data.kind !== 'coordinate-pattern-pairs'
        || !validSequence(data.first)
        || !validSequence(data.second)
        || data.first.terms.length !== data.second.terms.length
        || !Array.isArray(data.points)
        || data.points.length !== data.first.terms.length) {
        throw new ViewValidationError(viewId, 'Coordinate pairs require complete aligned numerical patterns.');
    }
    if (!data.points.every((point, index) => point
        && safeNonnegativeInteger(point.x)
        && safeNonnegativeInteger(point.y)
        && point.x <= 36 && point.y <= 36
        && point.x === data.first.terms[index]
        && point.y === data.second.terms[index])) {
        throw new ViewValidationError(viewId, 'Every plotted pair must exactly match the two patterns and fit the coordinate grid.');
    }
    if (!data.points.some(point => point.x === 0 || point.y === 0)) {
        throw new ViewValidationError(viewId, 'The coordinate pattern must include an axis point.');
    }
}

/** Uses equal x/y unit lengths and at most nine major tick intervals. */
export function coordinateGridScale(data: CoordinatePatternPairsProblem): {maximum: number; majorStep: number} {
    const greatest = Math.max(4, ...data.points.flatMap(point => [point.x, point.y]));
    const majorStep = greatest <= 10 ? 1 : greatest <= 20 ? 2 : 5;
    return {maximum: Math.ceil(greatest / majorStep) * majorStep, majorStep};
}

export function coordinatePointPosition(
    point: {x: number; y: number},
    maximum: number
): {x: number; y: number} {
    const unit = GRID_SIZE / maximum;
    return {x: GRID_LEFT + point.x * unit, y: GRID_BOTTOM - point.y * unit};
}

/** Keeps labels off the origin's zero, both axes' tick labels, and the outer edges. */
export function markerLabelPosition(
    point: {x: number; y: number},
    maximum: number
): {x: number; y: number; anchor: 'start' | 'middle' | 'end'} {
    const position = coordinatePointPosition(point, maximum);
    if (point.x === 0) return {x: position.x + 13, y: position.y - 10, anchor: 'start'};
    if (point.y === 0) return {x: position.x, y: position.y - 15, anchor: 'middle'};
    if (point.x >= maximum - 1) return {x: position.x - 12, y: position.y - 9, anchor: 'end'};
    return {x: position.x + 11, y: position.y - 9, anchor: 'start'};
}

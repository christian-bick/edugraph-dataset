import type {CoordinateSystemProblem} from '../../../types/problems.ts';

export const COORDINATE_FRAME = {
    width: 470,
    height: 450,
    originX: 70,
    originY: 390,
    tickPixels: 42
} as const;

type Axis = CoordinateSystemProblem['axes']['horizontal'] | CoordinateSystemProblem['axes']['vertical'];

const validAxis = (axis: Axis | undefined, name: 'x' | 'y'): boolean => {
    if (!axis || axis.axisName !== name || axis.coordinateName !== name
        || (axis.tickStep !== 1 && axis.tickStep !== 2)
        || !Array.isArray(axis.tickValues)
        || axis.tickValues.length < 5 || axis.tickValues.length > 9) return false;
    return axis.tickValues.every((value, index) =>
        Number.isSafeInteger(value) && value === index * axis.tickStep);
};

/** The frame, scale, and travel must all agree before either task is drawn. */
export function isValidCoordinateSystem(data: CoordinateSystemProblem): boolean {
    if (!data || data.kind !== 'coordinate-system-foundations'
        || data.origin?.x !== 0 || data.origin?.y !== 0
        || data.rightAngleDegrees !== 90
        || !validAxis(data.axes?.horizontal, 'x')
        || !validAxis(data.axes?.vertical, 'y')
        || data.axes.horizontal.positiveUnitVector?.x !== 1
        || data.axes.horizontal.positiveUnitVector?.y !== 0
        || data.axes.vertical.positiveUnitVector?.x !== 0
        || data.axes.vertical.positiveUnitVector?.y !== 1
        || !data.travel
        || !Number.isSafeInteger(data.travel.xUnits)
        || !Number.isSafeInteger(data.travel.yUnits)) return false;
    return data.axes.horizontal.tickValues.includes(data.travel.xUnits)
        && data.axes.vertical.tickValues.includes(data.travel.yUnits);
}

export function coordinatePosition(
    data: CoordinateSystemProblem,
    xUnits: number,
    yUnits: number
): {x: number; y: number} {
    return {
        x: COORDINATE_FRAME.originX + xUnits / data.axes.horizontal.tickStep * COORDINATE_FRAME.tickPixels,
        y: COORDINATE_FRAME.originY - yUnits / data.axes.vertical.tickStep * COORDINATE_FRAME.tickPixels
    };
}

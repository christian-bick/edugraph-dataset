import type {AngleMeasurementProblem} from '../../../types/problems.ts';

const ANGLE_MEASURES = new Set([
    23, 30, 37, 45, 52, 60, 68, 75, 90, 105, 112, 120, 127, 135, 143, 150, 158
]);

export const isValidAngleMeasurementProblem = (data: AngleMeasurementProblem): boolean =>
    ANGLE_MEASURES.has(data.angleMeasure);

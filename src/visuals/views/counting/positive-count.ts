import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

/** Validate the nonempty collection shared by positive-count projections. */
export function validatePositiveCountingData(viewId: string, data: unknown): number {
    validateProblemData(viewId, data, ['numObjects']);
    const count = (data as {numObjects: unknown}).numObjects;
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count <= 0) {
        throw new ViewValidationError(viewId, 'The object count must be a positive safe integer.');
    }
    return count;
}

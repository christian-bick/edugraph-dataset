import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import type {CountingEnumerationProblem, CountingTotalProblem} from '../../../types/problems.ts';

/** Validate the nonempty collection shared by positive-count projections. */
export function validatePositiveCountingData(viewId: string, data: unknown): number {
    validateProblemData(viewId, data, ['numObjects']);
    const count = (data as {numObjects: unknown}).numObjects;
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count <= 0) {
        throw new ViewValidationError(viewId, 'The object count must be a positive safe integer.');
    }
    return count;
}

function validateCountingCardinality(viewId: string, data: CountingEnumerationProblem | CountingTotalProblem): void {
    const count = validatePositiveCountingData(viewId, data);
    if (data.simpleAnswer !== count) {
        throw new ViewValidationError(viewId, 'The total must equal the collection cardinality.');
    }
    if (data.parity !== undefined && (data.parity !== 'even' && data.parity !== 'odd'
        || data.parity !== (count % 2 === 0 ? 'even' : 'odd'))) {
        throw new ViewValidationError(viewId, 'The parity must agree with the collection cardinality.');
    }
}

/** Require a complete one-to-one count before projecting its collection or counting numbers. */
export function validateCountingEnumerationData(viewId: string, data: unknown): CountingEnumerationProblem {
    validateProblemData(viewId, data, ['kind']);
    const enumeration = data as CountingEnumerationProblem;
    if (enumeration.kind !== 'counting-enumeration') {
        throw new ViewValidationError(viewId, 'A counting-enumeration payload is required.');
    }
    validateProblemData(viewId, data, ['numObjects', 'simpleAnswer', 'countingNumbers']);
    validateCountingCardinality(viewId, enumeration);
    if (!Array.isArray(enumeration.countingNumbers) || enumeration.countingNumbers.length !== enumeration.numObjects) {
        throw new ViewValidationError(viewId, 'The counting numbers must enumerate every object exactly once.');
    }
    for (let index = 0; index < enumeration.numObjects; index++) {
        if (!Object.hasOwn(enumeration.countingNumbers, index) || enumeration.countingNumbers[index] !== index + 1) {
            throw new ViewValidationError(viewId, 'The counting numbers must be the complete sequence from one to the total.');
        }
    }
    return enumeration;
}

/** Require scalar collection cardinality, independently of any enumeration procedure. */
export function validateCountingTotalData(viewId: string, data: unknown): CountingTotalProblem {
    validateProblemData(viewId, data, ['kind']);
    const total = data as CountingTotalProblem;
    if (total.kind !== 'counting-total') {
        throw new ViewValidationError(viewId, 'A counting-total payload is required.');
    }
    if ('countingNumbers' in total) {
        throw new ViewValidationError(viewId, 'A counting-total payload must not contain an enumeration witness.');
    }
    validateProblemData(viewId, data, ['numObjects', 'simpleAnswer']);
    validateCountingCardinality(viewId, total);
    return total;
}

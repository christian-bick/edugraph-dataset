import {describe, expect, it} from 'vitest';
import {validateProblemData, ViewValidationError} from './validation.ts';

describe('validateProblemData', () => {
    it('should throw ViewValidationError if data is missing or null', () => {
        expect(() => validateProblemData('test-view', null, ['field'])).toThrow(ViewValidationError);
        expect(() => validateProblemData('test-view', undefined, ['field'])).toThrow(ViewValidationError);
    });

    it('should throw ViewValidationError if a required field is missing or undefined', () => {
        expect(() => validateProblemData('test-view', {}, ['field'])).toThrow(ViewValidationError);
        expect(() => validateProblemData('test-view', { other: 123 }, ['field'])).toThrow(ViewValidationError);
    });

    it('should throw ViewValidationError if a required field is an empty array', () => {
        expect(() => validateProblemData('test-view', { field: [] }, ['field'])).toThrow(ViewValidationError);
    });

    it('should pass if all required fields are present and non-empty', () => {
        expect(() => validateProblemData('test-view', { field: 'value' }, ['field'])).not.toThrow();
        expect(() => validateProblemData('test-view', { field: ['value'] }, ['field'])).not.toThrow();
        expect(() => validateProblemData('test-view', { field: 0 }, ['field'])).not.toThrow();
        expect(() => validateProblemData('test-view', { field: false }, ['field'])).not.toThrow();
    });
});

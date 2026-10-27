import {describe, expect, it} from 'vitest';
import {ViewValidationError} from '../../helpers/validation.ts';
import {validatePositiveCountingData} from './positive-count.ts';

describe('positive-count projection payloads', () => {
    it.each([1, 2, 20, Number.MAX_SAFE_INTEGER])('accepts the positive safe count %s without changing data', count => {
        const data = Object.freeze({numObjects: count, simpleAnswer: count});
        expect(validatePositiveCountingData('counting-fixture', data)).toBe(count);
        expect(data).toEqual({numObjects: count, simpleAnswer: count});
    });

    it.each([0, -0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1,
        '1', true, {}, [1]])('rejects an invalid object count %j', numObjects => {
        expect(() => validatePositiveCountingData('counting-fixture', {numObjects})).toThrow(ViewValidationError);
        expect(() => validatePositiveCountingData('counting-fixture', {numObjects}))
            .toThrow('[View: counting-fixture] Validation Error: The object count must be a positive safe integer.');
    });

    it.each([undefined, null, {}, {numObjects: undefined}, {numObjects: null}, {numObjects: []}])(
        'rejects missing or empty payload data %j through shared field validation', data => {
            expect(() => validatePositiveCountingData('counting-fixture', data)).toThrow(ViewValidationError);
            expect(() => validatePositiveCountingData('counting-fixture', data)).toThrow('[View: counting-fixture]');
        });
});

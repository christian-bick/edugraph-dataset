import {describe, expect, it} from 'vitest';
import {ViewValidationError} from '../../helpers/validation.ts';
import {validateCountingEnumerationData, validateCountingTotalData, validatePositiveCountingData} from './positive-count.ts';

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

const total = Object.freeze({kind: 'counting-total' as const, numObjects: 6, simpleAnswer: 6, parity: 'even' as const});
const enumeration = Object.freeze({kind: 'counting-enumeration' as const, numObjects: 6, simpleAnswer: 6,
    countingNumbers: Object.freeze([1, 2, 3, 4, 5, 6]), parity: 'even' as const});

describe('separate total and enumeration projection contracts', () => {
    it.each([1, 6, 19])('accepts scalar cardinality %s without requiring or creating counting numbers', count => {
        const data = Object.freeze({kind: 'counting-total' as const, numObjects: count, simpleAnswer: count});
        expect(validateCountingTotalData('total-fixture', data)).toBe(data);
        expect(data).not.toHaveProperty('countingNumbers');
    });

    it.each([
        [1, [1]], [6, [1, 2, 3, 4, 5, 6]],
        [20, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]]
    ] as const)('accepts the complete count through %s without replacing its witness', (count, countingNumbers) => {
        const data = Object.freeze({kind: 'counting-enumeration' as const, numObjects: count,
            simpleAnswer: count, countingNumbers: Object.freeze(countingNumbers)});
        expect(validateCountingEnumerationData('enumeration-fixture', data)).toBe(data);
        expect(data.countingNumbers).toBe(countingNumbers);
    });

    it('keeps optional parity about the collection cardinality in both contracts', () => {
        expect(validateCountingTotalData('total-fixture', total)).toBe(total);
        expect(validateCountingEnumerationData('enumeration-fixture', enumeration)).toBe(enumeration);
        expect(validateCountingTotalData('total-fixture', {...total, numObjects: 7, simpleAnswer: 7, parity: 'odd'}).parity).toBe('odd');
        expect(validateCountingEnumerationData('enumeration-fixture', {...enumeration, numObjects: 7, simpleAnswer: 7,
            countingNumbers: [1, 2, 3, 4, 5, 6, 7], parity: 'odd'}).parity).toBe('odd');
    });

    it('rejects the opposite mathematical family before inspecting its other fields', () => {
        expect(() => validateCountingEnumerationData('enumeration-fixture', total))
            .toThrow('[View: enumeration-fixture] Validation Error: A counting-enumeration payload is required.');
        expect(() => validateCountingTotalData('total-fixture', enumeration))
            .toThrow('[View: total-fixture] Validation Error: A counting-total payload is required.');
        for (const validate of [validateCountingEnumerationData, validateCountingTotalData]) {
            expect(() => validate('counting-fixture', {numObjects: 6, simpleAnswer: 6})).toThrow(ViewValidationError);
            expect(() => validate('counting-fixture', {kind: 'parity-grouping', numObjects: 6})).toThrow(ViewValidationError);
        }
    });

    it.each([
        {name: 'own sequence', data: {...total, countingNumbers: [1, 2, 3, 4, 5, 6]}},
        {name: 'own undefined sequence', data: {...total, countingNumbers: undefined}},
        {name: 'inherited sequence', data: Object.assign(Object.create({countingNumbers: [1, 2, 3, 4, 5, 6]}), total)},
        {name: 'inherited undefined sequence', data: Object.assign(Object.create({countingNumbers: undefined}), total)}
    ])('rejects a total payload with $name', ({data}) => {
        expect(() => validateCountingTotalData('total-fixture', data)).toThrow(ViewValidationError);
        expect(() => validateCountingTotalData('total-fixture', data))
            .toThrow('A counting-total payload must not contain an enumeration witness.');
    });

    it.each([
        {numObjects: 0}, {numObjects: -1}, {numObjects: 1.5}, {numObjects: NaN}, {numObjects: Infinity},
        {numObjects: Number.MAX_SAFE_INTEGER + 1}, {numObjects: '6'},
        {simpleAnswer: undefined}, {simpleAnswer: null}, {simpleAnswer: 5}, {simpleAnswer: '6'},
        {parity: 'odd'}, {parity: 'any'}, {parity: null}
    ])('rejects incoherent scalar evidence %j in both families', changed => {
        expect(() => validateCountingTotalData('total-fixture', {...total, ...changed})).toThrow(ViewValidationError);
        expect(() => validateCountingEnumerationData('enumeration-fixture', {...enumeration, ...changed})).toThrow(ViewValidationError);
    });

    it.each([
        undefined, null, [], {}, '1,2,3,4,5,6',
        [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6, 7], [0, 1, 2, 3, 4, 5],
        [1, 2, 2, 4, 5, 6], [1, 2, 4, 3, 5, 6], [1, 2, 3, 4, 5, '6'],
        [1, 2, 3, 4, 5, NaN], [1, 2, 3, 4, 5, Infinity]
    ])('rejects a missing or incomplete enumeration witness %j', countingNumbers => {
        expect(() => validateCountingEnumerationData('enumeration-fixture', {...enumeration, countingNumbers}))
            .toThrow(ViewValidationError);
    });

    it('requires each counting-number position to be an own entry rather than a hole or inherited value', () => {
        const sparse = Object.assign(new Array<number>(6), {0: 1, 1: 2, 3: 4, 4: 5, 5: 6});
        expect(() => validateCountingEnumerationData('enumeration-fixture', {...enumeration, countingNumbers: sparse}))
            .toThrow(ViewValidationError);
        const inherited = Object.assign(new Array<number>(6), {0: 1, 1: 2, 3: 4, 4: 5, 5: 6});
        Object.setPrototypeOf(inherited, Object.assign(Object.create(Array.prototype), {2: 3}));
        expect(inherited[2]).toBe(3);
        expect(() => validateCountingEnumerationData('enumeration-fixture', {...enumeration, countingNumbers: inherited}))
            .toThrow(ViewValidationError);
    });
});

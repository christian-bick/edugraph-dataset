import {describe, expect, it} from 'vitest';
import {schemaResolutionKey} from './schema-resolution-key.ts';
import {schemaResolutionKey as publicKey} from './utils.ts';

describe('schema resolution value keys', () => {
    it.each([null, true, false, 0, -3, 'a\"b', undefined])('preserves primitive serialization for %s', value => {
        expect(schemaResolutionKey(value)).toBe(JSON.stringify(value));
    });

    it('canonicalizes nested object property order while preserving array order', () => {
        const left = {range: {max: 20, min: 1}, values: [3, {b: true, a: null}]};
        const right = {values: [3, {a: null, b: true}], range: {min: 1, max: 20}};
        expect(schemaResolutionKey(left)).toBe(schemaResolutionKey(right));
        expect(schemaResolutionKey(left)).toBe('{"range":{"max":20,"min":1},"values":[3,{"a":null,"b":true}]}');
        expect(schemaResolutionKey([1, 2])).not.toBe(schemaResolutionKey([2, 1]));
        expect(schemaResolutionKey({})).toBe('{}');
        expect(schemaResolutionKey([])).toBe('[]');
    });

    it('keeps the server utility export identical and leaves configuration untouched', () => {
        const config = Object.freeze({range: Object.freeze({max: 20, min: 1})});
        expect(publicKey).toBe(schemaResolutionKey);
        expect(publicKey(config)).toBe('{"range":{"max":20,"min":1}}');
        expect(Object.keys(config.range)).toEqual(['max', 'min']);
    });
});

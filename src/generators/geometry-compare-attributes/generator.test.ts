import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryCompareAttributesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryCompareAttributesGenerator', () => {
    let generator: GeometryCompareAttributesGenerator;

    beforeEach(() => {
        generator = new GeometryCompareAttributesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate compare-attributes sides/corners comparison math', () => {
        const input = {
            labels: [],
            constraints: { mode: 'compare-attributes', attribute: 'sides', shape1: 'rectangle', shape2: 'triangle' }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('sides');
        expect(stub!.data.shape1).toBe('rectangle');
        expect(stub!.data.shape2).toBe('triangle');
        expect(stub!.data.val1).toBe(4);
        expect(stub!.data.val2).toBe(3);
        expect(stub!.data.answer).toBe('rectangle'); // rectangle has more sides
    });

    it('should return null for non-compare-attributes modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'name-2d' }
        });
        expect(stub).toBeNull();
    });
});

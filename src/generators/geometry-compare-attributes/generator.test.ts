import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryCompareAttributesGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

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
        const config = {
            wantsTriangle: false,
            wantsSquare: false,
            wantsRectangle: false,
            wantsPolygon: false
        };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        
        const { shape1, shape2, val1, val2, attribute, answer } = stub!.data;
        expect(['sides', 'corners']).toContain(attribute);
        
        const getVal = (shape: string) => shape === 'triangle' ? 3 : (shape === 'hexagon' ? 6 : (shape === 'circle' ? 0 : 4));
        expect(val1).toBe(getVal(shape1));
        expect(val2).toBe(getVal(shape2));
        
        if (val1 > val2) expect(answer).toBe(shape1);
        else if (val2 > val1) expect(answer).toBe(shape2);
        else expect(answer).toBe('equal');
    });
});

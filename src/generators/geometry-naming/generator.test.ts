import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryNamingGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('GeometryNamingGenerator', () => {
    let generator: GeometryNamingGenerator;

    beforeEach(() => {
        generator = new GeometryNamingGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should generate valid shape naming stubs', () => {
        const input = {
            labels: [],
            constraints: {}
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBeDefined();
        expect(stub!.data.answer).toBe(stub!.data.shape);
    });
});

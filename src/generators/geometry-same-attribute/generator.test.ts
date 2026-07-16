import { describe, it, expect, beforeEach } from 'vitest';
import { GeometrySameAttributeGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometrySameAttributeGenerator', () => {
    let generator: GeometrySameAttributeGenerator;

    beforeEach(() => {
        generator = new GeometrySameAttributeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate same-attribute rolls/stacks/flat properties', () => {
        const inputRoll = {
            labels: [],
            constraints: { mode: 'same-attribute', attribute: 'can-roll' }
        };
        const stubRoll = generator.generate(inputRoll);
        expect(stubRoll).not.toBeNull();
        expect(stubRoll!.data.answer).toBe('sphere');

        const inputStack = {
            labels: [],
            constraints: { mode: 'same-attribute', attribute: 'can-stack' }
        };
        const stubStack = generator.generate(inputStack);
        expect(stubStack).not.toBeNull();
        expect(stubStack!.data.answer).toBe('cube');
    });

    it('should return null for non-same-attribute modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'name-2d' }
        });
        expect(stub).toBeNull();
    });
});

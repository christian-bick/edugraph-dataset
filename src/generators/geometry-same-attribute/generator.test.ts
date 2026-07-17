import {beforeEach, describe, expect, it} from 'vitest';
import {GeometrySameAttributeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

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
        const stubRoll = generator.generate({
            rollable: true,
            stackable: false,
            flatFaces: false
        });
        expect(stubRoll).not.toBeNull();
        expect(stubRoll!.data.answer).toBe('sphere');

        const stubStack = generator.generate({
            rollable: false,
            stackable: true,
            flatFaces: false
        });
        expect(stubStack).not.toBeNull();
        expect(stubStack!.data.answer).toBe('cube');
    });
});

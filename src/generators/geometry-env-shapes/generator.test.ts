import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryEnvShapesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryEnvShapesGenerator', () => {
    let generator: GeometryEnvShapesGenerator;

    beforeEach(() => {
        generator = new GeometryEnvShapesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate env-shapes mapping values', () => {
        const targets = ['clock', 'window', 'table'];
        const expectedAnswers = ['circle', 'square', 'rectangle'];
        
        targets.forEach((target, index) => {
            const input = {
                labels: [],
                constraints: { target }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.target).toBe(target);
            expect(stub!.data.answer).toBe(expectedAnswers[index]);
        });
    });
});

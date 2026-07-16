import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryEnvShapesGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

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
        const ENV_ITEMS: Record<string, string> = {
            'clock': 'circle',
            'window': 'square',
            'door': 'rectangle',
            'pizza': 'circle',
            'book': 'rectangle',
            'table': 'rectangle'
        };
        const input = { labels: [], constraints: {} };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(ENV_ITEMS[stub!.data.target]).toBeDefined();
        expect(stub!.data.answer).toBe(ENV_ITEMS[stub!.data.target]);
    });
});

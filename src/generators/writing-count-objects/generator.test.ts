import { describe, it, expect, beforeEach } from 'vitest';
import { WritingCountObjectsGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('WritingCountObjectsGenerator', () => {
    let generator: WritingCountObjectsGenerator;

    beforeEach(() => {
        generator = new WritingCountObjectsGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('writing');
    });

    it('should respect custom mode constraint', () => {
        const input = { labels: [], constraints: { mode: 'count-objects' } };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.number).toBeGreaterThanOrEqual(1);
    });

    it('should return null for stroke mode', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'stroke' }
        });
        expect(stub).toBeNull();
    });
});

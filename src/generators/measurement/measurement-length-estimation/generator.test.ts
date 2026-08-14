import {describe, expect, it} from 'vitest';
import {MeasurementLengthEstimationGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';

describe('MeasurementLengthEstimationGenerator', () => {
    it('generates only a scale-neutral size and estimate variant', () => {
        setSeed(42);
        const data = new MeasurementLengthEstimationGenerator().generate({}).data;

        expect(data).toEqual({
            referenceSize: expect.stringMatching(/^(small|large)$/),
            estimateVariant: expect.any(Number),
            referenceVariant: expect.any(Number)
        });
        expect([0, 1, 2]).toContain(data.estimateVariant);
        expect([0, 1, 2, 3]).toContain(data.referenceVariant);
    });

    it('covers both reference sizes, all estimate variants, and all reference variants', () => {
        const referenceSizes = new Set<string>();
        const estimateVariants = new Set<number>();
        const referenceVariants = new Set<number>();
        const states = new Set<string>();

        for (let seed = 0; seed < 500; seed++) {
            setSeed(seed);
            const data = new MeasurementLengthEstimationGenerator().generate({}).data;
            referenceSizes.add(data.referenceSize);
            estimateVariants.add(data.estimateVariant);
            referenceVariants.add(data.referenceVariant);
            states.add(JSON.stringify(data));
        }

        expect([...referenceSizes].sort()).toEqual(['large', 'small']);
        expect([...estimateVariants].sort()).toEqual([0, 1, 2]);
        expect([...referenceVariants].sort()).toEqual([0, 1, 2, 3]);
        expect(states.size).toBe(24);
    });

    it('is deterministic for the same seed', () => {
        const generator = new MeasurementLengthEstimationGenerator();
        setSeed('length-estimate');
        const first = generator.generate({});
        setSeed('length-estimate');

        expect(generator.generate({})).toEqual(first);
    });

    it('rejects a missing configuration object', () => {
        expect(() => new MeasurementLengthEstimationGenerator().generate(null as never)).toThrow(
            '[Generator: measurement-length-estimation] Validation Error'
        );
    });
});

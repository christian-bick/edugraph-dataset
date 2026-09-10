import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeFractionRegionGenerator} from './generator.ts';
import {ShapeFractionRegionGeneratorConfig} from './spec.ts';

const generator = new ShapeFractionRegionGenerator();
describe('ShapeFractionRegionGenerator', () => {
    it('generates every supported proper region, including both numerator boundaries', () => {
        for (const shape of ['circle', 'rectangle'] as const) {
            for (const parts of [2, 3, 4, 6, 8] as const) {
                expect(generator.generate({shape, fraction: {parts, minNumerator: 1, maxNumerator: 1}}).data)
                    .toEqual({kind: 'selected-region', shape, parts, numerator: 1});
                if (parts === 2) continue;
                const seen = new Set<number>();
                for (let seed = 0; seed < 100; seed++) {
                    setSeed(seed);
                    const data = generator.generate({shape, fraction: {parts, minNumerator: 2, maxNumerator: parts - 1}}).data;
                    expect(data.numerator).toBeGreaterThan(1);
                    expect(data.numerator).toBeLessThan(parts);
                    seen.add(data.numerator);
                }
                expect(seen).toEqual(new Set(Array.from({length: parts - 2}, (_, i) => i + 2)));
            }
        }
    });
    it('replays a concrete fraction from its seed', () => {
        const config = {shape: 'circle', fraction: {parts: 8, minNumerator: 2, maxNumerator: 7}} as const;
        setSeed(42);
        const first = generator.generate(config);
        setSeed(42);
        expect(generator.generate(config)).toEqual(first);
    });
    it.each([
        {}, {shape: 'circle'}, {fraction: {parts: 4, minNumerator: 1, maxNumerator: 1}},
        {shape: 'triangle', fraction: {parts: 4, minNumerator: 1, maxNumerator: 1}},
        ...[
            {parts: 5, minNumerator: 1, maxNumerator: 1},
            {parts: 4, minNumerator: 1.5, maxNumerator: 2},
            {parts: 4, minNumerator: 1, maxNumerator: 2.5},
            {parts: 4, minNumerator: 0, maxNumerator: 1},
            {parts: 4, minNumerator: 2, maxNumerator: 4},
            {parts: 2, minNumerator: 2, maxNumerator: 1}
        ].map(fraction => ({shape: 'circle', fraction}))
    ])('rejects missing, empty, or impossible proper-region configuration %j', config => {
        expect(() => generator.generate(config as ShapeFractionRegionGeneratorConfig)).toThrow(GeneratorValidationError);
    });
});

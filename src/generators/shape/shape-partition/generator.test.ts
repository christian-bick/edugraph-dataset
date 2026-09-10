import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {ShapePartitionGenerator} from './generator.ts';
import {ShapePartitionGeneratorConfig} from './spec.ts';

const generator = new ShapePartitionGenerator();
describe('ShapePartitionGenerator', () => {
    it('emits the specified equal partition without a learner action', () => {
        for (const shape of ['circle', 'rectangle'] as const) {
            for (const parts of [2, 3, 4, 6, 8] as const) {
                expect(generator.generate({shape, parts})).toEqual({data: {kind: 'partition', shape, parts}});
            }
        }
    });
    it.each([{}, {shape: 'circle'}, {parts: 4}, {shape: 'triangle', parts: 4},
        {shape: 'circle', parts: 0}, {shape: 'circle', parts: 5}, {shape: 'circle', parts: 2.5}
    ])('rejects missing or unsupported mathematical configuration %j', config => {
        expect(() => generator.generate(config as ShapePartitionGeneratorConfig)).toThrow(GeneratorValidationError);
    });
});

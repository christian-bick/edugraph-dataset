import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {ShapeUnitShareComparisonGenerator} from './generator.ts';
import {ShapeUnitShareComparisonGeneratorConfig} from './spec.ts';

const generator = new ShapeUnitShareComparisonGenerator();
describe('ShapeUnitShareComparisonGenerator', () => {
    it.each(['circle', 'rectangle'] as const)('compares a fourth and a half of equal %s wholes', shape => {
        const result = generator.generate({shape});
        expect(result.data).toEqual({kind: 'share-comparison', shape, leftParts: 4, relation: 'less', rightParts: 2});
        expect(1 / result.data.leftParts).toBeLessThan(1 / result.data.rightParts);
    });
    it.each([{}, {shape: 'triangle'}])('rejects missing or unsupported shapes %j', config => {
        expect(() => generator.generate(config as ShapeUnitShareComparisonGeneratorConfig)).toThrow(GeneratorValidationError);
    });
});

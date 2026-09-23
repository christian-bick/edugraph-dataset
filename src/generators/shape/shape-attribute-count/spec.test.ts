import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeAttributeCountGenerator} from './generator.ts';
import {ShapeAttributeCountGeneratorSchema} from './spec.ts';

describe('shape count schema', () => {
    it.each([[[Scope.VertexCount], 'vertices'], [[Scope.AngleCount], 'angles'],
        [[Scope.FaceCount, Scope.Equal], 'equal-faces']] as const)('resolves %j', (labels, attribute) => {
        const result = generateWithLabels(new ShapeAttributeCountGenerator(), [...labels])!;
        expect(result.data.attribute).toBe(attribute);
        expect(result.labels).toEqual(expect.arrayContaining([...labels]));
    });
    it('rejects competing constraints rather than selecting one', () => {
        expect(() => extractConfig(ShapeAttributeCountGeneratorSchema, [Scope.VertexCount, Scope.AngleCount])).toThrow();
    });
});

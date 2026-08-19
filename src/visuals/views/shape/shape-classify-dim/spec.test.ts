import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeClassifyDimViewSchema, spec} from './spec.ts';

describe('shape-classify-dim view spec', () => {
    it('owns only the visible classification ability', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptClassification]);
        expect(ShapeClassifyDimViewSchema).toEqual({});
    });
});

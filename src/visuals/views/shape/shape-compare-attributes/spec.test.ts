import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeCompareAttributesViewSchema, spec} from './spec.ts';

describe('shape-compare-attributes view spec', () => {
    it('owns only the visibly elicited reception ability', () => {
        expect(spec.generalLabels).toEqual([Ability.VisualReception]);
        expect(ShapeCompareAttributesViewSchema).toEqual({});
    });
});

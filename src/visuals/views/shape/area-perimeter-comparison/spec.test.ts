import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {AreaPerimeterComparisonViewSchema, spec} from './spec.ts';

describe('area-perimeter-comparison view spec', () => {
    it('owns classification of the companion measure relation', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptClassification]);
        expect(spec.requiredLabels).toBeUndefined();
        expect(spec.rejectedLabels).toBeUndefined();
        expect(AreaPerimeterComparisonViewSchema).toEqual({});
    });
});

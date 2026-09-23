import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeExcludedQuadrilateralGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('quadrilateral exclusion capability', () => {
    it('establishes the mathematical relation without selecting a learner action', () => {
        expect(spec.generalLabels).toEqual([Area.Quadrilateral, Area.ShapeSubsumption, Scope.ShapeAttributes]);
        const data = generateWithLabels(new ShapeExcludedQuadrilateralGenerator(), [...spec.generalLabels])!.data;
        expect(data.target).toBe('quadrilateral');
        expect(data.excludedCategories).toHaveLength(3);
    });
});

import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeNamingViewSchema, spec} from './spec.ts';

describe('shape-naming view spec', () => {
    it('owns naming and recognition while parameterizing presentation variation as Scope', () => {
        expect(spec.generalLabels).toEqual([
            Area.ShapeNaming,
            Ability.VisualRecognition
        ]);
        expect(Object.values(ShapeNamingViewSchema).flatMap(([labels]) => labels)).toEqual([
            Scope.ShapeOrientationVariation,
            Scope.ShapeSizeVariation
        ]);
    });
});

import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-naming view spec', () => {
    it('owns observable rotation and resizing invariance', () => {
        expect(spec.generalLabels).toEqual([
            Area.ShapeRecognition,
            Area.ShapeRotationConservation,
            Area.ShapeResizingConservation,
            Ability.VisualRecognition
        ]);
    });
});

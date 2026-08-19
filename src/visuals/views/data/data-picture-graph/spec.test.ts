import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('data-picture-graph view spec', () => {
    it('owns invariant picture-graph construction', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PictureGraph,
            Ability.VisualArticulation
        ]);
    });

    it('declares the picture layout boundaries for legacy arithmetic', () => {
        expect(spec.rejectedLabels).toEqual([Scope.SingleStep, Scope.MultiStep]);
    });
});

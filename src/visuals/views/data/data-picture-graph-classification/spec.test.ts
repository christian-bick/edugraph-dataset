import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('data-picture-graph-classification view spec', () => {
    it('owns invariant observation classification and graph construction', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PictureGraph,
            Ability.ConceptClassification,
            Ability.VisualArticulation
        ]);
        expect(spec.rejectedLabels).toEqual([Scope.SingleStep, Scope.MultiStep]);
    });
});

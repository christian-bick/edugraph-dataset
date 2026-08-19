import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('FractionsEquivalenceModelViewSpec', () => {
    it('owns visual numbers in one shared frame for legacy and scaling models', () => {
        expect(spec.generalLabels).toEqual([
            Scope.VisualNumbers,
            Scope.SingleFrameOfReference,
            Ability.ConceptClassification
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

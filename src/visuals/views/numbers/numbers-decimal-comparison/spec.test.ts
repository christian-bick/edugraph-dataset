import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-decimal-comparison view spec', () => {
    it('owns only the shared-whole visual model', () => {
        expect(spec.generalLabels).toEqual([
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers,
            Ability.ConceptDerivation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

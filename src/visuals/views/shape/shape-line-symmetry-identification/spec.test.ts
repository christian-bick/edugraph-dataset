import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-line-symmetry-identification view spec', () => {
    it('owns invariant recognition and classification', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ConceptClassification,
            Ability.VisualRecognition
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

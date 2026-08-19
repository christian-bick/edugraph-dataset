import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-patterns-identification view spec', () => {
    it('owns invariant emergent-feature classification', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptClassification]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

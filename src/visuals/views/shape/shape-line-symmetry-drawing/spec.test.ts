import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-line-symmetry-drawing view spec', () => {
    it('owns invariant visual articulation', () => {
        expect(spec.generalLabels).toEqual([Ability.VisualArticulation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

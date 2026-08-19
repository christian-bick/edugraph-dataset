import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-patterns view spec', () => {
    it('owns invariant pattern generation', () => {
        expect(spec.generalLabels).toEqual([Ability.VisualArticulation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

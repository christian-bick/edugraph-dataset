import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('geometry-angle-concepts view spec', () => {
    it('owns invariant angle interpretation', () => {
        expect(spec.generalLabels).toEqual([Ability.Interpretation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

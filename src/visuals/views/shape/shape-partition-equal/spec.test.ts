import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('ShapePartitionEqualViewSchema', () => {
    it('owns invariant equal-share partitioning', () => {
        expect(spec.generalLabels).toEqual([Ability.VisualArticulation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

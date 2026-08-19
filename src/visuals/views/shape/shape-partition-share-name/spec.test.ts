import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';
describe('shape-partition-share-name view spec', () => {it('owns invariant share naming', () => {
    expect(spec.generalLabels).toEqual([Ability.ActiveVocabulary]); expect(spec.rejectedLabels).toBeUndefined();
});});

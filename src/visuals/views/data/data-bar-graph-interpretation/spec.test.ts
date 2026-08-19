import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('data-bar-graph-interpretation view spec', () => {
    it('owns invariant category-count interpretation', () => {
        expect(spec.generalLabels).toEqual([Scope.BarGraph, Ability.Interpretation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

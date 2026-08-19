import {Ability} from 'edugraph-ts';
import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('data-bar-graph view spec', () => {
    it('owns invariant bar-graph construction', () => {
        expect(spec.generalLabels).toEqual([
            Scope.BarGraph,
            Ability.VisualArticulation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});

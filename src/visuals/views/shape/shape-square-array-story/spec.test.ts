import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-square-array-story view spec', () => {
    it('owns textual tile-scale area execution', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ProcedureExecution,
            Ability.TextualReception
        ]);
        expect(spec.requiredLabels).toEqual([Scope.TileScale]);
    });
});

import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-equal-square-count-story view spec', () => {
    it('owns textual equal-square counting execution', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ProcedureExecution,
            Ability.TextualReception
        ]);
        expect(spec.requiredLabels).toBeUndefined();
    });
});

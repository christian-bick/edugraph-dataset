import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-rectangle-area-story view spec', () => {
    it('owns textual rectangle-area execution', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ProcedureExecution,
            Ability.TextualReception
        ]);
        expect(spec.requiredLabels).toBeUndefined();
    });
});

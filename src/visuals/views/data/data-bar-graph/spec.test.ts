import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {DataBarGraphViewSchema} from './spec.ts';

describe('DataBarGraphViewSchema', () => {
    it.each([
        [Ability.VisualArticulation, true, false],
        [Ability.ProcedureExecution, false, true],
        [Ability.Interpretation, false, false],
        [Ability.ConceptClassification, false, false]
    ] as const)('resolves only view-owned presentation for %s', (ability, construction, arithmetic) => {
        expect(extractConfig(DataBarGraphViewSchema, [ability]).config).toEqual({
            showConstructionTask: construction,
            showArithmeticTask: arithmetic
        });
    });
});

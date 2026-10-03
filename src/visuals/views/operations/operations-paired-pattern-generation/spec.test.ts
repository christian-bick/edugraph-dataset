import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {OperationsPairedPatternGenerationViewSchema, spec} from './spec.ts';

describe('operations-paired-pattern-generation view spec', () => {
    it('declares its fixed learner task and target precondition', () => {
        expect(spec.generalLabels).toEqual([Area.PatternGeneration, Scope.ArabicNumerals, Ability.ProcedureExecution]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.PatternGeneration]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsPairedPatternGenerationViewSchema).toEqual({});
    });
});

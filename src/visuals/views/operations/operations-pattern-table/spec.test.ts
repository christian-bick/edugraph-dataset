import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {computeTaskFingerprint} from '../../../../lib/generation.ts';
import {operationTableProblem} from '../../../../generators/arithmetic/arithmetic-operation-table/domain.ts';
import {OperationsPatternTableViewSchema, spec} from './spec.ts';

describe('operations-pattern-table view spec', () => {
    it('owns invariant table-pattern classification', () => {
        expect(spec.generalLabels).toEqual([
            Area.GenerativeRuleRecognition,
            Scope.ArabicNumerals,
            Ability.ConceptClassification
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.GenerativeRuleRecognition]);
        expect(OperationsPatternTableViewSchema).toEqual({});
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });

    it('makes the selected table row fingerprint-visible', () => {
        const problems = [2, 3, 4, 5].map(row => operationTableProblem('multiplication', row));
        expect(new Set(problems.map(data => computeTaskFingerprint(data, {}))).size).toBe(4);
    });
});

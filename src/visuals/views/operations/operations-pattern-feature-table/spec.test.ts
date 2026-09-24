import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-feature-table view spec', () => {
    it('owns invariant generated-feature classification', () => {
        expect(spec.generalLabels).toEqual([
            Area.EmergentFeatureRecognition,
            Scope.ArabicNumerals,
            Ability.ConceptClassification,
            Ability.ProcedureExecution
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.EmergentFeatureRecognition]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});

import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-correspondence',
    generalLabels: [Scope.ArabicNumerals, Ability.ConceptDerivation],
    compatibility: [
        requireTargetLabels('pattern-correspondence-request', [Area.PatternCorrespondence])
    ]
};

export const OperationsPatternCorrespondenceViewSchema = {} as const;

export type OperationsPatternCorrespondenceViewConfig = ConfigFromSchema<typeof OperationsPatternCorrespondenceViewSchema>;

import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-feature-explanation',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ],
    requiredLabels: [Area.EmergentFeatureRecognition, Ability.ProcedureExecution]
};

export const OperationsPatternFeatureExplanationViewSchema = {} as const;

export type OperationsPatternFeatureExplanationViewConfig = ConfigFromSchema<
    typeof OperationsPatternFeatureExplanationViewSchema
>;

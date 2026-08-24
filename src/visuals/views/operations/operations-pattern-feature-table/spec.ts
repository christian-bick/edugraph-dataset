import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-feature-table',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ConceptClassification,
        Ability.ProcedureExecution
    ],
    requiredLabels: [Area.EmergentFeatureRecognition]
};

export const OperationsPatternFeatureTableViewSchema = {} as const;

export type OperationsPatternFeatureTableViewConfig = ConfigFromSchema<
    typeof OperationsPatternFeatureTableViewSchema
>;

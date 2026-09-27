import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {arithmeticPropertiesDisplayCapacity} from '../arithmetic-properties-compatibility.ts';

export const spec: ViewSpec = {
    viewId: 'operations-properties-explanation',
    compatibility: [arithmeticPropertiesDisplayCapacity],
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureUnderstanding]
};

export const OperationsPropertiesExplanationViewSchema = {} as const;
export type OperationsPropertiesExplanationViewConfig = ConfigFromSchema<typeof OperationsPropertiesExplanationViewSchema>;

import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-properties',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const OperationsPropertiesViewSchema = {} as const;

export type OperationsPropertiesViewConfig = ConfigFromSchema<typeof OperationsPropertiesViewSchema>;

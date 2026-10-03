import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-division-execution',
    generalLabels: [Ability.ProcedureExecution]
};

export const FractionsDivisionExecutionViewSchema = {} as const;
export type FractionsDivisionExecutionViewConfig = ConfigFromSchema<typeof FractionsDivisionExecutionViewSchema>;

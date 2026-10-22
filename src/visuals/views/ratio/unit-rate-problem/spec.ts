import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'unit-rate-problem',
    generalLabels: [Ability.ProcedureExecution, Ability.TextualReception]
};

export const UnitRateProblemViewSchema = {} as const;
export type UnitRateProblemViewConfig = ConfigFromSchema<typeof UnitRateProblemViewSchema>;

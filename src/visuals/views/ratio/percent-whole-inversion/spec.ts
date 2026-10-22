import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'percent-whole-inversion',
    generalLabels: [Ability.ProcedureInversion]
};

export const PercentWholeInversionViewSchema = {} as const;
export type PercentWholeInversionViewConfig = ConfigFromSchema<typeof PercentWholeInversionViewSchema>;

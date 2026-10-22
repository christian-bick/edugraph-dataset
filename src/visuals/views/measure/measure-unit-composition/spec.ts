import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-unit-composition',
    generalLabels: [Ability.ProcedureExecution, Ability.ProcedureUnderstanding]
};

export const MeasureUnitCompositionViewSchema = {} as const;
export type MeasureUnitCompositionViewConfig = ConfigFromSchema<typeof MeasureUnitCompositionViewSchema>;

import {Ability} from 'edugraph-ts';
import {ontologyNeutral} from '../../../../lib/resolvers.ts';
import {selectConversionDirection} from '../measurement-ratio-presentation.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-ratio-conversion',
    generalLabels: [Ability.ProcedureExecution, Ability.ProcedureUnderstanding]
};

export const MeasureRatioConversionViewSchema = {
    direction: ontologyNeutral(selectConversionDirection)
} as const;
export type MeasureRatioConversionViewConfig = ConfigFromSchema<typeof MeasureRatioConversionViewSchema>;

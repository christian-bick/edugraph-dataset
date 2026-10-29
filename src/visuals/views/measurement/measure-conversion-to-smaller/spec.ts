import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion-to-smaller',
    generalLabels: [Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10]
};

export const MeasureConversionToSmallerViewSchema = {} as const;

export type MeasureConversionToSmallerViewConfig = ConfigFromSchema<
    typeof MeasureConversionToSmallerViewSchema
>;

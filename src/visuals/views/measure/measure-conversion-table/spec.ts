import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion-table',
    generalLabels: [Scope.ArabicNumerals, Scope.Base10, Scope.ConversionTable, Ability.Formalization]
};

export const MeasureConversionTableViewSchema = {} as const;

export type MeasureConversionTableViewConfig = ConfigFromSchema<
    typeof MeasureConversionTableViewSchema
>;

import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-number-line',
    generalLabels: [Scope.Numberline, Scope.ArabicNumerals, Scope.Base10, Ability.VisualArticulation]
};

export const MeasurementNumberLineViewSchema = {} as const;

export type MeasurementNumberLineViewConfig = ConfigFromSchema<
    typeof MeasurementNumberLineViewSchema
>;

import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-analog-construction',
    generalLabels: [
        Scope.AnalogClock,
        Scope.ArabicNumerals,
        Ability.VisualArticulation
    ]
};

export const TimeAnalogConstructionViewSchema = {} as const;

export type TimeAnalogConstructionViewConfig = ConfigFromSchema<
    typeof TimeAnalogConstructionViewSchema
>;

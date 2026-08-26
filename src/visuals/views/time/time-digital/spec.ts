import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-digital',
    generalLabels: [
        Scope.DigitalClock,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.Formalization,
        Ability.VisualReception,
        Ability.Interpretation
    ]
};

export const TimeDigitalViewSchema = {} as const;

export type TimeDigitalViewConfig = ConfigFromSchema<typeof TimeDigitalViewSchema>;

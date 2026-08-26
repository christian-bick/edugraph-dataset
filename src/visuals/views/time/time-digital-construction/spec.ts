import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-digital-construction',
    generalLabels: [
        Scope.DigitalClock,
        Ability.Formalization,
        Ability.TextualReception,
        Ability.VisualArticulation
    ]
};

export const TimeDigitalConstructionViewSchema = {} as const;

export type TimeDigitalConstructionViewConfig = ConfigFromSchema<
    typeof TimeDigitalConstructionViewSchema
>;

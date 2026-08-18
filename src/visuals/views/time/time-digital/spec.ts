import {Ability, Scope} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-digital',
    generalLabels: [
        Scope.DigitalClock,
        Scope.ArabicNumerals,
        Ability.Formalization
    ]
};

export const TimeDigitalViewSchema = {
    direction: [
        [Ability.VisualReception, Ability.Interpretation, Ability.TextualReception, Ability.VisualArticulation],
        selectCanonicalLabel([
            [[Ability.VisualReception, Ability.Interpretation], 'reading'],
            [[Ability.TextualReception, Ability.VisualArticulation], 'construction']
        ])
    ]
} as const;

export type TimeDigitalViewConfig = ConfigFromSchema<typeof TimeDigitalViewSchema>;

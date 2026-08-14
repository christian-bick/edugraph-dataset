import {Ability, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-elapsed',
    generalLabels: [Ability.ProcedureExecution]
};

export const TimeElapsedViewSchema = {
    clockType: [
        [Scope.AnalogClock, Scope.DigitalClock],
        selectExactMatch
    ]
} as const;

export type TimeElapsedViewConfig = ConfigFromSchema<typeof TimeElapsedViewSchema>;

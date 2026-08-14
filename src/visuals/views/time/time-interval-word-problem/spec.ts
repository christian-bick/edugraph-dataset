import {Ability, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-interval-word-problem',
    generalLabels: [
        Ability.ProcedureExecution,
        Ability.TextualReception
    ]
};

export const TimeIntervalWordProblemViewSchema = {
    clockType: [
        [Scope.AnalogClock, Scope.DigitalClock],
        selectExactMatch
    ]
} as const;

export type TimeIntervalWordProblemViewConfig = ConfigFromSchema<
    typeof TimeIntervalWordProblemViewSchema
>;

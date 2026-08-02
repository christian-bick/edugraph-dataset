import {Ability, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-number-sequence',
    generalLabels: [Ability.ProcedureExecution]
};

export const CountingNumberSequenceViewSchema = {
    representation: [[Scope.PhysicalNumbers, Scope.ArabicNumerals], selectExactMatch]
} as const;

export type CountingNumberSequenceViewConfig = ConfigFromSchema<typeof CountingNumberSequenceViewSchema>;

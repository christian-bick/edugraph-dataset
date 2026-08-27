import {Ability, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-number-sequence',
    generalLabels: [Ability.ProcedureExecution]
};

export const CountingNumberSequenceViewSchema = {
    representation: [
        [Scope.PhysicalNumbers, Scope.ArabicNumerals],
        selectExactLabelSetMap([
            [[Scope.PhysicalNumbers], Scope.PhysicalNumbers],
            [[Scope.ArabicNumerals], Scope.ArabicNumerals],
            [[Scope.PhysicalNumbers, Scope.ArabicNumerals], Scope.PhysicalNumbers]
        ]),
        [
            [Scope.PhysicalNumbers],
            [Scope.ArabicNumerals]
        ]
    ]
} as const;

export type CountingNumberSequenceViewConfig = ConfigFromSchema<typeof CountingNumberSequenceViewSchema>;

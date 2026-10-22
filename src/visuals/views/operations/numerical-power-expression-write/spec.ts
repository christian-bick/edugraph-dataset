import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numerical-power-expression-write',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception],
    compatibility: [
        requireTargetLabels('numerical-power-prescribed-prose', [Ability.TextualReception]),
        {
            id: 'numerical-power-writing-evidence',
            description: 'Prescribed prose withholds the written expression whose binding would evidence OrderOfOperations.',
            dependencies: [{scope: 'generator', label: Area.OrderOfOperations}],
            predicate: labels => !labels.has('generator', Area.OrderOfOperations)
        }
    ]
};
export const NumericalPowerExpressionWriteViewSchema = {} as const;
export type NumericalPowerExpressionWriteViewConfig = ConfigFromSchema<typeof NumericalPowerExpressionWriteViewSchema>;

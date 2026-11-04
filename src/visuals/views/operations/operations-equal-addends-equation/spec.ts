import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const domain = [Scope.IntegerNumbers, Scope.TwoOperands, Scope.EvenNumbers, Area.Addition, Area.IteratedOperation];

export const spec: ViewSpec = {
    viewId: 'operations-equal-addends-equation',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization, Area.Equation, Scope.ExpressionOnOneSide],
    compatibility: [
        requireTargetLabels('equal-addends-equation-writing-task', [Ability.Formalization]),
        {
            id: 'equal-addends-equation-domain',
            dependencies: domain.map(label => ({scope: 'generator', label})),
            predicate: labels => domain.every(label => labels.has('generator', label))
        }
    ]
};

export const OperationsEqualAddendsEquationViewSchema = {} as const;
export type OperationsEqualAddendsEquationViewConfig = ConfigFromSchema<typeof OperationsEqualAddendsEquationViewSchema>;

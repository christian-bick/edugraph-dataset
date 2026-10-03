import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-rectangle-area',
    generalLabels: [Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('fractional-rectangle-execution-scope', [Scope.FractionNumbers])]
};

export const FractionsRectangleAreaViewSchema = {} as const;
export type FractionsRectangleAreaViewConfig = ConfigFromSchema<typeof FractionsRectangleAreaViewSchema>;

import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {boxedEquationShapeLabels, boxedEquationShapeRule, resolveBoxedEquationShape} from '../arithmetic-equation-presentation.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    compatibility: [boxedEquationShapeRule],
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Area.Equation
    ]
};

export const OperationsBoxesViewSchema = {
    equationShape: [boxedEquationShapeLabels, resolveBoxedEquationShape,
        boxedEquationShapeLabels.map(label => [label])]
} as const;

export type OperationsBoxesViewConfig = ConfigFromSchema<typeof OperationsBoxesViewSchema>;

import {Ability, Scope} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-add-subtract-strategy',
    generalLabels: [
        Scope.ArabicNumerals
    ]
};

export const OperationsAddSubtractStrategyViewSchema = {
    abilityMode: [
        [Ability.ProcedureUnderstanding, Ability.ConceptDerivation],
        selectCanonicalLabel([
            [[Ability.ProcedureUnderstanding], 'procedure-understanding'],
            [[Ability.ConceptDerivation], 'concept-derivation']
        ])
    ]
} as const;

export type OperationsAddSubtractStrategyViewConfig = ConfigFromSchema<
    typeof OperationsAddSubtractStrategyViewSchema
>;

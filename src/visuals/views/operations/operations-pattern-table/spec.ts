import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {selectTableFocusOperand} from '../pattern-table-helpers.ts';
import {ontologyNeutral} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-table',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ConceptClassification
    ],
    requiredLabels: [Area.GenerativeRuleRecognition]
};

export const OperationsPatternTableViewSchema = {
    focusOperand: ontologyNeutral(selectTableFocusOperand)
} as const;
export type OperationsPatternTableViewConfig = ConfigFromSchema<typeof OperationsPatternTableViewSchema>;

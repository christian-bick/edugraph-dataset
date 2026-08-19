import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-table',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ConceptClassification
    ]
};

export const OperationsPatternTableViewSchema = {} as const;
export type OperationsPatternTableViewConfig = ConfigFromSchema<typeof OperationsPatternTableViewSchema>;

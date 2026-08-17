import {Ability} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion',
    generalLabels: [],
    rejectedLabels: [Ability.Formalization]
};

export const MeasureConversionViewSchema = {
    taskKind: [
        [Ability.ConceptDerivation, Ability.ProcedureExecution],
        selectCanonicalLabel([
            [[Ability.ConceptDerivation], 'derivation'],
            [[Ability.ProcedureExecution], 'execution']
        ])
    ]
} as const;

export type MeasureConversionViewConfig = ConfigFromSchema<
    typeof MeasureConversionViewSchema
>;

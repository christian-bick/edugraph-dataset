import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-compare-benchmark-models',
    generalLabels: [
        Scope.VisualNumbers,
        Ability.ProcedureUnderstanding
    ]
};

export const FractionsCompareBenchmarkModelsViewSchema = {} as const;

export type FractionsCompareBenchmarkModelsViewConfig = ConfigFromSchema<
    typeof FractionsCompareBenchmarkModelsViewSchema
>;

import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const directBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Area.ObjectSorting,
        Scope.LengthMeasurement,
        Scope.DirectRelation,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.Least], [Scope.Most]]);

const mediatedBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.MediatedRelation,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([[Scope.Greater], [Scope.Less]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-measurement-order', directBuilder),
    ...toTargets('test-measurement-mediated-comparison', mediatedBuilder)
];

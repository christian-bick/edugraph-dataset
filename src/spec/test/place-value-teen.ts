import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../ccss/kindergarten.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Difference,
        Ability.ProcedureExecution,
        Scope.NumbersSmaller20
    ]);

export const PlaceValueTeenTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-place-value-teen-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));

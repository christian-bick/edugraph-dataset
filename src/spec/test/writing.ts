import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../ccss/kindergarten.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Ability.ProcedureExecution,
        Scope.NumbersSmaller10
    ]);

export const WritingTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-writing-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));

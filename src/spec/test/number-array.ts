import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const totalBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.NumberArray,
        Ability.ProcedureExecution
    ]);

const equationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Area.Equation,
        Area.IteratedOperation,
        Scope.NumberArray,
        Scope.ExpressionOnOneSide,
        Ability.Formalization
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-number-array-total', totalBuilder),
    ...toTargets('test-number-array-equation', equationBuilder)
];

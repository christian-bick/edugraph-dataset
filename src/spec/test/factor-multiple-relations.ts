import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const factorPairsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FactorsAndMultiples,
    Area.Factorization,
    Scope.NumbersSmaller100,
    Ability.ProcedureExecution
]);

const multipleTestBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FactorsAndMultiples,
    Area.PerfectDivisibility,
    Scope.NumbersSmaller100,
    Ability.ProcedureExecution
]);

const primeClassificationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PrimeNumbers,
    Area.Factorization,
    Scope.NumbersSmaller100,
    Ability.ConceptClassification
]);

const compositeClassificationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.CompositeNumbers,
    Area.Factorization,
    Scope.NumbersSmaller100,
    Ability.ConceptClassification
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-factor-pairs', factorPairsBuilder),
    ...toTargets('test-one-digit-multiple', multipleTestBuilder),
    ...toTargets('test-prime-classification', primeClassificationBuilder),
    ...toTargets('test-composite-classification', compositeClassificationBuilder)
];

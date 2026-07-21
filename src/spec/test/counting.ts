import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

const classifyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Area.ObjectSorting,
        Area.CollectionSense,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.ShapeProperties],
        []
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

const sortBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Least],
        [Scope.Most]
    ])
    .applyLabelVariants([
        [Scope.ShapeProperties],
        []
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

const incDecBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.AdditiveCount],
        [Scope.SubtractiveCount]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

export const CountingTestSpec: CompetencyTarget[] = [
    ...builder.build().map((p, i) => ({
        id: `test-counting-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...incDecBuilder.build().map((p, i) => ({
        id: `test-counting-inc-dec-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...classifyBuilder.build().map((p, i) => ({
        id: `test-classify-count-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...sortBuilder.build().map((p, i) => ({
        id: `test-classify-sort-${i}`,
        labels: p.labels,
        constraints: p.constraints
    }))
];



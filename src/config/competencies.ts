import { Area, Scope, Ability } from 'edugraph-ts';

export interface CompetencyTarget {
    id: string;
    labels: string[];
    constraints: Record<string, any>;
}

export const CompetencyRequirements: CompetencyTarget[] = [
    // --- K.CC.B.4a: One-to-one Correspondence ---
    {
        id: 'K.CC.B.4a-linear-1-10',
        labels: [Area.Numeration, Scope.AdditiveCount, Scope.PhysicalNumbers, Scope.NumbersSmaller10, Ability.ProcedureExecution],
        constraints: { minCount: 1, maxCount: 10, layout: 'linear' }
    },
    {
        id: 'K.CC.B.4a-scattered-11-20',
        labels: [Area.Numeration, Scope.AdditiveCount, Scope.PhysicalNumbers, Scope.NumbersSmaller20, Ability.ProcedureExecution],
        constraints: { minCount: 11, maxCount: 20, layout: 'scattered' }
    },

    // --- K.CC.B.4b: Cardinality & Conservation ---
    {
        id: 'K.CC.B.4b-cardinality-1-10',
        labels: [Area.Numeration, Scope.AdditiveCount, Scope.PhysicalNumbers, Scope.NumbersSmaller10, Ability.ProcedureUnderstanding],
        constraints: { minCount: 1, maxCount: 10 }
    },
    {
        id: 'K.CC.B.4b-conservation-5-12',
        labels: [Area.Numeration, Area.NumericIdentity, Scope.AdditiveCount, Ability.DirectUnderstanding],
        constraints: { minCount: 5, maxCount: 12 }
    },

    // --- K.CC.B.5: Count to tell "how many?" ---
    {
        id: 'K.CC.B.5-how-many-line-1-20',
        labels: [Area.Numeration, Scope.NumbersSmaller20, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { minCount: 1, maxCount: 20, arrangement: 'line' }
    },
    {
        id: 'K.CC.B.5-how-many-circle-1-20',
        labels: [Area.Numeration, Scope.NumbersSmaller20, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { minCount: 1, maxCount: 20, arrangement: 'circle' }
    },
    {
        id: 'K.CC.B.5-how-many-scattered-1-10',
        labels: [Area.Numeration, Scope.NumbersSmaller10, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { minCount: 1, maxCount: 10, arrangement: 'scattered' }
    },
    {
        id: 'K.CC.B.5-count-out-1-20',
        labels: [Area.Numeration, Scope.NumbersSmaller20, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { minCount: 1, maxCount: 20, countOut: true }
    },

    // --- K.MD.B.3: Classify & Sort ---
    {
        id: 'K.MD.B.3-classify-count-5-10',
        labels: [Area.ObjectSorting, Area.CollectionSense, Area.Numeration, Scope.NumbersSmaller10, Ability.ConceptClassification],
        constraints: { minTotal: 5, maxTotal: 10 }
    },
    {
        id: 'K.MD.B.3-classify-sort-5-10',
        labels: [Area.ObjectSorting, Area.NumericOrder, Scope.NumbersSmaller10, Ability.ProcedureExecution],
        constraints: { minTotal: 5, maxTotal: 10 }
    }
];

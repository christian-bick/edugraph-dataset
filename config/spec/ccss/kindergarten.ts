import { Area, Scope, Ability } from 'edugraph-ts';

export interface CompetencyTarget {
    id: string;
    labels: string[];
    constraints: Record<string, any>;
}

export const KindergartenSpec: CompetencyTarget[] = [
    // ==========================================
    // 1. Counting and Cardinality (K.CC)
    // ==========================================

    // --- K.CC.A.3: Write numbers & represent counts ---
    {
        id: 'K.CC.A.3-stroke-0-20',
        labels: [Area.DigitNotation, Scope.ArabicNumerals, Scope.NumbersSmaller20, Scope.NumbersWithZero, Ability.ProcedureExecution],
        constraints: {}
    },
    {
        id: 'K.CC.A.3-count-represent-0-20',
        labels: [Area.Numeration, Scope.ArabicNumerals, Scope.NumbersSmaller20, Scope.NumbersWithZero, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: {}
    },

    // --- K.CC.B.4a: One-to-one Correspondence ---
    {
        id: 'K.CC.B.4a-linear-1-10',
        labels: [Area.Numeration, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Scope.AdditiveCount, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: { arrangement: 'line' }
    },
    {
        id: 'K.CC.B.4a-scattered-11-20',
        labels: [Area.Numeration, Scope.NumbersSmaller20, Scope.NumbersLarger10, Scope.AdditiveCount, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: { arrangement: 'scattered' }
    },

    // --- K.CC.B.4b: Cardinality & Conservation ---
    {
        id: 'K.CC.B.4b-cardinality-1-10',
        labels: [Area.Numeration, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Scope.AdditiveCount, Scope.PhysicalNumbers, Ability.ProcedureUnderstanding],
        constraints: {}
    },
    {
        id: 'K.CC.B.4b-conservation-5-12',
        labels: [Area.Numeration, Area.NumericIdentity, Scope.NumbersSmaller20, Scope.AdditiveCount, Scope.NumericRange, Ability.DirectUnderstanding],
        constraints: {}
    },

    // --- K.CC.B.5: Count to tell "how many?" ---
    {
        id: 'K.CC.B.5-how-many-line-1-20',
        labels: [Area.Numeration, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { arrangement: 'line' }
    },
    {
        id: 'K.CC.B.5-how-many-circle-1-20',
        labels: [Area.Numeration, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { arrangement: 'circle' }
    },
    {
        id: 'K.CC.B.5-how-many-scattered-1-10',
        labels: [Area.Numeration, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { arrangement: 'scattered' }
    },
    {
        id: 'K.CC.B.5-count-out-1-20',
        labels: [Area.Numeration, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution],
        constraints: { countOut: true }
    },

    // --- K.CC.C.6: Compare groups of objects ---
    {
        id: 'K.CC.C.6-compare-groups-1-10',
        labels: [Area.Numeration, Area.NumericComparison, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: {}
    },

    // ==========================================
    // 2. Operations and Algebraic Thinking (K.OA)
    // ==========================================

    // --- K.OA.A.1 & K.OA.A.2: Addition and Subtraction representations ---
    {
        id: 'K.OA.A.1-add-represent-0-10',
        labels: [Area.BaseOperations, Scope.NumbersSmaller10, Scope.NumbersWithZero, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: {}
    },
    {
        id: 'K.OA.A.2-add-sub-word-0-10',
        labels: [Area.BaseOperations, Scope.NumbersSmaller10, Scope.NumbersWithZero, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: {}
    },
    {
        id: 'K.OA.A.3-decompose-0-10',
        labels: [Area.BaseOperations, Scope.NumbersSmaller10, Scope.NumbersWithZero, Scope.PhysicalNumbers, Ability.ProcedureUnderstanding],
        constraints: {}
    },
    {
        id: 'K.OA.A.4-make-ten',
        labels: [Area.BaseOperations, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: { targetSum: 10 }
    },

    // ==========================================
    // 3. Number and Operations in Base Ten (K.NBT)
    // ==========================================

    // --- K.NBT.A.1: Compose/decompose 11-19 ---
    {
        id: 'K.NBT.A.1-compose-teen',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersLarger10, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: { mode: 'compose-teen' }
    },
    {
        id: 'K.NBT.A.1-decompose-teen',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersLarger10, Scope.PhysicalNumbers, Ability.ProcedureExecution],
        constraints: { mode: 'decompose-teen' }
    },

    // ==========================================
    // 4. Measurement and Data (K.MD)
    // ==========================================

    // --- K.MD.A.1 & K.MD.A.2: Compare attributes ---
    {
        id: 'K.MD.A.1-measure-attributes',
        labels: [Area.Measurement, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ProcedureExecution],
        constraints: { mode: 'measure-length' }
    },
    {
        id: 'K.MD.A.2-compare-attributes',
        labels: [Area.Measurement, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ProcedureExecution],
        constraints: { mode: 'compare-attributes' }
    },

    // --- K.MD.B.3: Classify & Sort ---
    {
        id: 'K.MD.B.3-classify-count-5-10',
        labels: [Area.ObjectSorting, Area.CollectionSense, Area.Numeration, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ConceptClassification]
    },
    {
        id: 'K.MD.B.3-classify-sort-5-10',
        labels: [Area.ObjectSorting, Area.NumericOrder, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ProcedureExecution]
    },

    // ==========================================
    // 5. Geometry (K.G)
    // ==========================================

    // --- K.G.A.1, K.G.A.2, K.G.A.3, K.G.B.4: Identify and analyze shapes ---
    {
        id: 'K.G.A.2-shape-name',
        labels: [Area.Geometry, Ability.ProcedureExecution],
        constraints: { mode: 'name-2d' }
    }
];

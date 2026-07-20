import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from './kindergarten.ts';

export const Grade1Spec: CompetencyTarget[] = [
    // ==========================================
    // 1. Grade 1 Ordering (1.NBT)
    // ==========================================
    {
        id: '1.NBT.A.1-ordering-with-zero',
        labels: [Area.NumerationWithIntegers, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithZero, Ability.ProcedureExecution]
    },
    {
        id: '1.NBT.A.1-ordering-without-zero',
        labels: [Area.NumerationWithIntegers, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ProcedureExecution]
    },

    // --- 1.NBT.A.1: Write/read numerals to 120 ---
    {
        id: '1.NBT.A.1-write-120',
        labels: [Area.DigitNotation, Scope.ArabicNumerals, Scope.NumbersSmaller20, Scope.NumbersWithZero, Ability.ProcedureExecution]
    },

    // ==========================================
    // 2. Grade 1 Time (1.MD)
    // ==========================================
    {
        id: '1.MD.B.3-time-hour',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.HourIntervals, Ability.ProcedureExecution]
    },
    {
        id: '1.MD.B.3-time-half-hour',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.MinuteIntervals, Ability.ProcedureExecution]
    },
    {
        id: '1.MD.B.3-time-quarter-hour',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.MinuteIntervals, Ability.ProcedureExecution]
    },
    {
        id: '1.MD.B.3-time-minute',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.MinuteIntervals, Ability.ProcedureExecution]
    },
    {
        id: '1.MD.B.3-time-second',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.SecondIntervals, Ability.ProcedureExecution]
    },

    // ==========================================
    // 3. Operations and Algebraic Thinking (1.OA)
    // ==========================================

    // --- 1.OA.A.1: Addition & Subtraction word problems within 20 ---
    {
        id: '1.OA.A.1-add-sub-word-20',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithZero, Scope.PhysicalNumbers, Ability.TextualReception],
        
    },

    // --- 1.OA.A.2: Addition of three whole numbers with a sum <= 20 ---
    {
        id: '1.OA.A.2-three-addends-20',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution],
    },

    // --- 1.OA.B.3: Apply properties of operations ---
    {
        id: '1.OA.B.3-properties-addition',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution],
    },

    // --- 1.OA.B.4: Understand subtraction as unknown-addend ---
    {
        id: '1.OA.B.4-sub-unknown-addend',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Ability.ProcedureExecution]
    },

    // --- 1.OA.C.5: Relate counting to addition/subtraction ---
    {
        id: '1.OA.C.5-relate-counting',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution],
    },

    // --- 1.OA.C.6: Add/subtract within 20, fluency within 10 ---
    {
        id: '1.OA.C.6-add-sub-fluency',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution],
    },

    // --- 1.OA.D.7: Meaning of equal sign ---
    {
        id: '1.OA.D.7-equation-plausibility',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution],
    },

    // --- 1.OA.D.8: Determine unknown number ---
    {
        id: '1.OA.D.8-unknown-number',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution]
    },

    // ==========================================
    // 4. Number and Operations in Base Ten (1.NBT)
    // ==========================================

    // --- 1.NBT.B.2a: 10 is a bundle of ten ones ---
    {
        id: '1.NBT.B.2a-ten-bundle',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Ability.ProcedureExecution]
    },

    // --- 1.NBT.B.2b: Teen place value (11-19) ---
    {
        id: '1.NBT.B.2b-teen-place-value',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithoutZero, Scope.PhysicalNumbers, Ability.ProcedureExecution]
    },

    // --- 1.NBT.B.2c: Multiples of 10 ---
    {
        id: '1.NBT.B.2c-multiples-of-ten',
        labels: [Area.BaseOperations, Scope.NumbersSmaller20, Scope.NumbersWithZero, Scope.PhysicalNumbers, Ability.ProcedureExecution]
    },

    // --- 1.NBT.B.3: Compare two-digit numbers with >, =, < ---
    {
        id: '1.NBT.B.3-compare-2digit',
        labels: [Area.NumericComparison, Scope.ArabicNumerals, Scope.NumbersSmaller100, Scope.NumbersWithoutZero, Ability.ProcedureExecution]
    },

    // --- 1.NBT.C.4: Add within 100, regrouping ---
    {
        id: '1.NBT.C.4-addition-100',
        labels: [Area.BaseOperations, Scope.NumbersSmaller100, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution],
    },

    // --- 1.NBT.C.5: Mentally find 10 more or 10 less ---
    {
        id: '1.NBT.C.5-mental-10-more-less',
        labels: [Area.BaseOperations, Scope.NumbersSmaller100, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution]
    },

    // --- 1.NBT.C.6: Subtract multiples of 10 ---
    {
        id: '1.NBT.C.6-subtract-multiples-10',
        labels: [Area.BaseOperations, Scope.NumbersSmaller100, Scope.NumbersWithoutZero, Scope.ArabicNumerals, Ability.ProcedureExecution]
    },

    // ==========================================
    // 5. Measurement and Data (1.MD)
    // ==========================================

    // --- 1.MD.A.1: Order and compare lengths ---
    {
        id: '1.MD.A.1-order-lengths',
        labels: [Area.Measurement, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ProcedureExecution]
    },

    // --- 1.MD.A.2: Measure length with iterated units ---
    {
        id: '1.MD.A.2-measure-length-units',
        labels: [Area.Measurement, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ProcedureExecution]
    },

    // --- 1.MD.C.4: Organize, represent, and interpret data ---
    {
        id: '1.MD.C.4-interpret-data',
        labels: [Area.ObjectSorting, Area.CollectionSense, Area.Numeration, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ConceptClassification]
    },

    // ==========================================
    // 6. Geometry (1.G)
    // ==========================================

    // --- 1.G.A.1: Distinguish defining attributes of shapes ---
    {
        id: '1.G.A.1-shape-attributes',
        labels: [Area.Geometry, Ability.ProcedureExecution],
    },

    // --- 1.G.A.2: Compose 2D/3D shapes ---
    {
        id: '1.G.A.2-shape-composition',
        labels: [Area.Geometry, Ability.ProcedureExecution],
    },

    // --- 1.G.A.3: Partition circles/rectangles into halves/fourths ---
    {
        id: '1.G.A.3-partition-shapes',
        labels: [Area.Geometry, Ability.ProcedureExecution],
    }
];

import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { BeyondScopeEntry, CompetencyTarget, ImplementationTodo, OntologyTodo, TargetEquivalence } from '../../types/ml-engine.ts';

// ==========================================
// 1. Operations and Algebraic Thinking (1.OA)
// ==========================================

// --- 1.OA.A.1: Addition and subtraction word problems within 20 ---
const wordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.SingleStep,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 1.OA.A.2: Word problems with three addends (sum <= 20) ---
const threeAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.TextualReception
    ]);

// --- 1.OA.B.3: Apply properties of operations (commutative/associative) ---
const propertiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.CommutativeLaw],
        [Area.AssociativeLaw]
    ]);

// --- 1.OA.B.4: Understand subtraction as an unknown-addend problem ---
// This reverses the operation to recover a missing input, so the competency is
// explicitly scoped to procedure inversion rather than procedure execution.
const unknownAddendBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 1.OA.C.5: Relate counting to addition and subtraction ---
const relateCountingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.AdditiveCount, Scope.After],
        [Scope.SubtractiveCount, Scope.Before]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.OA.C.6: Add and subtract within 20, fluency within 10 ---
const fluencyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.OA.D.7: Meaning of the equal sign, judge equations as true or false ---
const equalSignBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.PlausibilityEvaluation
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 1.OA.D.8: Determine the unknown whole number in an equation ---
const unknownNumberBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

const unknownOperandBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// ==========================================
// 2. Number and Operations in Base Ten (1.NBT)
// ==========================================

// --- 1.NBT.A.1: Count to 120 from any starting number below 120 ---
const countTo120Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.StepsOf1,
        Scope.After,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.ProcedureExecution
    ]);

// --- 1.NBT.A.1: Read numerals through 120 ---
const readNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.TextualReception
    ]);

// --- 1.NBT.A.1: Write numerals through 120 ---
const writeNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.VisualArticulation
    ]);

// --- 1.NBT.A.1: Represent a number of objects with a written numeral ---
const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.PhysicalNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.Formalization
    ]);

// --- 1.NBT.B.2a: 10 as a bundle of ten ones ---
const tenBundleBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

// --- 1.NBT.B.2b: Teen numbers ---
// Grade 1 frames teen numbers explicitly as place value ("a ten and some ones",
// CCSS cluster 1.NBT.B "Understand place value"), whereas K.NBT.A.1 treats the
// same 10+n decomposition as "foundations for place value". Area.PlaceValue
// carries that distinction and keeps the two teen definitions distinguishable.
const teenNumbersBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Sum,
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ]);

// --- 1.NBT.B.2c: Multiples of 10 as a number of tens ---
const multiplesOfTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

// --- 1.NBT.B.3: Compare two two-digit numbers ---
const compareTwoDigitBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal]
    ]);

// --- 1.NBT.C.4: Add within 100 ---
const addWithin100Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ]);

// --- 1.NBT.C.5: Mentally find 10 more or 10 less ---
const tenMoreLessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.PlaceValue,
        Scope.Base10,
        Scope.StepsOf10,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.Increment],
        [Area.Decrement]
    ]);

// --- 1.NBT.C.6: Subtract multiples of 10 from multiples of 10 ---
const subtractTensBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Subtraction,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero],
        [Scope.NumbersWithZero]
    ]);

// ==========================================
// 3. Measurement and Data (1.MD)
// ==========================================

// --- 1.MD.A.1: Directly order three objects by length ---
const directLengthComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.DirectRelation,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.AscendingOrder],
        [Scope.DescendingOrder]
    ]);

// --- 1.MD.A.1: Compare two lengths through a third object ---
const mediatedLengthComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.MediatedRelation,
        Ability.ConceptDerivation
    ]);

// --- 1.MD.A.2: Express length as a whole number of iterated units ---
const measureLengthBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.IntegerNumbers
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.MD.B.3: Tell and write time in hours ---
const hourTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HourIntervals
    ])
    .applyLabelVariants([
        [Ability.VisualReception, Ability.Interpretation, Ability.Formalization],
        [Ability.VisualArticulation]
    ]);

// --- 1.MD.B.3: Tell and write time in half-hours ---
const halfHourTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HalfHourIntervals
    ])
    .applyLabelVariants([
        [Ability.VisualReception, Ability.Interpretation, Ability.Formalization],
        [Ability.VisualArticulation]
    ]);

// --- 1.MD.B.3: Tell and write time using digital clocks ---
const digitalTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.DigitalClock
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.HalfHourIntervals]
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ]);

// --- 1.MD.C.4: Organize, represent and interpret data ---
const interpretDataBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
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

// --- 1.MD.C.4: How many more or less in one category than in another ---
const compareDataBuilder = new DatasetPermutationBuilder()
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

// ==========================================
// 4. Geometry (1.G)
// ==========================================

// --- 1.G.A.1: Distinguish defining from non-defining attributes ---
const classifyShapeAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ]);

// --- 1.G.A.1: Build shapes possessing defining attributes ---
const buildShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon]
    ]);

const drawShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle, Area.CircularShapeDrawing],
        [Area.Square, Area.LinearShapeDrawing],
        [Area.Triangle, Area.LinearShapeDrawing]
    ]);

// --- 1.G.A.2: Compose shapes in one level ---
const singleLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.SingleLevelComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square],
        [Area.Triangle],
        [Area.Trapezoid],
        [Area.HalfCircle],
        [Area.QuarterCircle],
        [Area.Cube],
        [Area.RectangularPrism],
        [Area.Cone],
        [Area.Cylinder]
    ]);

// --- 1.G.A.2: Compose a new shape from an intermediate composite ---
const multiLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.MultiLevelComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square],
        [Area.Triangle],
        [Area.Trapezoid],
        [Area.HalfCircle],
        [Area.QuarterCircle],
        [Area.Cube],
        [Area.RectangularPrism],
        [Area.Cone],
        [Area.Cylinder]
    ]);

// --- 1.G.A.3: Partition circles and rectangles into equal shares ---
const partitionEqualSharesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeDecomposition,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// --- 1.G.A.3: Name individual shares as halves, fourths, or quarters ---
const nameUnitSharesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionInterpretation,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.ActiveVocabulary
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// --- 1.G.A.3: Describe a whole as all of its equal shares ---
const composeWholeFromSharesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionInterpretation,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// --- 1.G.A.3: Infer that more equal shares produce smaller shares ---
const compareUnitShareSizesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionCommonNumeratorComparison,
        Scope.EqualShares,
        Scope.UnitFractions,
        Scope.Less,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// Standard exports following universal convention.
export const spec: CompetencyTarget[] = [
    // 1.OA - Operations and Algebraic Thinking
    ...toTargets('1.OA.A.1-word-problems', wordProblemsBuilder),
    ...toTargets('1.OA.A.2-three-addend-word-problems', threeAddendsBuilder),
    ...toTargets('1.OA.B.3-properties', propertiesBuilder),
    ...toTargets('1.OA.B.4-unknown-addend', unknownAddendBuilder),
    ...toTargets('1.OA.C.5-relate-counting', relateCountingBuilder),
    ...toTargets('1.OA.C.6-fluency', fluencyBuilder),
    ...toTargets('1.OA.D.7-equal-sign', equalSignBuilder),
    ...toTargets('1.OA.D.8-unknown-number', unknownNumberBuilder),
    ...toTargets('1.OA.D.8-unknown-operand', unknownOperandBuilder),
    // 1.NBT - Number and Operations in Base Ten
    ...toTargets('1.NBT.A.1-count-to-120', countTo120Builder),
    ...toTargets('1.NBT.A.1-read-numerals', readNumeralsBuilder),
    ...toTargets('1.NBT.A.1-write-numerals', writeNumeralsBuilder),
    ...toTargets('1.NBT.A.1-represent-counts', representCountsBuilder),
    ...toTargets('1.NBT.B.2a-ten-bundle', tenBundleBuilder),
    ...toTargets('1.NBT.B.2b-teen-numbers', teenNumbersBuilder),
    ...toTargets('1.NBT.B.2c-multiples-of-ten', multiplesOfTenBuilder),
    ...toTargets('1.NBT.B.3-compare-two-digit', compareTwoDigitBuilder),
    ...toTargets('1.NBT.C.4-add-within-100', addWithin100Builder),
    ...toTargets('1.NBT.C.5-ten-more-less', tenMoreLessBuilder),
    ...toTargets('1.NBT.C.6-subtract-tens', subtractTensBuilder),
    // 1.MD - Measurement and Data
    ...toTargets('1.MD.A.1-direct-length-order', directLengthComparisonBuilder),
    ...toTargets('1.MD.A.1-mediated-length-comparison', mediatedLengthComparisonBuilder),
    ...toTargets('1.MD.A.2-measure-length', measureLengthBuilder),
    ...toTargets('1.MD.B.3-time', hourTimeBuilder),
    ...toTargets('1.MD.B.3-half-hour-time', halfHourTimeBuilder),
    ...toTargets('1.MD.B.3-digital-clocks', digitalTimeBuilder),
    ...toTargets('1.MD.C.4-interpret-data', interpretDataBuilder),
    ...toTargets('1.MD.C.4-compare-data', compareDataBuilder),
    // 1.G - Geometry
    ...toTargets('1.G.A.1-classify-shape-attributes', classifyShapeAttributesBuilder),
    ...toTargets('1.G.A.1-build-from-defining-attributes', buildShapesBuilder),
    ...toTargets('1.G.A.1-draw-from-defining-attributes', drawShapesBuilder),
    ...toTargets('1.G.A.2-single-level-composition', singleLevelCompositionBuilder),
    ...toTargets('1.G.A.2-multi-level-composition', multiLevelCompositionBuilder),
    ...toTargets('1.G.A.3-partition-equal-shares', partitionEqualSharesBuilder),
    ...toTargets('1.G.A.3-name-unit-shares', nameUnitSharesBuilder),
    ...toTargets('1.G.A.3-compose-whole-from-shares', composeWholeFromSharesBuilder),
    ...toTargets('1.G.A.3-compare-unit-share-sizes', compareUnitShareSizesBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [];

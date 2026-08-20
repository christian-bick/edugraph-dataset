import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import { Ability, Area, Scope } from 'edugraph-ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

// ==========================================
// 1. Operations and Algebraic Thinking (3.OA)
// ==========================================

const multiplicationDivisionWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.SingleStep,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.TextualReception
    ])
    .applyLabelVariants([[Area.Multiplication], [Area.Division]]);

const unknownMultiplicationDivisionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([[Area.Multiplication], [Area.Division]]);

const multiplicationKnownFactPropertiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MultiplicationKnownFactDerivation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.CommutativeLaw, Scope.TwoOperands],
        [Area.AssociativeLaw, Scope.ThreeOperands]
    ]);

const divisionUnknownFactorBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DivisionKnownFactDerivation,
        Area.Equation,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureInversion,
        Ability.ProcedureUnderstanding
    ]);

const multiplicationKnownFactFluencyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MultiplicationKnownFactDerivation,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding
    ]);

const divisionKnownFactFluencyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DivisionKnownFactDerivation,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding
    ]);

const computeWithin100Builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Multiplication], [Area.Division]]);

// --- 3.OA.A.1: Interpret products as equal groups ---
const multiplicationEqualGroupsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Multiplication,
        Area.GroupRecognition,
        Scope.EqualShares,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Scope.PhysicalNumbers],
        [Scope.NumberArray]
    ]);

// --- 3.OA.A.2: Interpret quotients through collection division ---
const partitiveDivisionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PartitiveDivision,
        Scope.EqualShares,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Scope.PhysicalNumbers],
        [Scope.NumberArray]
    ]);

const quotativeDivisionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.QuotativeDivision,
        Scope.EqualShares,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Scope.PhysicalNumbers],
        [Scope.NumberArray]
    ]);

// --- 3.OA.B.5: Use the distributive property for multiplication ---
const multiplicationDistributiveBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Multiplication,
        Area.Addition,
        Area.DistributiveLaw,
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding
    ]);

// --- 3.OA.D.8: Solve connected two-step word problems ---
const fourOperationTwoStepBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.MultiStep,
        Scope.MultiLevelComposition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division],
        [Area.Addition, Area.Subtraction],
        [Area.Addition, Area.Multiplication],
        [Area.Addition, Area.Division],
        [Area.Subtraction, Area.Multiplication],
        [Area.Subtraction, Area.Division],
        [Area.Multiplication, Area.Division]
    ]);

// --- 3.OA.D.8: Assess answer reasonableness through visible rounding ---
const answerReasonablenessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.IntegerRounding,
        Scope.NumbersSmaller1000,
        Ability.PlausibilityEvaluation
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division]
    ]);

// --- 3.OA.D.9: Identify arithmetic patterns ---
const identifyArithmeticPatternsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.GenerativeRuleRecognition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([[Area.Addition], [Area.Multiplication]]);

// --- 3.OA.D.9: Explain arithmetic patterns with operation properties ---
const explainArithmeticPatternsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.EmergentFeatureRecognition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Area.Addition, Area.CommutativeLaw],
        [Area.Addition, Area.AssociativeLaw],
        [Area.Multiplication, Area.CommutativeLaw],
        [Area.Multiplication, Area.AssociativeLaw],
        [Area.Multiplication, Area.DistributiveLaw]
    ]);

// ==========================================
// 2. Number and Operations in Base Ten (3.NBT)
// ==========================================

const addSubtractWithin1000Builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const placeValuePartitioningWithin1000Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.IntegerRegrouping,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.AdditionPlaceValuePartitioning],
        [Area.SubtractionPlaceValuePartitioning]
    ]);

const standardAlgorithmWithin1000Builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.AdditionStandardAlgorithm],
        [Area.SubtractionStandardAlgorithm]
    ]);

const flexibleAddSubtractStrategiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.AdditionCompensation],
        [Area.SubtractionCompensation],
        [Area.SubtractionThinkAddition]
    ]);

const integerRoundingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.IntegerRounding,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller1000,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf10], [Scope.StepsOf100]]);

const oneDigitTimesMultipleOfTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MultiplicationKnownFactDerivation,
        Area.PlaceValue,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000,
        Scope.MultiplesOf10,
        Scope.SingleDigitSmallestOperand,
        Scope.TwoDigitLargestOperand,
        Ability.ProcedureUnderstanding
    ]);

// ==========================================
// 3. Measurement and Data (3.MD)
// ==========================================

const readAnalogTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.MinuteIntervals,
        Scope.AnalogClock,
        Ability.VisualReception,
        Ability.Interpretation,
        Ability.Formalization
    ]);

const constructAnalogTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.MinuteIntervals,
        Scope.AnalogClock,
        Ability.VisualArticulation
    ]);

const writeDigitalTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.MinuteIntervals,
        Scope.DigitalClock,
        Ability.TextualReception,
        Ability.Formalization
    ]);

const elapsedTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Area.Difference,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.AnalogClock], [Scope.DigitalClock]]);

const timeIntervalWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Scope.SingleStep,
        Ability.ProcedureExecution,
        Ability.TextualReception
    ])
    .applyLabelVariants([[Scope.AnalogClock], [Scope.DigitalClock]])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const measureLiquidVolumeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.VolumeMeasurement,
        Scope.LiquidVolumes,
        Scope.LiterScale,
        Ability.ProcedureExecution
    ]);

const estimateLiquidVolumeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Estimation,
        Scope.VolumeMeasurement,
        Scope.LiquidVolumes,
        Scope.LiterScale,
        Ability.ProcedureExecution
    ]);

const measureMassBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringObjects, Scope.WeightMeasurement, Ability.ProcedureExecution])
    .applyLabelVariants([[Scope.GramScale], [Scope.KilogramScale]]);

const estimateMassBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.Estimation, Scope.WeightMeasurement, Ability.ProcedureExecution])
    .applyLabelVariants([[Scope.GramScale], [Scope.KilogramScale]]);

const massVolumeWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([Scope.SingleStep, Ability.TextualReception])
    .applyLabelVariants([
        [Scope.WeightMeasurement, Scope.GramScale],
        [Scope.WeightMeasurement, Scope.KilogramScale],
        [Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale]
    ])
    .applyLabelVariants([
        [Area.Addition, Scope.NumbersSmaller1000],
        [Area.Subtraction, Scope.NumbersSmaller1000],
        [Area.Multiplication, Scope.NumbersSmaller100],
        [Area.Division, Scope.NumbersSmaller100]
    ]);

const scaledPictureGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.Statistics, Scope.IntegerNumbers, Scope.PictureGraph, Ability.VisualArticulation])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const scaledBarGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.Statistics, Scope.IntegerNumbers, Scope.BarGraph, Ability.VisualArticulation])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const oneStepScaledBarComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Subtraction,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.SingleStep,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const twoStepScaledBarComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Subtraction,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.MultiStep,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const generateFractionalMeasurementsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.FractionNumbers,
        Scope.InchScale,
        Scope.PhysicalRuler,
        Scope.DataTable,
        Ability.ProcedureExecution
    ]);

const plotFractionalMeasurementsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.LengthMeasurement,
        Scope.FractionNumbers,
        Scope.InchScale,
        Scope.LinePlot,
        Ability.ProcedureExecution,
        Ability.VisualArticulation
    ]);

// --- 3.MD.C.5a: Interpret one square tile as one area unit ---
const unitSquareAreaUnitBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Square,
        Scope.TileScale,
        Ability.Interpretation
    ]);

// --- 3.MD.C.5b: Interpret exhaustive square-tile coverage as area ---
const unitSquareCoverageBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Iteration,
        Area.Square,
        Scope.TileScale,
        Scope.IntegerNumbers,
        Ability.Interpretation
    ]);

const countUnitSquaresBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Iteration,
        Area.Square,
        Scope.TileScale,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Scope.SquareCentimeterScale],
        [Scope.SquareMeterScale],
        [Scope.SquareInchScale],
        [Scope.SquareFootScale]
    ]);

const connectTilingToMultiplicationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Rectangle,
        Area.Square,
        Area.Multiplication,
        Scope.BoxArrangement,
        Scope.TwoOperands,
        Ability.ProcedureUnderstanding
    ]);

const rectangularAreaBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Rectangle,
        Area.Multiplication,
        Scope.TwoOperands,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[], [Ability.TextualReception]]);

const distributiveAreaModelBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Rectangle,
        Area.ShapeDecomposition,
        Area.Multiplication,
        Area.Addition,
        Area.DistributiveLaw,
        Scope.ThreeOperands,
        Ability.ProcedureUnderstanding
    ]);

const additiveRectilinearAreaBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Rectangle,
        Area.ShapeDecomposition,
        Area.Addition,
        Ability.VisualDecomposition,
        Ability.ProcedureExecution
    ]);

const polygonPerimeterBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.PerimeterCalculation, Scope.IntegerNumbers, Ability.ProcedureExecution])
    .applyLabelVariants([[Area.Triangle], [Area.Quadrilateral], [Area.Pentagon], [Area.Hexagon]]);

const unknownPolygonSideBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.PerimeterCalculation, Scope.IntegerNumbers, Ability.ProcedureInversion])
    .applyLabelVariants([[Area.Triangle], [Area.Quadrilateral], [Area.Pentagon], [Area.Hexagon]]);

const areaPerimeterRelationsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PerimeterCalculation,
        Area.AreaCalculation,
        Area.Rectangle,
        Scope.Equal,
        Ability.ConceptClassification
    ]);

const exhibitAreaPerimeterRelationsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PerimeterCalculation,
        Area.AreaCalculation,
        Area.Rectangle,
        Scope.Equal,
        Ability.ProcedureUnderstanding,
        Ability.VisualArticulation
    ]);

// ==========================================
// 4. Geometry (3.G)
// ==========================================

const classifyQuadrilateralSubcategoriesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSubsumption,
        Scope.ShapeAttributes,
        Ability.ConceptClassification,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([[Area.Rhombus], [Area.Rectangle], [Area.Square]]);

const drawOtherQuadrilateralBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Quadrilateral,
        Area.ShapeSubsumption,
        Area.LinearShapeDrawing,
        Scope.ShapeAttributes,
        Ability.VisualArticulation
    ]);

const partitionEqualAreaPartsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ProportionSense,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.VisualArticulation,
        Ability.Formalization
    ])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

// ==========================================
// 5. Number and Operations—Fractions (3.NF)
// ==========================================

const interpretFractionsOfWholeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionNotation,
        Area.ProportionSense,
        Scope.EqualShares,
        Ability.Interpretation
    ])
    .applyLabelVariants([[Scope.UnitFractions], [Scope.NonUnitFractions]])
    .applyLabelVariants([[Area.Circle], [Area.Rectangle]]);

const locateUnitFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithFractions,
        Area.FractionNotation,
        Scope.Numberline,
        Scope.UnitFractions,
        Ability.VisualArticulation
    ]);

const locateIteratedFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithFractions,
        Area.FractionNotation,
        Scope.Numberline,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([[Scope.NonUnitFractions], [Scope.ImproperFractions]]);

const recognizeEquivalentFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([[Scope.VisualNumbers], [Scope.Numberline]]);

const generateExplainEquivalentFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal,
        Ability.Formalization,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Scope.VisualNumbers], [Scope.Numberline]]);

const wholeNumbersAsFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionNotation,
        Area.FractionEquivalence,
        Scope.ImproperFractions,
        Scope.IntegerNumbers,
        Scope.Equal,
        Ability.Formalization
    ])
    .applyLabelVariants([[Scope.ArabicNumerals], [Scope.Numberline]]);

const compareFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionNotation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.LogicalInference
    ])
    .applyLabelVariants([
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator]
    ])
    .applyLabelVariants([[Scope.Greater], [Scope.Less]]);

// ==========================================
// 7. Target-spec exports
// ==========================================

export const spec: CompetencyTarget[] = [
    ...toTargets('3.OA.A.1-equal-groups-interpretation', multiplicationEqualGroupsBuilder),
    ...toTargets('3.OA.A.2-partitive-division', partitiveDivisionBuilder),
    ...toTargets('3.OA.A.2-quotative-division', quotativeDivisionBuilder),
    ...toTargets('3.OA.A.3-multiplication-division-word-problems', multiplicationDivisionWordProblemsBuilder),
    ...toTargets('3.OA.A.4-unknown-multiplication-division', unknownMultiplicationDivisionBuilder),
    ...toTargets('3.OA.B.5-distributive-property', multiplicationDistributiveBuilder),
    ...toTargets('3.OA.D.8-two-step-word-problems', fourOperationTwoStepBuilder),
    ...toTargets('3.OA.D.9-identify-patterns', identifyArithmeticPatternsBuilder),
    ...toTargets('3.OA.D.9-explain-patterns', explainArithmeticPatternsBuilder),
    ...toTargets('3.NBT.A.1-round-nearest-10-100', integerRoundingBuilder),
    ...toTargets('3.MD.A.1-time-interval-word-problems', timeIntervalWordProblemsBuilder),
    ...toTargets('3.MD.A.2-measure-liquid-volume', measureLiquidVolumeBuilder),
    ...toTargets('3.MD.A.2-estimate-liquid-volume', estimateLiquidVolumeBuilder),
    ...toTargets('3.MD.A.2-measure-mass', measureMassBuilder),
    ...toTargets('3.MD.A.2-estimate-mass', estimateMassBuilder),
    ...toTargets('3.MD.A.2-same-unit-word-problems', massVolumeWordProblemsBuilder),
    ...toTargets('3.MD.B.3-scaled-picture-graphs', scaledPictureGraphBuilder),
    ...toTargets('3.MD.B.3-scaled-bar-graphs', scaledBarGraphBuilder),
    ...toTargets('3.MD.B.3-one-step-scaled-bar-comparisons', oneStepScaledBarComparisonBuilder),
    ...toTargets('3.MD.B.3-two-step-scaled-bar-comparisons', twoStepScaledBarComparisonBuilder),
    ...toTargets('3.MD.C.5a-unit-square-area-unit', unitSquareAreaUnitBuilder),
    ...toTargets('3.MD.C.5b-unit-square-coverage', unitSquareCoverageBuilder),
    ...toTargets('3.MD.C.6-count-unit-squares', countUnitSquaresBuilder),
    ...toTargets('3.MD.C.7a-tiling-side-length-product', connectTilingToMultiplicationBuilder),
    ...toTargets('3.MD.C.7b-rectangular-area', rectangularAreaBuilder),
    ...toTargets('3.MD.C.7c-distributive-area-model', distributiveAreaModelBuilder),
    ...toTargets('3.MD.C.7d-additive-rectilinear-area', additiveRectilinearAreaBuilder),
    ...toTargets('3.MD.D.8-polygon-perimeter', polygonPerimeterBuilder),
    ...toTargets('3.MD.D.8-unknown-polygon-side', unknownPolygonSideBuilder),
    ...toTargets('3.G.A.1-classify-quadrilateral-subcategories', classifyQuadrilateralSubcategoriesBuilder),
    ...toTargets('3.G.A.1-draw-other-quadrilateral', drawOtherQuadrilateralBuilder),
    ...toTargets('3.G.A.2-partition-equal-area-parts', partitionEqualAreaPartsBuilder),
    ...toTargets('3.NF.A.2a-unit-fractions-number-line', locateUnitFractionsBuilder),
    ...toTargets('3.NF.A.2b-iterated-fractions-number-line', locateIteratedFractionsBuilder),
    ...toTargets('3.NF.A.3b-generate-explain-equivalent-fractions', generateExplainEquivalentFractionsBuilder),
    ...toTargets('3.NF.A.3c-whole-numbers-as-fractions', wholeNumbersAsFractionsBuilder),
    ...toTargets('3.NF.A.3d-compare-fractions', compareFractionsBuilder),
    ...toTargets('3.OA.C.7-compute-within-100', computeWithin100Builder),
    ...toTargets('3.NBT.A.2-add-subtract-within-1000', addSubtractWithin1000Builder),
    ...toTargets('3.MD.A.1-construct-analog-nearest-minute', constructAnalogTimeBuilder),
    ...toTargets('3.OA.B.5-multiplication-known-fact-properties', multiplicationKnownFactPropertiesBuilder),
    ...toTargets('3.OA.B.6-division-as-unknown-factor', divisionUnknownFactorBuilder),
    ...toTargets('3.OA.C.7-multiplication-known-fact-fluency', multiplicationKnownFactFluencyBuilder),
    ...toTargets('3.OA.C.7-division-known-fact-fluency', divisionKnownFactFluencyBuilder),
    ...toTargets('3.NBT.A.3-one-digit-times-multiple-of-ten', oneDigitTimesMultipleOfTenBuilder),
    ...toTargets('3.OA.D.8-answer-reasonableness', answerReasonablenessBuilder),
    ...toTargets('3.NBT.A.2-place-value-partitioning', placeValuePartitioningWithin1000Builder),
    ...toTargets('3.NBT.A.2-standard-algorithms', standardAlgorithmWithin1000Builder),
    ...toTargets('3.NBT.A.2-flexible-strategies', flexibleAddSubtractStrategiesBuilder),
    ...toTargets('3.MD.A.1-elapsed-minutes', elapsedTimeBuilder),
    ...toTargets('3.MD.A.1-read-analog-nearest-minute', readAnalogTimeBuilder),
    ...toTargets('3.MD.A.1-write-digital-nearest-minute', writeDigitalTimeBuilder),
    ...toTargets('3.MD.B.4-generate-fractional-measurements', generateFractionalMeasurementsBuilder),
    ...toTargets('3.MD.B.4-plot-fractional-measurements', plotFractionalMeasurementsBuilder),
    ...toTargets('3.NF.A.1-fractions-of-a-whole', interpretFractionsOfWholeBuilder),
    ...toTargets('3.NF.A.3a-recognize-equivalent-fractions', recognizeEquivalentFractionsBuilder),
    ...toTargets('3.MD.D.8-area-perimeter-relations', areaPerimeterRelationsBuilder),
    ...toTargets('3.MD.D.8-exhibit-area-perimeter-relations', exhibitAreaPerimeterRelationsBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [{
    targets: ['2.NBT.B.7-written-add-subtract', '3.NBT.A.2-add-subtract-within-1000'],
    reason: 'These two direct-computation slices require the same observable written addition or subtraction execution within 1000; Grade 3 strategy manifestations are represented by separate, more specific definitions.'
}];

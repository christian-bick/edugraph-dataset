import DatasetPermutationBuilder, {
    defineImplementationPackage,
    toImplementationTodos,
    toTargets
} from '../../lib/dataset-permutation-builder.ts';
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
        Scope.TwoOperands,
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
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([[Area.Multiplication], [Area.Division]]);

const multiplicationPropertiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Multiplication,
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Area.CommutativeLaw], [Area.AssociativeLaw]]);

const divisionUnknownFactorBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureInversion
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
        Scope.ThreeOperands,
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

// --- 3.OA.D.8: Assess answer reasonableness through visible estimation ---
const answerReasonablenessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Estimation,
        Area.IntegerRounding,
        Scope.NumbersSmaller1000,
        Ability.ConceptDerivation
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
        Area.PatternRecognition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([[Area.Addition], [Area.Multiplication]]);

// --- 3.OA.D.9: Explain arithmetic patterns with operation properties ---
const explainArithmeticPatternsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PatternRecognition,
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
        Area.Multiplication,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000,
        Scope.MultiplesOf10,
        Ability.ProcedureExecution
    ]);

// ==========================================
// 3. Measurement and Data (3.MD)
// ==========================================

const nearestMinuteTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringTime, Scope.MinuteIntervals])
    .applyLabelVariants([[Scope.AnalogClock], [Scope.DigitalClock]])
    .applyLabelVariants([[Ability.ProcedureExecution], [Ability.VisualArticulation]]);

const elapsedTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.TimeIntervals,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.AnalogClock], [Scope.DigitalClock]]);

const timeIntervalWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.TimeIntervals,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Scope.TwoOperands,
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
    .addLabels([Scope.TwoOperands, Ability.TextualReception])
    .applyLabelVariants([
        [Scope.WeightMeasurement, Scope.GramScale],
        [Scope.WeightMeasurement, Scope.KilogramScale],
        [Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale]
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division]
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
        Scope.TwoOperands,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const twoStepScaledBarComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Subtraction,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.ThreeOperands,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf2], [Scope.StepsOf5], [Scope.StepsOf10]]);

const generateFractionalMeasurementsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.FractionNumbers,
        Ability.ProcedureExecution
    ]);

const plotFractionalMeasurementsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.FractionNumbers,
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
        Area.ShapeComposition,
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
        Area.ShapeComposition,
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

const samePerimeterDifferentAreaBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PerimeterCalculation,
        Area.AreaCalculation,
        Area.Rectangle,
        Scope.Equal,
        Ability.ConceptDerivation
    ]);

const sameAreaDifferentPerimeterBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PerimeterCalculation,
        Area.AreaCalculation,
        Area.Rectangle,
        Scope.Equal,
        Ability.ConceptDerivation
    ]);

// ==========================================
// 4. Geometry (3.G)
// ==========================================

const classifyQuadrilateralSubcategoriesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptClassification,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([[Area.Rhombus], [Area.Rectangle], [Area.Square]]);

const drawOtherQuadrilateralBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Quadrilateral,
        Area.ShapeIdentity,
        Area.ShapeRecognition,
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
        Ability.ActiveVocabulary
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
        Ability.ConceptDerivation
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

const locateNonUnitFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithFractions,
        Area.FractionNotation,
        Scope.Numberline,
        Scope.NonUnitFractions,
        Ability.VisualArticulation
    ]);

const recognizeEquivalentFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([[Scope.PhysicalNumbers], [Scope.Numberline]]);

const generateExplainEquivalentFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal,
        Ability.Formalization,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Scope.PhysicalNumbers], [Scope.Numberline]]);

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
        Area.NumericComparison,
        Area.FractionNotation,
        Scope.ProperFractions,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([[Scope.Greater], [Scope.Equal], [Scope.Less]]);

// ==========================================
// 6. Reviewed implementation packages
// ==========================================

const oneDigitTimesMultipleOfTenImplementation = defineImplementationPackage({
    id: 'one-digit-times-multiple-of-ten',
    description: 'Constrain multiplication to one one-digit factor and one multiple of ten from 10 through 90.',
    generators: [{ module: 'arithmetic-ops-pairs', strategy: 'expand' }],
    views: [
        { module: 'operations-boxes', strategy: 'reuse' },
        { module: 'operations-vertical', strategy: 'reuse' }
    ]
});

const elapsedTimeImplementation = defineImplementationPackage({
    id: 'elapsed-time-minutes',
    description: 'Measure elapsed minutes and solve addition or subtraction interval stories.',
    generators: [
        { module: 'time', strategy: 'expand' },
        { module: 'time-interval-arithmetic', strategy: 'new' }
    ],
    views: [
        { module: 'time-elapsed', strategy: 'new' },
        { module: 'time-interval-word-problem', strategy: 'new' }
    ]
});

const massVolumeMeasurementImplementation = defineImplementationPackage({
    id: 'mass-volume-measurement',
    description: 'Measure liquid volume and mass using readable metric instruments.',
    generators: [{ module: 'measurement-mass-volume', strategy: 'new' }],
    views: [
        { module: 'measure-liquid-volume', strategy: 'new' },
        { module: 'measure-mass', strategy: 'new' }
    ]
});

const massVolumeEstimationImplementation = defineImplementationPackage({
    id: 'mass-volume-estimation',
    description: 'Estimate liquid volume and mass from familiar reference objects and units.',
    generators: [{ module: 'measurement-mass-volume-estimation', strategy: 'new' }],
    views: [
        { module: 'measure-liquid-volume-estimate', strategy: 'new' },
        { module: 'measure-mass-estimate', strategy: 'new' }
    ]
});

const massVolumeWordProblemsImplementation = defineImplementationPackage({
    id: 'mass-volume-word-problems',
    description: 'Solve same-unit one-step mass and liquid-volume stories with all four operations.',
    generators: [{ module: 'arithmetic-ops-pairs', strategy: 'reuse' }],
    views: [{ module: 'measurement-word-problem', strategy: 'new' }]
});

const scaledStatisticalGraphsImplementation = defineImplementationPackage({
    id: 'scaled-statistical-graphs',
    description: 'Draw and interpret picture and bar graphs with non-unit scales.',
    generators: [{ module: 'statistical-graphs', strategy: 'expand' }],
    views: [
        { module: 'data-picture-graph', strategy: 'expand' },
        { module: 'data-bar-graph', strategy: 'expand' }
    ]
});

const fractionalMeasurementDataImplementation = defineImplementationPackage({
    id: 'fractional-measurement-data',
    description: 'Collect half- and quarter-inch measurements and plot them on a fractional line plot.',
    generators: [{ module: 'measurement-data', strategy: 'expand' }],
    views: [
        { module: 'measurement-data-table', strategy: 'expand' },
        { module: 'measurement-line-plot', strategy: 'expand' }
    ]
});

const unitSquareAreaImplementation = defineImplementationPackage({
    id: 'unit-square-area',
    description: 'Measure area by exhaustively counting equal square units.',
    generators: [{ module: 'shape-square-array', strategy: 'expand' }],
    views: [{ module: 'shape-square-array', strategy: 'expand' }]
});

const rectangularAreaModelsImplementation = defineImplementationPackage({
    id: 'rectangular-area-models',
    description: 'Connect tiled rectangles, side-length multiplication, and square-unit area.',
    generators: [{ module: 'shape-square-array', strategy: 'expand' }],
    views: [{ module: 'shape-square-array', strategy: 'expand' }]
});

const distributiveAreaModelImplementation = defineImplementationPackage({
    id: 'distributive-area-model',
    description: 'Expose multiplication distribution through a visibly decomposed rectangular area model.',
    generators: [{ module: 'area-decomposition', strategy: 'new' }],
    views: [{ module: 'area-distributive-model', strategy: 'new' }]
});

const additiveRectilinearAreaImplementation = defineImplementationPackage({
    id: 'additive-rectilinear-area',
    description: 'Decompose rectilinear figures into rectangles and add their labeled areas.',
    generators: [{ module: 'area-decomposition', strategy: 'new' }],
    views: [{ module: 'area-rectilinear-decomposition', strategy: 'new' }]
});

const polygonPerimeterImplementation = defineImplementationPackage({
    id: 'polygon-perimeter',
    description: 'Find polygon perimeters and recover an unknown side from a known perimeter.',
    generators: [{ module: 'geometry-perimeter', strategy: 'new' }],
    views: [{ module: 'geometry-perimeter', strategy: 'new' }]
});

const areaPerimeterRelationsImplementation = defineImplementationPackage({
    id: 'area-perimeter-relations',
    description: 'Contrast rectangles with equal perimeter or area but different companion measures.',
    generators: [{ module: 'area-perimeter-relations', strategy: 'new' }],
    views: [{ module: 'area-perimeter-comparison', strategy: 'new' }]
});

const quadrilateralSubcategoriesImplementation = defineImplementationPackage({
    id: 'quadrilateral-subcategories',
    description: 'Elicit hierarchical classification of rhombuses, rectangles, and squares as quadrilaterals.',
    generators: [
        { module: 'shape-classify-attributes', strategy: 'expand' },
        { module: 'shape-identity', strategy: 'expand' }
    ],
    views: [
        { module: 'shape-classify-attributes', strategy: 'expand' },
        { module: 'shape-naming', strategy: 'expand' }
    ]
});

const otherQuadrilateralDrawingImplementation = defineImplementationPackage({
    id: 'other-quadrilateral-drawing',
    description: 'Draw a quadrilateral whose visible attributes exclude rhombus, rectangle, and square.',
    generators: [{ module: 'shape-build-shape', strategy: 'expand' }],
    views: [{ module: 'shape-draw-shape', strategy: 'expand' }]
});

const fractionModelsGrade3Implementation = defineImplementationPackage({
    id: 'fraction-models-grade-3',
    description: 'Model unit and non-unit fractions and create equal-area partitions for Grade 3 denominators.',
    generators: [{ module: 'shape-partition', strategy: 'expand' }],
    views: [{ module: 'shape-partition-equal', strategy: 'expand' }]
});

const fractionNumberLineImplementation = defineImplementationPackage({
    id: 'fraction-number-line',
    description: 'Locate unit and non-unit fractions by iterating equal lengths from zero.',
    generators: [{ module: 'fraction-number-line', strategy: 'new' }],
    views: [{ module: 'numbers-fraction-line', strategy: 'new' }]
});

const fractionEquivalenceImplementation = defineImplementationPackage({
    id: 'fraction-equivalence',
    description: 'Recognize, generate, and explain equivalent fractions with models or number lines.',
    generators: [{ module: 'fraction-equivalence', strategy: 'new' }],
    views: [{ module: 'fractions-equivalence-model', strategy: 'new' }]
});

const wholeNumberFractionsImplementation = defineImplementationPackage({
    id: 'whole-number-fractions',
    description: 'Express whole numbers as equal fractional values in notation and on number lines.',
    generators: [{ module: 'fraction-equivalence', strategy: 'new' }],
    views: [{ module: 'fractions-whole-equivalence', strategy: 'new' }]
});

const fractionComparisonImplementation = defineImplementationPackage({
    id: 'fraction-comparison',
    description: 'Compare fractions sharing a numerator or denominator against the same visible whole.',
    generators: [{ module: 'fraction-comparison', strategy: 'new' }],
    views: [{ module: 'fractions-compare-models', strategy: 'new' }]
});

// ==========================================
// 7. Target-spec exports
// ==========================================

export const spec: CompetencyTarget[] = [
    ...toTargets('3.OA.A.1-equal-groups-interpretation', multiplicationEqualGroupsBuilder),
    ...toTargets('3.OA.A.2-partitive-division', partitiveDivisionBuilder),
    ...toTargets('3.OA.A.2-quotative-division', quotativeDivisionBuilder),
    ...toTargets('3.OA.A.3-multiplication-division-word-problems', multiplicationDivisionWordProblemsBuilder),
    ...toTargets('3.OA.A.4-unknown-multiplication-division', unknownMultiplicationDivisionBuilder),
    ...toTargets('3.OA.B.5-multiplication-properties', multiplicationPropertiesBuilder),
    ...toTargets('3.OA.B.5-distributive-property', multiplicationDistributiveBuilder),
    ...toTargets('3.OA.D.8-two-step-word-problems', fourOperationTwoStepBuilder),
    ...toTargets('3.OA.D.8-answer-reasonableness', answerReasonablenessBuilder),
    ...toTargets('3.OA.D.9-identify-patterns', identifyArithmeticPatternsBuilder),
    ...toTargets('3.OA.D.9-explain-patterns', explainArithmeticPatternsBuilder),
    ...toTargets('3.NBT.A.1-round-nearest-10-100', integerRoundingBuilder),
    ...toTargets('3.OA.B.6-division-as-unknown-factor', divisionUnknownFactorBuilder),
    ...toTargets('3.OA.C.7-compute-within-100', computeWithin100Builder),
    ...toTargets('3.NBT.A.2-add-subtract-within-1000', addSubtractWithin1000Builder),
    ...toTargets('3.MD.A.1-tell-write-nearest-minute', nearestMinuteTimeBuilder)
];

export const implementationTodos: ImplementationTodo[] = [
    ...toImplementationTodos('3.NBT.A.3-one-digit-times-multiple-of-ten', oneDigitTimesMultipleOfTenBuilder, oneDigitTimesMultipleOfTenImplementation, 'Constrain factor roles to one digit by a multiple of ten from 10 through 90.'),
    ...toImplementationTodos('3.MD.A.1-elapsed-minutes', elapsedTimeBuilder, elapsedTimeImplementation, 'Show start time, end time, elapsed minutes, and hour-boundary handling.'),
    ...toImplementationTodos('3.MD.A.1-time-interval-word-problems', timeIntervalWordProblemsBuilder, elapsedTimeImplementation, 'Align the story, interval equation, clock evidence, and answer.'),
    ...toImplementationTodos('3.MD.A.2-measure-liquid-volume', measureLiquidVolumeBuilder, massVolumeMeasurementImplementation, 'Show a calibrated vessel, liquid level, liter unit, and measured answer.'),
    ...toImplementationTodos('3.MD.A.2-estimate-liquid-volume', estimateLiquidVolumeBuilder, massVolumeEstimationImplementation, 'Show a familiar container, liter reference, and plausible estimate.'),
    ...toImplementationTodos('3.MD.A.2-measure-mass', measureMassBuilder, massVolumeMeasurementImplementation, 'Show an object, readable scale, metric unit, and measured mass.'),
    ...toImplementationTodos('3.MD.A.2-estimate-mass', estimateMassBuilder, massVolumeEstimationImplementation, 'Show a familiar object, metric reference, and plausible mass estimate.'),
    ...toImplementationTodos('3.MD.A.2-same-unit-word-problems', massVolumeWordProblemsBuilder, massVolumeWordProblemsImplementation, 'Keep every quantity in the same visible unit and align story, equation, and answer.'),
    ...toImplementationTodos('3.MD.B.3-scaled-picture-graphs', scaledPictureGraphBuilder, scaledStatisticalGraphsImplementation, 'Align categorical totals with repeated symbols and a visible non-unit key.'),
    ...toImplementationTodos('3.MD.B.3-scaled-bar-graphs', scaledBarGraphBuilder, scaledStatisticalGraphsImplementation, 'Align categorical values with bars and a visibly scaled axis.'),
    ...toImplementationTodos('3.MD.B.3-one-step-scaled-bar-comparisons', oneStepScaledBarComparisonBuilder, scaledStatisticalGraphsImplementation, 'Derive a one-step more-or-less comparison from two scaled bars.'),
    ...toImplementationTodos('3.MD.B.3-two-step-scaled-bar-comparisons', twoStepScaledBarComparisonBuilder, scaledStatisticalGraphsImplementation, 'Use three graph values, an intermediate result, and a final comparison answer.'),
    ...toImplementationTodos('3.MD.B.4-generate-fractional-measurements', generateFractionalMeasurementsBuilder, fractionalMeasurementDataImplementation, 'Collect visible half- and quarter-inch ruler measurements.'),
    ...toImplementationTodos('3.MD.B.4-plot-fractional-measurements', plotFractionalMeasurementsBuilder, fractionalMeasurementDataImplementation, 'Plot collected measurements against whole, half, and quarter ticks.'),
    ...toImplementationTodos('3.MD.C.5a-unit-square-area-unit', unitSquareAreaUnitBuilder, unitSquareAreaImplementation, 'Identify one square tile as one unit on an area scale.'),
    ...toImplementationTodos('3.MD.C.5b-unit-square-coverage', unitSquareCoverageBuilder, unitSquareAreaImplementation, 'Cover the figure exhaustively without overlap and interpret the iterated square-tile count as area.'),
    ...toImplementationTodos('3.MD.C.6-count-unit-squares', countUnitSquaresBuilder, unitSquareAreaImplementation, 'Fully tile the figure and expose the counted square-unit total.'),
    ...toImplementationTodos('3.MD.C.7a-tiling-side-length-product', connectTilingToMultiplicationBuilder, rectangularAreaModelsImplementation, 'Align tiled rows and columns, side lengths, multiplication, and area.'),
    ...toImplementationTodos('3.MD.C.7b-rectangular-area', rectangularAreaBuilder, rectangularAreaModelsImplementation, 'Show side lengths, a rectangular model, multiplication, units, and optional story.'),
    ...toImplementationTodos('3.MD.C.7c-distributive-area-model', distributiveAreaModelBuilder, distributiveAreaModelImplementation, 'Show the original rectangle, split, partial products, and equal total.'),
    ...toImplementationTodos('3.MD.C.7d-additive-rectilinear-area', additiveRectilinearAreaBuilder, additiveRectilinearAreaImplementation, 'Decompose into non-overlapping rectangles and add their labeled areas.'),
    ...toImplementationTodos('3.MD.D.8-polygon-perimeter', polygonPerimeterBuilder, polygonPerimeterImplementation, 'Show every side length, boundary, calculation, unit, and perimeter.'),
    ...toImplementationTodos('3.MD.D.8-unknown-polygon-side', unknownPolygonSideBuilder, polygonPerimeterImplementation, 'Show total perimeter and recover one hidden side by inversion.'),
    ...toImplementationTodos('3.MD.D.8-same-perimeter-different-area', samePerimeterDifferentAreaBuilder, areaPerimeterRelationsImplementation, 'Compare rectangles with equal perimeter and visibly different areas.'),
    ...toImplementationTodos('3.MD.D.8-same-area-different-perimeter', sameAreaDifferentPerimeterBuilder, areaPerimeterRelationsImplementation, 'Compare rectangles with equal area and visibly different perimeters.'),
    ...toImplementationTodos('3.G.A.1-classify-quadrilateral-subcategories', classifyQuadrilateralSubcategoriesBuilder, quadrilateralSubcategoriesImplementation, 'Expose defining attributes and hierarchical quadrilateral inclusion.'),
    ...toImplementationTodos('3.G.A.1-draw-other-quadrilateral', drawOtherQuadrilateralBuilder, otherQuadrilateralDrawingImplementation, 'Draw and verify a quadrilateral outside the named subcategories.'),
    ...toImplementationTodos('3.G.A.2-partition-equal-area-parts', partitionEqualAreaPartsBuilder, fractionModelsGrade3Implementation, 'Partition equal areas and label one part as a unit fraction.'),
    ...toImplementationTodos('3.NF.A.1-fractions-of-a-whole', interpretFractionsOfWholeBuilder, fractionModelsGrade3Implementation, 'Align the whole, equal shares, highlighted numerator count, and fraction notation.'),
    ...toImplementationTodos('3.NF.A.2a-unit-fractions-number-line', locateUnitFractionsBuilder, fractionNumberLineImplementation, 'Partition zero to one and locate one unit-fraction length.'),
    ...toImplementationTodos('3.NF.A.2b-non-unit-fractions-number-line', locateNonUnitFractionsBuilder, fractionNumberLineImplementation, 'Iterate unit-fraction lengths from zero to the requested endpoint.'),
    ...toImplementationTodos('3.NF.A.3a-recognize-equivalent-fractions', recognizeEquivalentFractionsBuilder, fractionEquivalenceImplementation, 'Show distinct notations occupying the same model size or number-line point.'),
    ...toImplementationTodos('3.NF.A.3b-generate-explain-equivalent-fractions', generateExplainEquivalentFractionsBuilder, fractionEquivalenceImplementation, 'Transform numerator and denominator consistently and explain the equal value.'),
    ...toImplementationTodos('3.NF.A.3c-whole-numbers-as-fractions', wholeNumbersAsFractionsBuilder, wholeNumberFractionsImplementation, 'Show whole-number and fractional notation at the same value.'),
    ...toImplementationTodos('3.NF.A.3d-compare-fractions', compareFractionsBuilder, fractionComparisonImplementation, 'Use the same visible whole and justify the comparison symbol through models.')
];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [{
    targets: ['2.NBT.B.7-written-add-subtract', '3.NBT.A.2-add-subtract-within-1000'],
    reason: 'Both standards require the same observable written addition/subtraction execution within 1000; Grade 3 fluency and strategy language adds no defensible static-image label.'
}];

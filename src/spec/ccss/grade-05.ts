import DatasetPermutationBuilder, {
    defineImplementationPackage,
    toImplementationTodos,
    toTargets
} from '../../lib/dataset-permutation-builder.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

// Operations and Algebraic Thinking (5.OA)

const useGroupingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.GroupedExpression,
    Area.NumericalExpression,
    Area.OrderOfOperations,
    Scope.ArabicNumerals,
    Ability.Formalization
]);

const evaluateGroupedExpressionsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.GroupedExpression,
    Area.NumericalExpression,
    Area.OrderOfOperations,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

const identifyPatternCorrespondenceBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternCorrespondence,
    Scope.ArabicNumerals,
    Ability.ConceptDerivation
]);

const explainPatternCorrespondenceBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternCorrespondence,
    Scope.ArabicNumerals,
    Ability.Interpretation,
    Ability.TextualArticulation
]);

const graphPatternPairsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PointPlotting,
    Scope.CartesianCoordinateSystem,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.VisualArticulation
]);

const writeNumericalExpressionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumericalExpression,
    Scope.ArabicNumerals,
    Ability.Formalization,
    Ability.TextualReception
]);

const interpretNumericalExpressionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumericalExpression,
    Scope.ArabicNumerals,
    Ability.Interpretation
]);

const generatePairedPatternsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternGeneration,
    Scope.PairedPatterns,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

const formPatternPairsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.OrderedCoordinatePair,
    Scope.PairedPatterns,
    Scope.ArabicNumerals,
    Ability.Formalization
]);

const interpretCoordinateComponentsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.OrderedCoordinatePair,
    Area.CoordinateAxes,
    Area.Origin,
    Scope.CartesianCoordinateSystem,
    Scope.TwoDimensional,
    Ability.Interpretation
]);

const interpretContextualCoordinatesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.OrderedCoordinatePair,
    Scope.CartesianCoordinateSystem,
    Scope.NumbersWithoutNegatives,
    Ability.Interpretation,
    Ability.TextualReception
]);

// Number and Operations in Base Ten (5.NBT)

// DecimalNumbers includes base-ten whole-number examples as well as fractional places.
// Keep both directions and both place contexts in this complete competency.
const adjacentDecimalPlaceScalingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PlaceValue,
    Area.ProportionalScaling,
    Area.Multiplication,
    Area.Division,
    Scope.Base10,
    Scope.DecimalNumbers,
    Ability.ConceptDerivation
]);

const roundDecimalsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DecimalRounding,
    Scope.DecimalNumbers,
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureExecution
]);

const standardMultiplicationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.MultiplicationStandardAlgorithm,
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.MultipleDigitSmallestOperand,
    Ability.ProcedureExecution
]);

// Do not inherit the Grade 4 producer's nonzero-remainder restriction.
const twoDigitDivisorDivisionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DivisionPartialQuotients,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoDigitDivisor,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.TwoDigitDividend],
        [Scope.ThreeDigitDividend],
        [Scope.FourDigitDividend]
    ]);

const decimalMultiplicationImplementation = defineImplementationPackage({
    id: 'decimal-multiplication-method',
    description: 'Connect products of decimal operands through hundredths to exact partition models, a written calculation, and place-value reasoning.',
    generators: [{module: 'decimal-multiplication-model', strategy: 'new'}],
    views: [{module: 'operations-decimal-multiplication-method', strategy: 'new'}]
});

const decimalDivisionImplementation = defineImplementationPackage({
    id: 'decimal-division-method',
    description: 'Connect decimal division models and exact quotient relations to a written calculation and an explanation of the chosen strategy.',
    generators: [{module: 'decimal-division-model', strategy: 'new'}],
    views: [{module: 'operations-decimal-division-method', strategy: 'new'}]
});

// The conjunction admits exponent zero and excludes negative exponents in this
// nonnegative Grade 5 domain; Base10 alone would not constrain a power's base.
const grade5WholeNumberPowerContext = [
    Scope.PowersOf10,
    Scope.IntegerExponent,
    Scope.NumbersWithoutNegatives,
    Scope.Base10
];

const explainPowerTenZeroPatternsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternRecognition,
    Area.PlaceValue,
    Area.Multiplication,
    Area.Exponentiation,
    ...grade5WholeNumberPowerContext,
    Scope.IntegerNumbers,
    Scope.ArabicNumerals,
    Ability.ProcedureUnderstanding,
    Ability.TextualArticulation
]);

const explainDecimalPowerTenPatternsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PatternRecognition,
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Exponentiation,
        ...grade5WholeNumberPowerContext,
        Scope.DecimalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([[Area.Multiplication], [Area.Division]]);

const formalizePowersOfTenBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Exponentiation,
    ...grade5WholeNumberPowerContext,
    Scope.IntegerNumbers,
    Scope.ArabicNumerals,
    Ability.Formalization
]);

// These are cumulative input precision bounds, not exact digit counts.
// Preserve cases that require the thousandths place as well as coarser values.
const grade5DecimalWritingContext = [
    Scope.ThousandthDecimals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives
];

const readDecimalNumeralsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DecimalNotation,
    ...grade5DecimalWritingContext,
    Scope.ArabicNumerals,
    Ability.TextualReception
]);

const writeDecimalNumeralsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DecimalNotation,
    ...grade5DecimalWritingContext,
    Scope.ArabicNumerals,
    Ability.VisualArticulation
]);

const writeDecimalNumberNamesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumberNameNotation,
    ...grade5DecimalWritingContext,
    Ability.TextualArticulation
]);

const writeDecimalExpandedFormBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PlaceValue,
    Area.Sum,
    ...grade5DecimalWritingContext,
    Scope.ArabicNumerals,
    Ability.Formalization
]);

const compareDecimalsThroughThousandthsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        ...grade5DecimalWritingContext,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericEquality, Scope.Equal],
        [Area.NumericInequality, Scope.Less]
    ]);

// HundredthDecimals constrains the operands. Intermediate quantities and results
// retain their exact precision, including products/quotients beyond hundredths.
const grade5DecimalArithmeticLabels = [
    Area.PlaceValue,
    Scope.HundredthDecimals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.TwoOperands,
    Scope.ArabicNumerals,
    Scope.VisualNumbers,
    Ability.ProcedureExecution,
    Ability.ProcedureUnderstanding,
    Ability.TextualArticulation
];

const addDecimalsWithModelsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Addition,
    ...grade5DecimalArithmeticLabels
]);

const subtractDecimalsWithModelsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Subtraction,
    ...grade5DecimalArithmeticLabels
]);

const multiplyDecimalsWithModelsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Multiplication,
    ...grade5DecimalArithmeticLabels
]);

const divideDecimalsWithModelsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Division,
    ...grade5DecimalArithmeticLabels
]);

// Measurement and Data (5.MD)

const grade5MeasurementUnitPairs = [
    [Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.MeterScale],
    [Area.UnitMagnitudeScaling, Scope.MeterScale, Scope.CentimeterScale],
    [Area.UnitMagnitudeScaling, Scope.KilogramScale, Scope.GramScale],
    [Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale],
    [Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale],
    [Area.UnitFactorScaling, Scope.HourIntervals, Scope.MinuteIntervals],
    [Area.UnitFactorScaling, Scope.MinuteIntervals, Scope.SecondIntervals]
];

const grade5MeasurementNumberKinds = [[Scope.IntegerNumbers], [Scope.DecimalNumbers]];

const grade5LinePlotDenominators = [
    [Scope.HalfFractions],
    [Scope.QuarterFractions],
    [Scope.EighthFractions]
];

const grade5LinePlotLabels = [
    Area.Statistics,
    Scope.ProvidedMeasurement,
    Scope.LinePlot,
    Scope.SingleFrameOfReference
];

const convertWithinSystemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.ProcedureExecution
    ])
    .applyLabelVariants(grade5MeasurementUnitPairs)
    .applyLabelVariants(grade5MeasurementNumberKinds);

const multistepConversionProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.MultiStep,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants(grade5MeasurementUnitPairs)
    .applyLabelVariants(grade5MeasurementNumberKinds);

const constructGrade5FractionalLinePlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        ...grade5LinePlotLabels,
        Ability.VisualArticulation
    ])
    .applyLabelVariants(grade5LinePlotDenominators);

const linePlotFractionProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        ...grade5LinePlotLabels,
        Ability.ProcedureExecution,
        Ability.TextualReception
    ])
    .applyLabelVariants(grade5LinePlotDenominators)
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division]
    ]);

const unitCubeSpecificationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Cube,
        Area.MeasuringVolumes,
        Scope.CubeScale,
        Ability.ConceptSpecification
    ]);

const volumeFromPackingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Cube,
        Area.MeasuringVolumes,
        Scope.CubeScale,
        Ability.Interpretation
    ]);

const countUnitCubesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringVolumes,
        Area.Numeration,
        Area.Cube,
        Scope.CubeScale,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.CubicCentimeterScale],
        [Scope.CubicInchScale],
        [Scope.CubicFootScale],
        []
    ]);

const packingProductConnectionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringVolumes,
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Area.Equation,
        Scope.CubeScale,
        Scope.IntegerNumbers,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ]);

const representTripleProductsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Scope.CubeScale,
        Scope.IntegerNumbers,
        Scope.ThreeOperands,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [],
        [Area.AssociativeLaw]
    ]);

const rectangularPrismVolumeFormulasBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Area.Equation,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.ThreeOperands],
        [Scope.TwoOperands]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

const volumeAdditivityBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.ShapeDecomposition,
        Area.Addition,
        Scope.IntegerNumbers,
        Ability.ProcedureUnderstanding
    ]);

const compositeVolumeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.ShapeDecomposition,
        Area.Addition,
        Area.Multiplication,
        Area.Equation,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// Geometry (5.G)

const defineCoordinateSystemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.CoordinateAxes,
        Area.Origin,
        Scope.CartesianCoordinateSystem,
        Scope.TwoDimensional,
        Ability.ConceptSpecification
    ]);

const graphContextualPointsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PointPlotting,
        Scope.CartesianCoordinateSystem,
        Scope.NumbersWithoutNegatives,
        Ability.VisualArticulation,
        Ability.TextualReception
    ]);

const inheritedShapeAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSubsumption,
        Scope.ShapeAttributes,
        Scope.TwoDimensional,
        Ability.ConceptDerivation
    ]);

const classifyShapeHierarchyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSubsumption,
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Scope.TwoDimensional,
        Ability.ConceptClassification,
        Ability.VisualArticulation
    ]);

// ==========================================
// Number and Operations—Fractions (5.NF)
// ==========================================

const unlikeDenominatorArithmeticImplementation = defineImplementationPackage({
    id: 'unlike-denominator-fraction-arithmetic',
    description: 'Extend fraction addition and subtraction to unlike original denominators and mixed numbers, retaining equivalent-fraction conversion and complete same-whole word problems across common and unlike denominators.',
    generators: [{module: 'fraction-arithmetic', strategy: 'expand'}],
    views: [
        {module: 'fractions-operation-model', strategy: 'expand'},
        {module: 'fractions-word-problem', strategy: 'expand'}
    ]
});

const grade5FractionArithmeticNumberKinds = [
    [Scope.FractionNumbers],
    [Scope.MixedNumbers]
];

const unlikeDenominatorArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Scope.UnlikeDenominators,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]])
    .applyLabelVariants(grade5FractionArithmeticNumberKinds);

const grade5FractionArithmeticWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.SingleFrameOfReference,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]])
    .applyLabelVariants([[Scope.CommonDenominator], [Scope.UnlikeDenominators]])
    .applyLabelVariants(grade5FractionArithmeticNumberKinds);

const wholeNumberFractionQuotientProblemsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Division,
    Area.Equation,
    Scope.IntegerDividend,
    Scope.IntegerDivisor,
    Scope.FractionQuotient,
    Scope.NumbersWithoutNegatives,
    Ability.TextualReception,
    Ability.ProcedureExecution
]);

// The role pair identifies the unit-fraction operand; the producer must retain that
// operand's numerator-one condition in the original expression and its story/model.
const unitFractionDividendLabels = [
    Area.Division,
    Scope.FractionDividend,
    Scope.IntegerDivisor,
    Scope.UnitFractions,
    Scope.NumbersWithoutNegatives
];

const unitFractionDivisorLabels = [
    Area.Division,
    Scope.IntegerDividend,
    Scope.FractionDivisor,
    Scope.UnitFractions,
    Scope.NumbersWithoutNegatives
];

const interpretUnitFractionDividendBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDividendLabels,
    Ability.Interpretation
]);

const computeUnitFractionDividendBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDividendLabels,
    Ability.ProcedureExecution
]);

const createUnitFractionDividendStoryBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDividendLabels,
    Ability.TextualArticulation
]);

const explainUnitFractionDividendBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDividendLabels,
    Area.Multiplication,
    Ability.ProcedureUnderstanding
]);

const interpretUnitFractionDivisorBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDivisorLabels,
    Ability.Interpretation
]);

const computeUnitFractionDivisorBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDivisorLabels,
    Ability.ProcedureExecution
]);

const createUnitFractionDivisorStoryBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDivisorLabels,
    Ability.TextualArticulation
]);

const explainUnitFractionDivisorBuilder = new DatasetPermutationBuilder().addLabels([
    ...unitFractionDivisorLabels,
    Area.Multiplication,
    Ability.ProcedureUnderstanding
]);

const unitFractionDivisionProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([unitFractionDividendLabels, unitFractionDivisorLabels]);

const fractionBenchmarkEstimateBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericApproximation,
        Area.FractionReferenceComparison,
        Scope.FractionNumbers,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const fractionBenchmarkReasonablenessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionReferenceComparison,
        Scope.FractionNumbers,
        Scope.SingleFrameOfReference,
        Ability.PlausibilityEvaluation
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const fractionQuotientInterpretationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FractionNotation,
    Area.Division,
    Scope.FractionNumbers,
    Ability.Interpretation
]);

const fractionPartitionProductBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Multiplication,
    Area.Division,
    Area.FractionNumeratorInterpretation,
    Area.FractionDenominatorInterpretation,
    Scope.FractionNumbers,
    Scope.EqualShares,
    Ability.Interpretation
]);

const fractionProductStoryCreationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Multiplication,
    Area.Division,
    Area.FractionNumeratorInterpretation,
    Area.FractionDenominatorInterpretation,
    Scope.FractionNumbers,
    Scope.EqualShares,
    Ability.TextualArticulation
]);

const fractionalRectangleTilingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Square,
    Area.Multiplication,
    Scope.FractionNumbers,
    Scope.UnitFractions,
    Scope.BoxArrangement,
    Ability.ProcedureUnderstanding
]);

const fractionalRectangleAreaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Multiplication,
    Scope.FractionNumbers,
    Scope.TwoOperands,
    Ability.ProcedureExecution
]);

const fractionAreaProductRepresentationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Multiplication,
    Scope.FractionNumbers,
    Scope.TwoOperands,
    Ability.VisualArticulation
]);

const fractionProductFactorComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ProportionalScaling,
        Area.Multiplication,
        Scope.FractionNumbers,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal]
    ]);

const fractionScalingExplanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.NumericInequality,
        Ability.Interpretation,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Scope.ImproperFractions, Scope.Greater],
        [Scope.ProperFractions, Scope.Less]
    ]);

const fractionEquivalenceUnitScalingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FractionEquivalence,
    Area.Multiplication,
    Area.ProportionalScaling,
    Scope.FractionNumbers,
    Scope.Equal,
    Ability.Interpretation
]);

const generalFractionProductProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Multiplication,
        Area.Equation,
        Scope.SingleFrameOfReference,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.FractionNumbers], [Scope.MixedNumbers]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('5.OA.A.1-use-grouping', useGroupingBuilder),
    ...toTargets('5.OA.A.1-evaluate-grouped-expressions', evaluateGroupedExpressionsBuilder),
    ...toTargets('5.OA.A.2-write-numerical-expression', writeNumericalExpressionBuilder),
    ...toTargets('5.OA.A.2-interpret-numerical-expression', interpretNumericalExpressionBuilder),
    ...toTargets('5.OA.B.3-identify-pattern-correspondence', identifyPatternCorrespondenceBuilder),
    ...toTargets('5.OA.B.3-explain-pattern-correspondence', explainPatternCorrespondenceBuilder),
    ...toTargets('5.OA.B.3-generate-paired-patterns', generatePairedPatternsBuilder),
    ...toTargets('5.OA.B.3-graph-pattern-pairs', graphPatternPairsBuilder),
    ...toTargets('5.OA.B.3-form-pattern-pairs', formPatternPairsBuilder),
    ...toTargets('5.NBT.A.1-adjacent-decimal-place-scaling', adjacentDecimalPlaceScalingBuilder),
    ...toTargets('5.NBT.A.4-round-decimals', roundDecimalsBuilder),
    ...toTargets('5.NBT.B.5-multiplication-standard-algorithm', standardMultiplicationBuilder),
    ...toTargets('5.NBT.B.6-two-digit-divisor-division', twoDigitDivisorDivisionBuilder),
    ...toTargets('5.MD.A.1-convert-within-system', convertWithinSystemBuilder),
    ...toTargets('5.MD.A.1-multistep-conversion-problems', multistepConversionProblemsBuilder),
    ...toTargets('5.MD.B.2-construct-fractional-line-plot', constructGrade5FractionalLinePlotBuilder),
    ...toTargets('5.MD.B.2-line-plot-fraction-problems', linePlotFractionProblemsBuilder),
    ...toTargets('5.MD.C.3a-unit-cube', unitCubeSpecificationBuilder),
    ...toTargets('5.MD.C.3b-volume-from-packing', volumeFromPackingBuilder),
    ...toTargets('5.MD.C.4-count-unit-cubes', countUnitCubesBuilder),
    ...toTargets('5.MD.C.5a-packing-product-connection', packingProductConnectionBuilder),
    ...toTargets('5.MD.C.5a-represent-triple-products', representTripleProductsBuilder),
    ...toTargets('5.MD.C.5b-volume-formulas', rectangularPrismVolumeFormulasBuilder),
    ...toTargets('5.MD.C.5c-volume-additivity', volumeAdditivityBuilder),
    ...toTargets('5.MD.C.5c-composite-volume', compositeVolumeBuilder),
    ...toTargets('5.G.A.1-define-coordinate-system', defineCoordinateSystemBuilder),
    ...toTargets('5.G.A.1-interpret-coordinate-components', interpretCoordinateComponentsBuilder),
    ...toTargets('5.G.A.2-graph-contextual-points', graphContextualPointsBuilder),
    ...toTargets('5.G.A.2-interpret-contextual-coordinates', interpretContextualCoordinatesBuilder),
    ...toTargets('5.G.B.3-inherited-shape-attributes', inheritedShapeAttributesBuilder),
    ...toTargets('5.G.B.4-classify-shape-hierarchy', classifyShapeHierarchyBuilder),
    ...toTargets('5.NF.A.2-benchmark-estimate', fractionBenchmarkEstimateBuilder),
    ...toTargets('5.NF.A.2-benchmark-reasonableness', fractionBenchmarkReasonablenessBuilder),
    ...toTargets('5.NF.B.3-interpret-quotient', fractionQuotientInterpretationBuilder),
    ...toTargets('5.NF.B.3-whole-number-division-problems', wholeNumberFractionQuotientProblemsBuilder),
    ...toTargets('5.NF.B.7a-interpret-unit-fraction-dividend', interpretUnitFractionDividendBuilder),
    ...toTargets('5.NF.B.7a-compute-unit-fraction-dividend', computeUnitFractionDividendBuilder),
    ...toTargets('5.NF.B.7a-create-division-story', createUnitFractionDividendStoryBuilder),
    ...toTargets('5.NF.B.7a-explain-inverse-multiplication', explainUnitFractionDividendBuilder),
    ...toTargets('5.NF.B.7b-interpret-unit-fraction-divisor', interpretUnitFractionDivisorBuilder),
    ...toTargets('5.NF.B.7b-compute-unit-fraction-divisor', computeUnitFractionDivisorBuilder),
    ...toTargets('5.NF.B.7b-create-division-story', createUnitFractionDivisorStoryBuilder),
    ...toTargets('5.NF.B.7b-explain-inverse-multiplication', explainUnitFractionDivisorBuilder),
    ...toTargets('5.NF.B.7c-unit-fraction-division-problems', unitFractionDivisionProblemsBuilder),
    ...toTargets('5.NF.B.4a-partition-product', fractionPartitionProductBuilder),
    ...toTargets('5.NF.B.4a-create-product-story', fractionProductStoryCreationBuilder),
    ...toTargets('5.NF.B.6-fraction-product-problems', generalFractionProductProblemsBuilder),
    ...toTargets('5.NF.B.4b-tile-fractional-rectangle', fractionalRectangleTilingBuilder),
    ...toTargets('5.NF.B.4b-calculate-fractional-area', fractionalRectangleAreaBuilder),
    ...toTargets('5.NF.B.4b-represent-fraction-product', fractionAreaProductRepresentationBuilder),
    ...toTargets('5.NF.B.5a-compare-product-factor', fractionProductFactorComparisonBuilder),
    ...toTargets('5.NF.B.5b-explain-fraction-scaling', fractionScalingExplanationBuilder),
    ...toTargets('5.NF.B.5b-equivalence-unit-scaling', fractionEquivalenceUnitScalingBuilder),
    ...toTargets('5.NBT.A.2-explain-power-ten-zero-patterns', explainPowerTenZeroPatternsBuilder),
    ...toTargets('5.NBT.A.2-explain-decimal-power-ten-patterns', explainDecimalPowerTenPatternsBuilder),
    ...toTargets('5.NBT.A.2-formalize-powers-of-ten', formalizePowersOfTenBuilder),
    ...toTargets('5.NBT.A.3a-read-decimal-numerals', readDecimalNumeralsBuilder),
    ...toTargets('5.NBT.A.3a-write-decimal-numerals', writeDecimalNumeralsBuilder),
    ...toTargets('5.NBT.A.3a-write-decimal-number-names', writeDecimalNumberNamesBuilder),
    ...toTargets('5.NBT.A.3a-decimal-expanded-form', writeDecimalExpandedFormBuilder),
    ...toTargets('5.NBT.A.3b-compare-decimals', compareDecimalsThroughThousandthsBuilder),
    ...toTargets('5.NBT.B.7-add-decimals-with-models', addDecimalsWithModelsBuilder),
    ...toTargets('5.NBT.B.7-subtract-decimals-with-models', subtractDecimalsWithModelsBuilder)
];

export const implementationTodos: ImplementationTodo[] = [
    ...toImplementationTodos(
        '5.NBT.B.7-multiply-decimals-with-models',
        multiplyDecimalsWithModelsBuilder,
        decimalMultiplicationImplementation,
        'Multiply decimal operands through hundredths using a partition or area-model drawing, complete a corresponding written calculation, and explain how the place-value units determine the product. Preserve exact products beyond hundredths, such as 0.12 times 0.03 = 0.0036.'
    ),
    ...toImplementationTodos(
        '5.NBT.B.7-divide-decimals-with-models',
        divideDecimalsWithModelsBuilder,
        decimalDivisionImplementation,
        'Divide decimal operands through hundredths using a sharing or grouping drawing, complete a corresponding written calculation, and explain why the strategy produces the quotient. The divisor is nonzero; preserve exact quotients beyond hundredths when required and do not reduce the competency to a decimal-divisor shift.'
    ),
    ...toImplementationTodos(
        '5.NF.A.1-unlike-denominator-arithmetic',
        unlikeDenominatorArithmeticBuilder,
        unlikeDenominatorArithmeticImplementation,
        'Add and subtract fractions with unlike original denominators, including mixed numbers, by displaying equivalent replacements with a common denominator and then the resulting sum or difference. Preserve the original denominators and each conversion factor; a valid common denominator need not be the least one. Include both fractional and mixed-number operand forms with nonnegative quantities and results.'
    ),
    ...toImplementationTodos(
        '5.NF.A.2-fraction-word-problems',
        grade5FractionArithmeticWordProblemsBuilder,
        unlikeDenominatorArithmeticImplementation,
        'Solve complete same-whole fraction addition and subtraction word problems, retaining common- and unlike-denominator cases and fractional or mixed-number forms in one competency. Make the reference whole, story quantities, equation or model and exact answer agree; retain the original unlike denominators before any conversion. Existing common-denominator support is only part of this delivery.'
    ),
];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [];

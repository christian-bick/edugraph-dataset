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

const powersOfTenImplementation = defineImplementationPackage({
    id: 'powers-of-ten',
    description: 'Relate powers of ten with nonnegative integer exponents to whole-number zero patterns, decimal scaling, and exponent notation.',
    generators: [
        {module: 'whole-number-power-ten-scaling', strategy: 'new'},
        {module: 'decimal-power-ten-scaling', strategy: 'new'},
        {module: 'powers-of-ten', strategy: 'new'}
    ],
    views: [
        {module: 'numbers-power-ten-zero-pattern-explanation', strategy: 'new'},
        {module: 'numbers-power-ten-decimal-pattern-explanation', strategy: 'new'},
        {module: 'numbers-power-ten-exponent-notation', strategy: 'new'}
    ]
});

const decimalWritingImplementation = defineImplementationPackage({
    id: 'decimal-reading-writing',
    description: 'Represent nonnegative decimal values through thousandths for numeral reading, numeral writing, and written number names.',
    generators: [{module: 'decimal-writing', strategy: 'new'}],
    views: [
        {module: 'numbers-decimal-numeral-reading', strategy: 'new'},
        {module: 'numbers-decimal-numeral-writing', strategy: 'new'},
        {module: 'numbers-decimal-name-writing', strategy: 'new'}
    ]
});

const decimalExpandedFormImplementation = defineImplementationPackage({
    id: 'decimal-expanded-form',
    description: 'Connect decimal numerals through thousandths to sums of digit-times-place contributions, including fractional place units.',
    generators: [{module: 'decimal-place-value-expanded', strategy: 'new'}],
    views: [{module: 'numbers-decimal-expanded-form', strategy: 'new'}]
});

const decimalPlaceComparisonImplementation = defineImplementationPackage({
    id: 'decimal-place-comparison',
    description: 'Compare nonnegative decimals through thousandths using aligned place values and record the resulting equality or inequality.',
    generators: [{module: 'decimal-place-comparison', strategy: 'new'}],
    views: [{module: 'numbers-decimal-place-comparison', strategy: 'new'}]
});

const decimalAddSubtractImplementation = defineImplementationPackage({
    id: 'decimal-addition-subtraction-methods',
    description: 'Connect decimal addition and subtraction models, aligned written calculations, and explanations of regrouping and place-value units.',
    generators: [{module: 'decimal-addition-subtraction', strategy: 'new'}],
    views: [{module: 'operations-decimal-addition-subtraction-method', strategy: 'new'}]
});

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

const rectangularPrismVolumeImplementation = defineImplementationPackage({
    id: 'rectangular-prism-volume',
    description: 'Connect whole-number rectangular-prism cube packings, triple products and volume formulas through separate explanation, construction and calculation tasks.',
    generators: [
        {module: 'volume-rectangular-prism', strategy: 'new'}
    ],
    views: [
        {module: 'volume-packing-product-explanation', strategy: 'new'},
        {module: 'volume-product-model', strategy: 'new'},
        {module: 'volume-formula-execution', strategy: 'new'},
        {module: 'volume-formula-story', strategy: 'new'}
    ]
});

const compositePrismVolumeImplementation = defineImplementationPackage({
    id: 'composite-prism-volume',
    description: 'Explain and apply volume additivity for exactly two nonoverlapping rectangular prisms in geometric and contextual tasks.',
    generators: [
        {module: 'volume-composite-prisms', strategy: 'new'}
    ],
    views: [
        {module: 'volume-additivity-explanation', strategy: 'new'},
        {module: 'volume-composite-execution', strategy: 'new'},
        {module: 'volume-composite-story', strategy: 'new'}
    ]
});

const coordinateSystemFoundationsImplementation = defineImplementationPackage({
    id: 'coordinate-system-foundations',
    description: 'Specify a Cartesian coordinate system and interpret ordered components as travel from its origin along corresponding named axes.',
    generators: [{module: 'coordinate-system', strategy: 'new'}],
    views: [
        {module: 'coordinate-system-specification', strategy: 'new'},
        {module: 'coordinate-components-interpretation', strategy: 'new'}
    ]
});

const contextualCoordinateGraphingImplementation = defineImplementationPackage({
    id: 'contextual-coordinate-graphing',
    description: 'Graph nonnegative ordered quantities from a situation and interpret their coordinate roles, values and units in separate task projections.',
    generators: [{module: 'coordinate-context', strategy: 'new'}],
    views: [
        {module: 'coordinate-context-plotting', strategy: 'new'},
        {module: 'coordinate-context-interpretation', strategy: 'new'}
    ]
});

const shapeCategoryHierarchyImplementation = defineImplementationPackage({
    id: 'shape-category-hierarchy',
    description: 'Model a hierarchy of plane-shape categories for inherited-property inference and classification through defining attributes.',
    generators: [
        {module: 'shape-category-hierarchy', strategy: 'new'}
    ],
    views: [
        {module: 'shape-inherited-attributes', strategy: 'new'},
        {module: 'shape-hierarchy-classification', strategy: 'new'}
    ]
});

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

const fractionBenchmarkArithmeticImplementation = defineImplementationPackage({
    id: 'fraction-benchmark-arithmetic',
    description: 'Generate exact fraction operands, benchmark comparisons and bounds for estimation and answer-reasonableness tasks.',
    generators: [{module: 'fraction-benchmark-arithmetic', strategy: 'new'}],
    views: [
        {module: 'fractions-benchmark-estimate', strategy: 'new'},
        {module: 'fractions-benchmark-reasonableness', strategy: 'new'}
    ]
});

const fractionQuotientMeaningImplementation = defineImplementationPackage({
    id: 'fraction-quotient-meaning',
    description: 'Model exact division relations for fraction meaning, whole-number sharing with fractional or mixed quotients, and both unit-fraction division orientations; preserve operand roles and inverse multiplication across interpretation, calculation, story creation and explanation.',
    generators: [{module: 'fraction-quotient-model', strategy: 'new'}],
    views: [
        {module: 'fractions-quotient-interpretation', strategy: 'new'},
        {module: 'fractions-division-interpretation', strategy: 'new'},
        {module: 'fractions-division-execution', strategy: 'new'},
        {module: 'fractions-division-story-creation', strategy: 'new'},
        {module: 'fractions-division-inverse-explanation', strategy: 'new'},
        {module: 'fractions-division-word-problem', strategy: 'new'}
    ]
});

const generalFractionProductsImplementation = defineImplementationPackage({
    id: 'general-fraction-products',
    description: 'Generate exact whole, fractional and mixed-number products with equal-partition relations for interpretation, story creation and contextual calculation.',
    generators: [{module: 'fraction-products', strategy: 'new'}],
    views: [
        {module: 'fractions-product-partition-interpretation', strategy: 'new'},
        {module: 'fractions-product-story-creation', strategy: 'new'},
        {module: 'fractions-product-word-problem', strategy: 'new'}
    ]
});

const fractionalRectangleAreaImplementation = defineImplementationPackage({
    id: 'fractional-rectangle-area',
    description: 'Model exact fractional rectangle dimensions and unit-fraction square tiles for area reasoning, computation and product construction.',
    generators: [{module: 'fraction-rectangle-area', strategy: 'new'}],
    views: [
        {module: 'fractions-area-tiling-understanding', strategy: 'new'},
        {module: 'fractions-rectangle-area', strategy: 'new'},
        {module: 'fractions-area-product-construction', strategy: 'new'}
    ]
});

const fractionScalingReasoningImplementation = defineImplementationPackage({
    id: 'fraction-scaling-reasoning',
    description: 'Model a positive reference quantity, fractional scale and product comparison for reasoning from the scale relative to one.',
    generators: [{module: 'fraction-scaling', strategy: 'new'}],
    views: [
        {module: 'fractions-scaling-comparison', strategy: 'new'},
        {module: 'fractions-scaling-explanation', strategy: 'new'}
    ]
});

const fractionEquivalenceUnitScalingImplementation = defineImplementationPackage({
    id: 'fraction-equivalence-unit-scaling',
    description: 'Extend fraction equivalence with an explicit n/n unit multiplier and interpret why multiplying by one preserves value.',
    generators: [{module: 'fraction-equivalence', strategy: 'expand'}],
    views: [{module: 'fractions-equivalence-unit-scaling', strategy: 'new'}]
});

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
    ...toTargets('5.MD.C.4-count-unit-cubes', countUnitCubesBuilder)
];

export const implementationTodos: ImplementationTodo[] = [
    ...toImplementationTodos(
        '5.MD.C.5a-packing-product-connection',
        packingProductConnectionBuilder,
        rectangularPrismVolumeImplementation,
        'Show whole-number prism edges and complete unit-cube layers. Request an explanation and equations connecting the cube count to length times width times height and, equivalently, base area times height.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5a-represent-triple-products',
        representTripleProductsBuilder,
        rectangularPrismVolumeImplementation,
        'Ask the learner to construct or annotate a prism model of a three-factor whole-number product. When associativity is requested, show equivalent parenthesizations through regrouped cube layers.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5b-volume-formulas',
        rectangularPrismVolumeFormulasBuilder,
        rectangularPrismVolumeImplementation,
        'Calculate prism volume from either three supplied edge lengths or supplied base area and height, with formula substitution and cubic units. The contextual leaf must require understanding the story to obtain the relevant measurements.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5c-volume-additivity',
        volumeAdditivityBuilder,
        compositePrismVolumeImplementation,
        'Explain why two nonoverlapping rectangular prisms exhaust the composite solid and why their volumes may be added. Shared boundary faces must not be treated as overlapping volume.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5c-composite-volume',
        compositeVolumeBuilder,
        compositePrismVolumeImplementation,
        'Calculate the volumes of exactly two nonoverlapping rectangular-prism parts from their dimensions and add them. Geometric and necessary real-world story tasks use separate leaves with coherent equations and cubic units.'
    ),
    ...toImplementationTodos(
        '5.G.A.1-define-coordinate-system',
        defineCoordinateSystemBuilder,
        coordinateSystemFoundationsImplementation,
        'Complete or specify a two-dimensional coordinate system with perpendicular named axes, a common zero origin, coherent scales and the correspondence between axis and coordinate names.'
    ),
    ...toImplementationTodos(
        '5.G.A.2-graph-contextual-points',
        graphContextualPointsBuilder,
        contextualCoordinateGraphingImplementation,
        'Use necessary real-world or mathematical prose to supply paired quantities, then ask the learner to mark the corresponding first-quadrant points on named and scaled coordinate axes.'
    ),
    ...toImplementationTodos(
        '5.G.B.3-inherited-shape-attributes',
        inheritedShapeAttributesBuilder,
        shapeCategoryHierarchyImplementation,
        'Provide a plane-shape category inclusion and a defining property of the broader category. Ask the learner to infer and justify the inherited property of the narrower category.'
    ),
    ...toImplementationTodos(
        '5.G.B.4-classify-shape-hierarchy',
        classifyShapeHierarchyBuilder,
        shapeCategoryHierarchyImplementation,
        'Ask the learner to place plane figures or categories into a multilevel hierarchy using defining properties, preserving inclusions such as squares within both rectangles and rhombuses.'
    ),
    ...toImplementationTodos(
        '5.NF.A.2-benchmark-estimate',
        fractionBenchmarkEstimateBuilder,
        fractionBenchmarkArithmeticImplementation,
        'Ask for an approximate sum or difference without exact arithmetic; visible operand fractions, benchmark comparisons and worked bounds share one reference whole.'
    ),
    ...toImplementationTodos(
        '5.NF.A.2-benchmark-reasonableness',
        fractionBenchmarkReasonablenessBuilder,
        fractionBenchmarkArithmeticImplementation,
        'Present reasonable and unreasonable candidate fraction sums or differences and ask for a judgment justified by benchmark bounds relative to the same whole.'
    ),
    ...toImplementationTodos(
        '5.NF.B.3-interpret-quotient',
        fractionQuotientInterpretationBuilder,
        fractionQuotientMeaningImplementation,
        'Pair a fraction with equal sharing or an equivalent division equation and ask why dividing its numerator by its denominator gives its value.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4a-partition-product',
        fractionPartitionProductBuilder,
        generalFractionProductsImplementation,
        'Show b equal parts of a whole or fractional quantity q and a selected parts; ask how the model represents (a/b) times q and the equivalent sequence a times q divided by b.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4a-create-product-story',
        fractionProductStoryCreationBuilder,
        generalFractionProductsImplementation,
        'Provide a fraction-of-quantity equation or partition model and ask for a coherent written story preserving the numerator, denominator, equal parts and quantities, including fractional q.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4b-tile-fractional-rectangle',
        fractionalRectangleTilingBuilder,
        fractionalRectangleAreaImplementation,
        'Show fractional side lengths and square tiles with explicit unit-fraction side lengths and areas; ask why the tiled area equals the product of the rectangle sides. Preserve the outer rectangle, including unequal sides, separately from its square tiles.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4b-calculate-fractional-area',
        fractionalRectangleAreaBuilder,
        fractionalRectangleAreaImplementation,
        'Provide a rectangle with two fractional side measurements and require their product as its area, with consistent square units.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4b-represent-fraction-product',
        fractionAreaProductRepresentationBuilder,
        fractionalRectangleAreaImplementation,
        'Give two fraction factors and ask the learner to construct or annotate a rectangle whose side lengths and area represent their product.'
    ),
    ...toImplementationTodos(
        '5.NF.B.5a-compare-product-factor',
        fractionProductFactorComparisonBuilder,
        fractionScalingReasoningImplementation,
        'Keep the product uncomputed and ask for its relation to a positive reference factor, using the other factor being above, below or equal to one; require an interpretation without evaluating the multiplication.'
    ),
    ...toImplementationTodos(
        '5.NF.B.5b-explain-fraction-scaling',
        fractionScalingExplanationBuilder,
        fractionScalingReasoningImplementation,
        'Ask for a written explanation of why a positive quantity grows under a fraction strictly greater than one or shrinks under a fraction less than one; include whole-number enlargement as a familiar comparison.'
    ),
    ...toImplementationTodos(
        '5.NF.B.5b-equivalence-unit-scaling',
        fractionEquivalenceUnitScalingBuilder,
        fractionEquivalenceUnitScalingImplementation,
        'Expose a/b times n/n = na/nb with n/n equal to one and ask why this unit scaling changes the fraction representation while preserving its quantity.'
    ),
    ...toImplementationTodos(
        '5.NF.B.6-fraction-product-problems',
        generalFractionProductProblemsBuilder,
        generalFractionProductsImplementation,
        'Use necessary story quantities, a matching equation or model and a calculated answer for multiplication of two fractions and mixed numbers under one reference whole; include the complete fraction product domain beyond iterated whole-number multiplication.'
    ),
    ...toImplementationTodos(
        '5.G.A.1-interpret-coordinate-components',
        interpretCoordinateComponentsBuilder,
        coordinateSystemFoundationsImplementation,
        'Show perpendicular named axes with a common zero origin, coherent scales and an ordered pair. Elicit an interpretation of how far each component indicates travel from the origin along its corresponding axis, preserving first and second component order; the solution explains that association without substituting a point-marking task.'
    ),
    ...toImplementationTodos(
        '5.G.A.2-interpret-contextual-coordinates',
        interpretContextualCoordinatesBuilder,
        contextualCoordinateGraphingImplementation,
        'Provide necessary real-world or mathematical situation text and first-quadrant coordinates on named and scaled axes. Elicit what each component means in that situation, preserving the associated quantity, value and applicable unit; the solution explains both components rather than merely repeating the pair or plotting a point.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.2-explain-power-ten-zero-patterns',
        explainPowerTenZeroPatternsBuilder,
        powersOfTenImplementation,
        'Explain zero patterns in products of whole numbers and powers of ten. Visible repeated factors, exponent notation and aligned place values must support the written explanation; include exponent zero and distinguish existing zeros from zeros introduced by scaling.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.2-explain-decimal-power-ten-patterns',
        explainDecimalPowerTenPatternsBuilder,
        powersOfTenImplementation,
        'Explain decimal-placement patterns under multiplication or division by powers of ten with nonnegative integer exponents. Show before-and-after values, the selected power and changed digit place values; include exponent zero, both directions, and values crossing the units place.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.2-formalize-powers-of-ten',
        formalizePowersOfTenBuilder,
        powersOfTenImplementation,
        'Write a power of ten using exponent notation from repeated factors or the corresponding value. Require the power expression as the response; include 10^0 = 1 through the value case rather than pretending it has a positive number of factors.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.3a-read-decimal-numerals',
        readDecimalNumeralsBuilder,
        decimalWritingImplementation,
        'Read a supplied decimal numeral and identify its written value or place-value meaning, including decimals whose meaning requires the thousandths place. Distinguish this receptive task from producing number names or copying numerals.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.3a-write-decimal-numerals',
        writeDecimalNumeralsBuilder,
        decimalWritingImplementation,
        'Write the correctly positioned base-ten decimal numeral from a supplied number name or place-value representation. Include zero placeholders and values requiring thousandths; the requested numeral must not already be provided for copying.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.3a-write-decimal-number-names',
        writeDecimalNumberNamesBuilder,
        decimalWritingImplementation,
        'Produce a written number name for a supplied decimal through thousandths. Preserve the whole and fractional quantities and the named fractional unit, including values whose last necessary place is thousandths.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.3a-decimal-expanded-form',
        writeDecimalExpandedFormBuilder,
        decimalExpandedFormImplementation,
        'Express a supplied decimal through thousandths as a sum of digit-times-place contributions, with fractional units 1/10, 1/100 and 1/1000 as needed. The expanded expression and original numeral must denote the same value.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.3b-compare-decimals',
        compareDecimalsThroughThousandthsBuilder,
        decimalPlaceComparisonImplementation,
        'Compare two decimals by aligning and examining their digit place values, then record >, = or <. Include deciding places through thousandths, whole parts, unequal displayed precision and equal values with trailing zeros; keep the comparison procedure visible.'
    ),
    ...toImplementationTodos(
        '5.NBT.B.7-add-decimals-with-models',
        addDecimalsWithModelsBuilder,
        decimalAddSubtractImplementation,
        'Add decimal operands through hundredths using a concrete-model drawing, complete a corresponding written calculation, and explain the place-value strategy. Keep the model, calculation and written reasoning together; include regrouping and preserve exact intermediate and result values.'
    ),
    ...toImplementationTodos(
        '5.NBT.B.7-subtract-decimals-with-models',
        subtractDecimalsWithModelsBuilder,
        decimalAddSubtractImplementation,
        'Subtract decimal operands through hundredths using a concrete-model drawing, complete a corresponding written calculation, and explain the place-value strategy. Keep nonnegative differences, regrouping, zero placeholders, the model and the written reasoning coherent.'
    ),
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
    ...toImplementationTodos(
        '5.NF.B.3-whole-number-division-problems',
        wholeNumberFractionQuotientProblemsBuilder,
        fractionQuotientMeaningImplementation,
        'Solve sharing stories with a nonnegative whole-number dividend and nonzero whole-number divisor, expressing the quotient as a fraction or mixed number. Show the corresponding division relation or sharing model and interpret the share in the story units. FractionQuotient covers both output forms; allow zero dividends and integral-valued results written as fractions, and do not impose a global no-zero constraint.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7a-interpret-unit-fraction-dividend',
        interpretUnitFractionDividendBuilder,
        fractionQuotientMeaningImplementation,
        'Interpret a unit-fraction dividend divided by a nonzero whole-number divisor using the visible original operands and a coherent division relation or sharing model. The numerator-one fraction is the amount being divided; explain what the quotient means rather than merely calculating it.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7a-compute-unit-fraction-dividend',
        computeUnitFractionDividendBuilder,
        fractionQuotientMeaningImplementation,
        'Compute a unit fraction divided by a nonzero whole number. Preserve the numerator-one original dividend, integer divisor and exact fractional quotient, with a response requiring the missing result and a solution exposing the consistent division relation or model.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7a-create-division-story',
        createUnitFractionDividendStoryBuilder,
        fractionQuotientMeaningImplementation,
        'Create a written story for a specified unit-fraction dividend divided by a nonzero whole-number divisor. The amount being shared, number of shares and resulting share must agree with the given original division expression or model.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7a-explain-inverse-multiplication',
        explainUnitFractionDividendBuilder,
        fractionQuotientMeaningImplementation,
        'Explain the quotient by showing why multiplying it by the nonzero whole-number divisor reconstructs the original unit-fraction dividend; for example, connect (1/3) divided by 4 = 1/12 with (1/12) times 4 = 1/3. Require the inverse relationship as reasoning, not an unrelated multiplication exercise.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7b-interpret-unit-fraction-divisor',
        interpretUnitFractionDivisorBuilder,
        fractionQuotientMeaningImplementation,
        'Interpret a whole-number dividend divided by a unit-fraction divisor using the visible original operands and a coherent division relation or group-size model. The numerator-one fraction is the size of each group; explain how the quotient counts groups in the available whole-number quantity.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7b-compute-unit-fraction-divisor',
        computeUnitFractionDivisorBuilder,
        fractionQuotientMeaningImplementation,
        'Compute a nonnegative whole number divided by a unit fraction. Preserve the whole-number original dividend, numerator-one divisor and exact count of groups. Permit a zero dividend with a zero quotient; the divisor stays nonzero under the division contract.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7b-create-division-story',
        createUnitFractionDivisorStoryBuilder,
        fractionQuotientMeaningImplementation,
        'Create a written story for a specified whole-number dividend divided by a unit-fraction divisor. The available amount, numerator-one fractional group size and number of groups must agree with the original expression or model.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7b-explain-inverse-multiplication',
        explainUnitFractionDivisorBuilder,
        fractionQuotientMeaningImplementation,
        'Explain why multiplying the quotient by the unit-fraction divisor reconstructs the original whole-number dividend; for example, connect 4 divided by 1/5 = 20 with 20 times 1/5 = 4. Preserve the fractional group-size meaning and require the inverse relationship as reasoning.'
    ),
    ...toImplementationTodos(
        '5.NF.B.7c-unit-fraction-division-problems',
        unitFractionDivisionProblemsBuilder,
        fractionQuotientMeaningImplementation,
        'Solve real-world problems in both orientations: a unit fraction divided by a nonzero whole number, and a nonnegative whole number divided by a unit fraction. Use necessary story quantities and a model or equation that preserves which original operand is the numerator-one fraction and what the quotient measures. Keep both orientations in this one competency.'
    ),
];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [];

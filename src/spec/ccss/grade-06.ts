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

// Grade 6 competencies are expressible in ontology v0.31.0. Keep each complete
// competency in implementationTodos until its full generator/view contract exists;
// an earlier-grade slice matching one permutation does not implement the whole task.

// Shared implementation packages

const rationalOrderAndMagnitudeImplementation = defineImplementationPackage({
    id: 'rational-order-and-magnitude',
    description:
        'Interpret and express rational order and absolute magnitude, including their different meanings ' +
        'in signed contexts.',
    generators: [
        {module: 'rational-order-relations', strategy: 'new'},
        {module: 'rational-order-contexts', strategy: 'new'},
        {module: 'rational-magnitude-relations', strategy: 'new'},
        {module: 'rational-magnitude-contexts', strategy: 'new'}
    ],
    views: [
        {module: 'numbers-inequality-line-interpretation', strategy: 'new'},
        {module: 'numbers-contextual-order-explanation', strategy: 'new'},
        {module: 'numbers-contextual-order-writing', strategy: 'new'},
        {module: 'numbers-absolute-value-distance', strategy: 'new'},
        {module: 'numbers-contextual-absolute-value', strategy: 'new'},
        {module: 'numbers-order-versus-magnitude', strategy: 'new'}
    ]
});

const coordinatePlaneProblemsImplementation = defineImplementationPackage({
    id: 'coordinate-plane-problems',
    description:
        'Solve contextual coordinate problems, construct polygons from vertices and find ' +
        'coordinate-aligned distances.',
    generators: [
        {module: 'coordinate-axis-distance', strategy: 'new'},
        {module: 'coordinate-problems', strategy: 'new'},
        {module: 'coordinate-polygons', strategy: 'new'}
    ],
    views: [
        {module: 'coordinate-axis-distance', strategy: 'new'},
        {module: 'coordinate-axis-distance-story', strategy: 'new'},
        {module: 'coordinate-problem-plotting', strategy: 'new'},
        {module: 'coordinate-problem-story', strategy: 'new'},
        {module: 'coordinate-polygon-construction', strategy: 'new'},
        {module: 'coordinate-polygon-construction-story', strategy: 'new'},
        {module: 'coordinate-polygon-side-length', strategy: 'new'},
        {module: 'coordinate-polygon-side-length-story', strategy: 'new'}
    ]
});

const numericalPowerExpressionsImplementation = defineImplementationPackage({
    id: 'numerical-power-expressions',
    description:
        'Write and evaluate arithmetic expressions with nonnegative integer exponents and conventional ' +
        'operation order.',
    generators: [
        {module: 'numerical-power-expressions', strategy: 'new'}
    ],
    views: [
        {module: 'numerical-power-expression-evaluate', strategy: 'new'},
        {module: 'numerical-power-expression-write', strategy: 'new'}
    ]
});

const algebraExpressionStructureImplementation = defineImplementationPackage({
    id: 'algebra-expression-structure',
    description:
        'Represent literal expressions and structural roles, interpret subexpressions, substitute values ' +
        'and model quantitative situations.',
    generators: [
        {module: 'algebra-expressions', strategy: 'new'}
    ],
    views: [
        {module: 'algebra-expression-write', strategy: 'new'},
        {module: 'algebra-expression-parts', strategy: 'new'},
        {module: 'algebra-subexpression-interpretation', strategy: 'new'},
        {module: 'algebra-expression-evaluate', strategy: 'new'},
        {module: 'algebra-formula-evaluate', strategy: 'new'},
        {module: 'algebra-expression-model', strategy: 'new'}
    ]
});

const algebraExpressionEquivalenceImplementation = defineImplementationPackage({
    id: 'algebra-expression-equivalence',
    description:
        'Generate and judge equivalent literal expressions using operation properties and valid symbolic ' +
        'witnesses.',
    generators: [
        {module: 'algebra-expression-equivalence', strategy: 'new'}
    ],
    views: [
        {module: 'algebra-equivalent-expression-generate', strategy: 'new'},
        {module: 'algebra-expression-equivalence-judge', strategy: 'new'}
    ]
});

const algebraStatementsImplementation = defineImplementationPackage({
    id: 'algebra-statements',
    description:
        'Model, interpret and solve elementary equations and inequalities, check candidates and represent ' +
        'complete solution sets.',
    generators: [
        {module: 'algebra-equations', strategy: 'new'},
        {module: 'algebra-inequalities', strategy: 'new'}
    ],
    views: [
        {module: 'algebra-substitution-check', strategy: 'new'},
        {module: 'algebra-solution-meaning', strategy: 'new'},
        {module: 'algebra-equation-model-solve', strategy: 'new'},
        {module: 'algebra-inequality-numberline', strategy: 'new'},
        {module: 'algebra-inequality-infinite-solutions', strategy: 'new'},
        {module: 'algebra-inequality-model', strategy: 'new'}
    ]
});

const algebraVariableMeaningImplementation = defineImplementationPackage({
    id: 'algebra-variable-meaning',
    description:
        'Interpret explicitly designated unknown and generalized variable roles in their mathematical ' +
        'domains.',
    generators: [
        {module: 'algebra-variable-models', strategy: 'new'}
    ],
    views: [
        {module: 'algebra-variable-interpretation', strategy: 'new'}
    ]
});

const algebraCovariationImplementation = defineImplementationPackage({
    id: 'algebra-covariation',
    description:
        'Model dependent quantities and relate the same numerical relationship through equations, tables ' +
        'and graphs.',
    generators: [
        {module: 'algebra-covariation', strategy: 'new'}
    ],
    views: [
        {module: 'algebra-dependent-equation-model', strategy: 'new'},
        {module: 'algebra-covariation-interpretation', strategy: 'new'},
        {module: 'algebra-covariation-table-graph', strategy: 'new'}
    ]
});

const polygonAreaDissectionImplementation = defineImplementationPackage({
    id: 'polygon-area-dissection',
    description:
        'Find polygon areas through composition and decomposition across the complete triangle, ' +
        'quadrilateral and polygon profiles.',
    generators: [
        {module: 'polygon-area-dissection', strategy: 'new'}
    ],
    views: [
        {module: 'polygon-area-composition', strategy: 'new'},
        {module: 'polygon-area-composition-story', strategy: 'new'},
        {module: 'polygon-area-decomposition', strategy: 'new'},
        {module: 'polygon-area-decomposition-story', strategy: 'new'}
    ]
});

const fractionalPrismVolumeImplementation = defineImplementationPackage({
    id: 'fractional-prism-volume',
    description:
        'Use unit-fraction cube packing and prism-volume formulas, and explain why packing agrees with ' +
        'multiplying edge lengths.',
    generators: [
        {module: 'volume-rectangular-prism', strategy: 'expand'}
    ],
    views: [
        {module: 'volume-fractional-packing-count', strategy: 'new'},
        {module: 'volume-packing-product-explanation', strategy: 'expand'},
        {module: 'volume-formula-execution', strategy: 'expand'},
        {module: 'volume-formula-story', strategy: 'expand'}
    ]
});

const polyhedralNetsImplementation = defineImplementationPackage({
    id: 'polyhedral-nets',
    description:
        'Construct valid rectangle-and-triangle nets and calculate the surface area of their solids.',
    generators: [
        {module: 'polyhedral-nets', strategy: 'new'}
    ],
    views: [
        {module: 'solid-net-construction', strategy: 'new'},
        {module: 'solid-net-construction-story', strategy: 'new'},
        {module: 'net-surface-area', strategy: 'new'},
        {module: 'net-surface-area-story', strategy: 'new'}
    ]
});

const statisticalQuestionRecognitionImplementation = defineImplementationPackage({
    id: 'statistical-question-recognition',
    description:
        'Recognize questions whose observations are expected to vary and explain the relevant variability.',
    generators: [
        {module: 'statistical-questions', strategy: 'new'}
    ],
    views: [
        {module: 'statistical-question-classification', strategy: 'new'}
    ]
});

const numericalDistributionInterpretationImplementation = defineImplementationPackage({
    id: 'numerical-distribution-interpretation',
    description:
        'Interpret numerical distributions through center, spread, shape and contextual departures from ' +
        'the overall pattern.',
    generators: [
        {module: 'numerical-data', strategy: 'new'}
    ],
    views: [
        {module: 'distribution-description', strategy: 'new'},
        {module: 'distribution-patterns-context', strategy: 'new'}
    ]
});

const statisticalSummaryMeaningImplementation = defineImplementationPackage({
    id: 'statistical-summary-meaning',
    description:
        'Explain the distinct meanings of center and variation measures as single-number summaries of ' +
        'data.',
    generators: [
        {module: 'numerical-data', strategy: 'new'}
    ],
    views: [
        {module: 'center-summary-interpretation', strategy: 'new'},
        {module: 'variation-summary-interpretation', strategy: 'new'}
    ]
});

const numericalDistributionPlotsImplementation = defineImplementationPackage({
    id: 'numerical-distribution-plots',
    description:
        'Construct dot plots, histograms and box plots from numerical data using explicit display ' +
        'conventions.',
    generators: [
        {module: 'numerical-data', strategy: 'new'}
    ],
    views: [
        {module: 'numerical-distribution-plot', strategy: 'new'}
    ]
});

const numericalDataContextSummaryImplementation = defineImplementationPackage({
    id: 'numerical-data-context-summary',
    description:
        'Report observation counts and describe the recorded attribute, measurement method and units of a ' +
        'numerical data set.',
    generators: [
        {module: 'numerical-data', strategy: 'new'}
    ],
    views: [
        {module: 'data-observation-count', strategy: 'new'},
        {module: 'data-attribute-description', strategy: 'new'}
    ]
});

const numericalDataSummariesImplementation = defineImplementationPackage({
    id: 'numerical-data-summaries',
    description:
        'Calculate and interpret contextual mean, median, interquartile range and mean absolute deviation.',
    generators: [
        {module: 'numerical-data', strategy: 'new'}
    ],
    views: [
        {module: 'contextual-center-summary', strategy: 'new'},
        {module: 'contextual-variation-summary', strategy: 'new'}
    ]
});

const statisticalSummarySelectionImplementation = defineImplementationPackage({
    id: 'statistical-summary-selection',
    description:
        'Choose and justify center and variation measures with reference to distribution shape and ' +
        'investigation context.',
    generators: [
        {module: 'numerical-data', strategy: 'new'}
    ],
    views: [
        {module: 'statistical-summary-selection', strategy: 'new'}
    ]
});

// Ratios and Proportional Relationships (6.RP)

// 6.RP.A.1: interpret an ordered ratio and express its meaning.
const ratioLanguageBuilder = new DatasetPermutationBuilder().addLabels([
    Area.RatioAntecedentInterpretation,
    Area.RatioConsequentInterpretation,
    Ability.Interpretation,
    Ability.TextualArticulation
]);

// 6.RP.A.2: interpret a unit rate and express its contextual meaning.
const unitRateLanguageBuilder = new DatasetPermutationBuilder().addLabels([
    Area.RatioAntecedentInterpretation,
    Area.RatioConsequentInterpretation,
    Area.RatioEquivalence,
    Area.Division,
    Scope.RationalNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.Interpretation,
    Ability.TextualArticulation
]);

// 6.RP.A.3a: plot pairs from equivalent-ratio tables.
const ratioCoordinatePlottingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.RatioEquivalence,
    Area.PointPlotting,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Scope.TabularAlgebraicRepresentation,
    Scope.CartesianCoordinateSystem,
    Ability.VisualArticulation
]);

// 6.RP.A.3a: compare ratios using tables.
const ratioTableComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.RatioAntecedentInterpretation,
        Area.RatioConsequentInterpretation,
        Area.RatioEquivalence,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.TabularAlgebraicRepresentation,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal],
        [Area.NumericInequality, Scope.Greater]
    ]);

// 6.RP.A.3a: make equivalent-ratio tables.
const ratioTableConstructionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.RatioEquivalence,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Scope.TabularAlgebraicRepresentation,
    Ability.VisualArticulation
]);

// 6.RP.A.3a: find missing equivalent-ratio table entries.
const ratioTableMissingValuesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.RatioEquivalence,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Scope.TabularAlgebraicRepresentation,
    Ability.ProcedureInversion
]);

// 6.RP.A.3b: solve unit pricing, constant-speed and other unit-rate problems.
const unitRateProblemsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Division,
    Area.ProportionalScaling,
    Area.RatioEquivalence,
    Scope.RationalNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureExecution,
    Ability.TextualReception
]);

// 6.RP.A.3c: calculate a percent of a quantity as a rate per hundred.
const percentOfQuantityBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PercentageEquivalence,
    Area.ProportionalScaling,
    Scope.RationalNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureExecution
]);

// 6.RP.A.3c: recover the whole from its part and percent.
const wholeFromPercentBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PercentageEquivalence,
    Area.ProportionalScaling,
    Scope.RationalNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureInversion
]);

// 6.RP.A.3d: use ratio reasoning for measurement-unit conversion.
const ratioUnitConversionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.UnitConversion,
    Area.RatioEquivalence,
    Scope.RationalNumbers,
    Ability.ProcedureExecution,
    Ability.ProcedureUnderstanding
]);

// 6.RP.A.3d: manipulate and transform units when multiplying or dividing quantities.
const unitProductsQuotientsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.UnitDimensionality,
        Scope.RationalNumbers,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.Multiplication],
        [Area.Division]
    ]);

// The Number System (6.NS)

// 6.NS.A.1: fraction division execution.
const fractionDivisionExecutionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.FractionDividend, Scope.FractionDivisor],
        [Scope.FractionDividend, Scope.IntegerDivisor],
        [Scope.IntegerDividend, Scope.FractionDivisor]
    ]);

// 6.NS.A.1: fraction division interpretation.
const fractionDivisionInterpretationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Scope.NumbersWithoutNegatives,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Scope.FractionDividend, Scope.FractionDivisor],
        [Scope.FractionDividend, Scope.IntegerDivisor],
        [Scope.IntegerDividend, Scope.FractionDivisor]
    ]);

// 6.NS.A.1: fraction division inverse explanation.
const fractionDivisionInverseExplanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Area.Multiplication,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.FractionDividend, Scope.FractionDivisor],
        [Scope.FractionDividend, Scope.IntegerDivisor],
        [Scope.IntegerDividend, Scope.FractionDivisor]
    ]);

// 6.NS.A.1: fraction division model construction.
const fractionDivisionModelConstructionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Scope.NumbersWithoutNegatives,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.FractionDividend, Scope.FractionDivisor],
        [Scope.FractionDividend, Scope.IntegerDivisor],
        [Scope.IntegerDividend, Scope.FractionDivisor]
    ]);

// 6.NS.A.1: fraction division story creation.
const fractionDivisionStoryCreationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Scope.NumbersWithoutNegatives,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Scope.FractionDividend, Scope.FractionDivisor],
        [Scope.FractionDividend, Scope.IntegerDivisor],
        [Scope.IntegerDividend, Scope.FractionDivisor]
    ]);

// 6.NS.A.1: fraction division word problems.
const fractionDivisionWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Area.Equation,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureExecution,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Scope.FractionDividend, Scope.FractionDivisor],
        [Scope.FractionDividend, Scope.IntegerDivisor],
        [Scope.IntegerDividend, Scope.FractionDivisor]
    ]);

// 6.NS.B.2: standard division.
const standardDivisionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DivisionStandardAlgorithm,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.MultipleDigitDividend,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

// 6.NS.B.3: standard decimal addition.
const standardDecimalAdditionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AdditionStandardAlgorithm,
    Scope.DecimalNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.MultipleDigitLargestOperand,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

// 6.NS.B.3: standard decimal division.
const standardDecimalDivisionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DivisionStandardAlgorithm,
    Scope.DecimalNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.MultipleDigitLargestOperand,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

// 6.NS.B.3: standard decimal multiplication.
const standardDecimalMultiplicationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.MultiplicationStandardAlgorithm,
    Scope.DecimalNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.MultipleDigitLargestOperand,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

// 6.NS.B.3: standard decimal subtraction.
const standardDecimalSubtractionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.SubtractionStandardAlgorithm,
    Scope.DecimalNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.MultipleDigitLargestOperand,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

// 6.NS.B.4: rewrite a sum using its full common factor and coprime residual addends.
const extractFullCommonFactorBuilder = new DatasetPermutationBuilder().addLabels([
    Area.GreatestCommonDivisor,
    Area.DistributiveLaw,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureExecution
]);

// 6.NS.B.4: find the greatest common factor of two whole numbers at most 100.
const greatestCommonFactorBuilder = new DatasetPermutationBuilder().addLabels([
    Area.GreatestCommonDivisor,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureExecution
]);

// 6.NS.B.4: find the least common multiple of two whole numbers at most 12.
const leastCommonMultipleBuilder = new DatasetPermutationBuilder().addLabels([
    Area.LeastCommonMultiple,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureExecution
]);

// 6.NS.C.5: explain the reference meaning of zero.
const contextualZeroBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ZeroConcept,
    Scope.RationalNumbers,
    Scope.NumbersWithZero,
    Ability.Interpretation,
    Ability.TextualArticulation
]);

// 6.NS.C.5: understand opposite signed quantities.
const signedContextInterpretationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.SignNotation,
    Scope.RationalNumbers,
    Scope.NumbersWithNegatives,
    Ability.Interpretation
]);

// 6.NS.C.5: represent contextual quantities by signed numbers.
const signedContextRepresentationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.SignNotation,
    Scope.RationalNumbers,
    Scope.NumbersWithNegatives,
    Ability.Formalization,
    Ability.TextualReception
]);

// 6.NS.C.6a: the opposite of an opposite recovers the number.
const doubleOppositeBuilder = new DatasetPermutationBuilder().addLabels([
    Area.RulesOfSigns,
    Area.SignNotation,
    Scope.RationalNumbers,
    Ability.Interpretation
]);

// 6.NS.C.6a: opposite signs give opposite-side positions.
const oppositeLineLocationsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.SignNotation,
    Scope.RationalNumbers,
    Scope.NumbersWithNegatives,
    Scope.Numberline,
    Ability.Interpretation
]);

// 6.NS.C.6a: zero is its own opposite.
const zeroOppositeBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ZeroConcept,
    Area.SignNotation,
    Scope.NumbersWithZero,
    Scope.Numberline,
    Ability.Interpretation
]);

// 6.NS.C.6b: interpret coordinate signs as quadrant locations.
const coordinateSignQuadrantsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.OrderedCoordinatePair,
    Area.Quadrants,
    Area.SignNotation,
    Scope.RationalNumbers,
    Scope.CartesianCoordinateSystem,
    Ability.Interpretation
]);

// 6.NS.C.6b: sign changes imply coordinate reflections.
const coordinateSignReflectionsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.OrderedCoordinatePair,
    Area.Reflection,
    Area.SignNotation,
    Scope.RationalNumbers,
    Scope.CartesianCoordinateSystem,
    Ability.Interpretation
]);

// 6.NS.C.6c: plot given ordered pairs.
const rationalCoordinatePositioningBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PointPlotting,
        Scope.CartesianCoordinateSystem,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.IntegerNumbers],
        [Scope.FractionNumbers],
        [Scope.DecimalNumbers]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutNegatives],
        [Scope.NumbersWithNegatives]
    ]);

// 6.NS.C.6c: find represented ordered pairs.
const rationalCoordinateReadingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.OrderedCoordinatePair,
        Scope.CartesianCoordinateSystem,
        Ability.VisualReception
    ])
    .applyLabelVariants([
        [Scope.IntegerNumbers],
        [Scope.FractionNumbers],
        [Scope.DecimalNumbers]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutNegatives],
        [Scope.NumbersWithNegatives]
    ]);

// 6.NS.C.6c: position rational values on number lines.
const rationalNumberlinePositioningBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.Numberline,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.NumerationWithIntegers, Scope.IntegerNumbers],
        [Area.NumerationWithFractions, Scope.FractionNumbers],
        [Area.NumerationWithDecimals, Scope.DecimalNumbers]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutNegatives],
        [Scope.NumbersWithNegatives]
    ]);

// 6.NS.C.6c: find rational values represented on a number line.
const rationalNumberlineReadingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.Numberline,
        Ability.VisualReception
    ])
    .applyLabelVariants([
        [Area.NumerationWithIntegers, Scope.IntegerNumbers],
        [Area.NumerationWithFractions, Scope.FractionNumbers],
        [Area.NumerationWithDecimals, Scope.DecimalNumbers]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutNegatives],
        [Scope.NumbersWithNegatives]
    ]);

// 6.NS.C.7a: inequality line interpretation.
const inequalityLineInterpretationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Inequality,
        Scope.RationalNumbers,
        Scope.Numberline,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Scope.Less],
        [Scope.Greater]
    ]);

// 6.NS.C.7b: contextual order explanation.
const contextualOrderExplanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Inequality,
        Scope.RationalNumbers,
        Ability.Interpretation,
        Ability.TextualArticulation,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Scope.Less],
        [Scope.Greater]
    ]);

// 6.NS.C.7b: contextual order writing.
const contextualOrderWritingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Inequality,
        Scope.RationalNumbers,
        Ability.Formalization,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Scope.Less],
        [Scope.Greater]
    ]);

// 6.NS.C.7c: absolute value distance.
const absoluteValueDistanceBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AbsoluteNumberMagnitude,
    Scope.RationalNumbers,
    Scope.Numberline,
    Ability.Interpretation
]);

// 6.NS.C.7c: contextual absolute value.
const contextualAbsoluteValueBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AbsoluteNumberMagnitude,
    Scope.RationalNumbers,
    Ability.Interpretation,
    Ability.Formalization
]);

// 6.NS.C.7d: order versus magnitude.
const orderVersusMagnitudeBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AbsoluteNumberMagnitude,
    Area.Inequality,
    Scope.RationalNumbers,
    Scope.NumbersWithNegatives,
    Ability.ConceptClassification
]);

// 6.NS.C.8: use coordinates and absolute value for same-axis distances.
const axisAlignedCoordinateDistanceBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.CoordinateDistance,
        Area.AbsoluteNumberMagnitude,
        Scope.CartesianCoordinateSystem,
        Scope.RationalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// 6.NS.C.8: solve mathematical/contextual problems by graphing points.
const coordinatePlaneProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PointPlotting,
        Scope.CartesianCoordinateSystem,
        Scope.RationalNumbers,
        Ability.VisualArticulation,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// Expressions and Equations (6.EE)

// 6.EE.A.1: Evaluate arithmetic expressions involving whole-number exponents.
const evaluatePowerExpressionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ArithmeticExpression,
        Area.Exponentiation,
        Area.OrderOfOperations,
        Scope.IntegerExponent,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Scope.PositiveExponent]
    ]);

// 6.EE.A.1: Write arithmetic expressions involving whole-number exponents.
const writePowerExpressionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ArithmeticExpression,
        Area.Exponentiation,
        Scope.IntegerExponent,
        Scope.ArabicNumerals,
        Ability.Formalization,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [],
        [Scope.PositiveExponent]
    ]);

// 6.EE.A.2a: Translate a prescribed operation phrase into an expression containing letters.
const writeLetterExpressionsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AlgebraicExpression,
    Scope.ArabicNumerals,
    Ability.Formalization,
    Ability.TextualReception
]);

// 6.EE.A.2b: Identify sum, term, product, factor, quotient and coefficient roles.
const identifyExpressionPartsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.ArithmeticExpression, Area.Term],
        [Area.AlgebraicExpression, Area.Term],
        [Area.ArithmeticExpression, Area.Factor],
        [Area.AlgebraicExpression, Area.Factor],
        [Area.AlgebraicExpression, Area.Coefficient],
        [Area.ArithmeticExpression, Area.Addition],
        [Area.AlgebraicExpression, Area.Addition],
        [Area.ArithmeticExpression, Area.Multiplication],
        [Area.AlgebraicExpression, Area.Multiplication],
        [Area.ArithmeticExpression, Area.Division],
        [Area.AlgebraicExpression, Area.Division]
    ]);

// 6.EE.A.2b: Interpret a grouped subexpression as one operand in the enclosing expression.
const interpretSubexpressionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.GroupingSymbol,
        Area.Operand,
        Scope.ArabicNumerals,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.ArithmeticExpression],
        [Area.AlgebraicExpression]
    ]);

// 6.EE.A.2c: Substitute specified values into variable expressions and contextual formulas.
const evaluateVariableExpressionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AlgebraicExpression,
        Area.AlgebraicSubstitution,
        Area.OrderOfOperations,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Area.Exponentiation, Scope.IntegerExponent],
        [Area.Exponentiation, Scope.IntegerExponent, Scope.PositiveExponent]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// 6.EE.A.3: Use operation properties to generate equivalent literal expressions.
const generateEquivalentExpressionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AlgebraicExpression,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.DistributingLinearCombinations],
        [Area.CollectingLinearTerms],
        [Area.AlgebraicEquivalence, Area.AssociativeLaw],
        [Area.AlgebraicEquivalence, Area.CommutativeLaw]
    ]);

// 6.EE.A.4: Judge whether two literal expressions are equal for all admissible substitutions.
const identifyEquivalentExpressionsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AlgebraicExpression,
    Area.AlgebraicEquivalence,
    Scope.ArabicNumerals,
    Ability.CorrectnessEvaluation
]);

// 6.EE.B.5: Check whether a supplied candidate satisfies an equation or inequality.
const checkSubstitutionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AlgebraicSubstitution,
        Area.RelationSatisfaction,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.CorrectnessEvaluation
    ])
    .applyLabelVariants([
        [Area.Equation],
        [Area.Inequality]
    ]);

// 6.EE.B.5: Interpret solving as finding every admissible value that satisfies a relation.
const interpretSolutionProcessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SolutionSet,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.Equation, Area.EquationSolving],
        [Area.Inequality, Area.InequalitySolving]
    ]);

// 6.EE.B.6: Interpret a variable as an unknown or a generalized number.
const interpretVariableRolesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.UnknownVariable],
        [Area.GeneralizedVariable]
    ]);

// 6.EE.B.6: Select quantities and construct an expression for a quantitative situation.
const modelContextualExpressionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AlgebraicModeling,
    Area.AlgebraicExpression,
    Scope.ArabicNumerals,
    Ability.Formalization,
    Ability.TextualReception
]);

// 6.EE.B.7: Model and solve x+p=q or px=q in the nonnegative rational domain.
const modelAndSolveRationalEquationsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AlgebraicModeling,
        Area.Equation,
        Area.EquationSolving,
        Scope.RationalNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.ExpressionOnOneSide,
        Scope.ArabicNumerals,
        Ability.TextualReception,
        Ability.Formalization,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Multiplication]
    ]);

// 6.EE.B.8: Represent the complete strict-inequality solution set on a number line.
const graphInequalitySolutionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Inequality,
        Area.SolutionSet,
        Scope.NoExpressions,
        Scope.Numberline,
        Scope.GraphicalAlgebraicRepresentation,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less]
    ]);

// 6.EE.B.8: Interpret the infinite solution set of a strict one-variable inequality.
const interpretInfiniteSolutionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Inequality,
        Area.SolutionSet,
        Scope.NoExpressions,
        Scope.ArabicNumerals,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less]
    ]);

// 6.EE.B.8: Model a strict quantitative constraint as x>c or x<c.
const modelStrictInequalitiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AlgebraicModeling,
        Area.Inequality,
        Scope.NoExpressions,
        Scope.ArabicNumerals,
        Ability.TextualReception,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less]
    ]);

// 6.EE.C.9: Model a dependent quantity in terms of an independent quantity.
const modelDependentQuantityBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AlgebraicModeling,
    Area.NumericFunction,
    Area.Equation,
    Area.IndependentVariable,
    Area.DependentVariable,
    Scope.ArabicNumerals,
    Ability.TextualReception,
    Ability.Formalization
]);

// 6.EE.C.9: Analyze the same dependent relationship in equation, table and graph forms.
const relateEquationTableGraphBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumericFunction,
    Area.Equation,
    Area.IndependentVariable,
    Area.DependentVariable,
    Scope.TabularAlgebraicRepresentation,
    Scope.GraphicalAlgebraicRepresentation,
    Scope.CartesianCoordinateSystem,
    Ability.Interpretation,
    Ability.VisualReception
]);

// 6.EE.C.9: Form and graph corresponding values from a contextual numerical relationship.
const tabulateAndGraphCovariationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumericFunction,
    Area.Equation,
    Area.OrderedCoordinatePair,
    Area.PointPlotting,
    Scope.TabularAlgebraicRepresentation,
    Scope.GraphicalAlgebraicRepresentation,
    Scope.CartesianCoordinateSystem,
    Ability.Formalization,
    Ability.VisualArticulation
]);

// Geometry (6.G)

// 6.G.A.1: Calculate polygon areas by composition or decomposition, including contextual problems.
const polygonAreaDissectionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.RightTriangle, Area.ShapeSynthesis, Ability.SpatialGeneration],
        [Area.AcuteTriangle, Area.ShapeDecomposition, Ability.VisualDecomposition],
        [Area.ObtuseTriangle, Area.ShapeDecomposition, Ability.VisualDecomposition],
        [Area.Parallelogram, Area.ShapeSynthesis, Ability.SpatialGeneration],
        [Area.Rhombus, Area.ShapeDecomposition, Ability.VisualDecomposition],
        [Area.Trapezoid, Area.ShapeDecomposition, Ability.VisualDecomposition],
        [Area.Kite, Area.ShapeDecomposition, Ability.VisualDecomposition],
        [Area.Polygon, Area.ShapeDecomposition, Ability.VisualDecomposition]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// 6.G.A.2: Find prism volume from unit-fraction cube packing.
const fractionalCubePackingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.MeasuringVolumes,
    Area.VolumeCalculation,
    Area.RectangularPrism,
    Area.Multiplication,
    Scope.CubeScale,
    Scope.FractionNumbers,
    Ability.ProcedureExecution
]);

// 6.G.A.2: Explain why fractional cube packing agrees with the edge product.
const fractionalPackingProductConnectionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.MeasuringVolumes,
    Area.VolumeCalculation,
    Area.RectangularPrism,
    Area.Multiplication,
    Scope.CubeScale,
    Scope.FractionNumbers,
    Area.Equation,
    Ability.ProcedureUnderstanding,
    Ability.Formalization
]);

// 6.G.A.2: Apply fractional prism-volume formulas in mathematical and contextual problems.
const fractionalPrismFormulasBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Area.Equation,
        Scope.FractionNumbers,
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

// 6.G.A.3: Draw polygons from ordered vertex coordinates.
const coordinatePolygonConstructionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapePlotting,
        Area.Polygon,
        Scope.CartesianCoordinateSystem,
        Scope.RationalNumbers,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutNegatives],
        [Scope.NumbersWithNegatives]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// 6.G.A.3: Find lengths of coordinate-aligned polygon sides.
const coordinatePolygonSideLengthBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.CoordinateDistance,
        Area.Polygon,
        Scope.CartesianCoordinateSystem,
        Scope.RationalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutNegatives],
        [Scope.NumbersWithNegatives]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// 6.G.A.4: Represent solids by rectangle/triangle nets.
const constructSolidNetBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeDecomposition,
        Scope.GeometricNet,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.RectangularPrism],
        [Area.Prism, Area.Triangle],
        [Area.Pyramid]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// 6.G.A.4: Find a solid surface area from its net.
const netSurfaceAreaBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SurfaceAreaCalculation,
        Scope.GeometricNet,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.RectangularPrism],
        [Area.Prism, Area.Triangle],
        [Area.Pyramid]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// Statistics and Probability (6.SP)

// 6.SP.A.1: Recognize questions that anticipate variable data.
const classifyStatisticalQuestionsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.StatisticalQuestion,
    Ability.ConceptClassification
]);

// 6.SP.A.2: Describe a distribution through its center, spread and shape.
const describeDistributionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.EmpiricalDistributionShape,
        Area.StatisticalVariability,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.ArithmeticMean, Area.MeanAbsoluteDeviation],
        [Area.Median, Area.InterquartileRange]
    ]);

// 6.SP.A.3: Interpret one measure of center as a summary of data values.
const interpretCenterSummaryBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.ArithmeticMean],
        [Area.Median]
    ]);

// 6.SP.A.3: Interpret one measure of variation as a summary of spread.
const interpretVariationSummaryBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.InterquartileRange],
        [Area.MeanAbsoluteDeviation]
    ]);

// 6.SP.B.4: Construct dot plots, histograms and box plots on numerical axes.
const constructNumericalDistributionPlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.FrequencyDistribution, Scope.LinePlot],
        [Area.FrequencyDistribution, Scope.Histogram],
        [Area.Quartile, Area.Median, Scope.BoxPlot]
    ]);

// 6.SP.B.5a: Report the number of observations in a numerical data set.
const observationCountBuilder = new DatasetPermutationBuilder().addLabels([
    Area.StatisticalSample,
    Area.NumerationWithIntegers,
    Scope.QuantityMeasurement,
    Ability.ProcedureExecution
]);

// 6.SP.B.5b: Describe the investigated attribute, measurement method and units.
const dataAttributeDescriptionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.StatisticalVariable,
    Ability.InformationExtraction,
    Ability.TextualArticulation
]);

// 6.SP.B.5c: Compute and report a contextual mean or median.
const computeContextualCenterBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.ProcedureExecution,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.ArithmeticMean],
        [Area.Median]
    ]);

// 6.SP.B.5c: Compute and report contextual IQR or MAD.
const computeContextualVariationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.ProcedureExecution,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.InterquartileRange],
        [Area.MeanAbsoluteDeviation]
    ]);

// 6.SP.B.5c: Describe overall distribution patterns and striking departures in context.
const describeContextualPatternsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.EmpiricalDistributionShape,
    Area.StatisticalOutlier,
    Ability.Interpretation
]);

// 6.SP.B.5d: Relate the choice of center and variability measures to shape and context.
const selectContextualSummariesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ArithmeticMean,
    Area.Median,
    Area.InterquartileRange,
    Area.MeanAbsoluteDeviation,
    Area.EmpiricalDistributionShape,
    Ability.ProcedureApplicability
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('6.RP.A.1-ratio-language', ratioLanguageBuilder),
    ...toTargets('6.RP.A.2-unit-rate-language', unitRateLanguageBuilder),
    ...toTargets('6.RP.A.3a-ratio-coordinate-plotting', ratioCoordinatePlottingBuilder),
    ...toTargets('6.RP.A.3a-ratio-table-comparison', ratioTableComparisonBuilder),
    ...toTargets('6.RP.A.3a-ratio-table-construction', ratioTableConstructionBuilder),
    ...toTargets('6.RP.A.3a-ratio-table-missing-values', ratioTableMissingValuesBuilder),
    ...toTargets('6.RP.A.3b-unit-rate-problems', unitRateProblemsBuilder),
    ...toTargets('6.RP.A.3c-percent-of-quantity', percentOfQuantityBuilder),
    ...toTargets('6.RP.A.3c-whole-from-percent', wholeFromPercentBuilder),
    ...toTargets('6.RP.A.3d-ratio-unit-conversion', ratioUnitConversionBuilder),
    ...toTargets('6.RP.A.3d-unit-products-quotients', unitProductsQuotientsBuilder),
    ...toTargets('6.NS.A.1-fraction-division-execution', fractionDivisionExecutionBuilder),
    ...toTargets('6.NS.A.1-fraction-division-interpretation', fractionDivisionInterpretationBuilder),
    ...toTargets('6.NS.A.1-fraction-division-inverse-explanation', fractionDivisionInverseExplanationBuilder),
    ...toTargets('6.NS.A.1-fraction-division-model-construction', fractionDivisionModelConstructionBuilder),
    ...toTargets('6.NS.A.1-fraction-division-story-creation', fractionDivisionStoryCreationBuilder),
    ...toTargets('6.NS.A.1-fraction-division-word-problems', fractionDivisionWordProblemsBuilder),
    ...toTargets('6.NS.B.2-standard-division', standardDivisionBuilder),
    ...toTargets('6.NS.B.3-standard-decimal-addition', standardDecimalAdditionBuilder),
    ...toTargets('6.NS.B.3-standard-decimal-division', standardDecimalDivisionBuilder),
    ...toTargets('6.NS.B.3-standard-decimal-multiplication', standardDecimalMultiplicationBuilder),
    ...toTargets('6.NS.B.3-standard-decimal-subtraction', standardDecimalSubtractionBuilder),
    ...toTargets('6.NS.B.4-extract-full-common-factor', extractFullCommonFactorBuilder),
    ...toTargets('6.NS.B.4-greatest-common-factor', greatestCommonFactorBuilder),
    ...toTargets('6.NS.B.4-least-common-multiple', leastCommonMultipleBuilder),
    ...toTargets('6.NS.C.5-contextual-zero', contextualZeroBuilder),
    ...toTargets('6.NS.C.5-signed-context-interpretation', signedContextInterpretationBuilder),
    ...toTargets('6.NS.C.5-signed-context-representation', signedContextRepresentationBuilder),
    ...toTargets('6.NS.C.6a-double-opposite', doubleOppositeBuilder),
    ...toTargets('6.NS.C.6a-opposite-line-locations', oppositeLineLocationsBuilder),
    ...toTargets('6.NS.C.6a-zero-opposite', zeroOppositeBuilder),
    ...toTargets('6.NS.C.6b-coordinate-sign-quadrants', coordinateSignQuadrantsBuilder),
    ...toTargets('6.NS.C.6b-coordinate-sign-reflections', coordinateSignReflectionsBuilder),
    ...toTargets('6.NS.C.6c-rational-coordinate-positioning', rationalCoordinatePositioningBuilder),
    ...toTargets('6.NS.C.6c-rational-coordinate-reading', rationalCoordinateReadingBuilder),
    ...toTargets('6.NS.C.6c-rational-numberline-positioning', rationalNumberlinePositioningBuilder),
    ...toTargets('6.NS.C.6c-rational-numberline-reading', rationalNumberlineReadingBuilder)
];

export const implementationTodos: ImplementationTodo[] = [
    // The Number System (6.NS)
    ...toImplementationTodos(
        '6.NS.C.7a-inequality-line-interpretation',
        inequalityLineInterpretationBuilder,
        rationalOrderAndMagnitudeImplementation,
        'Interpret an explicit inequality as left/right ordering of two points, including negative values ' +
        'and appropriate orientation. The competency concerns the form and meaning of an inequality ' +
        'statement; NumericInequality now specifically identifies unequal numerical values. Less/Greater ' +
        'retain the actual order direction.'
    ),
    ...toImplementationTodos(
        '6.NS.C.7b-contextual-order-explanation',
        contextualOrderExplanationBuilder,
        rationalOrderAndMagnitudeImplementation,
        'Read the necessary real-world context, then interpret and explain its provided inequality while ' +
        'preserving sign and physical direction. The competency concerns the form and meaning of an ' +
        'inequality statement; NumericInequality now specifically identifies unequal numerical values. ' +
        'Less/Greater retain the actual order direction.'
    ),
    ...toImplementationTodos(
        '6.NS.C.7b-contextual-order-writing',
        contextualOrderWritingBuilder,
        rationalOrderAndMagnitudeImplementation,
        'Turn contextual comparisons into accurate signed rational inequality statements. The competency ' +
        'concerns the form and meaning of an inequality statement; NumericInequality now specifically ' +
        'identifies unequal numerical values. Less/Greater retain the actual order direction.'
    ),
    ...toImplementationTodos(
        '6.NS.C.7c-absolute-value-distance',
        absoluteValueDistanceBuilder,
        rationalOrderAndMagnitudeImplementation,
        'Absolute-value bars, point a and measured distance to zero; explain nonnegative distance ' +
        'independently of sign.'
    ),
    ...toImplementationTodos(
        '6.NS.C.7c-contextual-absolute-value',
        contextualAbsoluteValueBuilder,
        rationalOrderAndMagnitudeImplementation,
        'Context makes magnitude distinct from direction; write and interpret a relation such as ∣−30∣=30 ' +
        'for debt size.'
    ),
    ...toImplementationTodos(
        '6.NS.C.7d-order-versus-magnitude',
        orderVersusMagnitudeBuilder,
        rationalOrderAndMagnitudeImplementation,
        'Signed-order and absolute-magnitude statements appear side by side, such as -40 < -30 and ∣-40∣ > ' +
        '∣-30∣. Classify what each statement compares and explain why a smaller signed balance can mean a ' +
        'larger debt magnitude; include unequal negative values where the order reverses. Inequality ' +
        'supplies the meaning of the contrasted order statements. NumericInequality would only establish ' +
        'non-equality, and a single Less/Greater Scope would not identify which of the two comparisons it ' +
        'qualifies.'
    ),
    ...toImplementationTodos(
        '6.NS.C.8-axis-aligned-coordinate-distance',
        axisAlignedCoordinateDistanceBuilder,
        coordinatePlaneProblemsImplementation,
        'Same x or same y is explicit; use absolute value/distance to obtain the separation, including ' +
        'crossing an axis.'
    ),
    ...toImplementationTodos(
        '6.NS.C.8-coordinate-plane-problems',
        coordinatePlaneProblemsBuilder,
        coordinatePlaneProblemsImplementation,
        'Plot points and use the graph to answer the supplied mathematical or contextual question; all ' +
        'four quadrants belong to one complete domain.'
    ),

    // Expressions and Equations (6.EE)
    ...toImplementationTodos(
        '6.EE.A.1-evaluate-power-expressions',
        evaluatePowerExpressionsBuilder,
        numericalPowerExpressionsImplementation,
        'Evaluate a numerical expression containing powers and other operations. The worked result ' +
        'respects exponentiation, conventional precedence and grouping. The generator enforces integer ' +
        'exponents >= 0; the IntegerExponent-only configuration includes exponent-zero examples with ' +
        'nonzero bases. PositiveExponent additionally requires n > 0. Omitting PositiveExponent does not ' +
        'itself label zero or nonnegativity. Do not constrain all numbers/base signs merely to constrain ' +
        'the exponent; exclude undefined 0^0 locally.'
    ),
    ...toImplementationTodos(
        '6.EE.A.1-write-power-expressions',
        writePowerExpressionsBuilder,
        numericalPowerExpressionsImplementation,
        'Read a prescribed calculation and write its arithmetic expression with exponent notation; ' +
        'distinguish an exponent from repeated addition and from multiplying the base by the exponent. The ' +
        'generator enforces integer exponents >= 0; the IntegerExponent-only configuration includes ' +
        'exponent-zero examples with nonzero bases. PositiveExponent additionally requires n > 0. Omitting ' +
        'PositiveExponent does not itself label zero or nonnegativity. Do not constrain all numbers/base ' +
        'signs merely to constrain the exponent; exclude undefined 0^0 locally.'
    ),
    ...toImplementationTodos(
        '6.EE.A.2a-write-letter-expressions',
        writeLetterExpressionsBuilder,
        algebraExpressionStructureImplementation,
        'A written calculation already specifies the operation and includes a letter standing for a ' +
        'number; the learner writes its symbolic form, including order-sensitive phrases such as subtract ' +
        'y from 5. Do not add AlgebraicModeling merely because prose is present: the operation ' +
        'relationship is already specified. AlgebraicExpression supplies the observable literal-expression ' +
        'distinction from Grade 5 numerical translation.'
    ),
    ...toImplementationTodos(
        '6.EE.A.2b-identify-expression-parts',
        identifyExpressionPartsBuilder,
        algebraExpressionStructureImplementation,
        'Classify a displayed expression component by its additive, multiplicative, quotient or ' +
        'coefficient role. Across configurations cover every named category, with the numeric 2(8+7) ' +
        'example as well as literal expressions. A coefficient configuration must identify the designated ' +
        'variable part. Term, Factor and Coefficient identify structural roles. Addition, Multiplication ' +
        'and Division identify the operation whose expression is a sum, product or quotient; these tasks ' +
        'classify rather than execute it. They do not require a new Sum/Product/Quotient Area. Use ' +
        'correlated expression-kind/role variants: Coefficient requires a designated variable part and is ' +
        'paired only with AlgebraicExpression. The arithmetic/literal alternatives retain the source\'s ' +
        'explicit numerical example without making variables incidental labels. The generator carries an ' +
        'Ability-neutral expression tree and its role metadata. The view selects the component it asks ' +
        'about; never put learner-facing highlighting or a selected question into the generator payload.'
    ),
    ...toImplementationTodos(
        '6.EE.A.2b-interpret-subexpressions',
        interpretSubexpressionsBuilder,
        algebraExpressionStructureImplementation,
        'Explain how a grouped expression is one complete input of the enclosing operation while retaining ' +
        'its inner structure, for example the sum (8+7) as one factor in 2(8+7), or x+2 in 3(x+2). ' +
        'GroupedExpression was removed; the expression kind plus GroupingSymbol and Operand express the ' +
        'observable composition. Do not add every primitive appearing incidentally in the expression.'
    ),
    ...toImplementationTodos(
        '6.EE.A.2c-evaluate-variable-expressions',
        evaluateVariableExpressionsBuilder,
        algebraExpressionStructureImplementation,
        'Given a variable expression or formula and admissible values, replace every relevant occurrence ' +
        'consistently and evaluate in conventional order. Include rational inputs, unparenthesized ' +
        'precedence and optional powers; contextual formula text must be necessary to identify values or ' +
        'the requested quantity. The generator enforces integer exponents >= 0; the IntegerExponent-only ' +
        'configuration includes exponent-zero examples with nonzero bases. PositiveExponent additionally ' +
        'requires n > 0. Omitting PositiveExponent does not itself label zero or nonnegativity. Do not ' +
        'constrain all numbers/base signs merely to constrain the exponent; exclude undefined 0^0 locally. ' +
        'A separate no-power alternative retains ordinary substitution examples. Whole-number powers are ' +
        'included within the competency rather than imposed on every instance. Formula evaluation does not ' +
        'automatically claim the geometry theorem behind a supplied formula.'
    ),
    ...toImplementationTodos(
        '6.EE.A.3-generate-equivalent-expressions',
        generateEquivalentExpressionsBuilder,
        algebraExpressionEquivalenceImplementation,
        'Produce an equivalent expression with a symbolic property witness. Distribution includes ' +
        'expansion and extraction of a common multiplier; term collection includes y+y+y=3y. Reordering or ' +
        'regrouping must preserve the expression for every admissible variable assignment. ' +
        'DistributingLinearCombinations and CollectingLinearTerms specialize LinearRewriting and therefore ' +
        'AlgebraicEquivalence; do not repeat the broad ancestor in these variants. For the other property ' +
        'variants, retain AlgebraicEquivalence explicitly because an arithmetic law does not inherit it. ' +
        'No new theorem family is required. The canonical payload supplies exact ' +
        'transformation/equivalence witnesses; the view chooses the requested rewrite.'
    ),
    ...toImplementationTodos(
        '6.EE.A.4-identify-equivalent-expressions',
        identifyEquivalentExpressionsBuilder,
        algebraExpressionEquivalenceImplementation,
        'Compare two expressions over an explicit common domain. Correct examples have a symbolic ' +
        'equivalence witness; incorrect examples have a valid counterexample or structural reason. ' +
        'Agreement at finitely many test values does not prove an identity. Do not add Equation merely ' +
        'because an equals sign appears in a worked witness; this competency concerns expression ' +
        'equivalence. Distinguish it from checking one candidate in B.5.'
    ),
    ...toImplementationTodos(
        '6.EE.B.5-check-substitution',
        checkSubstitutionBuilder,
        algebraStatementsImplementation,
        'Substitute a given candidate from a stated set, calculate the resulting values, and judge the ' +
        'relation\'s truth. The worked answer shows consistent substitution and truth, without claiming ' +
        'that one check determines the complete solution set.'
    ),
    ...toImplementationTodos(
        '6.EE.B.5-interpret-solution-process',
        interpretSolutionProcessBuilder,
        algebraStatementsImplementation,
        'A relation and a specified candidate set are supplied. Explain why the process selects precisely ' +
        'the candidates making the relation true, including empty or multiple matches where applicable. ' +
        'The supplied candidate domain is part of the mathematics and must be visible. This is meaning of ' +
        'solving, not a mandatory requirement to perform a particular transformation technique.'
    ),
    ...toImplementationTodos(
        '6.EE.B.6-interpret-variable-roles',
        interpretVariableRolesBuilder,
        algebraVariableMeaningImplementation,
        'Explain the stated role of a symbol in its context: one particular value to determine, or an ' +
        'arbitrary member of a named domain in a relationship valid for all such members. The domain and ' +
        'symbol meaning are visible or necessarily supplied by text. Use the precise role selected by the ' +
        'task. Do not label generic Algebra, and do not equate generalized variables with arbitrary ' +
        'function-argument occurrence.'
    ),
    ...toImplementationTodos(
        '6.EE.B.6-model-contextual-expression',
        modelContextualExpressionBuilder,
        algebraExpressionStructureImplementation,
        'Read a real-world or mathematical situation, choose the quantity represented by a letter and its ' +
        'admissible values, identify the needed relationship, and write the resulting expression. The ' +
        'situation must require extracting the relationship rather than merely translating an operation ' +
        'phrase. This resolves the former contextual-expression-modeling ontology package. ' +
        'AlgebraicModeling is available; do not propose QuantitativeSituation or another new ontology ' +
        'label. Keep this distinct from A.2a operation-phrase translation. No equivalence declaration is ' +
        'justified.'
    ),
    ...toImplementationTodos(
        '6.EE.B.7-model-and-solve-rational-equations',
        modelAndSolveRationalEquationsBuilder,
        algebraStatementsImplementation,
        'Read a mathematical or real-world quantitative problem, formulate x+p=q or px=q, and determine ' +
        'the complete solution in the stated nonnegative rational domain. The supplied quantities, ' +
        'equation and solution agree; integer, fraction and finite-decimal examples remain admissible. ' +
        'Routine px=q tasks may require p>0 locally while allowing x=0 or q=0; do not globally exclude ' +
        'zero. If a zero-coefficient relation is admitted, handle it faithfully without dividing by zero. ' +
        'Empty/full-domain classifications are a validity boundary, not an additional Grade 6 competency ' +
        'or an implementation-completion requirement. Equation describes formalization, EquationSolving ' +
        'the independent mathematical objective, and AlgebraicModeling the construction of the relation ' +
        'from quantities.'
    ),
    ...toImplementationTodos(
        '6.EE.B.8-graph-inequality-solutions',
        graphInequalitySolutionsBuilder,
        algebraStatementsImplementation,
        'Given x>c or x<c over the stated unrestricted domain, draw an open endpoint at c and a correctly ' +
        'directed ray on a scaled number line. The ray represents the whole solution set rather than a few ' +
        'satisfying points. GraphicalAlgebraicRepresentation identifies the solution-set representation.'
    ),
    ...toImplementationTodos(
        '6.EE.B.8-interpret-infinite-solutions',
        interpretInfiniteSolutionsBuilder,
        algebraStatementsImplementation,
        'Explain that x>c or x<c over an unrestricted rational or real domain has infinitely many ' +
        'satisfying values, excludes c, and has no last value in the indicated direction. Do not carry the ' +
        'infinity claim into a context with an explicitly finite candidate set or bounded discrete domain. ' +
        'The algebraic solution-set example must state its domain.'
    ),
    ...toImplementationTodos(
        '6.EE.B.8-model-strict-inequalities',
        modelStrictInequalitiesBuilder,
        algebraStatementsImplementation,
        'Read a condition, identify its quantity and boundary, and write the correct strict inequality. ' +
        'The problem\'s admissible domain remains explicit when it restricts values. NoExpressions means ' +
        'neither statement side is composite, not that a single variable ceases to be a mathematical ' +
        'expression.'
    ),
    ...toImplementationTodos(
        '6.EE.C.9-model-dependent-quantity',
        modelDependentQuantityBuilder,
        algebraCovariationImplementation,
        'The situation supplies two related changing quantities. Define their symbols and domains, ' +
        'identify the chosen input and corresponding output roles, and write the output quantity in terms ' +
        'of the input. Do not restrict all relationships to proportional motion merely because the source ' +
        'gives d=65t as an example. Each proposed model must remain within Grade 6 mathematics. ' +
        'IndependentVariable and DependentVariable identify explicitly elicited roles here; do not add ' +
        'them to unrelated expressions merely because ' +
        'variables occur.'
    ),
    ...toImplementationTodos(
        '6.EE.C.9-relate-equation-table-graph',
        relateEquationTableGraphBuilder,
        algebraCovariationImplementation,
        'Read an equation with a corresponding table and graph. Identify independent/dependent roles and ' +
        'explain how the same input/output relationship appears in all representations, including ' +
        'correspondence between table entries and plotted points. This is not a request for unrestricted ' +
        'function theory or function notation such as f(x).'
    ),
    ...toImplementationTodos(
        '6.EE.C.9-tabulate-and-graph-covariation',
        tabulateAndGraphCovariationBuilder,
        algebraCovariationImplementation,
        'From a contextual equation, form corresponding input/output values in a table and plot the ' +
        'resulting ordered pairs on meaningfully labeled axes with units. Both table and graph retain the ' +
        'same relationship. Use algebraic table/graph representation scopes instead of a data-table claim ' +
        'for a functional relationship. The given equation\'s syntax is used to construct corresponding ' +
        'values; Equation is therefore necessary content rather than incidental decoration.'
    ),

    // Geometry (6.G)
    ...toImplementationTodos(
        '6.G.A.1-polygon-area-dissection',
        polygonAreaDissectionBuilder,
        polygonAreaDissectionImplementation,
        'A measured polygon and a valid area-preserving composition or dissection expose all required ' +
        'lengths and square-unit area. The learner supplies the construction/decomposition and ' +
        'calculation; story versions require the text to identify relevant dimensions or the requested ' +
        'area. Preserve correlated shape/method profiles. The general polygon configuration includes ' +
        'nontrivial polygons beyond the named triangle/quadrilateral profiles, including concave cases; no ' +
        'supported rectilinear-only slice becomes active.'
    ),
    ...toImplementationTodos(
        '6.G.A.2-fractional-cube-packing',
        fractionalCubePackingBuilder,
        fractionalPrismVolumeImplementation,
        'Fractional edge lengths, a stated unit-fraction cube edge, and visible layer/row information ' +
        'establish exact packing. Cube count is multiplied by cube volume in the original cubic unit. A ' +
        'cube with edge 1/n has volume 1/n^3. Fractional edge lengths alone do not identify the required ' +
        'cube scale.'
    ),
    ...toImplementationTodos(
        '6.G.A.2-fractional-packing-product-connection',
        fractionalPackingProductConnectionBuilder,
        fractionalPrismVolumeImplementation,
        'A packing model at the fractional unit scale and a written explanation/equation connect cube ' +
        'count times cube volume to l*w*h. The request explicitly elicits the equation and explanation; ' +
        'printing an incidental equals sign is not Equation knowledge.'
    ),
    ...toImplementationTodos(
        '6.G.A.2-fractional-prism-formulas',
        fractionalPrismFormulasBuilder,
        fractionalPrismVolumeImplementation,
        'Fractional edge lengths or base area/height are supplied. The learner writes the corresponding ' +
        'formula/substitution and computes exact volume with cubic units. Story text determines requested ' +
        'quantities. Retain l*w*h / B*h operand variants. Existing volume-product-model is an additional ' +
        'affected consumer to adopt if the common payload broadens, not an owner of this requested ' +
        'competency.'
    ),
    ...toImplementationTodos(
        '6.G.A.3-coordinate-polygon-construction',
        coordinatePolygonConstructionBuilder,
        coordinatePlaneProblemsImplementation,
        'Given ordered vertex coordinates and scaled axes, construct the polygon by plotting and ' +
        'connecting successive vertices. Contextual versions require interpreting the coordinate ' +
        'description. Signed rational coordinates are admitted. Existing first-quadrant pattern plotting ' +
        'is not the complete competency.'
    ),
    ...toImplementationTodos(
        '6.G.A.3-coordinate-polygon-side-length',
        coordinatePolygonSideLengthBuilder,
        coordinatePlaneProblemsImplementation,
        'A polygon side has equal first or second endpoint coordinates. The learner uses the varying ' +
        'coordinates to find a nonnegative length; the solution exposes the subtraction/distance ' +
        'relationship. Only horizontal/vertical sides are required here; do not import arbitrary ' +
        'Euclidean-distance or Pythagorean requirements.'
    ),
    ...toImplementationTodos(
        '6.G.A.4-construct-solid-net',
        constructSolidNetBuilder,
        polyhedralNetsImplementation,
        'A depicted solid, its face dimensions and adjacency information let the learner draw a connected ' +
        'planar net. The solution preserves each face and shared edge and folds to the specified solid ' +
        'without face overlap. Contextual variants use necessary task text. Rectangular prisms, triangular ' +
        'prisms and pyramids with triangle/rectangle faces supply the profiles. The Prism+Triangle profile ' +
        'specifically constrains triangular bases and rectangular lateral faces; the Pyramid profile ' +
        'constrains triangular or rectangular bases. GeometricNet is a Scope; no physical folding or ' +
        'cutting is required in the image task.'
    ),
    ...toImplementationTodos(
        '6.G.A.4-net-surface-area',
        netSurfaceAreaBuilder,
        polyhedralNetsImplementation,
        'A complete rectangle/triangle net exposes every face and enough dimensions for its area. The ' +
        'learner counts every external face exactly once and reports total square-unit area; story text is ' +
        'needed in contextual versions. Retain the same solid profiles as net construction. Triangle ' +
        'heights, not merely side lengths, must be supplied when necessary. Do not use Foldable as a ' +
        'substitute for the net representation.'
    ),

    // Statistics and Probability (6.SP)
    ...toImplementationTodos(
        '6.SP.A.1-classify-statistical-questions',
        classifyStatisticalQuestionsBuilder,
        statisticalQuestionRecognitionImplementation,
        'Candidate questions contrast an individual fixed observation with a collection/process whose ' +
        'answers vary. The learner classifies questions by anticipated variability; the solution states ' +
        'the relevant observations and variability. A statistical question need not already have collected ' +
        'data. The generator supplies structured investigation/candidate-question meaning, not the learner ' +
        'instruction or requested answer.'
    ),
    ...toImplementationTodos(
        '6.SP.A.2-describe-distribution',
        describeDistributionBuilder,
        numericalDistributionInterpretationImplementation,
        'A contextual numerical data collection and its display expose frequencies, overall shape, and ' +
        'supplied or derivable center/spread summaries. The learner explains what the center and spread ' +
        'say about the data and describes symmetry/skewness, peaks, gaps or clusters as appropriate. The ' +
        'correlated mean/MAD and median/IQR profiles keep center and spread observable. This competency ' +
        'concerns their joint interpretation; it does not require a new generic DistributionCenter or ' +
        'StatisticalMeasureSelection Area.'
    ),
    ...toImplementationTodos(
        '6.SP.A.3-interpret-center-summary',
        interpretCenterSummaryBuilder,
        statisticalSummaryMeaningImplementation,
        'A data set and its mean or median are shown. The learner explains how the single center value ' +
        'summarizes the set, distinguishing a typical/central value from the number of observations and ' +
        'from spread. Use conceptual comparisons such as data sets sharing a center but differing in ' +
        'spread. Merely calculating a mean or median does not meet this task.'
    ),
    ...toImplementationTodos(
        '6.SP.A.3-interpret-variation-summary',
        interpretVariationSummaryBuilder,
        statisticalSummaryMeaningImplementation,
        'Data with a supplied IQR or MAD let the learner explain what that one number says about ' +
        'variability, contrasting sets with the same center but different spread where useful. IQR and MAD ' +
        'have different meanings and must be explained accurately; the prompt must elicit interpretation ' +
        'rather than only calculation.'
    ),
    ...toImplementationTodos(
        '6.SP.B.4-construct-numerical-distribution-plot',
        constructNumericalDistributionPlotBuilder,
        numericalDistributionPlotsImplementation,
        'A numerical data set and the requested display convention are supplied. The learner constructs ' +
        'the plot with a numerical axis, accurate frequencies or quartiles, and appropriate units. A ' +
        'histogram states bins; a box plot states the finite-data quartile/whisker convention. One whole ' +
        'competency retains all three representations. Use FrequencyDistribution for dot plots/histograms ' +
        'and Quartile+Median for box plots, avoiding a frequency-only mathematical claim on a box plot. ' +
        'Equal-width histogram bins suffice at this grade; no density or outlier-fence rule is imposed.'
    ),
    ...toImplementationTodos(
        '6.SP.B.5a-observation-count',
        observationCountBuilder,
        numericalDataContextSummaryImplementation,
        'Individual observation records are visible, including repeated equal values. The learner reports ' +
        'record count, not distinct-value count or the sum of observed values. StatisticalSample replaces ' +
        'organizational Statistics; collection membership and observation multiplicity must be visible. ' +
        'QuantityMeasurement refers to counting observations, not their measured values.'
    ),
    ...toImplementationTodos(
        '6.SP.B.5b-data-attribute-description',
        dataAttributeDescriptionBuilder,
        numericalDataContextSummaryImplementation,
        'A study description and data table identify the observational units, recorded characteristic, how ' +
        'it was measured, and its measurement units. The learner describes those supplied facts. Do not ' +
        'add MeasurementScale merely for naming centimetres: that Area concerns ' +
        'nominal/ordinal/interval/ratio scales. UnitDimensionality likewise requires dimensional ' +
        'composition, not incidental unit names.'
    ),
    ...toImplementationTodos(
        '6.SP.B.5c-compute-contextual-center',
        computeContextualCenterBuilder,
        numericalDataSummariesImplementation,
        'A contextual numerical data set is supplied. The learner computes the requested mean or median ' +
        'and states its meaning in the recorded attribute units, with a sorted-data or sum/count witness ' +
        'in the solution. Retain both odd and even observation counts for median; the central pair must be ' +
        'averaged for even counts. Contextual meaning is a required output, not a decorative story.'
    ),
    ...toImplementationTodos(
        '6.SP.B.5c-compute-contextual-variation',
        computeContextualVariationBuilder,
        numericalDataSummariesImplementation,
        'The learner computes the requested variability measure and explains its meaning in the data ' +
        'context and units. IQR uses stated consistent quartile conventions; MAD uses deviations from the ' +
        'arithmetic mean and retains multiplicity. Do not replace MAD by the mean signed deviation or ' +
        'deviations from the median. Do not require a 1.5-IQR outlier rule.'
    ),
    ...toImplementationTodos(
        '6.SP.B.5c-describe-contextual-patterns',
        describeContextualPatternsBuilder,
        numericalDistributionInterpretationImplementation,
        'A contextual data display has an overall pattern and a defensible striking deviation. The learner ' +
        'describes both with reference to the recorded attribute and units; the solution explains why the ' +
        'departure is striking in the given context. Use a contextual criterion for unusual observations. ' +
        'The example in StatisticalOutlier mentioning an IQR fence does not make that rule compulsory.'
    ),
    ...toImplementationTodos(
        '6.SP.B.5d-select-contextual-summaries',
        selectContextualSummariesBuilder,
        statisticalSummarySelectionImplementation,
        'A contextual distribution and candidate summaries permit the learner to choose and justify ' +
        'appropriate center/spread measures using shape, sensitivity to unusual values, and the question ' +
        'being answered. The artifact makes the compared measures available and elicits their suitability. ' +
        'ProcedureApplicability expresses the suitability judgment. The joint statistical concepts change ' +
        'meaning through the visible comparison, without inventing StatisticalMeasureSelection. Avoid ' +
        'treating median/IQR as universally correct for every context or mean/MAD as forbidden when ' +
        'skewed.'
    )
];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [];

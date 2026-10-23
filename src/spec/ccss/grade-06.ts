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
    ...toTargets('6.NS.C.6c-rational-numberline-reading', rationalNumberlineReadingBuilder),
    ...toTargets('6.NS.C.7a-inequality-line-interpretation', inequalityLineInterpretationBuilder),
    ...toTargets('6.NS.C.7b-contextual-order-explanation', contextualOrderExplanationBuilder),
    ...toTargets('6.NS.C.7b-contextual-order-writing', contextualOrderWritingBuilder),
    ...toTargets('6.NS.C.7c-absolute-value-distance', absoluteValueDistanceBuilder),
    ...toTargets('6.NS.C.7c-contextual-absolute-value', contextualAbsoluteValueBuilder),
    ...toTargets('6.NS.C.7d-order-versus-magnitude', orderVersusMagnitudeBuilder),
    ...toTargets('6.NS.C.8-axis-aligned-coordinate-distance', axisAlignedCoordinateDistanceBuilder),
    ...toTargets('6.NS.C.8-coordinate-plane-problems', coordinatePlaneProblemsBuilder),
    ...toTargets('6.G.A.3-coordinate-polygon-construction', coordinatePolygonConstructionBuilder),
    ...toTargets('6.G.A.3-coordinate-polygon-side-length', coordinatePolygonSideLengthBuilder),
    ...toTargets('6.EE.A.1-evaluate-power-expressions', evaluatePowerExpressionsBuilder),
    ...toTargets('6.EE.A.1-write-power-expressions', writePowerExpressionsBuilder),
    ...toTargets('6.EE.A.2a-write-letter-expressions', writeLetterExpressionsBuilder),
    ...toTargets('6.EE.A.2b-identify-expression-parts', identifyExpressionPartsBuilder),
    ...toTargets('6.EE.A.2b-interpret-subexpressions', interpretSubexpressionsBuilder),
    ...toTargets('6.EE.A.2c-evaluate-variable-expressions', evaluateVariableExpressionsBuilder),
    ...toTargets('6.EE.B.6-model-contextual-expression', modelContextualExpressionBuilder),
    ...toTargets('6.EE.A.3-generate-equivalent-expressions', generateEquivalentExpressionsBuilder),
    ...toTargets('6.EE.A.4-identify-equivalent-expressions', identifyEquivalentExpressionsBuilder),
    ...toTargets('6.EE.B.5-check-substitution', checkSubstitutionBuilder),
    ...toTargets('6.EE.B.5-interpret-solution-process', interpretSolutionProcessBuilder),
    ...toTargets('6.EE.B.7-model-and-solve-rational-equations', modelAndSolveRationalEquationsBuilder),
    ...toTargets('6.EE.B.8-graph-inequality-solutions', graphInequalitySolutionsBuilder),
    ...toTargets('6.EE.B.8-interpret-infinite-solutions', interpretInfiniteSolutionsBuilder),
    ...toTargets('6.EE.B.8-model-strict-inequalities', modelStrictInequalitiesBuilder),
    ...toTargets('6.EE.B.6-interpret-variable-roles', interpretVariableRolesBuilder),
    ...toTargets('6.EE.C.9-model-dependent-quantity', modelDependentQuantityBuilder),
    ...toTargets('6.EE.C.9-relate-equation-table-graph', relateEquationTableGraphBuilder),
    ...toTargets('6.EE.C.9-tabulate-and-graph-covariation', tabulateAndGraphCovariationBuilder),
    ...toTargets('6.G.A.1-polygon-area-dissection', polygonAreaDissectionBuilder),
    ...toTargets('6.G.A.2-fractional-cube-packing', fractionalCubePackingBuilder),
    ...toTargets('6.G.A.2-fractional-packing-product-connection', fractionalPackingProductConnectionBuilder),
    ...toTargets('6.G.A.2-fractional-prism-formulas', fractionalPrismFormulasBuilder),
    ...toTargets('6.G.A.4-construct-solid-net', constructSolidNetBuilder),
    ...toTargets('6.G.A.4-net-surface-area', netSurfaceAreaBuilder),
    ...toTargets('6.SP.A.1-classify-statistical-questions', classifyStatisticalQuestionsBuilder),
    ...toTargets('6.SP.A.2-describe-distribution', describeDistributionBuilder),
    ...toTargets('6.SP.B.5c-describe-contextual-patterns', describeContextualPatternsBuilder),
    ...toTargets('6.SP.A.3-interpret-center-summary', interpretCenterSummaryBuilder),
    ...toTargets('6.SP.A.3-interpret-variation-summary', interpretVariationSummaryBuilder),
    ...toTargets('6.SP.B.4-construct-numerical-distribution-plot', constructNumericalDistributionPlotBuilder),
    ...toTargets('6.SP.B.5a-observation-count', observationCountBuilder),
    ...toTargets('6.SP.B.5b-data-attribute-description', dataAttributeDescriptionBuilder),
    ...toTargets('6.SP.B.5c-compute-contextual-center', computeContextualCenterBuilder),
    ...toTargets('6.SP.B.5c-compute-contextual-variation', computeContextualVariationBuilder)
];

export const implementationTodos: ImplementationTodo[] = [
    // Expressions and Equations (6.EE)

    // Geometry (6.G)

    // Statistics and Probability (6.SP)
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

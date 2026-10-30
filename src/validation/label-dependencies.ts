import {Area, Scope} from 'edugraph-ts/generated';
import type {LabelDependencyGraph} from '../types/label-dependencies.ts';

/** Repo-local assessment obligations. Grouping roots never become annotations. */
export const labelDependencies = {
    version: 1,
    context: {
        allAreasWithin: [Area.Arithmetic, Area.IntuitiveMathematics, Area.FormalMathematics],
        requireArea: true
    },
    facets: {
        numeric: {root: Scope.NumericAbstraction},
        numberKind: {root: Scope.NumericSpace},
        numeralSystem: {root: Scope.Numerals},
        // These representations establish place values; a digit repertoire alone does not.
        positionalRepresentation: {labels: [Scope.RodNumerals, Scope.BaseTenBlocks, Scope.ScientificExponentNotation]},
        base: {root: Scope.NumericBase},
        range: {root: Scope.NumericRange, check: 'presence-only'},
        sign: {root: Scope.NumericSign},
        zero: {root: Scope.NumericZero},
        operandCount: {root: Scope.OperandCardinality},
        // Role-group nodes are organizational; only actual width descriptors satisfy this facet.
        operandDigits: {labels: [Scope.SingleDigitSmallestOperand, Scope.MultipleDigitSmallestOperand,
            Scope.SingleDigitLargestOperand, Scope.MultipleDigitLargestOperand,
            Scope.SingleDigitDividend, Scope.MultipleDigitDividend,
            Scope.SingleDigitDivisor, Scope.MultipleDigitDivisor]},
        fraction: {root: Scope.FractionNumbers},
        fractionMagnitude: {labels: [Scope.ProperFractions, Scope.ImproperFractions]},
        decimal: {root: Scope.DecimalNumbers},
        referenceFrames: {root: Scope.ReferenceFrameComplexity}
    },
    rules: [
        {id: 'LD-NUM-01', when: {any: [{family: 'numeric'}, {family: 'numeralSystem'},
            {family: 'operandCount'}, {family: 'operandDigits'}]},
            assess: ['numberKind', 'range', 'sign', 'zero']},
        {id: 'LD-POSITIONAL-01', when: {any: [
            {family: 'positionalRepresentation'}, {areaWithin: Area.PlaceValue}, {areaWithin: Area.DecimalNotation}
        ]}, assess: ['base']},
        {id: 'LD-OPERANDS-01', when: {any: [{family: 'operandCount'}, {family: 'operandDigits'}]},
            assess: ['operandCount']},
        {id: 'LD-OPERANDS-02', when: {all: [
            {any: [{areaWithin: Area.ArithmeticOperations}, {areaWithin: Area.IntegerArithmetic}]},
            {familyWithin: {family: 'numberKind', root: Scope.IntegerNumbers, ignore: [Scope.DecimalNumbers]}},
            {any: [{family: 'operandCount'}, {family: 'operandDigits'}]}
        ]}, assess: ['operandDigits']},
        {id: 'LD-FRACTION-01', when: {family: 'fraction'}, assess: ['fractionMagnitude']},
        {id: 'LD-DECIMAL-01', when: {family: 'decimal'}, assess: ['base']}
    ],
    conflicts: [
        {id: 'LD-ZERO-CONFLICT-01', facet: 'zero', labels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]},
        {id: 'LD-SIGN-CONFLICT-01', facet: 'sign', labels: [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives]},
        {id: 'LD-FRAME-CONFLICT-01', facet: 'referenceFrames',
            labels: [Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]}
    ],
    exclusions: [
        {id: 'LD-ALGEBRA-POLARITY-01', when: {any: [
            {areaWithin: Area.AlgebraicExpression},
            {areaWithin: {root: Area.Algebra, ignore: [Area.Arithmetic]}}
        ]}, facets: ['sign', 'zero']}
    ]
} as const satisfies LabelDependencyGraph;

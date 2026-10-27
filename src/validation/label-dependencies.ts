import {Ability, Area, Scope} from 'edugraph-ts/generated';
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
        base: {root: Scope.NumericBase},
        range: {root: Scope.NumericRange, check: 'presence-only'},
        sign: {root: Scope.NumericSign},
        zero: {root: Scope.NumericZero},
        operandCount: {root: Scope.OperandCardinality},
        operandDigits: {root: Scope.OperandDigitCount},
        fraction: {root: Scope.FractionNumbers},
        fractionMagnitude: {labels: [Scope.ProperFractions, Scope.ImproperFractions]},
        fractionUnit: {labels: [Scope.UnitFractions, Scope.NonUnitFractions]},
        decimal: {root: Scope.DecimalNumbers},
        decimalPrecision: {labels: [Scope.TenthDecimals, Scope.HundredthDecimals, Scope.ThousandthDecimals]},
        referenceFrames: {root: Scope.ReferenceFrameComplexity},
        articulation: {labels: [Ability.TextualArticulation]}
    },
    rules: [
        {id: 'LD-NUM-01', when: {any: [{family: 'numeric'}, {family: 'numeralSystem'},
            {family: 'operandCount'}, {family: 'operandDigits'}, {evidence: 'numericTask'}]},
            assess: ['numberKind', 'numeralSystem', 'base', 'range', 'sign', 'zero']},
        {id: 'LD-OPERANDS-01', when: {any: [{family: 'operandCount'}, {family: 'operandDigits'},
            {evidence: 'arithmeticOperands'}]}, assess: ['operandCount', 'operandDigits']},
        {id: 'LD-FRACTION-01', when: {any: [{family: 'fraction'}, {evidence: 'fractionValues'}]},
            assess: ['fractionMagnitude']},
        // Unit/nonunit labels do not cover zero, negative, or all improper fractions.
        {id: 'LD-FRACTION-UNIT-01', when: {evidence: 'fractionValues'}, assess: ['fractionUnit']},
        {id: 'LD-DECIMAL-01', when: {any: [{family: 'decimal'}, {evidence: 'decimalRepresentation'}]},
            assess: ['base']},
        // The current precision catalog stops at thousandths; DecimalNumbers does not.
        {id: 'LD-DECIMAL-PRECISION-01', when: {evidence: 'decimalRepresentation'}, assess: ['decimalPrecision']},
        {id: 'LD-FRAME-01', when: {evidence: 'quantityReferenceFrames'}, assess: ['referenceFrames']},
        {id: 'LD-EXPLAIN-01', when: {evidence: 'writtenExplanation'}, assess: ['articulation']}
    ],
    conflicts: [
        {id: 'LD-ZERO-CONFLICT-01', facet: 'zero', labels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]},
        {id: 'LD-SIGN-CONFLICT-01', facet: 'sign', labels: [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives]},
        {id: 'LD-FRAME-CONFLICT-01', facet: 'referenceFrames',
            labels: [Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]}
    ]
} as const satisfies LabelDependencyGraph;

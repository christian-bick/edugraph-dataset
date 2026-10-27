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
        base: {root: Scope.NumericBase},
        range: {root: Scope.NumericRange, check: 'presence-only'},
        sign: {root: Scope.NumericSign},
        zero: {root: Scope.NumericZero},
        operandCount: {root: Scope.OperandCardinality},
        operandDigits: {root: Scope.OperandDigitCount},
        fraction: {root: Scope.FractionNumbers},
        fractionMagnitude: {labels: [Scope.ProperFractions, Scope.ImproperFractions]},
        decimal: {root: Scope.DecimalNumbers},
        referenceFrames: {root: Scope.ReferenceFrameComplexity}
    },
    rules: [
        {id: 'LD-NUM-01', when: {any: [{family: 'numeric'}, {family: 'numeralSystem'},
            {family: 'operandCount'}, {family: 'operandDigits'}]},
            assess: ['numberKind', 'numeralSystem', 'base', 'range', 'sign', 'zero']},
        {id: 'LD-OPERANDS-01', when: {any: [{family: 'operandCount'}, {family: 'operandDigits'}]},
            assess: ['operandCount', 'operandDigits']},
        {id: 'LD-FRACTION-01', when: {family: 'fraction'}, assess: ['fractionMagnitude']},
        {id: 'LD-DECIMAL-01', when: {family: 'decimal'}, assess: ['base']}
    ],
    conflicts: [
        {id: 'LD-ZERO-CONFLICT-01', facet: 'zero', labels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]},
        {id: 'LD-SIGN-CONFLICT-01', facet: 'sign', labels: [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives]},
        {id: 'LD-FRAME-CONFLICT-01', facet: 'referenceFrames',
            labels: [Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]}
    ]
} as const satisfies LabelDependencyGraph;

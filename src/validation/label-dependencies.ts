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
        {id: 'LD-NUM-01', when: {any: [{family: 'numeric'}, {evidence: 'numericTask'}]},
            assess: ['numberKind', 'numeralSystem', 'base', 'range', 'sign', 'zero']},
        {id: 'LD-OPERANDS-01', when: {evidence: 'arithmeticOperands'}, assess: ['operandCount', 'operandDigits']},
        {id: 'LD-FRACTION-01', when: {any: [{family: 'fraction'}, {evidence: 'fractionValues'}]},
            assess: ['fractionMagnitude', 'fractionUnit']},
        {id: 'LD-DECIMAL-01', when: {any: [{family: 'decimal'}, {evidence: 'decimalRepresentation'}]},
            assess: ['base', 'decimalPrecision']},
        {id: 'LD-FRAME-01', when: {evidence: 'quantityReferenceFrames'}, assess: ['referenceFrames']},
        {id: 'LD-EXPLAIN-01', when: {evidence: 'writtenExplanation'}, assess: ['articulation']}
    ]
} as const satisfies LabelDependencyGraph;

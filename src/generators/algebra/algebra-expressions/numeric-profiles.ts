import {Area, Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {AlgebraicScalar, ArithmeticOperation} from '../../../types/problems.ts';

export const numericProfileBundles = [
    [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
    [Scope.NumbersWithoutNegatives, Scope.NumbersWithZero],
    [Scope.NumbersWithNegatives, Scope.NumbersWithoutZero],
    [Scope.NumbersWithNegatives, Scope.NumbersWithZero]
] as const;
export type AlgebraNumericProfile = 0 | 1 | 2 | 3 | 4;
export const numericProfileLabels = [...new Set(numericProfileBundles.flat())];
export const numericProfileChoices = [[], ...numericProfileBundles] as const;
export const numericContextLabels = [Area.ArithmeticExpression, Area.AlgebraicExpression, Scope.RationalNumbers,
    Area.Term, Area.Factor, Area.Coefficient, Area.Addition, Area.Multiplication, Area.Division,
    Area.GroupingSymbol, Area.Operand, Area.NumericSubstitution, Area.AlgebraicModeling] as const;

/** Generic polarity claims belong only to fully numeric structural frames. */
export function allowedNumericProfiles(selected: (label: string) => boolean): readonly AlgebraNumericProfile[] {
    if (!numericContextLabels.some(selected)) return [0, 1, 2, 3, 4];
    if (selected(Area.AlgebraicExpression) || selected(Area.NumericSubstitution) || selected(Area.AlgebraicModeling)) return [0];
    if (selected(Area.ArithmeticExpression)) return selected(Area.Term) ? [2, 3]
        : selected(Area.Division) ? [1, 3] : [1, 2, 3];
    return [0];
}

/** Decode numeric-frame claims; the empty bundle leaves algebra outside classification. */
export function numericProfileForLabels(selected: (label: string) => boolean): AlgebraNumericProfile | undefined {
    const chosen = numericProfileLabels.filter(selected);
    const index = numericProfileBundles.findIndex(bundle => bundle.length === chosen.length
        && bundle.every(label => chosen.includes(label)));
    const profile = chosen.length ? index < 0 ? undefined : (index + 1) as AlgebraNumericProfile : 0;
    return profile !== undefined && allowedNumericProfiles(selected).includes(profile)
        ? profile : undefined;
}

export const resolveNumericProfile = withLabelChoices(exactResolver((labels: string[]) =>
    numericProfileForLabels(label => labels.includes(label))), {kind: 'alternatives', alternatives: numericProfileChoices,
    contextLabels: numericContextLabels, resolvedContext: true});

export interface ExpressionInputs {
    a: number;
    b: number;
    c: number;
    input: AlgebraicScalar;
    operation?: ArithmeticOperation;
}

/** Classify displayed literals and complete signed terms, never unused evaluation subtotals. */
export function inputsMeetNumericProfile(relation: string, inputs: ExpressionInputs, profile: AlgebraNumericProfile): boolean {
    if (profile === 0) return true;
    // The writer displays the rational domain; its quotient additionally excludes zero.
    if (relation === 'plain') return profile === (inputs.operation === 'division' ? 3 : 4);
    const {a, b, c} = inputs;
    let {numerator: n} = inputs.input;
    if (relation === 'numeric-quotient' && n === 0) n = -1;
    // Denominators and the declared coefficients are positive. For terms, the
    // complete second signed component is -b*q even when every literal is positive.
    const values = relation === 'numeric-terms' ? [a, b, c, n, a * n, -b * n]
        : relation === 'numeric-sum' || relation === 'numeric-quotient' ? [a, n] : [a, b, n];
    return values.some(value => value < 0) === (profile > 2)
        && values.some(value => value === 0) === (profile % 2 === 0);
}

export function profilesForRelation(relation: string): readonly AlgebraNumericProfile[] {
    // The public writer resolves 0. Retain the two existing conditional configs
    // for direct mathematical replay; neither exports a polarity annotation.
    return relation === 'plain' ? [0, 3, 4] : relation === 'numeric-terms' ? [2, 3]
        : relation === 'numeric-quotient' ? [1, 3] : relation.startsWith('numeric-') ? [1, 2, 3] : [0];
}

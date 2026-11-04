import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';
import type {ArithmeticProblem} from '../../../types/problems.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export type BoxedEquationShape = 'one-side' | 'both-sides';
export type VerticalEquationPresentation = 'vertical' | 'law-one-side' | 'law-both-sides';

const laws = [Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw];
const one = Scope.ExpressionOnOneSide;
const both = Scope.ExpressionOnBothSides;
const equation = Area.Equation;
const lawDependencies = laws.map(label => ({scope: 'generator' as const, label}));

export const boxedEquationShapeLabels = [one, both];
const boxedShape = selectExactLabelMap([
    [one, 'one-side'], [both, 'both-sides']
] as const);
const lawShape = selectExactLabelMap([
    [Area.CommutativeLaw, 'one-side'], [Area.AssociativeLaw, 'one-side'], [Area.DistributiveLaw, 'both-sides']
] as const);
export const resolveBoxedEquationShape = withLabelChoices(exactResolver<BoxedEquationShape | undefined>(labels => {
    const selected = boxedShape(labels);
    const required = lawShape(labels);
    if (required !== undefined && selected !== required) return undefined;
    return selected ?? 'one-side';
}), {
    kind: 'alternatives', alternatives: [[one], [both]], contextLabels: laws,
    defaults: [
        {whenAll: [Area.DistributiveLaw], labels: [both]},
        {whenAll: [Area.CommutativeLaw], labels: [one]},
        {whenAll: [Area.AssociativeLaw], labels: [one]}
    ]
});

/** The distributive witness necessarily compares two composite expressions. */
export const boxedEquationShapeRule: ViewCompatibilityRule = {
    id: 'boxed-equation-shape',
    dependencies: [...lawDependencies, {scope: 'view', label: one}, {scope: 'view', label: both}],
    predicate: labels => labels.has('generator', Area.DistributiveLaw)
        ? labels.exact('view', both) && !labels.exact('view', one)
        : labels.exact('view', one) && !labels.exact('view', both)
};

const presentations = [
    [[], 'vertical'],
    [[equation, one], 'law-one-side'],
    [[equation, both], 'law-both-sides']
] as const;
export const verticalEquationPresentationLabels = [equation, one, both];
const presentation = selectExactLabelSetMap(presentations);
const lawFormat = selectExactLabelMap([
    [Area.CommutativeLaw, 'law-one-side'], [Area.AssociativeLaw, 'law-one-side'],
    [Area.DistributiveLaw, 'law-both-sides']
] as const);
export const resolveVerticalEquationPresentation = withLabelChoices(exactResolver<VerticalEquationPresentation | undefined>(labels => {
    const required = lawFormat(labels);
    if ([equation, one, both].some(label => labels.includes(label))) {
        const selected = presentation(labels);
        return required !== undefined && selected !== required ? undefined : selected;
    }
    return required === undefined ? 'vertical' : undefined;
}), {
    kind: 'alternatives', alternatives: presentations.map(([labels]) => labels), contextLabels: laws,
    defaults: [
        {whenAll: [Area.DistributiveLaw], labels: [equation, both]},
        {whenAll: [Area.CommutativeLaw], labels: [equation, one]},
        {whenAll: [Area.AssociativeLaw], labels: [equation, one]}
    ]
});

/** Select the existing projection before generation, using semantic law capabilities. */
export const verticalEquationPresentationRule: ViewCompatibilityRule = {
    id: 'vertical-equation-presentation',
    dependencies: [...lawDependencies, {scope: 'view', label: equation},
        {scope: 'view', label: one}, {scope: 'view', label: both}],
    predicate: labels => {
        const selected = laws.filter(label => labels.has('generator', label));
        if (selected.length === 0) {
            return !labels.exact('view', equation) && !labels.exact('view', one) && !labels.exact('view', both);
        }
        if (selected.length !== 1 || !labels.exact('view', equation)) return false;
        return selected[0] === Area.DistributiveLaw
            ? labels.exact('view', both) && !labels.exact('view', one)
            : labels.exact('view', one) && !labels.exact('view', both);
    }
};

function lawPresentation(data: ArithmeticProblem): VerticalEquationPresentation {
    if (data.propertyLaw === undefined) return 'vertical';
    if (data.propertyLaw === 'distributive') return 'law-both-sides';
    if (data.propertyLaw === 'commutative' || data.propertyLaw === 'associative') return 'law-one-side';
    throw new ViewValidationError('arithmetic-equation-presentation', 'Unsupported arithmetic property law.');
}

export function validateBoxedEquationShape(data: ArithmeticProblem, shape: BoxedEquationShape | undefined): void {
    const expected = lawPresentation(data) === 'law-both-sides' ? 'both-sides' : 'one-side';
    if (shape !== expected) {
        throw new ViewValidationError('operations-boxes', 'The prepared equation shape must agree with its mathematical witness.');
    }
}

export function validateVerticalEquationPresentation(
    data: ArithmeticProblem, presentation: VerticalEquationPresentation | undefined
): void {
    if (presentation !== lawPresentation(data)) {
        throw new ViewValidationError('operations-vertical', 'The prepared presentation must agree with its mathematical witness.');
    }
}

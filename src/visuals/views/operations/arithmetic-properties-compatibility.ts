import {Scope} from 'edugraph-ts';
import {ViewCompatibilityRule} from '../../../types/compatibility.ts';

const supportedUpperBounds = [
    Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100
];

export const arithmeticPropertiesDisplayCapacity: ViewCompatibilityRule = {
    id: 'arithmetic-properties-display-capacity',
    description: 'Property equations display whole-number operands and results through 100.',
    dependencies: supportedUpperBounds.map(label => ({scope: 'generator', label})),
    predicate: labels => supportedUpperBounds.some(label => labels.exact('generator', label))
};

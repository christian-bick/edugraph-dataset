import {Area, Scope} from 'edugraph-ts';

export type ParityConstraint = 'even' | 'odd' | 'any';

export function resolveParityConstraint(labels: string[]): ParityConstraint {
    const requiresEven = labels.includes(Area.EvenDivisibility)
        || labels.includes(Scope.EvenNumbers);
    const requiresOdd = labels.includes(Area.UnevenDivisibility)
        || labels.includes(Scope.OddNumbers);

    if (requiresEven && requiresOdd) {
        throw new Error('Parity labels cannot require both even and odd values.');
    }
    if (requiresEven) return 'even';
    if (requiresOdd) return 'odd';
    return 'any';
}

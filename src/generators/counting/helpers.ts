import {Scope} from 'edugraph-ts';

export type ParityConstraint = 'even' | 'odd' | 'any';

export function resolveParityConstraint(labels: string[]): ParityConstraint {
    if (labels.includes(Scope.EvenNumbers)) return 'even';
    if (labels.includes(Scope.OddNumbers)) return 'odd';
    return 'any';
}

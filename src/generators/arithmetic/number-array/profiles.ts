import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {NumberArrayProblem} from '../../../types/problems.ts';

export const arrayOperations = [
    [Area.Addition, 'addition'], [Area.Multiplication, 'multiplication'],
    [Area.PartitiveDivision, 'partitive-division'], [Area.QuotativeDivision, 'quotative-division']
] as const;
export interface ArrayNumericProfile {
    readonly range: CanonicalNumericRange;
    readonly smallestDigits: 1 | 2 | false;
    readonly largestDigits: 1 | 2 | false;
    readonly iterated: boolean;
}

export function arrayQuantities(data: NumberArrayProblem): number[] {
    return data.operation === 'addition' ? [...data.addends, data.total]
        : [data.groupCount, data.groupSize, data.total, data.answer];
}

export function arrayCandidates(operation: NumberArrayProblem['operation'], twoOperands: boolean,
    profile: ArrayNumericProfile): NumberArrayProblem[] {
    if (!['addition', 'multiplication', 'partitive-division', 'quotative-division'].includes(operation)) return [];
    // Preserve the original unspecified-cardinality contract. In particular, the ontology
    // has no five-operand descriptor for the five-row repeated-addition source domain.
    if (twoOperands !== Boolean(profile.smallestDigits)) return [];
    if (profile.iterated && (operation !== 'addition' || twoOperands)) return [];
    const binaryAddition = operation === 'addition' && twoOperands;
    const candidates: NumberArrayProblem[] = [];
    for (let rows = profile.iterated ? 3 : 2; rows <= (binaryAddition ? 2 : 5); rows++) {
        for (let columns = 2; columns <= (binaryAddition ? 20 : 5); columns++) {
            const total = rows * columns;
            const answer = operation === 'partitive-division' ? columns
                : operation === 'quotative-division' ? rows : total;
            const data: NumberArrayProblem = {operation, rows, columns, groupCount: rows,
                groupSize: columns, total, answer, addends: Array.from({length: rows}, () => columns)};
            const operands = operation === 'addition' ? data.addends
                : operation === 'multiplication' ? [rows, columns]
                : [total, operation === 'partitive-division' ? rows : columns];
            if (profile.smallestDigits && (Math.min(...operands) < 10 ? 1 : 2) !== profile.smallestDigits
                || profile.largestDigits && (Math.max(...operands) < 10 ? 1 : 2) !== profile.largestDigits
                || !hasCanonicalRangeWitness(arrayQuantities(data), profile.range)) continue;
            candidates.push(data);
        }
    }
    return candidates;
}

export const arrayProfiles = canonicalRangeProfiles.filter(({range}) => range.max <= 100)
    .flatMap(({labels, range}) => ([false, true] as const).flatMap(iterated =>
        ([[false, false], [1, 1], [1, 2], [2, 2]] as const).flatMap(([smallestDigits, largestDigits]) => {
            const profile: ArrayNumericProfile = {range, iterated, smallestDigits, largestDigits};
            if (!arrayOperations.some(([, operation]) => [false, true].some(two =>
                arrayCandidates(operation, two, profile).length))) return [];
            return [{profile, labels: [...labels, ...(smallestDigits ? [
                smallestDigits === 1 ? Scope.SingleDigitSmallestOperand : Scope.TwoDigitSmallestOperand,
                largestDigits === 1 ? Scope.SingleDigitLargestOperand : Scope.TwoDigitLargestOperand] : []),
                ...(iterated ? [Area.IteratedOperation] : [])]}];
        })));
export const arrayProfileChoices = arrayProfiles.map(({labels}) => labels);
export const arrayProfileLabels = [...new Set(arrayProfileChoices.flat())];
const arrayWidthLabels = [Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand,
    Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand];

/** A requested width belongs to this module's binary profiles; omitted arity/width stays generic. */
export const resolveArrayArity = withLabelChoices(exactResolver((labels: string[]): boolean | undefined => {
    if (labels.includes(Scope.TwoOperands)) return true;
    return arrayWidthLabels.some(label => labels.includes(label)) ? undefined : false;
}), {kind: 'alternatives', alternatives: [[], [Scope.TwoOperands]],
    defaults: [{whenNone: [Scope.TwoOperands, ...arrayWidthLabels], labels: []}],
    contextLabels: arrayWidthLabels});

export function arrayProfileFromSelection(selected: (label: string) => boolean): ArrayNumericProfile | undefined {
    const labels = arrayProfileLabels.filter(selected);
    return arrayProfiles.find(candidate => candidate.labels.length === labels.length
        && candidate.labels.every(selected))?.profile;
}

/** Context-free fallback validation is finite; resolved operation/arity then prove feasibility. */
export const resolveArrayProfile = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = arrayProfileFromSelection(label => labels.includes(label));
    if (!profile) return undefined;
    const operations = arrayOperations.filter(([label]) => labels.includes(label));
    if (operations.length === 0) return profile;
    return operations.length === 1 && arrayCandidates(operations[0][1], labels.includes(Scope.TwoOperands), profile).length
        ? profile : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: arrayProfileChoices,
    contextLabels: [...arrayOperations.map(([label]) => label), Scope.TwoOperands], resolvedContext: true});

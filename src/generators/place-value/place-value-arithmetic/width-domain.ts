import {random} from '../../../lib/random.ts';

export const exactPrimaryWidths = ['11', '21', '22', '31', '32', '33'] as const;
export type ExactPrimaryWidth = typeof exactPrimaryWidths[number];
// Unlabelled low-level controls retain the protected native sampler law.
// The schema always selects an exact width.
export type PrimaryWidth = 'legacy' | 'single' | 'multiple' | ExactPrimaryWidth;
export interface WidthDomain {
    readonly operation: 'addition' | 'subtraction';
    readonly minimum: number;
    readonly maximum: number;
    readonly regrouping: boolean;
    readonly zeroResult?: boolean;
    readonly coefficientZero?: boolean;
    readonly maximumAbove?: number;
    readonly multipleOf10Presence?: boolean;
}
interface PairRow {
    readonly first: number;
    readonly seconds: readonly number[];
    readonly weight: number;
}

/** Both primary operands, including a determined hidden operand, must be divisible by ten. */
export const matchesMultipleOf10Presence = (a: number, b: number, presence?: boolean): boolean =>
    presence === undefined || (a % 10 === 0 && b % 10 === 0) === presence;

const cache = new Map<string, readonly PairRow[]>();
export const hasPrimaryWidth = (a: number, b: number, width: PrimaryWidth): boolean => {
    if (width === 'legacy') return true;
    if (width === 'single' || width === 'multiple') return (Math.max(a, b) <= 9) === (width === 'single');
    return `${String(Math.max(a, b)).length}${String(Math.min(a, b)).length}` === width;
};

/** Restrict a row to the selected digit intervals before visiting any pairs. */
export function primaryWidthSecondInterval(
    first: number, width: PrimaryWidth, minimum: number, maximum: number
): readonly [number, number] | undefined {
    let lower = minimum, upper = maximum;
    if (width === 'single') {
        if (first > 9) return undefined;
        upper = Math.min(upper, 9);
    } else if (width === 'multiple') {
        if (first < 10) lower = Math.max(lower, 10);
    } else if (width !== 'legacy') {
        const largest = Number(width[0]), smallest = Number(width[1]);
        const largeLower = largest === 1 ? 0 : 10 ** (largest - 1), largeUpper = 10 ** largest - 1;
        const smallLower = smallest === 1 ? 0 : 10 ** (smallest - 1), smallUpper = 10 ** smallest - 1;
        if (first >= largeLower && first <= largeUpper) {
            lower = Math.max(lower, smallLower);
            upper = Math.min(upper, smallUpper);
        } else if (first >= smallLower && first <= smallUpper) {
            lower = Math.max(lower, largeLower);
            upper = Math.min(upper, largeUpper);
        } else return undefined;
    }
    return lower <= upper ? [lower, upper] : undefined;
}

/** All three consumers expose complete H/T/O counts outside positive whole-tens subtraction. */
export const hasCoefficientZero = (first: number, second: number, operation: WidthDomain['operation']): boolean =>
    [first, second, operation === 'addition' ? first + second : first - second]
        .some(value => Math.floor(value / 100) === 0 || Math.floor(value % 100 / 10) === 0 || value % 10 === 0);

/** Complete finite support with the original uniform-first/uniform-second proposal weights. */
export function primaryWidthRows(domain: WidthDomain, width: PrimaryWidth): readonly PairRow[] {
    const key = JSON.stringify([domain.operation, domain.minimum, domain.maximum, domain.regrouping,
        domain.zeroResult, domain.coefficientZero, domain.maximumAbove, domain.multipleOf10Presence, width]);
    const cached = cache.get(key);
    if (cached) return cached;
    const rows: PairRow[] = [];
    const {operation, minimum, maximum, regrouping} = domain;
    if (operation === 'subtraction' && domain.zeroResult) {
        if (!regrouping) for (let operand = minimum; operand <= maximum; operand++) {
            if (operand > (domain.maximumAbove ?? -1) && domain.coefficientZero !== false
                && matchesMultipleOf10Presence(operand, operand, domain.multipleOf10Presence) && hasPrimaryWidth(operand, operand, width)) rows.push({first: operand, seconds: [operand],
                weight: 1 / (maximum - minimum + 1)});
        }
        cache.set(key, rows);
        return rows;
    }
    const firstMinimum = operation === 'addition' ? minimum : minimum + 1;
    const firstMaximum = operation === 'addition' ? maximum - minimum : maximum;
    // These counts describe the original proposal, not its width-conditioned
    // support. Pruning must never renormalize a first/second denominator here.
    const firstCount = firstMaximum - firstMinimum + 1;
    const boundedFirstMaximum = width === 'single' ? Math.min(firstMaximum, 9)
        : width === 'legacy' || width === 'multiple' ? firstMaximum
            : Math.min(firstMaximum, 10 ** Number(width[0]) - 1);
    for (let first = firstMinimum; first <= boundedFirstMaximum; first++) {
        const secondMaximum = operation === 'addition' ? maximum - first : first - 1;
        const originalCount = secondMaximum - minimum + 1;
        const interval = primaryWidthSecondInterval(first, width, minimum, secondMaximum);
        if (!interval) continue;
        const seconds: number[] = [];
        for (let second = interval[0]; second <= interval[1]; second++) {
            if (!matchesMultipleOf10Presence(first, second, domain.multipleOf10Presence)) continue;
            if ((operation === 'addition' ? first + second : first) <= (domain.maximumAbove ?? -1)) continue;
            if (domain.coefficientZero !== undefined
                && hasCoefficientZero(first, second, operation) !== domain.coefficientZero) continue;
            if (operation === 'addition') {
                if ((first % 10 + second % 10 >= 10) !== regrouping) continue;
            } else {
                const borrow = first % 10 < second % 10;
                const leftTens = Math.floor(first % 100 / 10) - (borrow ? 1 : 0);
                if (borrow !== regrouping || leftTens < Math.floor(second % 100 / 10)
                    || Math.floor(first / 100) < Math.floor(second / 100)) continue;
            }
            seconds.push(second);
        }
        if (seconds.length) rows.push({first, seconds,
            weight: seconds.length / (firstCount * originalCount)});
    }
    cache.set(key, rows);
    return rows;
}

/** Conditioning removes rejected proposals without changing relative accepted-pair probabilities. */
export function samplePrimaryWidth(domain: WidthDomain, width: PrimaryWidth): readonly [number, number] | null {
    const rows = primaryWidthRows(domain, width);
    if (!rows.length) return null;
    let offset = random() * rows.reduce((sum, row) => sum + row.weight, 0);
    const row = rows.find(candidate => (offset -= candidate.weight) < 0) ?? rows[rows.length - 1]!;
    return [row.first, row.seconds[Math.floor(random() * row.seconds.length)]!];
}

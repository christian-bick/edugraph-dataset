import {random} from '../../../lib/random.ts';

export type PrimaryWidth = 'legacy' | 'single' | 'multiple';
export interface WidthDomain {
    readonly operation: 'addition' | 'subtraction';
    readonly minimum: number;
    readonly maximum: number;
    readonly regrouping: boolean;
    readonly zeroResult?: boolean;
    readonly coefficientZero?: boolean;
}
interface PairRow {
    readonly first: number;
    readonly seconds: readonly number[];
    readonly weight: number;
}

const cache = new Map<string, readonly PairRow[]>();
const hasWidth = (a: number, b: number, width: PrimaryWidth) => width === 'legacy'
    || (Math.max(a, b) <= 9) === (width === 'single');

/** All three consumers expose complete H/T/O counts outside positive whole-tens subtraction. */
export const hasCoefficientZero = (first: number, second: number, operation: WidthDomain['operation']): boolean =>
    [first, second, operation === 'addition' ? first + second : first - second]
        .some(value => Math.floor(value / 100) === 0 || Math.floor(value % 100 / 10) === 0 || value % 10 === 0);

/** Complete finite support with the original uniform-first/uniform-second proposal weights. */
export function primaryWidthRows(domain: WidthDomain, width: PrimaryWidth): readonly PairRow[] {
    const key = JSON.stringify([domain.operation, domain.minimum, domain.maximum, domain.regrouping,
        domain.zeroResult, domain.coefficientZero, width]);
    const cached = cache.get(key);
    if (cached) return cached;
    const rows: PairRow[] = [];
    const {operation, minimum, maximum, regrouping} = domain;
    if (operation === 'subtraction' && domain.zeroResult) {
        if (!regrouping) for (let operand = minimum; operand <= maximum; operand++) {
            if (domain.coefficientZero !== false && hasWidth(operand, operand, width)) rows.push({first: operand, seconds: [operand],
                weight: 1 / (maximum - minimum + 1)});
        }
        cache.set(key, rows);
        return rows;
    }
    const firstMinimum = operation === 'addition' ? minimum : minimum + 1;
    const firstMaximum = operation === 'addition' ? maximum - minimum : maximum;
    const firstCount = firstMaximum - firstMinimum + 1;
    for (let first = firstMinimum; first <= firstMaximum; first++) {
        const secondMaximum = operation === 'addition' ? maximum - first : first - 1;
        const originalCount = secondMaximum - minimum + 1;
        const seconds: number[] = [];
        for (let second = minimum; second <= secondMaximum; second++) {
            if (!hasWidth(first, second, width)) continue;
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

import {Area} from 'edugraph-ts';
import type {ArithmeticTripleSamplingConfig} from './arithmetic-triple-schema.ts';

/** Feasibility of a complete, bounded property witness produced by the shared sampler. */
export function isFeasibleArithmeticProperty(config: ArithmeticTripleSamplingConfig): boolean {
    const {operation, range, requireZero, requireMultipleOf10,
        useCommutativeLaw, useAssociativeLaw, useDistributiveLaw} = config;
    if ([useCommutativeLaw, useAssociativeLaw, useDistributiveLaw].filter(Boolean).length !== 1) return false;
    if (operation !== Area.Addition && operation !== Area.Multiplication) return false;
    if (useDistributiveLaw && operation !== Area.Multiplication) return false;
    if (!range || !Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max)
        || range.min > range.max || range.max > 1000000) return false;
    if (requireZero && range.min > 0) return false;

    const step = requireMultipleOf10 ? 10 : 1;
    const minimum = Math.ceil(Math.max(1, range.min) / step) * step;
    const maximum = Math.floor(range.max / step) * step;
    if (maximum < minimum) return false;

    if (useDistributiveLaw) {
        // Preserve the legacy sampler while excluding its unsupported zero and factor domains.
        const largestFirstFactor = Math.min(9, Math.floor(maximum / 2));
        return !requireZero && !requireMultipleOf10 && minimum <= largestFirstFactor
            && 2 * minimum * largestFirstFactor <= maximum;
    }
    const distinctIncrement = useCommutativeLaw && !requireZero ? step : 0;
    if (operation === Area.Addition) return (requireZero ? 2 : 3) * minimum + distinctIncrement <= maximum;
    return requireZero ? minimum ** 2 <= maximum : minimum ** 2 * (minimum + distinctIncrement) <= maximum;
}

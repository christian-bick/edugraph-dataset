import type {PowerTenPower} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const WHOLE_PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'] as const;
const FRACTIONAL_PLACES = ['tenths', 'hundredths', 'thousandths', 'ten-thousandths', 'hundred-thousandths'] as const;

export function assertPowerTenPower(viewId: string, power: PowerTenPower): void {
    const values = [1, 10, 100];
    if (
        power?.base !== 10 ||
        !Number.isInteger(power.exponent) ||
        power.exponent < 0 ||
        power.exponent > 2 ||
        power.value !== values[power.exponent] ||
        !Array.isArray(power.repeatedFactors) ||
        power.repeatedFactors.length !== power.exponent ||
        power.repeatedFactors.some(factor => factor !== 10)
    ) {
        throw new ViewValidationError(viewId, 'Expected an exact nonnegative power of ten through 10².');
    }
}

export function PowerTenSymbol({exponent}: {exponent: PowerTenPower['exponent']}) {
    return <span>10<sup>{exponent}</sup></span>;
}

export function placeName(exponent: number): string {
    if (exponent >= 0) return WHOLE_PLACES[exponent] ?? `10^${exponent} place`;
    return FRACTIONAL_PLACES[-exponent - 1] ?? `10^${exponent} place`;
}

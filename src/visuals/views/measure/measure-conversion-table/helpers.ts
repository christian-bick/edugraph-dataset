import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
export {isValidStandardUnitEquivalences as hasCoherentConversionTable} from '../../../helpers/measurement-conversion.ts';

export function formatTableValue(value: number): string {
    return formatStandardNumeral(value);
}

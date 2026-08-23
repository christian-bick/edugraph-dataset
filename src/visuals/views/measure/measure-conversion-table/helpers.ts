import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {MeasurementConversionTableProblem} from '../../../../types/problems.ts';
import {isValidMeasurementConversionPair} from '../../../helpers/measurement-conversion.ts';

const isPositiveSafeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) > 0;

export function hasCoherentConversionTable(data: MeasurementConversionTableProblem): boolean {
    if (!data
        || data.task !== 'conversion-table'
        || !isValidMeasurementConversionPair(data.pair)
        || !Array.isArray(data.rows)
        || data.rows.length !== 5) {
        return false;
    }

    return data.rows.every((row, index) => (
        Boolean(row)
        && isPositiveSafeInteger(row.largerValue)
        && isPositiveSafeInteger(row.smallerValue)
        && row.smallerValue === row.largerValue * data.pair.factor
        && (index === 0
            ? row.largerValue >= 1 && row.largerValue <= 5
            : row.largerValue === data.rows[index - 1]!.largerValue + 1)
    ));
}

export function formatTableValue(value: number): string {
    return formatStandardNumeral(value);
}

import type {StandardMultiplicationPartialRow, StandardMultiplicationSumColumn} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const wholePlaces = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands',
    'millions', 'ten-millions', 'hundred-millions', 'billions', 'ten-billions', 'hundred-billions',
    'trillions', 'ten-trillions', 'hundred-trillions', 'quadrillions'];
const fractionalPlaces = ['tenths', 'hundredths', 'thousandths', 'ten-thousandths', 'hundred-thousandths',
    'millionths', 'ten-millionths', 'hundred-millionths', 'billionths', 'ten-billionths', 'hundred-billionths',
    'trillionths', 'ten-trillionths', 'hundred-trillionths', 'quadrillionths'];

/** Names the unit of a supplied canonical column without turning its index into an operand. */
export function columnUnit(placeExponent: number): string {
    const unit = placeExponent >= 0 ? wholePlaces[placeExponent] : fractionalPlaces[-placeExponent - 1];
    if (!unit) throw new ViewValidationError('standard-column-calculations', 'Unsupported column place.');
    return unit;
}

export interface ColumnCalculation {
    unit: string;
    equation: string;
}

/** Project supplied arithmetic results; no new result or artificial carry-zero term is calculated. */
export const sumEquation = (operands: readonly number[], carryIn: number, workingValue: number): string =>
    `${[...operands, ...(carryIn > 0 ? [carryIn] : [])].join(' + ')} = ${workingValue}`;

export function ColumnCalculations({title, calculations}: {title: string; calculations: readonly ColumnCalculation[]}) {
    return <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950"
        data-role="column-calculations">
        <h2 className="text-sm font-bold">{title}</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2">
            {calculations.map(({unit, equation}) => <div key={unit} className="min-w-0" data-unit={unit}>
                <div className="text-xs font-semibold capitalize">{unit}</div>
                <div className="break-words font-mono text-sm font-bold leading-snug">{equation}</div>
            </div>)}
        </div>
    </section>;
}

/** The same visible row cells determine which sum terms are real, excluding absent leading places. */
export function MultiplicationColumnCalculations({partialRows, sumColumns, displayedRows, coefficient}: {
    partialRows: readonly StandardMultiplicationPartialRow[];
    sumColumns: readonly StandardMultiplicationSumColumn[];
    displayedRows: readonly (readonly (number | null)[])[];
    coefficient: boolean;
}) {
    return <>
        {partialRows.map(row => <ColumnCalculations key={row.shiftPlaces}
            title={`${coefficient ? 'Coefficient ' : ''}${columnUnit(row.shiftPlaces)} row: ×${row.multiplierDigit}, ${row.shiftPlaces} place shifts`}
            calculations={row.columns.map(column => ({unit: columnUnit(column.placeIndex),
                equation: `${column.multiplicandDigit} × ${row.multiplierDigit}${column.carryIn > 0 ? ` + ${column.carryIn}` : ''} = ${column.workingValue}`}))} />)}
        {partialRows.length > 1 && <ColumnCalculations title="Add the aligned rows by place"
            calculations={sumColumns.map(column => ({unit: columnUnit(column.placeIndex),
                equation: sumEquation(column.addendDigits.filter((_digit, rowIndex) =>
                    displayedRows[rowIndex][displayedRows[rowIndex].length - 1 - column.placeIndex] !== null),
                column.carryIn, column.workingValue)}))} />}
    </>;
}

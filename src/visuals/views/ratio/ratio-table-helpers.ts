import type {RatioTableComparisonProblem, RatioTableProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

const positiveInteger = (value: number): boolean => Number.isSafeInteger(value) && value > 0;

export function assertRatioTable(viewId: string, data: RatioTableProblem): void {
    validateProblemData(viewId, data, ['kind', 'quantities', 'base', 'rows', 'coordinateScale']);
    const {base, rows, coordinateScale: axes, quantities} = data;
    const coherent = data.kind === 'ratio-table'
        && Array.isArray(base) && base.length === 2 && base.every(positiveInteger)
        && Array.isArray(quantities) && quantities.length === 2
        && quantities.every(quantity => quantity && typeof quantity.name === 'string'
            && quantity.name.trim().length > 0 && typeof quantity.unit === 'string'
            && quantity.unit.trim().length > 0)
        && Array.isArray(rows) && rows.length >= 2 && rows.length <= 6
        && rows.every(row => row && positiveInteger(row.scale)
            && positiveInteger(row.antecedent) && positiveInteger(row.consequent)
            && row.antecedent === base[0] * row.scale
            && row.consequent === base[1] * row.scale)
        && new Set(rows.map(row => row.scale)).size === rows.length
        && axes && [axes.xStep, axes.yStep, axes.xMax, axes.yMax].every(positiveInteger)
        && axes.xMax % axes.xStep === 0 && axes.yMax % axes.yStep === 0
        && rows.every(row => row.antecedent <= axes.xMax && row.consequent <= axes.yMax);
    if (!coherent) {
        throw new ViewValidationError(viewId, 'Expected coherent positive integer ratio rows and a bounded coordinate scale.');
    }
}

export function assertRatioPlotScale(viewId: string, data: RatioTableProblem): void {
    const {xMax, xStep, yMax, yStep} = data.coordinateScale;
    if (xMax / xStep > 10 || yMax / yStep > 10) {
        throw new ViewValidationError(viewId, 'Coordinate grids support at most ten steps on each axis.');
    }
}

export function assertRatioComparison(viewId: string, data: RatioTableComparisonProblem): void {
    validateProblemData(viewId, data, ['kind', 'left', 'right', 'relation', 'normalized']);
    assertRatioTable(viewId, data.left);
    assertRatioTable(viewId, data.right);
    const {normalized: common, left, right, relation} = data;
    const expected = common.leftAntecedent < common.rightAntecedent
        ? 'less' : common.leftAntecedent > common.rightAntecedent ? 'greater' : 'equal';
    const leftFinal = left.rows.at(-1)!;
    const rightFinal = right.rows.at(-1)!;
    if (data.kind !== 'ratio-table-comparison' || relation !== expected
        || ![common.consequent, common.leftAntecedent, common.rightAntecedent].every(positiveInteger)
        || common.consequent !== leftFinal.consequent || common.consequent !== rightFinal.consequent
        || common.leftAntecedent !== leftFinal.antecedent || common.rightAntecedent !== rightFinal.antecedent
        || left.quantities.some((quantity, index) => quantity.name !== right.quantities[index]!.name
            || quantity.unit !== right.quantities[index]!.unit)) {
        throw new ViewValidationError(viewId, 'Expected two ordered ratios compared at the same consequent quantity.');
    }
}

export const ratioTableHeading = (quantity: RatioTableProblem['quantities'][number]): string =>
    `${quantity.name} (${quantity.unit})`;

export const ratioQuantityPhrase = (value: number, quantity: RatioTableProblem['quantities'][number]): string =>
    `${value} ${quantity.name.endsWith(quantity.unit) ? quantity.name : `${quantity.unit} of ${quantity.name}`}`;

export const ratioEquivalence = (data: RatioTableProblem): string =>
    data.rows.map(row => `${row.antecedent} : ${row.consequent}`).join(' = ');

import {buildAlgebraCovariationBackbone} from '../../../generators/algebra/algebra-covariation-backbone-helpers.ts';
import {buildCovariationDependencyProof, buildCovariationOriginProof} from '../../../generators/algebra/algebra-covariation-helpers.ts';
import {makeCoordinateAxis} from '../../../generators/coordinate/coordinate-helpers.ts';
import type {AffineQuantityContext, AlgebraCovariationBackbone, AlgebraCovariationProblem, AlgebraicNotation, AlgebraicScalar, AlgebraicUnit, CovaryingInputQuantity, CovaryingOutputQuantity, ExactSymbolicExpressionNode as Node, RationalCoordinateAxes} from '../../../types/problems.ts';

export const covariationValue = (numerator: number, denominator = 1): AlgebraicScalar => ({numerator, denominator});
const q = covariationValue;
const spelling = (value: AlgebraicScalar): AlgebraicNotation => value.denominator === 1 ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value};
const number = (id: string, value: AlgebraicScalar, notation: AlgebraicNotation = spelling(value)): Node => ({id, kind: 'number', value, notation});
const variable = (id: string): Node => ({id, kind: 'variable', symbolId: 'input-symbol'});
const binary = (id: string, operation: 'multiplication' | 'addition', left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const unit = (subject: AlgebraicUnit['subject'], name: string, currency: number, time: number, count: number, length: number): AlgebraicUnit => ({subject, name, dimensions: {currency, time, count, length}});
const hours = unit('time', 'hours', 0, 1, 0, 0), dollars = unit('money', 'dollars', 1, 0, 0, 0), meters = unit('length', 'meters', 0, 0, 0, 1), items = unit('item', 'items', 0, 0, 1, 0);

export function covariationComplete(backbone: AlgebraCovariationBackbone, proofCount: 0 | 1 | 2): AlgebraCovariationProblem {
    const selectedRelations = proofCount === 0 ? [] as const : proofCount === 1 ? [buildCovariationDependencyProof(backbone)] as const : [buildCovariationDependencyProof(backbone), buildCovariationOriginProof(backbone)] as const;
    return {...backbone, selectedRelations};
}

/** Literal independent oracles: rental (3/2)t+3, purchase2n+1, motion2t. */
export function covariationFixture(kind: AffineQuantityContext['kind'], proofCount: 0 | 1 | 2, options: {crop?: boolean; repeated?: boolean; retained?: boolean; broadAxis?: boolean; nonzeroMinimum?: boolean; signedFrame?: boolean} = {}): AlgebraCovariationProblem {
    const count = kind === 'item-purchase', speed = kind === 'constant-speed';
    const rate = count || speed ? q(2) : q(3, 2), initial = speed ? q(0) : count ? q(1) : q(3);
    const maximumInput = speed ? q(3, 2) : count ? q(3) : q(4);
    const input: CovaryingInputQuantity = count ? {quantityId: 'items', symbolId: 'input-symbol', symbol: 'n', meaning: 'item-count', unit: items, domain: {kind: 'integer', minimum: q(0), maximum: maximumInput}}
        : {quantityId: 'time', symbolId: 'input-symbol', symbol: 't', meaning: speed ? 'elapsed-time' : kind === 'rental-charge' ? 'rental-duration' : 'production-time', unit: hours, domain: {kind: 'real', minimum: options.nonzeroMinimum ? q(1) : q(0), maximum: maximumInput}};
    const output: CovaryingOutputQuantity = {quantityId: 'result', symbolId: 'output-symbol', symbol: speed ? 'd' : kind === 'constant-production' ? 'L' : 'C',
        meaning: speed ? 'distance-traveled' : count ? 'total-cost' : kind === 'rental-charge' ? 'rental-cost' : 'total-length', unit: speed || kind === 'constant-production' ? meters : dollars,
        domain: {kind: 'real', minimum: q(0), maximum: q(20)}};
    const rateUnit = count ? unit('money', 'dollars per item', 1, 0, -1, 0) : speed || kind === 'constant-production' ? unit('length', 'meters per hour', 0, -1, 0, 1) : unit('money', 'dollars per hour', 1, -1, 0, 0);
    let context: AffineQuantityContext;
    if (speed) context = {kind, timeQuantityId: input.quantityId, distanceQuantityId: output.quantityId, speed: rate, speedNotation: spelling(rate), rateUnit, initialUnit: output.unit};
    else if (count) context = {kind, countQuantityId: input.quantityId, costQuantityId: output.quantityId, itemPrice: rate, itemPriceNotation: spelling(rate), fixedCharge: initial, fixedChargeNotation: spelling(initial), rateUnit, initialUnit: output.unit};
    else if (kind === 'rental-charge') context = {kind, durationQuantityId: input.quantityId, costQuantityId: output.quantityId, hourlyCharge: rate, hourlyChargeNotation: spelling(rate), initialCharge: initial, initialChargeNotation: spelling(initial), rateUnit, initialUnit: output.unit};
    else context = {kind, timeQuantityId: input.quantityId, lengthQuantityId: output.quantityId, lengthPerTime: rate, lengthPerTimeNotation: spelling(rate), initialLength: initial, initialLengthNotation: spelling(initial), rateUnit, initialUnit: output.unit};
    const right = options.repeated ? binary('right', 'addition', binary('left-sum', 'addition', number('three', q(3)), binary('first-product', 'multiplication', number('decimal-rate', q(3, 4), {kind: 'decimal', coefficient: 750, scale: 3, numeral: '0.750'}), variable('first-t'))), binary('second-product', 'multiplication', number('fraction-rate', q(3, 4)), variable('second-t')))
        : speed ? binary('right', 'multiplication', number('rate', rate), variable('t')) : binary('right', 'addition', binary('product', 'multiplication', number('rate', rate), variable('t')), number('initial', initial));
    const inputs = options.crop ? [q(0), q(2)] : options.repeated ? [q(2), q(3), q(4)] : speed ? [q(0), q(1, 2), q(1), q(3, 2)] : count ? [q(0), q(2), q(3)] : [options.nonzeroMinimum ? q(1) : q(0), q(2), q(4)];
    const x = options.broadAxis ? {minimum: q(0), maximum: q(6), step: q(1, 2), zeroIndex: 0, ticks: Array.from({length: 13}, (_, index) => q(index % 2 === 0 ? index / 2 : index, index % 2 === 0 ? 1 : 2)), tickNotations: Array.from({length: 13}, (_, index) => spelling(q(index % 2 === 0 ? index / 2 : index, index % 2 === 0 ? 1 : 2))), stepNotation: spelling(q(1, 2))}
        : makeCoordinateAxis(count ? q(1) : q(1, 2), options.signedFrame ? -2 : 0, count ? 3 : speed ? 3 : 8, 'fraction');
    const lastY = options.crop ? 4 : count ? 7 : speed ? options.signedFrame ? 5 : 3 : 6;
    const axes: RationalCoordinateAxes = {x, y: makeCoordinateAxis(count || speed ? q(1) : q(3, 2), options.signedFrame ? -Math.min(5, 10 - lastY) : 0, lastY, 'fraction')};
    const tableInputs = inputs.map(value => ({input: value, inputNotation: options.retained && value.numerator === 2 && value.denominator === 1 ? {kind: 'decimal' as const, coefficient: 200, scale: 2, numeral: '2.00'} : spelling(value)}));
    const backbone = buildAlgebraCovariationBackbone({input, output, context, right, axes, tableInputs: [tableInputs[0]!, tableInputs[1]!, ...tableInputs.slice(2)]});
    return covariationComplete(backbone, proofCount);
}

import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {AffineQuantityContext, AlgebraCovariationProblem, AlgebraicNotation, AlgebraicScalar, AlgebraicUnit,
    CovaryingInputQuantity, CovaryingOutputQuantity, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {makeCoordinateAxis, makeCoordinateNotation} from '../../coordinate/coordinate-helpers.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {addAffineScalars, multiplyAffineScalars} from '../algebra-affine-helpers.ts';
import {buildAlgebraCovariationBackbone} from '../algebra-covariation-backbone-helpers.ts';
import {buildCovariationDependencyProof, buildCovariationOriginProof} from '../algebra-covariation-helpers.ts';
import {AlgebraCovariationGeneratorSchema, type AlgebraCovariationGeneratorConfig} from './spec.ts';

const generatorId = 'algebra-covariation';
const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const q = (numerator: number, denominator = 1): AlgebraicScalar => makeSignedRational(numerator, denominator);
const unit = (name: string, subject: AlgebraicUnit['subject'], currency: number, time: number, count: number, length: number): AlgebraicUnit =>
    ({name, subject, dimensions: {currency, time, count, length}});
const hours = unit('hours', 'time', 0, 1, 0, 0), items = unit('items', 'item', 0, 0, 1, 0);
const dollars = unit('dollars', 'money', 1, 0, 0, 0), meters = unit('meters', 'length', 0, 0, 0, 1);
const moneyPerHour = unit('dollars per hour', 'money', 1, -1, 0, 0);
const moneyPerItem = unit('dollars per item', 'money', 1, 0, -1, 0);
const lengthPerHour = unit('meters per hour', 'length', 0, -1, 0, 1);

/** Preserve an original exact spelling independently of its reduced rational value. */
function spelling(value: AlgebraicScalar): AlgebraicNotation {
    const form = integer(0, 2);
    if (form === 0 && value.denominator === 1) return makeCoordinateNotation(value, 'integer');
    if (form === 1) return makeCoordinateNotation(value, 'decimal', 2);
    return {kind: 'fraction', numerator: value.numerator * 2, denominator: value.denominator * 2};
}
const number = (id: string, value: AlgebraicScalar): Node => ({id, kind: 'number', value, notation: spelling(value)});
const variable = (id: string): Node => ({id, kind: 'variable', symbolId: 'input-symbol'});
const add = (id: string, left: Node, right: Node): Node => ({id, kind: 'binary', operation: 'addition', left, right});
const product = (id: string, left: Node, right: Node): Node => ({id, kind: 'binary', operation: 'multiplication', left, right});

export class AlgebraCovariationGenerator implements ProblemGenerator<AlgebraCovariationProblem, AlgebraCovariationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = AlgebraCovariationGeneratorSchema;

    generate(config: AlgebraCovariationGeneratorConfig): ProblemStub<AlgebraCovariationProblem> {
        validateConfigFields(generatorId, config, ['relations']);
        if (!config.relations || !['quantitative-origin', 'designated-dependency', 'numerical-correspondence'].includes(config.relations)) {
            throw new GeneratorValidationError(generatorId, 'Choose a numerical correspondence or a checked quantity dependency/origin construction.');
        }
        const family = integer(0, 3), slope = q([1, 2, 3, 4, 6][integer(0, 4)]!, 2);
        const yStep = multiplyAffineScalars(slope, q(1, 2));
        const interceptTicks = family === 0 ? 0 : integer(0, 2), intercept = multiplyAffineScalars(yStep, q(interceptTicks));
        const minimum = integer(0, 1), maximum = 4, visibleMaximum = integer(3, 4);
        const inputId = 'input-quantity', outputId = 'output-quantity';
        const input: CovaryingInputQuantity = family === 2
            ? {quantityId: inputId, symbolId: 'input-symbol', symbol: 'n', unit: items, meaning: 'item-count', domain: {kind: 'integer', minimum: q(minimum), maximum: q(maximum)}}
            : {quantityId: inputId, symbolId: 'input-symbol', symbol: 't', unit: hours,
                meaning: family === 0 ? 'elapsed-time' : family === 1 ? 'rental-duration' : 'production-time',
                domain: {kind: 'real', minimum: q(minimum), maximum: q(maximum)}};
        const output: CovaryingOutputQuantity = {quantityId: outputId, symbolId: 'output-symbol',
            symbol: family === 0 ? 'd' : family === 3 ? 'L' : 'C', unit: family === 0 || family === 3 ? meters : dollars,
            meaning: family === 0 ? 'distance-traveled' : family === 1 ? 'rental-cost' : family === 2 ? 'total-cost' : 'total-length',
            domain: {kind: 'real', minimum: q(0), maximum: addAffineScalars(multiplyAffineScalars(slope, q(maximum)), intercept)}};
        let context: AffineQuantityContext;
        if (family === 0) context = {kind: 'constant-speed', timeQuantityId: inputId, distanceQuantityId: outputId,
            speed: slope, speedNotation: spelling(slope), rateUnit: lengthPerHour, initialUnit: meters};
        else if (family === 1) context = {kind: 'rental-charge', durationQuantityId: inputId, costQuantityId: outputId,
            initialCharge: intercept, initialChargeNotation: spelling(intercept), hourlyCharge: slope, hourlyChargeNotation: spelling(slope), rateUnit: moneyPerHour, initialUnit: dollars};
        else if (family === 2) context = {kind: 'item-purchase', countQuantityId: inputId, costQuantityId: outputId,
            fixedCharge: intercept, fixedChargeNotation: spelling(intercept), itemPrice: slope, itemPriceNotation: spelling(slope), rateUnit: moneyPerItem, initialUnit: dollars};
        else context = {kind: 'constant-production', timeQuantityId: inputId, lengthQuantityId: outputId,
            initialLength: intercept, initialLengthNotation: spelling(intercept), lengthPerTime: slope, lengthPerTimeNotation: spelling(slope), rateUnit: lengthPerHour, initialUnit: meters};
        const expressionFamily = integer(0, 2);
        const scaled = () => product('law-product', number('law-rate', slope), variable('law-input'));
        const right = expressionFamily === 0 ? add('law-sum', scaled(), number('law-initial', intercept))
            : expressionFamily === 1 ? add('law-sum', number('law-initial', intercept), scaled())
                : add('law-repeated-input', add('law-two-products',
                    product('law-first-product', number('law-first-rate', yStep), variable('law-first-input')),
                    product('law-second-product', number('law-second-rate', yStep), variable('law-second-input'))), number('law-initial', intercept));
        const tableInputs = [q(minimum), family === 2 ? q(minimum + 1) : q(minimum + visibleMaximum, 2), q(visibleMaximum)]
            .map(value => ({input: value, inputNotation: spelling(value)})) as [
                {input: AlgebraicScalar; inputNotation: AlgebraicNotation}, {input: AlgebraicScalar; inputNotation: AlgebraicNotation},
                {input: AlgebraicScalar; inputNotation: AlgebraicNotation}];
        const axes = {x: makeCoordinateAxis(q(1, family === 2 ? 1 : 2), 0, family === 2 ? maximum : maximum * 2, 'fraction'),
            y: makeCoordinateAxis(yStep, 0, interceptTicks + visibleMaximum * 2, 'fraction')};
        const backbone = buildAlgebraCovariationBackbone({input, output, context, right, tableInputs, axes});
        const selectedRelations: AlgebraCovariationProblem['selectedRelations'] = config.relations === 'numerical-correspondence' ? []
            : config.relations === 'designated-dependency' ? [buildCovariationDependencyProof(backbone)]
                : [buildCovariationDependencyProof(backbone), buildCovariationOriginProof(backbone)];
        return {data: {...backbone, selectedRelations}};
    }
}

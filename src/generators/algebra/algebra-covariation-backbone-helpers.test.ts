import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AffineQuantityContext, AlgebraCovariationBackbone, AlgebraicScalar, AlgebraicUnit, CovariationValueWitness,
    CovaryingInputQuantity, CovaryingOutputQuantity, ExactSymbolicExpressionNode as Node, RationalCoordinateAxes,
    RationalCoordinateAxis, RationalCoordinatePoint} from '../../types/problems.ts';
import {makeCoordinateAxis, makeCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {addAffineScalars, multiplyAffineScalars} from './algebra-affine-helpers.ts';
import {buildAlgebraCovariationBackbone as build, isAlgebraCovariationBackbone as guard,
    type CovariationBackboneInput} from './algebra-covariation-backbone-helpers.ts';

const q = (n: number, d = 1): AlgebraicScalar => makeSignedRational(n, d);
const notation = (value: AlgebraicScalar) => makeCoordinateNotation(value, value.denominator === 1 ? 'integer' : 'fraction');
const n = (id: string, value: AlgebraicScalar): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value, notation: notation(value)});
const v = (id = 'time'): Extract<Node, {kind: 'variable'}> => ({id, kind: 'variable', symbolId: 't'});
const binary = (id: string, operation: 'addition' | 'subtraction' | 'multiplication' | 'division', left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const unit = (name: string, subject: AlgebraicUnit['subject'], currency = 0, time = 0, count = 0, length = 0): AlgebraicUnit => ({name, subject, dimensions: {currency, time, count, length}});
const hours = unit('hours', 'time', 0, 1), items = unit('items', 'item', 0, 0, 1), dollars = unit('dollars', 'money', 1), meters = unit('meters', 'length', 0, 0, 0, 1);
const moneyRate = unit('dollars per hour', 'money', 1, -1), price = unit('dollars per item', 'money', 1, 0, -1), lengthRate = unit('meters per hour', 'length', 0, -1, 0, 1);
type FixtureOptions = {kind?: AffineQuantityContext['kind']; slope?: AlgebraicScalar; intercept?: AlgebraicScalar;
    minimum?: number; maximum?: number; frame?: RationalCoordinateAxes; right?: Node; inputs?: AlgebraicScalar[]};
function fixture(options: FixtureOptions = {}): CovariationBackboneInput {
    const kind = options.kind ?? 'rental-charge', slope = options.slope ?? q(2), intercept = options.intercept ?? q(kind === 'constant-speed' ? 0 : 1);
    const minimum = options.minimum ?? 0, maximum = options.maximum ?? 4;
    const input: CovaryingInputQuantity = kind === 'item-purchase'
        ? {quantityId: 'time-quantity', symbolId: 't', symbol: 'n', meaning: 'item-count', unit: items, domain: {kind: 'integer', minimum: q(minimum), maximum: q(maximum)}}
        : {quantityId: 'time-quantity', symbolId: 't', symbol: 't', meaning: kind === 'constant-speed' ? 'elapsed-time' : kind === 'rental-charge' ? 'rental-duration' : 'production-time',
            unit: hours, domain: {kind: 'real', minimum: q(minimum), maximum: q(maximum)}};
    const monetary = kind === 'item-purchase' || kind === 'rental-charge', outputUnit = monetary ? dollars : meters;
    const output: CovaryingOutputQuantity = {quantityId: 'result-quantity', symbolId: 'result', symbol: monetary ? 'C' : 'd',
        meaning: kind === 'constant-speed' ? 'distance-traveled' : kind === 'constant-production' ? 'total-length' : kind === 'rental-charge' ? 'rental-cost' : 'total-cost',
        unit: outputUnit, domain: {kind: 'real', minimum: q(0), maximum: addAffineScalars(multiplyAffineScalars(slope, q(maximum)), intercept)}};
    const rateUnit = kind === 'item-purchase' ? price : monetary ? moneyRate : lengthRate;
    let context: AffineQuantityContext;
    if (kind === 'constant-speed') context = {kind, timeQuantityId: input.quantityId, distanceQuantityId: output.quantityId,
        speed: slope, speedNotation: notation(slope), rateUnit, initialUnit: outputUnit};
    else if (kind === 'rental-charge') context = {kind, durationQuantityId: input.quantityId, costQuantityId: output.quantityId,
        hourlyCharge: slope, hourlyChargeNotation: notation(slope), initialCharge: intercept, initialChargeNotation: notation(intercept), rateUnit, initialUnit: outputUnit};
    else if (kind === 'item-purchase') context = {kind, countQuantityId: input.quantityId, costQuantityId: output.quantityId,
        itemPrice: slope, itemPriceNotation: notation(slope), fixedCharge: intercept, fixedChargeNotation: notation(intercept), rateUnit, initialUnit: outputUnit};
    else context = {kind, timeQuantityId: input.quantityId, lengthQuantityId: output.quantityId,
        lengthPerTime: slope, lengthPerTimeNotation: notation(slope), initialLength: intercept, initialLengthNotation: notation(intercept), rateUnit, initialUnit: outputUnit};
    const inputs = options.inputs ?? [q(minimum), q(minimum + 1), q(maximum - 1)];
    const tableInput = (input: AlgebraicScalar) => ({input, inputNotation: notation(input)});
    return {input, output, context,
        right: options.right ?? binary('sum', 'addition', binary('product', 'multiplication', n('rate', slope), v()), n('initial', intercept)),
        tableInputs: [tableInput(inputs[0]!), tableInput(inputs[1]!), ...inputs.slice(2).map(tableInput)],
        axes: options.frame ?? {x: makeCoordinateAxis(q(1, kind === 'item-purchase' ? 1 : 2), 0, kind === 'item-purchase' ? 4 : 8, 'fraction'),
            y: makeCoordinateAxis(q(1), 0, 9, 'fraction')}};
}
const changed = <T>(source: T, edit: (value: any) => void): T => {const copy = structuredClone(source); edit(copy); return copy;};
const values = (backbone: AlgebraCovariationBackbone) => [backbone.domainImage.atMinimumInput, backbone.domainImage.atMaximumInput,
    ...backbone.table.map(row => row.value), ...(backbone.graph.geometry.kind === 'continuous-affine-segment'
        ? [backbone.graph.geometry.first.value, backbone.graph.geometry.last.value] : backbone.graph.geometry.visibleValues.map(row => row.value))];

/** Complete independent literal oracle for d=2t, real0..1, image0..2. */
function oracle(): AlgebraCovariationBackbone {
    const original = binary('product', 'multiplication', n('two', q(2)), v());
    const linear = {constant: q(0), coefficients: [{symbolId: 't', coefficient: q(2)}]};
    const witness = (input: number): CovariationValueWitness => ({input: q(input), inputNotation: notation(q(input)), scaledInput: q(input * 2),
        scaledInputNotation: notation(q(input * 2)), output: q(input * 2), outputNotation: notation(q(input * 2)), evaluation: {
            binding: {symbolId: 't', value: q(input), notation: notation(q(input))}, replacements: [{occurrenceNodeId: 'time', symbolId: 't', value: q(input), notation: notation(q(input))}],
            calculation: {expression: binary('product', 'multiplication', n('two', q(2)), n('time', q(input))) as Extract<Node, {kind: 'binary'}> & {left: Extract<Node, {kind: 'number'}>; right: Extract<Node, {kind: 'number'}>},
                nodeValues: [{nodeId: 'product', value: q(input * 2)}, {nodeId: 'two', value: q(2)}, {nodeId: 'time', value: q(input)}], powerFacts: [],
                reductions: [{targetNodeId: 'product', path: [], evidence: {kind: 'binary', operation: 'multiplication', operands: [q(2), q(input)], result: q(input * 2)}, after: n('product', q(input * 2))}],
                finalValue: q(input * 2), precedenceWitness: null}}});
    const first = witness(0), last = witness(1);
    const point = (value: 0 | 1): RationalCoordinatePoint => ({id: `p${value}`,
        x: {value: q(value), notation: notation(q(value)), tickIndex: value, sign: value, magnitude: q(value)},
        y: {value: q(2 * value), notation: notation(q(2 * value)), tickIndex: value, sign: value, magnitude: q(2 * value)}, locationTag: value === 0 ? 'origin' : 'quadrant-I'});
    return {kind: 'algebra-covariation', input: {quantityId: 'T', symbolId: 't', symbol: 't', meaning: 'elapsed-time', unit: hours,
        domain: {kind: 'real', minimum: q(0), maximum: q(1)}}, output: {quantityId: 'D', symbolId: 'd', symbol: 'd', meaning: 'distance-traveled', unit: meters,
        domain: {kind: 'real', minimum: q(0), maximum: q(2)}}, context: {kind: 'constant-speed', timeQuantityId: 'T', distanceQuantityId: 'D', speed: q(2), speedNotation: notation(q(2)), rateUnit: lengthRate, initialUnit: meters},
        equation: {inputSymbolId: 't', outputSymbolId: 'd', right: original, slope: q(2), slopeNotation: notation(q(2)), intercept: q(0), interceptNotation: notation(q(0))},
        lawProof: {proofDomain: {domainId: 'formal-Q', kind: 'independent-rational-variables', symbols: [{symbolId: 't', symbol: 't', domain: {kind: 'rational', lower: null, upper: null, excludedValues: []}}]},
            rhsExpression: {expressionId: 'original-rule', domainId: 'formal-Q', root: original}, normalization: {expressionId: 'original-rule', rootNormalForm: linear,
                steps: [{kind: 'literal', nodeId: 'two', value: q(2), result: {constant: q(2), coefficients: []}},
                    {kind: 'variable', nodeId: 'time', symbolId: 't', unitCoefficient: {numerator: 1, denominator: 1}, result: {constant: q(0), coefficients: [{symbolId: 't', coefficient: q(1)}]}},
                    {kind: 'multiply', nodeId: 'product', constantNodeId: 'two', affineNodeId: 'time', constantFactor: q(2), result: linear,
                        components: [{symbolId: null, arithmetic: {kind: 'binary', operation: 'multiplication', operands: [q(2), q(0)], result: q(0)}},
                            {symbolId: 't', arithmetic: {kind: 'binary', operation: 'multiplication', operands: [q(2), q(1)], result: q(2)}}]}]}},
        domainImage: {atMinimumInput: first, atMaximumInput: last, imageKind: 'real-interval-image'}, table: [{rowId: 'r0', value: first}, {rowId: 'r1', value: last}],
        graph: {axes: {x: makeCoordinateAxis(q(1), 0, 1, 'integer'), y: makeCoordinateAxis(q(2), 0, 1, 'integer')},
            horizontalQuantityId: 'T', verticalQuantityId: 'D', window: {minimumInput: q(0), maximumInput: q(1)},
            tablePoints: [{rowId: 'r0', point: point(0)}, {rowId: 'r1', point: point(1)}],
            geometry: {kind: 'continuous-affine-segment', first: {point: point(0), value: first}, last: {point: point(1), value: last}, firstBoundary: 'domain-endpoint', lastBoundary: 'domain-endpoint'}}};
}

describe('whole-domain exact affine covariation', () => {
    it('accepts an independently authored complete real-law/row/geometry proof', () => {
        expect(guard(oracle())).toBe(true);
        expect(guard({...oracle(), selectedRelations: {outsideThisGuard: true}})).toBe(true);
    });
    it('constructs all four semantic contexts with exact endpoint and table arithmetic', () => {
        for (const kind of ['constant-speed', 'rental-charge', 'item-purchase', 'constant-production'] as const) {
            const data = build(fixture({kind})); expect(guard(data)).toBe(true);
            expect(data.equation.slope).toEqual(q(2)); expect(data.context.kind).toBe(kind);
            for (const value of values(data)) {
                const a = BigInt(value.input.numerator), d = BigInt(value.input.denominator), expected = a * 2n + (kind === 'constant-speed' ? 0n : d);
                expect(BigInt(value.output.numerator) * d).toBe(expected * BigInt(value.output.denominator));
                expect(value.evaluation.calculation.finalValue).toEqual(value.output);
            }
            expect(data.domainImage.imageKind).toBe(kind === 'item-purchase' ? 'discrete-endpoint-envelope' : 'real-interval-image');
        }
    });
    it('proves a real interval image beyond the finite table and the full exact window crop', () => {
        const data = build(fixture({slope: q(3, 2), intercept: q(3), inputs: [q(0), q(1), q(2)],
            frame: {x: makeCoordinateAxis(q(1, 2), 0, 8, 'fraction'), y: makeCoordinateAxis(q(3, 2), 0, 4, 'fraction')}}));
        expect(data.domainImage.atMaximumInput.output).toEqual(q(9));
        expect(data.table.map(row => row.value.output)).toEqual([q(3), q(9, 2), q(6)]);
        expect(data.graph.window).toEqual({minimumInput: q(0), maximumInput: q(2)});
        expect(data.graph.geometry.kind).toBe('continuous-affine-segment');
        if (data.graph.geometry.kind !== 'continuous-affine-segment') throw Error('Fixture');
        expect(data.graph.geometry.lastBoundary).toBe('window-cut'); expect(data.graph.geometry.last.point.y.value).toEqual(q(6));
        expect(guard(data)).toBe(true);
        const croppedLeft = build(fixture({minimum: 0, inputs: [q(1), q(2), q(3)], frame: {x: makeCoordinateAxis(q(1), 0, 4, 'integer'),
            y: makeCoordinateAxis(q(1), -1, 9, 'integer')}}));
        expect(guard(croppedLeft)).toBe(true);
    });
    it('supplies every admitted count point without asserting the envelope is filled', () => {
        const data = build(fixture({kind: 'item-purchase'}));
        expect(data.domainImage.atMinimumInput.output).toEqual(q(1)); expect(data.domainImage.atMaximumInput.output).toEqual(q(9));
        if (data.graph.geometry.kind !== 'discrete-points') throw Error('Fixture');
        expect(data.graph.geometry.visibleValues.map(row => [row.value.input, row.value.output])).toEqual([0, 1, 2, 3, 4].map(value => [q(value), q(2 * value + 1)]));
        expect(data.table).toHaveLength(3); expect(guard(data)).toBe(true);
    });
    it('preserves original fraction/decimal spellings and accepts alternate valid proof/work/incidence orders', () => {
        const right = binary('sum', 'addition', binary('product', 'multiplication', {...n('rate', q(2)), notation: {kind: 'fraction', numerator: 4, denominator: 2}}, v()),
            {...n('initial', q(1)), notation: {kind: 'decimal', coefficient: 1000, scale: 3, numeral: '1.000'}});
        const source = changed(fixture({right, inputs: [q(0), q(1, 2), q(3)]}), value => {
            value.tableInputs[1].inputNotation = {kind: 'fraction', numerator: 2, denominator: 4};
        });
        const data = build(source), alternate = changed(data, value => {
            const steps = value.lawProof.normalization.steps;
            [steps[0], steps[1]] = [steps[1], steps[0]];
            steps.filter((row: any) => row.components).forEach((row: any) => row.components.reverse());
            value.graph.tablePoints.reverse();
            values(value).forEach(row => {
                const mutable = row as unknown as {evaluation: {calculation: {nodeValues: unknown[]}; replacements: unknown[]}};
                mutable.evaluation.calculation.nodeValues.reverse(); mutable.evaluation.replacements.reverse();
            });
        });
        expect(data.equation.right).toEqual(right);
        expect(data.table[1].value.inputNotation).toEqual({kind: 'fraction', numerator: 2, denominator: 4});
        expect(guard(alternate)).toBe(true);
    });
    it('preserves grouped double negation and proved constant division beyond sampler templates', () => {
        const divisor = {...n('two', q(2)), notation: {kind: 'decimal' as const, coefficient: 200, scale: 2, numeral: '2.00'}};
        const right: Node = {id: 'outer-minus', kind: 'negation', operand: {id: 'inner-minus', kind: 'negation', operand: {
            id: 'group', kind: 'group', expression: binary('quotient', 'division', {id: 'numerator', kind: 'group', expression:
                binary('sum', 'addition', binary('product', 'multiplication', n('four', q(4)), v()), n('initial', q(2)))}, divisor)}}};
        const data = build(fixture({right, inputs: [q(0), q(1, 2), q(3)]}));
        expect(data.equation.right).toEqual(right);
        expect(data.equation.slope).toEqual(q(2)); expect(data.equation.intercept).toEqual(q(1));
        expect(data.table.map(row => row.value.output)).toEqual([q(1), q(2), q(7)]);
        for (const row of values(data)) {
            expect(row.evaluation.calculation.powerFacts).toEqual([]);
            expect(row.evaluation.calculation.expression).toMatchObject({id: 'outer-minus', kind: 'negation', operand: {
                id: 'inner-minus', kind: 'negation', operand: {id: 'group', kind: 'group', expression: {id: 'quotient', right: divisor}}}});
            expect(row.evaluation.calculation.finalValue).toEqual(row.output);
        }
        expect(guard(data)).toBe(true);
    });
    it('accepts broad exact frames and safe scalar boundaries without a sampling tick cap', () => {
        const wideAxis = (): RationalCoordinateAxis => ({minimum: q(0), maximum: q(12), step: q(1), ticks: Array.from({length: 13}, (_, i) => q(i)),
            zeroIndex: 0, tickNotations: Array.from({length: 13}, (_, i) => notation(q(i))), stepNotation: notation(q(1))});
        expect(guard(build(fixture({frame: {x: wideAxis(), y: wideAxis()}})))).toBe(true);
        const maximum = Number.MAX_SAFE_INTEGER, half = q(maximum, 2), ticks = [q(-maximum), q(-maximum, 2), q(0), half, q(maximum)];
        const frame = {x: makeCoordinateAxis(q(1), 0, 1, 'integer'), y: {minimum: ticks[0]!, maximum: ticks[4]!, step: half, ticks,
            zeroIndex: 2, tickNotations: ticks.map(notation), stepNotation: notation(half)}};
        const safe = build(fixture({slope: half, intercept: half, maximum: 1, inputs: [q(0), q(1)], frame}));
        expect(safe.graph.window).toEqual({minimumInput: q(0), maximumInput: q(1)}); expect(guard(safe)).toBe(true);
    });
});

describe('strict full common proof validation', () => {
    it('rejects false physical/domain/unit meanings and incoherent source facts', () => {
        const data = build(fixture());
        const mutations: ((value: any) => void)[] = [value => {value.input.quantityId = value.output.quantityId;}, value => {value.output.symbolId = 't';},
            value => {value.input.symbol = '2t';}, value => {value.input.meaning = 'area';}, value => {value.output.meaning = 'duration';},
            value => {value.input.domain.minimum = q(-1);}, value => {value.input.domain.maximum = q(0);}, value => {value.output.domain.kind = 'integer';},
            value => {value.output.domain.maximum = q(7);}, value => {value.output.domain.minimum = q(2);},
            value => {value.context.kind = 'unknown';}, value => {value.context.durationQuantityId = 'other';}, value => {value.context.costQuantityId = 'other';},
            value => {value.context.hourlyCharge = q(3);}, value => {value.context.hourlyChargeNotation = notation(q(3));},
            value => {value.context.initialCharge = q(-1);}, value => {value.context.initialChargeNotation = notation(q(2));},
            value => {value.input.unit.name = 'minutes';}, value => {value.output.unit.name = 'euros';},
            value => {value.context.initialUnit = meters;}, value => {value.context.rateUnit.subject = 'length';},
            value => {value.input.unit = dollars; value.context.rateUnit = unit('number', 'number');},
            value => {value.output.unit.subject = 'area';}];
        for (const edit of mutations) expect(guard(changed(data, edit))).toBe(false);
        for (const kind of ['constant-speed', 'constant-production', 'item-purchase'] as const) {
            const source = build(fixture({kind}));
            expect(guard(changed(source, value => {value.context[kind === 'constant-speed' ? 'speed' : kind === 'constant-production' ? 'lengthPerTime' : 'itemPrice'] = q(0);}))).toBe(false);
        }
        const count = build(fixture({kind: 'item-purchase'}));
        expect(guard(changed(count, value => {value.input.domain.minimum = q(1, 2);}))).toBe(false);
        expect(() => build(changed(fixture(), value => {value.output.domain.maximum = q(7);}))).toThrow(GeneratorValidationError);
    });
    it('rejects original-tree, universal-coefficient, quantity-symbol and endpoint proof forgeries', () => {
        const data = build(fixture());
        const mutations: ((value: any) => void)[] = [value => {value.equation.inputSymbolId = 'other';}, value => {value.equation.outputSymbolId = 't';},
            value => {value.equation.slope = q(-2);}, value => {value.equation.intercept = q(-1);}, value => {value.equation.slopeNotation = notation(q(3));},
            value => {value.equation.right.id = 'other';}, value => {value.lawProof.proofDomain.symbols[0].symbol = 'x';},
            value => {value.lawProof.proofDomain.symbols[0].domain.kind = 'integer';}, value => {value.lawProof.rhsExpression.domainId = 'other';},
            value => {value.lawProof.normalization.steps[0].value = q(3);}, value => {value.lawProof.normalization.rootNormalForm.coefficients = [];},
            value => {value.domainImage.imageKind = 'discrete-endpoint-envelope';}, value => {value.domainImage.atMaximumInput.input = q(3);},
            value => {value.domainImage.atMinimumInput.output = q(2);}];
        for (const edit of mutations) expect(guard(changed(data, edit))).toBe(false);
        for (const right of [n('constant', q(1)), binary('quadratic', 'multiplication', v('a'), v('b')),
            binary('variable-divisor', 'division', n('one', q(1)), v()), {...v(), symbolId: 'result'}, {id: 'power', kind: 'power', base: v(), exponent: 1} as Node]) {
            expect(() => build(fixture({right}))).toThrow(GeneratorValidationError);
        }
    });
    it('rejects forged original-ID substitution, arithmetic, notation and incomplete row-point maps', () => {
        const data = build(fixture());
        const mutations: ((value: any) => void)[] = [value => {value.table[1].value.scaledInput = q(3);}, value => {value.table[1].value.output = q(4);},
            value => {value.table[1].value.inputNotation = notation(q(2));}, value => {value.table[1].value.scaledInputNotation = notation(q(3));},
            value => {value.table[1].value.evaluation.binding.symbolId = 'result';}, value => {value.table[1].value.evaluation.binding.value = q(2);},
            value => {value.table[1].value.evaluation.binding.notation = {kind: 'fraction', numerator: 2, denominator: 2};},
            value => {value.table[1].value.evaluation.replacements = [];}, value => {value.table[1].value.evaluation.replacements[0].symbolId = 'result';},
            value => {value.table[1].value.evaluation.replacements[0].occurrenceNodeId = 'other';},
            value => {value.table[1].value.evaluation.calculation.expression.left.right.id = 'other';},
            value => {value.table[1].value.evaluation.calculation.finalValue = q(4);},
            value => {value.table[1].rowId = value.table[0].rowId;}, value => {value.table.reverse();}, value => {value.table = [value.table[0]];},
            value => {value.graph.tablePoints.pop();}, value => {value.graph.tablePoints[1].rowId = value.graph.tablePoints[0].rowId;},
            value => {value.graph.tablePoints[1].point.y.value = q(4);}, value => {value.graph.tablePoints[1].point.x.notation = notation(q(2));},
            value => {value.graph.tablePoints[1].point.id = value.graph.tablePoints[0].point.id;}];
        for (const edit of mutations) expect(guard(changed(data, edit))).toBe(false);
        expect(() => build(fixture({inputs: [q(1), q(0)]}))).toThrow(GeneratorValidationError);
        expect(() => build(fixture({kind: 'item-purchase', inputs: [q(0), q(1, 2)]}))).toThrow(GeneratorValidationError);
    });
    it('rejects incomplete/cropped/connected graph claims or silently rounded positions', () => {
        const data = build(fixture()), count = build(fixture({kind: 'item-purchase'}));
        const mutations: ((value: any) => void)[] = [value => {value.graph.horizontalQuantityId = value.output.quantityId;}, value => {value.graph.verticalQuantityId = value.input.quantityId;},
            value => {value.graph.window.maximumInput = q(3);}, value => {value.graph.geometry.lastBoundary = 'window-cut';},
            value => {value.graph.geometry.firstBoundary = 'window-cut';}, value => {value.graph.geometry.last = value.graph.geometry.first;},
            value => {value.graph.geometry.kind = 'discrete-points';}, value => {value.graph.axes.x.ticks[1] = q(1, 3);}];
        for (const edit of mutations) expect(guard(changed(data, edit))).toBe(false);
        for (const edit of [(value: any) => {value.graph.geometry.visibleValues.splice(1, 1);},
            (value: any) => {value.graph.geometry.visibleValues[1] = value.graph.geometry.visibleValues[0];},
            (value: any) => {value.graph.geometry = data.graph.geometry;}]) expect(guard(changed(count, edit))).toBe(false);
        expect(() => build(fixture({frame: {x: makeCoordinateAxis(q(1), 0, 4, 'integer'), y: makeCoordinateAxis(q(2), 0, 4, 'integer')}}))).toThrow(GeneratorValidationError);
        expect(() => build(fixture({frame: {x: makeCoordinateAxis(q(1), -4, 0, 'integer'), y: makeCoordinateAxis(q(1), 0, 9, 'integer')}}))).toThrow(GeneratorValidationError);
        expect(() => build(fixture({kind: 'item-purchase', frame: {x: makeCoordinateAxis(q(2), 0, 2, 'integer'), y: makeCoordinateAxis(q(1), 0, 9, 'integer')}, inputs: [q(0), q(2), q(4)]}))).toThrow(GeneratorValidationError);
    });
    it('is total for sparse, cyclic, throwing and absent data without speculative allocations', () => {
        const source = build(fixture()), cycle: any = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        const invalid = [undefined, null, [], {}, {get kind() {throw Error('accessor');}},
            changed(source, value => {value.table = new Array(2 ** 32 - 1);}),
            changed(source, value => {value.graph.axes.x.ticks = new Array(2 ** 32 - 1);}),
            changed(source, value => {value.equation.right = cycle;}),
            changed(source, value => {value.domainImage.atMinimumInput.evaluation.replacements = new Array(2 ** 32 - 1);}),
            changed(source, value => {value.lawProof.normalization.steps = new Array(2 ** 32 - 1);}),
            changed(source, value => {Object.defineProperty(value.context, 'kind', {get() {throw Error('accessor');}});})];
        for (const value of invalid) expect(guard(value)).toBe(false);
        for (const value of [null, {}, changed(fixture(), value => {value.tableInputs = new Array(2);})]) expect(() => build(value as never)).toThrow(GeneratorValidationError);
    });
});

import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AffineQuantityContext, AlgebraCovariationBackbone, AlgebraCovariationProblem, AlgebraicScalar,
    AlgebraicUnit, CovariationDependencyProof, CovariationOriginProof, CovaryingInputQuantity,
    CovaryingOutputQuantity, ExactSymbolicExpressionNode as Node} from '../../types/problems.ts';
import {makeCoordinateAxis} from '../coordinate/coordinate-helpers.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {buildAlgebraCovariationBackbone} from './algebra-covariation-backbone-helpers.ts';
import {buildCovariationDependencyProof as dependency, buildCovariationOriginProof as origin,
    isAlgebraCovariationProblem as guard} from './algebra-covariation-helpers.ts';

const q = (numerator: number, denominator = 1): AlgebraicScalar => makeSignedRational(numerator, denominator);
const numeral = (id: string, value: AlgebraicScalar): Node => ({id, kind: 'number', value,
    notation: value.denominator === 1 ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value}});
const atom = (id: string): Node => ({id, kind: 'variable', symbolId: 'input-symbol'});
const product = (id: string, value: AlgebraicScalar, variableId: string): Node => ({id, kind: 'binary', operation: 'multiplication', left: numeral(`${id}-rate`, value), right: atom(variableId)});
const dimensions = (currency: number, time: number, count: number, length: number) => ({currency, time, count, length});
const hours: AlgebraicUnit = {subject: 'time', name: 'hours', dimensions: dimensions(0, 1, 0, 0)};
const meters: AlgebraicUnit = {subject: 'length', name: 'meters', dimensions: dimensions(0, 0, 0, 1)};
const dollars: AlgebraicUnit = {subject: 'money', name: 'dollars', dimensions: dimensions(1, 0, 0, 0)};
const items: AlgebraicUnit = {subject: 'item', name: 'items', dimensions: dimensions(0, 0, 1, 0)};
const moneyRate: AlgebraicUnit = {subject: 'money', name: 'dollars per hours', dimensions: dimensions(1, -1, 0, 0)};
const lengthRate: AlgebraicUnit = {subject: 'length', name: 'meters per hours', dimensions: dimensions(0, -1, 0, 1)};
const itemRate: AlgebraicUnit = {subject: 'money', name: 'dollars per items', dimensions: dimensions(1, 0, -1, 0)};
const spelling = (value: AlgebraicScalar) => value.denominator === 1 ? {kind: 'integer' as const, numeral: String(value.numerator)} : {kind: 'fraction' as const, ...value};
const changed = <T>(source: T, edit: (value: any) => void): T => {const value = structuredClone(source); edit(value); return value;};

function backbone(kind: AffineQuantityContext['kind'] = 'rental-charge', repeated = false, crop = false): AlgebraCovariationBackbone {
    const purchase = kind === 'item-purchase', speed = kind === 'constant-speed';
    const rate = purchase || speed ? q(2) : q(3, 2), initial = speed ? q(0) : purchase ? q(1) : q(3);
    const input: CovaryingInputQuantity = purchase
        ? {quantityId: 'input-quantity', symbolId: 'input-symbol', symbol: 'n', meaning: 'item-count', unit: items,
            domain: {kind: 'integer', minimum: q(0), maximum: q(3)}}
        : {quantityId: 'input-quantity', symbolId: 'input-symbol', symbol: 't',
            meaning: speed ? 'elapsed-time' : kind === 'rental-charge' ? 'rental-duration' : 'production-time', unit: hours,
            domain: {kind: 'real', minimum: q(0), maximum: q(4)}};
    const output: CovaryingOutputQuantity = {quantityId: 'output-quantity', symbolId: 'output-symbol', symbol: 'y',
        meaning: speed ? 'distance-traveled' : purchase ? 'total-cost' : kind === 'rental-charge' ? 'rental-cost' : 'total-length',
        unit: speed || kind === 'constant-production' ? meters : dollars, domain: {kind: 'real', minimum: q(0), maximum: q(20)}};
    let context: AffineQuantityContext;
    if (speed) context = {kind: 'constant-speed', timeQuantityId: input.quantityId, distanceQuantityId: output.quantityId,
        speed: rate, speedNotation: spelling(rate), rateUnit: lengthRate, initialUnit: meters};
    else if (purchase) context = {kind: 'item-purchase', countQuantityId: input.quantityId, costQuantityId: output.quantityId,
        itemPrice: rate, itemPriceNotation: spelling(rate), fixedCharge: initial, fixedChargeNotation: spelling(initial), rateUnit: itemRate, initialUnit: dollars};
    else if (kind === 'rental-charge') context = {kind: 'rental-charge', durationQuantityId: input.quantityId, costQuantityId: output.quantityId,
        hourlyCharge: rate, hourlyChargeNotation: spelling(rate), initialCharge: initial, initialChargeNotation: spelling(initial), rateUnit: moneyRate, initialUnit: dollars};
    else context = {kind: 'constant-production', timeQuantityId: input.quantityId, lengthQuantityId: output.quantityId,
        lengthPerTime: rate, lengthPerTimeNotation: spelling(rate), initialLength: initial, initialLengthNotation: spelling(initial), rateUnit: lengthRate, initialUnit: meters};
    const right: Node = repeated
        ? {id: 'main-rhs', kind: 'binary', operation: 'addition',
            left: {id: 'left-sum', kind: 'binary', operation: 'addition', left: numeral('initial', initial), right: product('first-product', q(3, 4), 'first-input')},
            right: product('second-product', q(3, 4), 'second-input')}
        : {id: 'main-rhs', kind: 'binary', operation: 'addition', left: product('rate-product', rate, 'original-input'), right: numeral('initial', initial)};
    const tableValues = crop ? [q(0), q(2)] : purchase ? [q(0), q(2), q(3)] : [q(0), q(2), q(4)];
    return buildAlgebraCovariationBackbone({input, output, context, right,
        tableInputs: [{input: tableValues[0]!, inputNotation: spelling(tableValues[0]!)},
            {input: tableValues[1]!, inputNotation: spelling(tableValues[1]!)},
            ...tableValues.slice(2).map(value => ({input: value, inputNotation: spelling(value)}))],
        axes: {x: makeCoordinateAxis(purchase ? q(1) : q(1, 2), 0, purchase ? 3 : 8, 'fraction'),
            y: makeCoordinateAxis(purchase || speed ? q(1) : q(3, 2), 0, crop ? 4 : purchase || speed ? 8 : 6, 'fraction')}});
}
function complete(common: AlgebraCovariationBackbone, proofCount: 0 | 1 | 2 = 2): AlgebraCovariationProblem {
    // Separate proof occurrences from common immutable objects so a proof mutation
    // cannot accidentally mutate the backbone and fail before the selected guard.
    const proofs = proofCount === 0 ? [] : proofCount === 1 ? [dependency(common)] : [dependency(common), origin(common)];
    return {...common, selectedRelations: JSON.parse(JSON.stringify(proofs))};
}

/** Selected witnesses are literal, independently of the two selected-proof constructors. */
function literalSelected(common: AlgebraCovariationBackbone): readonly [CovariationDependencyProof, CovariationOriginProof] {
    const expressionId = common.lawProof.rhsExpression.expressionId;
    const equal = (value: AlgebraicScalar) => ({kind: 'binary' as const, operation: 'subtraction' as const, operands: [value, value] as const, result: q(0)});
    return [{kind: 'designated-quantity-dependency',
        inputIncidence: {quantityId: 'input-quantity', symbolId: 'input-symbol', domainQuantityId: 'input-quantity',
            occurrenceNodeIds: ['first-input', 'second-input'], horizontalQuantityId: 'input-quantity'},
        outputIncidence: {quantityId: 'output-quantity', symbolId: 'output-symbol', domainQuantityId: 'output-quantity',
            isolatedLeftSymbolId: 'output-symbol', rightRootNodeId: 'main-rhs', verticalQuantityId: 'output-quantity'},
        lawExpressionId: expressionId, endpointInputValues: [q(0), q(4)]},
    {kind: 'quantitative-origin', quantitySymbols: [
        {quantityId: 'input-quantity', symbolId: 'input-symbol', domainQuantityId: 'input-quantity'},
        {quantityId: 'output-quantity', symbolId: 'output-symbol', domainQuantityId: 'output-quantity'}],
        rateLink: {source: 'hourlyCharge', expressionId, rootNodeId: 'main-rhs', inputSymbolId: 'input-symbol', equality: equal(q(3, 2))},
        initialLink: {source: 'initialCharge', expressionId, rootNodeId: 'main-rhs', equality: equal(q(3))},
        unitRelations: [{operation: 'multiplication', first: moneyRate, second: hours, result: dollars},
            {operation: 'addition', first: dollars, second: dollars, result: dollars}]}];
}

describe('selected exact affine covariation relations', () => {
    it('accepts independently authored complete original-incidence and fact/unit proofs', () => {
        const common = backbone('rental-charge', true), selectedRelations = literalSelected(common);
        expect(guard({...common, selectedRelations})).toBe(true);
        expect(dependency(common)).toEqual(selectedRelations[0]);
        expect(origin(common)).toEqual(selectedRelations[1]);
        expect(selectedRelations[1].rateLink.equality.operands).toEqual([q(3, 2), q(3, 2)]);
        expect(common.equation.right.kind === 'binary' && common.equation.right.left.kind).toBe('binary');
    });

    it.each(['constant-speed', 'rental-charge', 'item-purchase', 'constant-production'] as const)('derives actual %s sources and accepts all three selected tuples', kind => {
        const common = backbone(kind), proof = origin(common);
        const names = {'constant-speed': ['speed', 'zero-distance-origin'], 'rental-charge': ['hourlyCharge', 'initialCharge'],
            'item-purchase': ['itemPrice', 'fixedCharge'], 'constant-production': ['lengthPerTime', 'initialLength']} as const;
        expect([proof.rateLink.source, proof.initialLink.source]).toEqual(names[kind]);
        for (const equality of [proof.rateLink.equality, proof.initialLink.equality]) {
            expect(equality.operation).toBe('subtraction');
            const [first, second] = equality.operands;
            expect(BigInt(first.numerator) * BigInt(second.denominator) - BigInt(second.numerator) * BigInt(first.denominator)).toBe(0n);
            expect(equality.result).toEqual(q(0));
        }
        for (const count of [0, 1, 2] as const) expect(guard(complete(common, count))).toBe(true);
    });

    it('accepts coherent alternate occurrence/quantity-row ordering and exact unit aliases', () => {
        const data = complete(backbone('rental-charge', true));
        const alternate = changed(data, value => {
            value.selectedRelations[0].inputIncidence.occurrenceNodeIds.reverse();
            value.selectedRelations[1].quantitySymbols.reverse();
            value.selectedRelations[1].unitRelations[0].first.name = 'dollar per hour';
            value.selectedRelations[1].unitRelations[0].second.name = 'hour';
            value.selectedRelations[1].unitRelations[0].result.name = 'dollar';
        });
        expect(guard(alternate)).toBe(true);
    });

    it('retains all canceled original input incidences and does not infer roles from a simplified map', () => {
        const common = backbone(), input = common.input;
        const right: Node = {id: 'with-cancellation', kind: 'binary', operation: 'addition',
            left: {id: 'canceled-group', kind: 'group', expression: {id: 'cancel', kind: 'binary', operation: 'subtraction', left: atom('canceled-first'), right: atom('canceled-second')}},
            right: {id: 'law-group', kind: 'group', expression: common.equation.right}};
        const expanded = buildAlgebraCovariationBackbone({input, output: common.output, context: common.context, right,
            tableInputs: [{input: q(0), inputNotation: spelling(q(0))}, {input: q(4), inputNotation: spelling(q(4))}], axes: common.graph.axes});
        const data = complete(expanded);
        expect(dependency(expanded).inputIncidence.occurrenceNodeIds).toEqual(['canceled-first', 'canceled-second', 'original-input']);
        expect(guard(data)).toBe(true);
        expect(guard(changed(data, value => {value.selectedRelations[0].inputIncidence.occurrenceNodeIds.splice(0, 2);}))).toBe(false);
    });

    it('accepts a true clipped graph with a full-domain endpoint proof distinct from the graph window', () => {
        const common = backbone('rental-charge', true, true), proof = dependency(common);
        expect(common.graph.window.maximumInput).toEqual(q(2));
        expect(proof.endpointInputValues).toEqual([q(0), q(4)]);
        expect(guard(complete(common))).toBe(true);
        expect(guard(changed(complete(common), value => {value.selectedRelations[0].endpointInputValues[1] = q(2);}))).toBe(false);
    });

    it('rejects every forged original role, symbol, domain, axis and law incidence', () => {
        const source = complete(backbone('rental-charge', true));
        const mutations: ((value: any) => void)[] = [
            value => {value.selectedRelations[0] = null;}, value => {value.selectedRelations[0].kind = 'role-profile';},
            value => {value.selectedRelations[0].inputIncidence = null;}, value => {value.selectedRelations[0].outputIncidence = null;},
            ...['quantityId', 'symbolId', 'domainQuantityId', 'horizontalQuantityId'].map(field => (value: any) => {value.selectedRelations[0].inputIncidence[field] = 'wrong';}),
            ...['quantityId', 'symbolId', 'domainQuantityId', 'isolatedLeftSymbolId', 'rightRootNodeId', 'verticalQuantityId'].map(field => (value: any) => {value.selectedRelations[0].outputIncidence[field] = 'wrong';}),
            value => {value.selectedRelations[0].inputIncidence.occurrenceNodeIds = ['first-input', 'first-input'];},
            value => {value.selectedRelations[0].inputIncidence.occurrenceNodeIds = ['first-input', 'unrelated'];},
            value => {value.selectedRelations[0].inputIncidence.occurrenceNodeIds = [1, 'second-input'];},
            value => {value.selectedRelations[0].inputIncidence.occurrenceNodeIds = new Array(2);},
            value => {value.selectedRelations[0].lawExpressionId = 'wrong';},
            value => {value.selectedRelations[0].endpointInputValues = [q(0)];},
            value => {value.selectedRelations[0].endpointInputValues = [q(1), q(4)];},
            value => {value.selectedRelations[0].endpointInputValues = [q(0), q(3)];}
        ];
        for (const edit of mutations) expect(guard(changed(source, edit))).toBe(false);
    });

    it('rejects wrong typed source facts, normalized targets, coefficient arithmetic and quantity-domain links', () => {
        const source = complete(backbone('rental-charge', true));
        const mutations: ((value: any) => void)[] = [
            value => {value.selectedRelations[1] = null;}, value => {value.selectedRelations[1].kind = 'modeling';},
            value => {value.selectedRelations[1].quantitySymbols = [];}, value => {value.selectedRelations[1].quantitySymbols[0] = null;},
            value => {value.selectedRelations[1].quantitySymbols[1] = value.selectedRelations[1].quantitySymbols[0];},
            value => {value.selectedRelations[1].quantitySymbols[0].quantityId = 'other';},
            value => {value.selectedRelations[1].quantitySymbols[0].symbolId = 'output-symbol';},
            value => {value.selectedRelations[1].quantitySymbols[0].domainQuantityId = 'output-quantity';},
            value => {value.selectedRelations[1].rateLink = null;}, value => {value.selectedRelations[1].initialLink = null;},
            ...['source', 'expressionId', 'rootNodeId', 'inputSymbolId'].map(field => (value: any) => {value.selectedRelations[1].rateLink[field] = 'wrong';}),
            ...['source', 'expressionId', 'rootNodeId'].map(field => (value: any) => {value.selectedRelations[1].initialLink[field] = 'wrong';}),
            value => {value.selectedRelations[1].rateLink.equality = null;},
            value => {value.selectedRelations[1].rateLink.equality.kind = 'unary';},
            value => {value.selectedRelations[1].rateLink.equality.operation = 'addition';},
            value => {value.selectedRelations[1].rateLink.equality.operands = [q(3, 2)];},
            value => {value.selectedRelations[1].rateLink.equality.operands[0] = q(2);},
            value => {value.selectedRelations[1].rateLink.equality.operands[1] = q(2);},
            value => {value.selectedRelations[1].rateLink.equality.result = q(1);},
            value => {value.selectedRelations[1].initialLink.equality.operands[0] = q(2);},
            value => {value.selectedRelations[1].initialLink.equality.operands[1] = q(2);},
            value => {value.selectedRelations[1].initialLink.equality.result = {numerator: -0, denominator: 1};}
        ];
        for (const edit of mutations) expect(guard(changed(source, edit))).toBe(false);
    });

    it('rejects same-dimension unit substitutions, wrong semantic subjects and rearranged operation tuples', () => {
        const source = complete(backbone());
        const mutations: ((value: any) => void)[] = [
            value => {value.selectedRelations[1].unitRelations = [];}, value => {value.selectedRelations[1].unitRelations[0] = null;},
            value => {value.selectedRelations[1].unitRelations.reverse();},
            value => {value.selectedRelations[1].unitRelations[0].operation = 'addition';},
            value => {value.selectedRelations[1].unitRelations[0].first = null;},
            value => {value.selectedRelations[1].unitRelations[0].first.subject = 'time';},
            value => {value.selectedRelations[1].unitRelations[0].first.name = 'euros per hours';},
            value => {value.selectedRelations[1].unitRelations[0].second.name = 'minutes';},
            value => {value.selectedRelations[1].unitRelations[0].result.name = 'euros';},
            value => {value.selectedRelations[1].unitRelations[1].first.name = 'euros';},
            value => {value.selectedRelations[1].unitRelations[1].second.name = 'euros';},
            value => {value.selectedRelations[1].unitRelations[1].result.name = 'euros';}
        ];
        for (const edit of mutations) expect(guard(changed(source, edit))).toBe(false);
    });

    it('delegates malformed common mathematics and rejects missing, sparse, cyclic or throwing selected data', () => {
        const source = complete(backbone());
        const invalid = [undefined, null, {}, [], {...source, selectedRelations: undefined}, {...source, selectedRelations: [source.selectedRelations[1]]},
            {...source, selectedRelations: new Array(2)}, {...source, selectedRelations: new Array(2 ** 32 - 1)},
            {...source, selectedRelations: [...source.selectedRelations, source.selectedRelations[0]]},
            changed(source, value => {value.equation.slope = q(2);}),
            changed(source, value => {value.context.hourlyCharge = q(2);}),
            changed(source, value => {value.selectedRelations[0].inputIncidence = value.selectedRelations[0];}),
            changed(source, value => {Object.defineProperty(value, 'selectedRelations', {get() {throw Error('accessor');}});}),
            changed(source, value => {Object.defineProperty(value.selectedRelations[1], 'rateLink', {get() {throw Error('accessor');}});})];
        for (const value of invalid) expect(guard(value)).toBe(false);
        for (const builder of [dependency, origin]) for (const value of [undefined, null, {}, {...source, context: {}}]) {
            expect(() => builder(value as never)).toThrow(GeneratorValidationError);
        }
    });
});

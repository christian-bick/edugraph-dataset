import {describe, expect, it} from 'vitest';
import type {AlgebraicDomainRestriction, AlgebraicExpressionContext, AlgebraicQuantity, AlgebraicQuantityRelation,
    AlgebraicSymbolDeclaration, AlgebraicUnit, ExactSymbolicExpressionNode as Node} from '../../types/problems.ts';
import {isAlgebraicExpressionContext as valid} from './algebra-context-helpers.ts';

let sequence = 0;
const value = (numerator: number, denominator = 1) => ({numerator, denominator});
const n = (numerator: number, denominator = 1): Node => ({id: `n${sequence++}`, kind: 'number', value: value(numerator, denominator),
    notation: denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator}});
const v = (symbolId = 'x'): Node => ({id: `v${sequence++}`, kind: 'variable', symbolId});
const copy = (node: Node): Node => {
    if (node.kind === 'binary') return {...node, id: `c${sequence++}`, left: copy(node.left), right: copy(node.right)};
    if (node.kind === 'group') return {...node, id: `c${sequence++}`, expression: copy(node.expression)};
    if (node.kind === 'power') return {...node, id: `c${sequence++}`, base: copy(node.base)};
    if (node.kind === 'negation') return {...node, id: `c${sequence++}`, operand: copy(node.operand)};
    return {...node, id: `c${sequence++}`};
};
const binary = (operation: 'addition' | 'subtraction' | 'multiplication' | 'division', a: Node, b: Node): Node => ({id: `b${sequence++}`, kind: 'binary', operation, left: copy(a), right: copy(b)});
const group = (expression: Node): Node => ({id: `g${sequence++}`, kind: 'group', expression: copy(expression)});
const power = (base: Node, exponent: number): Node => ({id: `p${sequence++}`, kind: 'power', base: copy(base), exponent});
const unit = (subject: AlgebraicUnit['subject'], name: string, currency = 0, time = 0, count = 0, length = 0): AlgebraicUnit => ({subject, name, dimensions: {currency, time, count, length}});
const dollars = unit('money', 'dollars', 1), hours = unit('time', 'hours', 0, 1), numbers = unit('number', 'number');
const meters = unit('length', 'meters', 0, 0, 0, 1);
const quantity = (quantityId: string, expression: Node, namedUnit = dollars, meaning: AlgebraicQuantity['meaning'] = 'total-amount'): AlgebraicQuantity => ({quantityId, expression, unit: namedUnit, meaning});
const symbols = (lower = 0, upper: number | null = null, integer = false): AlgebraicSymbolDeclaration[] => [{symbolId: 'x', symbol: 'x', domain: {
    kind: integer ? 'integer' : 'rational', lower: {value: value(lower), inclusive: true}, upper: upper === null ? null : {value: value(upper), inclusive: true}, excludedValues: []}}];
type Fixture = {context: AlgebraicExpressionContext; expression: Node; symbols: AlgebraicSymbolDeclaration[]; restrictions: AlgebraicDomainRestriction[]};
function fixture(quantities: AlgebraicQuantity[], relations: AlgebraicQuantityRelation[], declarations = symbols(), restrictions: AlgebraicDomainRestriction[] = []): Fixture {
    const output = quantities.at(-1)!;
    return {context: {kind: 'quantitative-system', setting: 'purchase', quantities: quantities as [AlgebraicQuantity, ...AlgebraicQuantity[]],
        relations: relations as [AlgebraicQuantityRelation, ...AlgebraicQuantityRelation[]], outputQuantityId: output.quantityId,
        variableQuantities: [{symbolId: 'x', quantityId: 'input'}]}, expression: output.expression, symbols: declarations, restrictions};
}
const accepts = (data: Fixture): boolean => valid(data.context, data.expression, data.symbols, data.restrictions);
function fixed(): Fixture {
    const base = n(3), rate = n(2), input = group(v());
    return fixture([quantity('fixed', base, dollars, 'fixed-charge'), quantity('rate', rate, unit('money', 'dollars per hour', 1, -1), 'rate'),
        quantity('input', input, hours, 'duration'), quantity('result', binary('addition', base, binary('multiplication', rate, input)))],
        [{kind: 'fixed-and-proportional', resultId: 'result', fixedId: 'fixed', rateId: 'rate', inputId: 'input'}]);
}
function pair(kind: 'combined-amounts' | 'remaining-amount' | 'equal-groups' | 'equal-sharing' | 'rectangular-measure', first = v(), second = n(3), declarations = symbols(3)): Fixture {
    const op = kind === 'combined-amounts' ? 'addition' : kind === 'remaining-amount' ? 'subtraction' : kind === 'equal-sharing' ? 'division' : 'multiplication';
    const count = kind === 'equal-groups' || kind === 'equal-sharing';
    const firstUnit = kind === 'rectangular-measure' ? meters : count && kind === 'equal-groups' ? numbers : dollars;
    const secondUnit = kind === 'rectangular-measure' ? meters : count && kind === 'equal-sharing' ? numbers : dollars;
    const resultUnit = kind === 'rectangular-measure' ? unit('area', 'square meters', 0, 0, 0, 2) : dollars;
    const result = binary(op, first, second);
    const relation: AlgebraicQuantityRelation = kind === 'combined-amounts' ? {kind, resultId: 'result', firstId: 'input', secondId: 'second'}
        : kind === 'remaining-amount' ? {kind, resultId: 'result', initialId: 'input', removedId: 'second'}
            : kind === 'equal-groups' ? {kind, resultId: 'result', groupCountId: 'input', amountPerGroupId: 'second'}
                : kind === 'equal-sharing' ? {kind, resultId: 'result', totalId: 'input', shareCountId: 'second'}
                    : {kind, resultId: 'result', lengthId: 'input', widthId: 'second'};
    return fixture([quantity('input', first, firstUnit, kind === 'equal-groups' ? 'group-count' : kind === 'equal-sharing' ? 'total-amount' : kind === 'rectangular-measure' ? 'length' : 'initial-amount'),
        quantity('second', second, secondUnit, kind === 'equal-sharing' ? 'share-count' : kind === 'equal-groups' ? 'amount-per-group' : kind === 'combined-amounts' ? 'added-amount' : kind === 'rectangular-measure' ? 'width' : 'removed-amount'),
        quantity('result', result, resultUnit, kind === 'remaining-amount' ? 'remaining-amount' : kind === 'equal-sharing' ? 'amount-per-share' : kind === 'rectangular-measure' ? 'area' : 'total-amount')], [relation], declarations,
        result.kind === 'binary' && op === 'division' ? [{kind: 'nonzero-expression', expressionNodeId: result.right.id, reason: 'division-denominator'}] : []);
}
const change = (data: Fixture, edit: (value: any) => void): Fixture => {
    const result = JSON.parse(JSON.stringify(data)); edit(result); return result;
};

describe('constructive algebra quantitative contexts', () => {
    it('accepts the canonical fixed-charge graph over the entire nonnegative time domain', () => {
        const data = fixed();
        expect(accepts(data)).toBe(true);
        expect(accepts(change(data, row => { row.context.quantities.reverse(); row.context.relations.reverse(); }))).toBe(true);
        expect(accepts(change(data, row => { row.symbols[0].domain.lower = null; }))).toBe(false);
        expect(accepts(change(data, row => { row.symbols[0].domain.lower.value = value(-1); }))).toBe(false);
    });

    it('validates parameter descriptions exactly and permits no unbound/spurious symbol', () => {
        const expression = binary('addition', v(), n(3));
        const context = {kind: 'parameter-description', parameters: [{symbolId: 'x', meaning: 'number'}], resultMeaning: 'number'};
        expect(valid(context, expression, symbols(), [])).toBe(true);
        for (const bad of [{...context, resultMeaning: 'amount'}, {...context, parameters: []}, {...context, parameters: new Array(1)},
            {...context, parameters: [{symbolId: 'other', meaning: 'number'}]}, {...context, parameters: [{symbolId: 'x', meaning: 'money'}]}]) expect(valid(bad, expression, symbols(), [])).toBe(false);
        expect(valid(context, n(3), symbols(), [])).toBe(false);
        expect(valid(context, expression, symbols(-3), [])).toBe(true);
        const powered = power(v(), 0);
        expect(valid(context, powered, symbols(-3), [{kind: 'nonzero-expression', expressionNodeId: powered.kind === 'power' ? powered.base.id : '', reason: 'zero-exponent-base'}])).toBe(true);
    });

    it('proves remaining amounts by domain separation, not by one convenient binding', () => {
        expect(accepts(pair('remaining-amount'))).toBe(true);
        expect(accepts(pair('remaining-amount', v(), n(3), symbols(0)))).toBe(false);
        const finite = pair('remaining-amount', v(), n(3), symbols(3, 5));
        expect(accepts(finite)).toBe(true);
        const swapped = pair('remaining-amount', n(10), v(), symbols(1, 10));
        if (swapped.context.kind === 'quantitative-system') swapped.context = {...swapped.context, variableQuantities: [{symbolId: 'x', quantityId: 'second'}]};
        expect(accepts(swapped)).toBe(true);
        expect(accepts(change(swapped, row => { row.symbols[0].domain.upper = null; }))).toBe(false);
    });

    it('admits integer count domains, fractional measured domains and exact named dimension cancellation', () => {
        expect(accepts(pair('equal-groups', v(), n(3), symbols(0, null, true)))).toBe(true);
        expect(accepts(pair('equal-groups', v(), n(3), symbols()))).toBe(false);
        expect(accepts(pair('equal-sharing', v(), n(2), symbols()))).toBe(true);
        expect(accepts(pair('rectangular-measure', v(), n(3, 2), symbols()))).toBe(true);
        const zeroCount = pair('equal-groups', v(), n(0), symbols(0, null, true));
        expect(accepts(zeroCount)).toBe(true);
        const named = fixed();
        expect(accepts(change(named, row => { row.context.quantities[2].unit.name = 'hour'; }))).toBe(true);
        expect(accepts(change(named, row => { row.context.quantities[2].unit.name = 'minutes'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[0].unit.name = 'euros'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[1].unit.name = 'dollars / hours'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[1].unit.name = 'dollars per square per hour'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[1].unit.name = 'dollars per hour per item'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[0].unit.subject = 'area'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[0].unit.dimensions.currency = -0; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[0].unit.subject = 'other'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[0].meaning = 'initial-amount'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[1].meaning = 'removed-amount'; }))).toBe(false);
        expect(accepts(change(named, row => { row.context.quantities[2].meaning = 'width'; }))).toBe(false);
        expect(accepts(change(named, row => {
            row.context.quantities[2].unit = dollars; row.context.quantities[1].unit = numbers;
        }))).toBe(false);
        expect(accepts(change(named, row => {
            row.context.quantities[0].unit.name = 'foo'; row.context.quantities[2].unit.name = 'foo';
            row.context.quantities[1].unit.name = 'foo per foo'; row.context.quantities[3].unit.name = 'foo';
        }))).toBe(false);
        const multiple = pair('combined-amounts', v(), n(3));
        expect(accepts(change(multiple, row => {
            row.context.quantities[0].unit = unit('money', 'foo', 1);
            row.context.quantities[1].unit = unit('money', 'foo per bar', 1);
            row.context.quantities[2].unit = unit('money', 'foo', 1);
        }))).toBe(false);
        expect(accepts(change(multiple, row => {
            for(const quantity of row.context.quantities) quantity.unit = unit('money', 'foo per bar', 1);
        }))).toBe(false);
        const tickets = pair('equal-groups', v(), n(3), symbols(0, null, true));
        expect(accepts(change(tickets, row => {
            row.context.quantities[0].unit = unit('item', 'groups', 0, 0, 1);
            row.context.quantities[1].unit = unit('item', 'tickets per group');
            row.context.quantities[2].unit = unit('item', 'tickets', 0, 0, 1);
        }))).toBe(true);
        expect(accepts(change(tickets, row => {
            row.context.quantities[1].unit = unit('item', 'hours per minute');
        }))).toBe(false);
        expect(accepts(change(named, row => {
            row.context.quantities[0].unit.name = 'credits'; row.context.quantities[1].unit.name = 'credits per hour';
            row.context.quantities[3].unit.name = 'credits';
        }))).toBe(true);
        const rectangle = pair('rectangular-measure', v(), n(3), symbols());
        expect(accepts(change(rectangle, row => {
            row.context.quantities[0].meaning = 'area'; row.context.quantities[0].unit = unit('area', 'square meters', 0, 0, 0, 2);
            row.context.quantities[1].meaning = 'input-number'; row.context.quantities[1].unit = numbers;
        }))).toBe(false);
    });

    it('retains exact original nonzero restrictions and proves positive share counts over their whole domains', () => {
        const data = pair('equal-sharing', n(10), v(), symbols());
        if (data.context.kind === 'quantitative-system') data.context = {...data.context, variableQuantities: [{symbolId: 'x', quantityId: 'second'}]};
        // A rational share count is not a count, even after excluding zero.
        expect(accepts(data)).toBe(false);
        const integers = change(data, row => { row.symbols[0].domain.kind = 'integer'; });
        expect(accepts(integers)).toBe(true);
        expect(accepts(change(integers, row => { row.restrictions = []; }))).toBe(false);
        expect(accepts(change(integers, row => { row.restrictions[0].expressionNodeId = 'missing'; }))).toBe(false);
        expect(accepts(change(integers, row => { row.restrictions[0].reason = 'zero-exponent-base'; }))).toBe(false);
        expect(accepts(change(integers, row => { row.restrictions.push(row.restrictions[0]); }))).toBe(false);
        const zero = pair('equal-sharing', n(0), v(), symbols(0, null, true));
        if (zero.context.kind === 'quantitative-system') zero.context = {...zero.context, variableQuantities: [{symbolId: 'x', quantityId: 'second'}]};
        expect(accepts(zero)).toBe(true);
        expect(accepts(pair('equal-sharing', v(), n(0), symbols()))).toBe(false);
    });

    it('uses actual integer bounds and exclusions rather than rational endpoint approximations', () => {
        const data = pair('equal-groups', v(), n(3), symbols(0, 4, true));
        expect(accepts(change(data, row => { row.symbols[0].domain.lower = {value: value(-1, 2), inclusive: false};
            row.symbols[0].domain.upper = {value: value(9, 2), inclusive: false}; row.symbols[0].domain.excludedValues = [value(0), value(4)]; }))).toBe(true);
        expect(accepts(change(data, row => { row.symbols[0].domain.lower.inclusive = false; row.symbols[0].domain.upper.inclusive = false; }))).toBe(true);
        const singleton = pair('equal-groups', v(), n(3), symbols(2, 2));
        expect(accepts(singleton)).toBe(true);
        const measured = pair('combined-amounts', v(), n(3), symbols(0, 4));
        expect(accepts(change(measured, row => { row.symbols[0].domain.excludedValues = [value(0), value(4)]; }))).toBe(true);
    });

    it('requires integrality of count-valued sharing for all admitted values', () => {
        const data = pair('equal-sharing', v(), n(2), symbols(0, null, true));
        expect(accepts(change(data, row => { for (const quantity of row.context.quantities) if(quantity.quantityId !== 'second') {
            quantity.unit = unit('item', 'tickets', 0, 0, 1); } }))).toBe(false);
        const identity = pair('equal-sharing', v(), n(1), symbols(0, null, true));
        expect(accepts(change(identity, row => { for (const quantity of row.context.quantities) if(quantity.quantityId !== 'second') {
            quantity.unit = unit('item', 'tickets', 0, 0, 1); } }))).toBe(true);
        const fixed = pair('equal-sharing', v(), n(2), symbols(4, 4, true));
        expect(accepts(change(fixed, row => { for (const quantity of row.context.quantities) if(quantity.quantityId !== 'second') {
            quantity.unit = unit('item', 'tickets', 0, 0, 1); } }))).toBe(true);
    });

    it('propagates exact rational divisibility proofs through count graphs without assuming variable division is integral', () => {
        const tickets = unit('item', 'tickets', 0, 0, 1);
        const input = v(), size = n(2), total = binary('multiplication', input, size), share = n(2);
        for(const offset of [false, true]) {
            const added = n(1), odd = binary('addition', total, added);
            const numerator = offset ? odd : total, result = binary('division', numerator, share);
            const quantities = [quantity('input', input, numbers, 'group-count'), quantity('size', size, tickets, 'amount-per-group'), quantity('total', total, tickets)];
            const relations: AlgebraicQuantityRelation[] = [{kind: 'equal-groups', resultId: 'total', groupCountId: 'input', amountPerGroupId: 'size'}];
            if(offset) {
                quantities.push(quantity('added', added, tickets, 'added-amount'), quantity('odd', odd, tickets));
                relations.push({kind: 'combined-amounts', resultId: 'odd', firstId: 'total', secondId: 'added'});
            }
            quantities.push(quantity('share', share, numbers, 'share-count'), quantity('result', result, tickets, 'amount-per-share'));
            relations.push({kind: 'equal-sharing', resultId: 'result', totalId: offset ? 'odd' : 'total', shareCountId: 'share'});
            const data = fixture(quantities, relations, symbols(0, null, true), [{kind: 'nonzero-expression',
                expressionNodeId: result.kind === 'binary' ? result.right.id : '', reason: 'division-denominator'}]);
            expect(accepts(data)).toBe(!offset);
        }
        const dividend = binary('multiplication', input, size), result = binary('division', dividend, v('y'));
        const variableDivisor = fixture([quantity('input', input, numbers, 'group-count'), quantity('size', size, tickets, 'amount-per-group'),
            quantity('total', dividend, tickets), quantity('share', v('y'), numbers, 'share-count'), quantity('result', result, tickets, 'amount-per-share')],
        [{kind: 'equal-groups', resultId: 'total', groupCountId: 'input', amountPerGroupId: 'size'},
            {kind: 'equal-sharing', resultId: 'result', totalId: 'total', shareCountId: 'share'}], symbols(1, null, true),
        [{kind: 'nonzero-expression', expressionNodeId: result.kind === 'binary' ? result.right.id : '', reason: 'division-denominator'}]);
        variableDivisor.symbols.push({...symbols(1, null, true)[0]!, symbolId: 'y', symbol: 'y'});
        if(variableDivisor.context.kind === 'quantitative-system') variableDivisor.context = {...variableDivisor.context,
            variableQuantities: [{symbolId: 'x', quantityId: 'input'}, {symbolId: 'y', quantityId: 'share'}]};
        // An arbitrary positive variable denominator has no whole-domain quotient-integrality proof.
        expect(accepts(variableDivisor)).toBe(false);
        expect(accepts(change(variableDivisor, row => {
            for(const quantity of row.context.quantities) if(['size','total','result'].includes(quantity.quantityId)) quantity.unit = dollars;
        }))).toBe(true);
        expect(accepts(pair('combined-amounts', v(), n(-1), symbols()))).toBe(false);
    });

    it('accepts cube volume/surface area as exact powers or expanded products, with cubic/square named units', () => {
        for (const measure of ['volume', 'surface-area'] as const) for(const expanded of [false, true]) {
            const edge = v(), degree = measure === 'volume' ? 3 : 2;
            const product = degree === 3 ? binary('multiplication', binary('multiplication', edge, edge), edge) : binary('multiplication', edge, edge);
            const base = expanded ? product : power(edge, degree);
            const expression = measure === 'volume' ? base : binary('multiplication', n(6), base.kind === 'binary' ? group(base) : base);
            const data = fixture([quantity('input', edge, meters, 'edge'), quantity('result', expression,
                unit(measure === 'volume' ? 'volume' : 'area', measure === 'volume' ? 'cubic meters' : 'square meters', 0, 0, 0, degree), measure === 'volume' ? 'volume' : 'area')],
                [{kind: 'cubical-measure', resultId: 'result', edgeId: 'input', measure}], symbols());
            expect(accepts(data)).toBe(true);
            expect(accepts(change(data, row => { row.context.quantities[1].unit.name = 'meters'; }))).toBe(false);
            expect(accepts(change(data, row => { row.context.relations[0].measure = 'perimeter'; }))).toBe(false);
            expect(accepts(change(data, row => {
                const expression = binary('addition', v(), n(1)); row.expression = expression; row.context.quantities[1].expression = expression;
            }))).toBe(false);
        }
    });

    it('checks complete multistage graphs, shared inputs, open ranges and zero results', () => {
        const input = v(), added = n(3), sum = binary('addition', input, added), removed = n(1), result = binary('subtraction', sum, removed);
        const graph = fixture([quantity('input', input, dollars, 'initial-amount'), quantity('added', added, dollars, 'added-amount'),
            quantity('sum', sum), quantity('removed', removed, dollars, 'removed-amount'), quantity('result', result, dollars, 'remaining-amount')],
            [{kind: 'combined-amounts', resultId: 'sum', firstId: 'input', secondId: 'added'},
                {kind: 'remaining-amount', resultId: 'result', initialId: 'sum', removedId: 'removed'}], symbols(0, 4));
        expect(accepts(graph)).toBe(true);
        const twice = pair('combined-amounts', v(), v(), symbols(0, 4));
        if (twice.context.kind === 'quantitative-system') {
            const context = twice.context;
            // One primitive variable identity may be used twice in a definition, not duplicated as another quantity.
            twice.context = {...context, quantities: [context.quantities[0], context.quantities[2]],
                relations: [{kind: 'combined-amounts', resultId: 'result', firstId: 'input', secondId: 'input'}]};
        }
        expect(accepts(twice)).toBe(true);
        const zero = fixed();
        expect(accepts(change(zero, row => {
            row.context.quantities[1].expression.value = value(0); row.context.quantities[1].expression.notation.numeral = '0';
            const expression = binary('addition', row.context.quantities[0].expression, binary('multiplication', row.context.quantities[1].expression, row.context.quantities[2].expression));
            row.expression = expression; row.context.quantities[3].expression = expression;
        }))).toBe(true);
        const sharing = pair('equal-sharing', n(10), v(), symbols(0, null, true));
        if(sharing.context.kind === 'quantitative-system') sharing.context = {...sharing.context, variableQuantities: [{symbolId: 'x', quantityId: 'second'}]};
        expect(accepts(sharing)).toBe(true);
        const impossible = pair('equal-sharing', n(10), v(), symbols(0, 0, true));
        if(impossible.context.kind === 'quantitative-system') impossible.context = {...impossible.context, variableQuantities: [{symbolId: 'x', quantityId: 'second'}]};
        expect(accepts(impossible)).toBe(false);
        const a = v(), b = v('y'), rectangle = pair('rectangular-measure', a, b, symbols());
        rectangle.symbols.push({...symbols(0, 4)[0]!, symbolId: 'y', symbol: 'y'});
        rectangle.symbols[0] = {...rectangle.symbols[0]!, domain: {...rectangle.symbols[0]!.domain, excludedValues: [value(0)]}};
        if(rectangle.context.kind === 'quantitative-system') rectangle.context = {...rectangle.context,
            variableQuantities: [{symbolId: 'x', quantityId: 'input'}, {symbolId: 'y', quantityId: 'second'}]};
        expect(accepts(rectangle)).toBe(true);
        rectangle.symbols[1] = {...rectangle.symbols[1]!, domain: {...rectangle.symbols[1]!.domain, excludedValues: [value(0)]}};
        expect(accepts(rectangle)).toBe(true);
        const variableSharing = pair('equal-sharing', v(), v('y'), symbols(0, 10));
        variableSharing.symbols.push({...symbols(1, null, true)[0]!, symbolId: 'y', symbol: 'y'});
        if(variableSharing.context.kind === 'quantitative-system') variableSharing.context = {...variableSharing.context,
            variableQuantities: [{symbolId: 'x', quantityId: 'input'}, {symbolId: 'y', quantityId: 'second'}]};
        expect(accepts(variableSharing)).toBe(true);
    });

    it('rejects disconnected/cyclic/dangling/false graph definitions, undeclared mappings and malformed data', () => {
        const data = fixed();
        const mutations: ((row: any) => void)[] = [row => { row.context.kind = 'other'; }, row => { row.context.setting = 'other'; },
            row => { row.context.quantities = new Array(4); }, row => { row.context.relations = []; }, row => { row.context.variableQuantities = []; },
            row => { row.context.quantities[1].quantityId = 'fixed'; }, row => { row.context.quantities[0].meaning = 'other'; },
            row => { row.context.quantities[0].expression = binary('addition', n(1), n(2)); },
            row => { row.context.outputQuantityId = 'missing'; }, row => { row.context.relations[0].resultId = 'missing'; },
            row => { row.context.relations.push(row.context.relations[0]); }, row => { row.context.relations[0].fixedId = 'result'; },
            row => { row.context.relations[0].inputId = 'missing'; }, row => { row.context.relations[0].kind = 'other'; },
            row => { row.context.variableQuantities[0].symbolId = 'other'; }, row => { row.context.variableQuantities[0].quantityId = 'result'; },
            row => { row.context.variableQuantities[0].quantityId = 'rate'; }, row => { row.context.quantities.push(quantity('extra', n(1))); },
            row => { row.context.quantities[3].expression = binary('addition', n(1), v()); },
            row => { row.expression = binary('addition', n(1), v()); }, row => { row.context.quantities[0].unit = null; },
            row => { row.context.quantities[0].unit.name = ''; }, row => { row.context.quantities[0].unit.name = 'square dollars'; },
            row => { row.context.quantities[2].expression = v('other'); }, row => { row.restrictions = new Array(1); }];
        for (const mutation of mutations) expect(accepts(change(data, mutation))).toBe(false);
        expect(valid(null, data.expression, data.symbols, [])).toBe(false);
        expect(valid(data.context, data.expression, [], [])).toBe(false);
        expect(valid({...data.context, quantities: undefined}, data.expression, data.symbols, [])).toBe(false);
    });
});

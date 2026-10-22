import type {AlgebraicDomainRestriction, AlgebraicExpressionContext, AlgebraicQuantity, AlgebraicQuantityRelation,
    AlgebraicScalar, AlgebraicSymbolDeclaration, AlgebraicUnit, ExactSymbolicExpressionNode as Node} from '../../types/problems.ts';
import {isAlgebraicDeclarations, isAlgebraicExpressionSyntax, inspectAlgebraicExpression, sameAlgebraicSyntax} from './algebra-syntax-helpers.ts';

type Rational = {n: bigint; d: bigint};
type Range = {lower: Rational; upper: Rational | null; lowerClosed: boolean; upperClosed: boolean; integral: boolean; multiple: Rational | null};
type Unit = {dimensions: readonly number[]; basis: ReadonlyMap<string, number>};
const zero = {n: 0n, d: 1n}, one = {n: 1n, d: 1n};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim() === value && value.length > 0;
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const require = (condition: unknown): void => { if (!condition) throw new Error('Invalid constructive algebraic context.'); };
const array = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const q = (value: AlgebraicScalar): Rational => ({n: BigInt(value.numerator), d: BigInt(value.denominator)});
const compare = (a: Rational, b: Rational): number => a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
const add = (a: Rational, b: Rational): Rational => ({n: a.n * b.d + b.n * a.d, d: a.d * b.d});
const subtract = (a: Rational, b: Rational): Rational => ({n: a.n * b.d - b.n * a.d, d: a.d * b.d});
const multiply = (a: Rational, b: Rational): Rational => ({n: a.n * b.n, d: a.d * b.d});
const divide = (a: Rational, b: Rational): Rational => ({n: a.n * b.d, d: a.d * b.n});
const whole = (a: Rational): boolean => a.n % a.d === 0n;
const constant = (range: Pick<Range, 'lower' | 'upper'>): Rational | null => range.upper && compare(range.lower, range.upper) === 0 ? range.lower : null;
function rationalGcd(a: Rational, b: Rational): Rational {
    let first = a.n * b.d, second = b.n * a.d;
    while (second !== 0n) [first, second] = [second, first % second];
    return {n: first, d: a.d * b.d};
}
/** Every value is an integer multiple of this exact step; null carries no lattice proof. */
function withMultiple(range: Omit<Range, 'multiple'>, step: Rational | null): Range {
    const fixed = constant(range);
    const multiple = fixed ? {n: fixed.n < 0n ? -fixed.n : fixed.n, d: fixed.d} : step;
    return {...range, multiple, integral: range.integral || multiple !== null && whole(multiple)};
}
const atom = (node: Node): Node => node.kind === 'group' ? atom(node.expression) : node;
const dimensions = ['currency', 'time', 'count', 'length'] as const;
const meanings: readonly AlgebraicQuantity['meaning'][] = ['fixed-charge', 'rate', 'duration', 'group-count', 'amount-per-group',
    'initial-amount', 'added-amount', 'removed-amount', 'remaining-amount', 'total-amount', 'share-count', 'amount-per-share',
    'length', 'width', 'edge', 'area', 'volume', 'input-number', 'output-number'];
const aliases: Readonly<Record<string, string>> = {dollars: 'dollar', euros: 'euro', hours: 'hour', minutes: 'minute', seconds: 'second',
    meters: 'meter', centimeters: 'centimeter', items: 'item', tickets: 'ticket', groups: 'group', shares: 'share'};
const knownDimensions: Readonly<Record<string, readonly number[]>> = {dollar: [1, 0, 0, 0], euro: [1, 0, 0, 0], hour: [0, 1, 0, 0],
    minute: [0, 1, 0, 0], second: [0, 1, 0, 0], meter: [0, 0, 0, 1], centimeter: [0, 0, 0, 1],
    item: [0, 0, 1, 0], ticket: [0, 0, 1, 0], group: [0, 0, 1, 0], share: [0, 0, 1, 0]};

/** Atomic base identities, optional square/cubic prefixes and one 'per'; no conversions or English stemming. */
function unit(value: unknown): Unit {
    require(record(value));
    const data = value as AlgebraicUnit;
    require(text(data.name) && record(data.dimensions) && dimensions.every(key => integer(data.dimensions[key])));
    const indices = {money: [0, 1], time: [1, 1], item: [2, 1], length: [3, 1], area: [3, 2], volume: [3, 3]} as const;
    require(data.subject === 'number' || Object.hasOwn(indices, data.subject));
    const vector = dimensions.map(key => data.dimensions[key]);
    const basis = new Map<string, number>();
    if (data.subject === 'number') {
        require(vector.every(value => value === 0) && ['number', 'numbers', 'dimensionless', 'unitless'].includes(data.name));
    } else {
        const [axis, degree] = indices[data.subject];
        require(vector[axis] === degree || data.subject === 'item' && vector[axis] === 0 && data.name.includes(' per '));
        const terms = data.name.split(' per ');
        require(terms.length <= 2);
        terms.forEach((term, index) => {
            let degree = index === 0 ? 1 : -1;
            if (term.startsWith('square ')) { degree *= 2; term = term.slice(7); }
            else if (term.startsWith('cubic ')) { degree *= 3; term = term.slice(6); }
            require(/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(term) && !/\b(per|square|cubic|times|squared|cubed)\b/.test(term));
            const name = Object.hasOwn(aliases, term) ? aliases[term]! : term;
            if (index === 0 && data.subject === 'item' && Object.hasOwn(knownDimensions, name)) require(knownDimensions[name]![2] === 1);
            basis.set(name, (basis.get(name) ?? 0) + degree);
        });
        for (const [name, degree] of basis) if (degree === 0) basis.delete(name);
        if ([...basis.keys()].every(name => Object.hasOwn(knownDimensions, name))) {
            require(vector.every((value, index) => value === [...basis].reduce((sum, [name, degree]) => sum + knownDimensions[name]![index]! * degree, 0)));
        }
    }
    return {dimensions: vector, basis};
}

function unitProduct(a: Unit, b: Unit, inverse = false): Unit {
    const sign = inverse ? -1 : 1, basis = new Map(a.basis);
    for (const [name, degree] of b.basis) {
        const result = (basis.get(name) ?? 0) + sign * degree;
        if (result === 0) basis.delete(name); else basis.set(name, result);
    }
    return {dimensions: a.dimensions.map((value, index) => value + sign * b.dimensions[index]!), basis};
}
const sameUnit = (a: Unit, b: Unit): boolean => a.dimensions.every((value, index) => value === b.dimensions[index])
    && a.basis.size === b.basis.size && [...a.basis].every(([name, degree]) => b.basis.get(name) === degree);

/** One atom has one dimension identity throughout the graph, including unknown atomic names. */
function consistentUnits(units: readonly Unit[]): void {
    const names = [...new Set(units.flatMap(value => [...value.basis.keys()]))];
    const constraints = [...units, ...names.filter(name => Object.hasOwn(knownDimensions, name))
        .map(name => ({basis: new Map([[name, 1]]), dimensions: knownDimensions[name]!}))];
    const reduced = (value: Rational): Rational => {
        let a = value.n < 0n ? -value.n : value.n, b = value.d < 0n ? -value.d : value.d;
        while (b !== 0n) [a, b] = [b, a % b];
        return {n: value.n / a, d: value.d / a};
    };
    for (let axis = 0; axis < 4; axis++) {
        const rows = constraints.map(value => [...names.map(name => ({n: BigInt(value.basis.get(name) ?? 0), d: 1n})),
            {n: BigInt(value.dimensions[axis]!), d: 1n}]);
        let pivotRow = 0;
        for (let column = 0; column < names.length; column++) {
            const pivot = rows.findIndex((row, index) => index >= pivotRow && row[column]!.n !== 0n);
            if (pivot < 0) continue;
            [rows[pivotRow], rows[pivot]] = [rows[pivot]!, rows[pivotRow]!];
            const divisor = rows[pivotRow]![column]!;
            rows[pivotRow] = rows[pivotRow]!.map(value => reduced(divide(value, divisor)));
            rows.forEach((row, index) => {
                if (index === pivotRow || row[column]!.n === 0n) return;
                const factor = row[column]!;
                rows[index] = row.map((value, field) => reduced(subtract(value, multiply(factor, rows[pivotRow]![field]!))));
            });
            pivotRow++;
        }
        require(pivotRow === names.length); // Unresolved compound identities have no admitted base-unit proof.
        for (const row of rows) {
            const active = row.slice(0, -1).filter(value => value.n !== 0n);
            require(active.length > 0 || row.at(-1)!.n === 0n);
            if (active.length === 1) require(whole(divide(row.at(-1)!, active[0]!)));
        }
    }
}

/** Exact same-unit sum or product, using the existing coherent-name grammar without conversions. */
export function isAlgebraicUnitRelation(first: unknown, second: unknown, result: unknown,
    operation: 'addition' | 'multiplication'): boolean {
    try {
        const a = unit(first), b = unit(second), output = unit(result);
        consistentUnits([a, b, output]);
        return operation === 'addition' ? sameUnit(a, b) && sameUnit(a, output)
            : operation === 'multiplication' && sameUnit(unitProduct(a, b), output);
    } catch { return false; }
}

function primitive(node: Node, symbols: readonly AlgebraicSymbolDeclaration[]): Range {
    const source = atom(node);
    if (source.kind === 'number') {
        const value = q(source.value);
        return withMultiple({lower: value, upper: value, lowerClosed: true, upperClosed: true, integral: whole(value)}, value);
    }
    require(source.kind === 'variable');
    const domain = symbols.find(symbol => symbol.symbolId === (source as Extract<Node, {kind: 'variable'}>).symbolId)!.domain;
    require(domain.lower !== null);
    let lower = q(domain.lower!.value), upper = domain.upper ? q(domain.upper.value) : null;
    let lowerClosed = domain.lower!.inclusive, upperClosed = domain.upper?.inclusive ?? false;
    if (domain.kind === 'integer') {
        const floor = (value: Rational): bigint => value.n / value.d - (value.n < 0n && value.n % value.d !== 0n ? 1n : 0n);
        lower = {n: floor(lower) + (lowerClosed && whole(lower) ? 0n : 1n), d: 1n};
        if (upper) upper = {n: floor(upper) - (!upperClosed && whole(upper) ? 1n : 0n), d: 1n};
        while (domain.excludedValues.some(value => compare(q(value), lower) === 0)) lower.n++;
        while (upper && domain.excludedValues.some(value => compare(q(value), upper!) === 0)) upper.n--;
        lowerClosed = true; upperClosed = upper !== null;
    } else {
        if (domain.excludedValues.some(value => compare(q(value), lower) === 0)) lowerClosed = false;
        if (upper && domain.excludedValues.some(value => compare(q(value), upper!) === 0)) upperClosed = false;
    }
    return withMultiple({lower, upper, lowerClosed, upperClosed, integral: domain.kind === 'integer'}, domain.kind === 'integer' ? one : null);
}

function combine(a: Range, b: Range, operation: 'addition' | 'subtraction' | 'multiplication' | 'division'): Range {
    const sumStep = a.multiple && b.multiple ? rationalGcd(a.multiple, b.multiple) : null;
    if (operation === 'addition') return withMultiple({lower: add(a.lower, b.lower), upper: a.upper && b.upper ? add(a.upper, b.upper) : null,
        lowerClosed: a.lowerClosed && b.lowerClosed, upperClosed: a.upperClosed && b.upperClosed, integral: a.integral && b.integral}, sumStep);
    if (operation === 'subtraction') {
        require(b.upper && compare(a.lower, b.upper) >= 0);
        return withMultiple({lower: subtract(a.lower, b.upper!), upper: a.upper ? subtract(a.upper, b.lower) : null,
            lowerClosed: a.lowerClosed && b.upperClosed, upperClosed: a.upperClosed && b.lowerClosed, integral: a.integral && b.integral}, sumStep);
    }
    if (operation === 'multiplication' && (constant(a)?.n === 0n || constant(b)?.n === 0n)) {
        return withMultiple({lower: zero, upper: zero, lowerClosed: true, upperClosed: true, integral: true}, zero);
    }
    if (operation === 'multiplication') return withMultiple({lower: multiply(a.lower, b.lower), upper: a.upper && b.upper ? multiply(a.upper, b.upper) : null,
        lowerClosed: a.lowerClosed && b.lowerClosed || a.lower.n === 0n && a.lowerClosed || b.lower.n === 0n && b.lowerClosed,
        upperClosed: a.upperClosed && b.upperClosed, integral: a.integral && b.integral}, a.multiple && b.multiple ? multiply(a.multiple, b.multiple) : null);
    require(compare(b.lower, zero) > 0 || compare(b.lower, zero) === 0 && !b.lowerClosed);
    const fixedA = constant(a), fixedB = constant(b);
    if (fixedA?.n === 0n) return withMultiple({lower: zero, upper: zero, lowerClosed: true, upperClosed: true, integral: true}, zero);
    return withMultiple({lower: b.upper ? divide(a.lower, b.upper) : zero,
        upper: a.upper && b.lower.n > 0n ? divide(a.upper, b.lower) : null,
        lowerClosed: a.lowerClosed && b.upperClosed || a.lower.n === 0n && a.lowerClosed,
        upperClosed: a.upperClosed && b.lowerClosed,
        integral: !!fixedA && !!fixedB ? whole(divide(fixedA, fixedB)) : !!fixedB && compare(fixedB, one) === 0 && a.integral},
    fixedB && a.multiple ? divide(a.multiple, fixedB) : null);
}

const binaryMatches = (expression: Node, operation: string, a: Node, b: Node): boolean => {
    const node = atom(expression);
    return node.kind === 'binary' && node.operation === operation && sameAlgebraicSyntax(node.left, a) && sameAlgebraicSyntax(node.right, b);
};
const edgeDegree = (expression: Node, edge: Node): number => {
    if (sameAlgebraicSyntax(expression, edge)) return 1;
    const node = atom(expression);
    if (node.kind === 'power' && sameAlgebraicSyntax(node.base, edge)) return node.exponent;
    if (node.kind !== 'binary' || node.operation !== 'multiplication') return NaN;
    return edgeDegree(node.left, edge) + edgeDegree(node.right, edge);
};
const factors = (expression: Node): readonly Node[] => {
    const node = atom(expression);
    return node.kind === 'binary' && node.operation === 'multiplication' ? [...factors(node.left), ...factors(node.right)] : [expression];
};
const countQuantity = (value: AlgebraicQuantity): boolean => value.meaning === 'group-count' || value.meaning === 'share-count'
    || value.unit.subject === 'item' && value.unit.dimensions.count === 1 && value.unit.dimensions.currency === 0
    && value.unit.dimensions.time === 0 && value.unit.dimensions.length === 0;
const role = (quantity: AlgebraicQuantity, allowed: readonly AlgebraicQuantity['meaning'][], subjects?: readonly AlgebraicUnit['subject'][]): void => {
    require(allowed.includes(quantity.meaning) && (!subjects || subjects.includes(quantity.unit.subject)));
};

/** Nonnegative constructive quantitative family; signed abstract mathematics uses parameter-description. */
export function isAlgebraicExpressionContext(value: unknown, expression: Node, symbols: readonly AlgebraicSymbolDeclaration[],
    restrictions: readonly AlgebraicDomainRestriction[]): value is AlgebraicExpressionContext {
    try {
        require(isAlgebraicDeclarations(symbols) && isAlgebraicExpressionSyntax(expression, symbols) && record(value) && array(restrictions));
        const nodes = inspectAlgebraicExpression(expression, symbols);
        require(new Set(nodes.filter(node => node.kind === 'variable').map(node => node.symbolId)).size === symbols.length);
        const needed = nodes.flatMap(node => node.kind === 'binary' && node.operation === 'division'
            ? [{expressionNodeId: node.right.id, reason: 'division-denominator'}]
            : node.kind === 'power' && node.exponent === 0 ? [{expressionNodeId: node.base.id, reason: 'zero-exponent-base'}] : []);
        require(restrictions.length === needed.length && restrictions.every(item => record(item) && item.kind === 'nonzero-expression'
            && needed.some(row => row.expressionNodeId === item.expressionNodeId && row.reason === item.reason))
            && new Set(restrictions.map(item => `${item.expressionNodeId}:${item.reason}`)).size === restrictions.length);
        const context = value as AlgebraicExpressionContext;
        if (context.kind === 'parameter-description') return context.resultMeaning === 'number' && array(context.parameters)
            && context.parameters.length === symbols.length && context.parameters.every(row => record(row) && row.meaning === 'number'
                && symbols.some(symbol => symbol.symbolId === row.symbolId))
            && new Set(context.parameters.map(row => row.symbolId)).size === symbols.length;
        require(context.kind === 'quantitative-system' && ['purchase', 'production', 'sharing', 'measurement'].includes(context.setting)
            && array(context.quantities) && context.quantities.length > 0 && array(context.relations) && context.relations.length > 0
            && array(context.variableQuantities) && context.variableQuantities.length === symbols.length);
        const quantities = new Map<string, AlgebraicQuantity>(), units = new Map<string, Unit>();
        for (const quantity of context.quantities) {
            require(record(quantity) && text(quantity.quantityId) && !quantities.has(quantity.quantityId)
                && meanings.includes(quantity.meaning) && isAlgebraicExpressionSyntax(quantity.expression, symbols));
            quantities.set(quantity.quantityId, quantity); units.set(quantity.quantityId, unit(quantity.unit));
            if (quantity.meaning === 'duration') role(quantity, ['duration'], ['time']);
            if (['length', 'width', 'edge'].includes(quantity.meaning)) role(quantity, ['length', 'width', 'edge'], ['length']);
            if (quantity.meaning === 'area') role(quantity, ['area'], ['area']);
            if (quantity.meaning === 'volume') role(quantity, ['volume'], ['volume']);
            if (quantity.meaning === 'fixed-charge') require(quantity.unit.subject === 'money'
                && dimensions.every((key, index) => quantity.unit.dimensions[key] === (index === 0 ? 1 : 0)));
            if (quantity.meaning === 'duration') require(dimensions.every((key, index) => quantity.unit.dimensions[key] === (index === 1 ? 1 : 0)));
            if (['length', 'width', 'edge', 'area', 'volume'].includes(quantity.meaning)) {
                const degree = quantity.meaning === 'area' ? 2 : quantity.meaning === 'volume' ? 3 : 1;
                require(dimensions.every((key, index) => quantity.unit.dimensions[key] === (index === 3 ? degree : 0)));
            }
            if (quantity.meaning === 'input-number' || quantity.meaning === 'output-number') role(quantity, ['input-number', 'output-number'], ['number']);
            if (quantity.meaning === 'group-count' || quantity.meaning === 'share-count') {
                require(['number', 'item'].includes(quantity.unit.subject) && dimensions.every((key, index) =>
                    index === 2 ? quantity.unit.dimensions[key] === 0 || quantity.unit.dimensions[key] === 1 : quantity.unit.dimensions[key] === 0));
            }
        }
        consistentUnits([...units.values()]);
        const output = quantities.get(context.outputQuantityId);
        require(output && sameAlgebraicSyntax(output.expression, expression));
        const definitions = new Map<string, AlgebraicQuantityRelation>();
        for (const relation of context.relations) {
            require(record(relation) && text(relation.resultId) && quantities.has(relation.resultId) && !definitions.has(relation.resultId));
            definitions.set(relation.resultId, relation);
        }
        const mapped = new Set<string>(), mappedQuantities = new Set<string>();
        for (const mapping of context.variableQuantities) {
            require(record(mapping) && symbols.some(symbol => symbol.symbolId === mapping.symbolId) && !mapped.has(mapping.symbolId)
                && !mappedQuantities.has(mapping.quantityId) && quantities.has(mapping.quantityId) && !definitions.has(mapping.quantityId));
            const source = atom(quantities.get(mapping.quantityId)!.expression);
            require(source.kind === 'variable' && source.symbolId === mapping.symbolId);
            mapped.add(mapping.symbolId); mappedQuantities.add(mapping.quantityId);
        }
        const ranges = new Map<string, Range>(), visiting = new Set<string>();
        function visit(id: string): Range {
            require(quantities.has(id) && !visiting.has(id));
            if (ranges.has(id)) return ranges.get(id)!;
            visiting.add(id);
            const quantity = quantities.get(id)!, relation = definitions.get(id);
            let range: Range;
            if (!relation) {
                const source = atom(quantity.expression);
                require(source.kind === 'number' || source.kind === 'variable' && mappedQuantities.has(id));
                range = primitive(quantity.expression, symbols);
            } else {
                const take = (key: string): AlgebraicQuantity => {
                    const input = (relation as unknown as Record<string, unknown>)[key];
                    require(typeof input === 'string' && quantities.has(input));
                    visit(input as string);
                    return quantities.get(input as string)!;
                };
                const operation = (a: AlgebraicQuantity, b: AlgebraicQuantity, op: 'addition' | 'subtraction' | 'multiplication' | 'division'): Range => {
                    require(binaryMatches(quantity.expression, op, a.expression, b.expression));
                    const first = units.get(a.quantityId)!, second = units.get(b.quantityId)!;
                    if (op === 'addition' || op === 'subtraction') require(sameUnit(first, second) && sameUnit(units.get(id)!, first));
                    else require(sameUnit(units.get(id)!, unitProduct(first, second, op === 'division')));
                    return combine(ranges.get(a.quantityId)!, ranges.get(b.quantityId)!, op);
                };
                if (relation.kind === 'fixed-and-proportional') {
                    const fixed = take('fixedId'), rate = take('rateId'), input = take('inputId');
                    role(fixed, ['fixed-charge'], ['money']); role(rate, ['rate']);
                    role(input, ['duration', 'group-count', 'input-number', 'length', 'width', 'edge']); role(quantity, ['total-amount', 'output-number']);
                    const node = atom(quantity.expression);
                    require(node.kind === 'binary' && node.operation === 'addition' && sameAlgebraicSyntax(node.left, fixed.expression)
                        && binaryMatches(node.right, 'multiplication', rate.expression, input.expression));
                    require(sameUnit(units.get(id)!, units.get(fixed.quantityId)!) && sameUnit(units.get(id)!, unitProduct(units.get(rate.quantityId)!, units.get(input.quantityId)!)));
                    range = combine(ranges.get(fixed.quantityId)!, combine(ranges.get(rate.quantityId)!, ranges.get(input.quantityId)!, 'multiplication'), 'addition');
                } else if (relation.kind === 'equal-groups') {
                    const count = take('groupCountId'), amount = take('amountPerGroupId');
                    role(count, ['group-count'], ['number', 'item']); role(amount, ['amount-per-group']); role(quantity, ['total-amount']);
                    require(ranges.get(count.quantityId)!.integral);
                    range = operation(count, amount, 'multiplication');
                } else if (relation.kind === 'combined-amounts') {
                    const first = take('firstId'), second = take('secondId');
                    role(first, ['initial-amount', 'added-amount', 'total-amount', 'remaining-amount']); role(second, ['initial-amount', 'added-amount', 'total-amount', 'remaining-amount']); role(quantity, ['total-amount']);
                    range = operation(first, second, 'addition');
                } else if (relation.kind === 'remaining-amount') {
                    const initial = take('initialId'), removed = take('removedId');
                    role(initial, ['initial-amount', 'total-amount', 'remaining-amount']); role(removed, ['removed-amount']); role(quantity, ['remaining-amount']);
                    range = operation(initial, removed, 'subtraction');
                }
                else if (relation.kind === 'equal-sharing') {
                    const total = take('totalId'), count = take('shareCountId');
                    role(total, ['total-amount', 'initial-amount', 'remaining-amount']); role(count, ['share-count'], ['number', 'item']); role(quantity, ['amount-per-share']);
                    require(ranges.get(count.quantityId)!.integral);
                    range = operation(total, count, 'division');
                } else if (relation.kind === 'rectangular-measure') {
                    const length = take('lengthId'), width = take('widthId');
                    role(length, ['length', 'edge'], ['length']); role(width, ['width', 'edge'], ['length']); role(quantity, ['area'], ['area']);
                    range = operation(length, width, 'multiplication');
                }
                else {
                    require(relation.kind === 'cubical-measure' && (relation.measure === 'volume' || relation.measure === 'surface-area'));
                    const edge = take('edgeId'), node = atom(quantity.expression);
                    role(edge, ['edge'], ['length']);
                    role(quantity, [relation.measure === 'volume' ? 'volume' : 'area'], [relation.measure === 'volume' ? 'volume' : 'area']);
                    const degree = relation.measure === 'volume' ? 3 : 2;
                    if (relation.measure === 'volume') require(edgeDegree(node, edge.expression) === degree);
                    else {
                        const parts = [...factors(node)], coefficient = parts.findIndex(part => atom(part).kind === 'number'
                            && compare(q((atom(part) as Extract<Node, {kind: 'number'}>).value), {n: 6n, d: 1n}) === 0);
                        require(coefficient >= 0); parts.splice(coefficient, 1);
                        require(parts.reduce((sum, part) => sum + edgeDegree(part, edge.expression), 0) === degree);
                    }
                    let expected = units.get(edge.quantityId)!, result = ranges.get(edge.quantityId)!;
                    for (let index = 1; index < degree; index++) { expected = unitProduct(expected, units.get(edge.quantityId)!); result = combine(result, ranges.get(edge.quantityId)!, 'multiplication'); }
                    require(sameUnit(expected, units.get(id)!));
                    range = relation.measure === 'volume' ? result : combine(withMultiple({lower: {n: 6n, d: 1n}, upper: {n: 6n, d: 1n}, lowerClosed: true, upperClosed: true, integral: true}, {n: 6n, d: 1n}), result, 'multiplication');
                }
            }
            if (restrictions.some(restriction => sameAlgebraicSyntax(nodes.find(node => node.id === restriction.expressionNodeId)!, quantity.expression))) {
                if (range.lower.n === 0n) range = {...range, lowerClosed: false};
                if (range.upper?.n === 0n) range = {...range, upperClosed: false};
            }
            require(compare(range.lower, zero) >= 0 && (!range.upper || compare(range.lower, range.upper) < 0
                || compare(range.lower, range.upper) === 0 && range.lowerClosed && range.upperClosed));
            require(!countQuantity(quantity) || range.integral);
            ranges.set(id, range); visiting.delete(id);
            return range;
        }
        visit(context.outputQuantityId);
        return ranges.size === quantities.size;
    } catch {
        return false;
    }
}

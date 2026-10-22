import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AffineQuantityContext, AlgebraCovariationBackbone, AlgebraicNotation, AlgebraicScalar, AlgebraicUnit,
    CovariationGraphGeometry, CovariationValueWitness, CovaryingInputQuantity, CovaryingOutputQuantity,
    ExactNumericalExpressionNode, ExactSymbolicExpressionNode as Node, RationalCoordinateAxes, RationalCoordinatePoint,
    StatementBinding, StatementOccurrenceReplacement} from '../../types/problems.ts';
import {buildExactNumericCalculation, isExactNumericCalculation} from '../arithmetic/exact-numeric-calculation-helpers.ts';
import {isCoordinateNotation, isRationalCoordinateAxes, isRationalCoordinatePoint, makeCoordinateNotation,
    makeCoordinatePoint} from '../coordinate/coordinate-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {addAffineScalars, affineScalar, compareAffineScalars, equalAffineScalars,
    isAffineNormalizationProof, isCommonAffineDomain, multiplyAffineScalars, normalizeAffineExpression} from './algebra-affine-helpers.ts';
import {isAlgebraicUnitRelation} from './algebra-context-helpers.ts';
import {algebraicChildren, inspectAlgebraicExpression, isAlgebraicDeclarations, sameAlgebraicSyntax} from './algebra-syntax-helpers.ts';

export type CovariationBackboneInput = Readonly<{
    input: CovaryingInputQuantity;
    output: CovaryingOutputQuantity;
    context: AffineQuantityContext;
    right: Node;
    tableInputs: readonly [Readonly<{input: AlgebraicScalar; inputNotation: AlgebraicNotation}>,
        Readonly<{input: AlgebraicScalar; inputNotation: AlgebraicNotation}>, ...Readonly<{input: AlgebraicScalar; inputNotation: AlgebraicNotation}>[]];
    axes: RationalCoordinateAxes;
}>;
type Core = Pick<AlgebraCovariationBackbone, 'input' | 'output' | 'context' | 'equation' | 'lawProof'>;
const fail = (message: string): never => { throw new GeneratorValidationError('algebra-covariation', message); };
const require: (condition: unknown, message?: string) => asserts condition = (condition, message = 'Inconsistent exact covariation data.') => {
    if (!condition) fail(message);
};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const zero: AlgebraicScalar = {numerator: 0, denominator: 1};
const same = equalAffineScalars;
const compare = compareAffineScalars;
const scalar = (value: unknown): value is AlgebraicScalar => isCanonicalSignedRational(value);
const notation = (value: AlgebraicScalar) => makeCoordinateNotation(value, value.denominator === 1 ? 'integer' : 'fraction');
const allQ = () => ({kind: 'rational' as const, lower: null, upper: null, excludedValues: []});
const policy = {domain: 'rational' as const, maximumAbsoluteValue: {numerator: Number.MAX_SAFE_INTEGER, denominator: 1},
    maximumNodes: Number.MAX_SAFE_INTEGER, maximumDepth: Number.MAX_SAFE_INTEGER, maximumExponent: 0};

function validDomain(value: unknown, kind: 'real' | 'integer'): boolean {
    return record(value) && value.kind === kind && scalar(value.minimum) && scalar(value.maximum) && value.minimum.numerator >= 0
        && compare(value.minimum, value.maximum) < 0 && (kind === 'real' || value.minimum.denominator === 1 && value.maximum.denominator === 1);
}
function quantities(first: unknown, second: unknown): {input: CovaryingInputQuantity; output: CovaryingOutputQuantity} {
    require(record(first) && record(second) && text(first.quantityId) && text(second.quantityId) && first.quantityId !== second.quantityId);
    const declarations = [first, second].map(value => ({symbolId: value.symbolId, symbol: value.symbol, domain: allQ()}));
    require(isAlgebraicDeclarations(declarations));
    require(['elapsed-time', 'rental-duration', 'production-time', 'item-count'].includes(first.meaning as string)
        && ['distance-traveled', 'rental-cost', 'total-cost', 'total-length'].includes(second.meaning as string)
        && validDomain(first.domain, first.meaning === 'item-count' ? 'integer' : 'real') && validDomain(second.domain, 'real'));
    return {input: first as CovaryingInputQuantity, output: second as CovaryingOutputQuantity};
}
const dimensionKeys = ['currency', 'time', 'count', 'length'] as const;
function pure(unit: AlgebraicUnit, subject: AlgebraicUnit['subject'], axis: typeof dimensionKeys[number]): boolean {
    return record(unit) && unit.subject === subject && record(unit.dimensions)
        && dimensionKeys.every(key => unit.dimensions[key] === (key === axis ? 1 : 0));
}
function contextFacts(input: CovaryingInputQuantity, output: CovaryingOutputQuantity, value: unknown) {
    require(record(value));
    let rate: unknown, rateNotation: unknown, initial: unknown, initialNotation: unknown;
    if (value.kind === 'constant-speed') {
        require(input.meaning === 'elapsed-time' && output.meaning === 'distance-traveled'
            && value.timeQuantityId === input.quantityId && value.distanceQuantityId === output.quantityId);
        rate = value.speed; rateNotation = value.speedNotation; initial = zero; initialNotation = notation(zero);
    } else if (value.kind === 'rental-charge') {
        require(input.meaning === 'rental-duration' && output.meaning === 'rental-cost'
            && value.durationQuantityId === input.quantityId && value.costQuantityId === output.quantityId);
        rate = value.hourlyCharge; rateNotation = value.hourlyChargeNotation; initial = value.initialCharge; initialNotation = value.initialChargeNotation;
    } else if (value.kind === 'item-purchase') {
        require(input.meaning === 'item-count' && output.meaning === 'total-cost'
            && value.countQuantityId === input.quantityId && value.costQuantityId === output.quantityId);
        rate = value.itemPrice; rateNotation = value.itemPriceNotation; initial = value.fixedCharge; initialNotation = value.fixedChargeNotation;
    } else {
        require(value.kind === 'constant-production' && input.meaning === 'production-time' && output.meaning === 'total-length'
            && value.timeQuantityId === input.quantityId && value.lengthQuantityId === output.quantityId);
        rate = value.lengthPerTime; rateNotation = value.lengthPerTimeNotation; initial = value.initialLength; initialNotation = value.initialLengthNotation;
    }
    require(scalar(rate) && rate.numerator > 0 && isCoordinateNotation(rate, rateNotation)
        && scalar(initial) && initial.numerator >= 0 && isCoordinateNotation(initial, initialNotation));
    require(pure(input.unit, input.meaning === 'item-count' ? 'item' : 'time', input.meaning === 'item-count' ? 'count' : 'time')
        && pure(output.unit, output.meaning === 'rental-cost' || output.meaning === 'total-cost' ? 'money' : 'length',
            output.meaning === 'rental-cost' || output.meaning === 'total-cost' ? 'currency' : 'length')
        && record(value.rateUnit) && value.rateUnit.subject === output.unit.subject
        && isAlgebraicUnitRelation(value.rateUnit, input.unit, output.unit, 'multiplication')
        && isAlgebraicUnitRelation(value.initialUnit, output.unit, output.unit, 'addition'));
    return {rate, initial};
}
function axes(value: unknown): asserts value is RationalCoordinateAxes {
    require(record(value));
    for (const axis of [value.x, value.y]) require(record(axis) && dense(axis.ticks) && dense(axis.tickNotations));
    require(isRationalCoordinateAxes(value), 'Coherent complete exact axes are required.');
}
function sameTree(first: Node, second: Node): boolean {
    return first.id === second.id && sameAlgebraicSyntax(first, second)
        && algebraicChildren(first).every((child, index) => sameTree(child, algebraicChildren(second)[index]!));
}
function inspectCore(value: unknown): Core {
    require(record(value));
    const pair = quantities(value.input, value.output), facts = contextFacts(pair.input, pair.output, value.context);
    require(record(value.equation) && record(value.lawProof));
    const equation = value.equation, law = value.lawProof;
    require(equation.inputSymbolId === pair.input.symbolId && equation.outputSymbolId === pair.output.symbolId
        && scalar(equation.slope) && equation.slope.numerator > 0 && isCoordinateNotation(equation.slope, equation.slopeNotation)
        && scalar(equation.intercept) && equation.intercept.numerator >= 0 && isCoordinateNotation(equation.intercept, equation.interceptNotation)
        && same(equation.slope, facts.rate) && same(equation.intercept, facts.initial));
    require(isCommonAffineDomain(law.proofDomain) && law.proofDomain.symbols.length === 1
        && law.proofDomain.symbols[0].symbolId === pair.input.symbolId && law.proofDomain.symbols[0].symbol === pair.input.symbol);
    const original = inspectAlgebraicExpression(equation.right, law.proofDomain.symbols);
    require(original.some(node => node.kind === 'variable') && record(law.rhsExpression)
        && isAffineNormalizationProof(law.normalization, law.rhsExpression as Core['lawProof']['rhsExpression'], law.proofDomain));
    const proof = law.normalization;
    require(sameTree(equation.right as Node, (law.rhsExpression as Core['lawProof']['rhsExpression']).root)
        && same(proof.rootNormalForm.constant, equation.intercept) && proof.rootNormalForm.coefficients.length === 1
        && proof.rootNormalForm.coefficients[0]!.symbolId === pair.input.symbolId
        && same(proof.rootNormalForm.coefficients[0]!.coefficient, equation.slope));
    return value as unknown as Core;
}
const admitted = (value: AlgebraicScalar, input: CovaryingInputQuantity): boolean => compare(value, input.domain.minimum) >= 0
    && compare(value, input.domain.maximum) <= 0 && (input.domain.kind === 'real' || value.denominator === 1);
function substitute(node: Node, binding: StatementBinding, replacements: StatementOccurrenceReplacement[]): ExactNumericalExpressionNode {
    if (node.kind === 'number') return node;
    if (node.kind === 'variable') {
        replacements.push({occurrenceNodeId: node.id, symbolId: binding.symbolId, value: binding.value, notation: binding.notation});
        return {id: node.id, kind: 'number', value: binding.value, notation: binding.notation};
    }
    if (node.kind === 'binary') return {...node, left: substitute(node.left, binding, replacements), right: substitute(node.right, binding, replacements)};
    if (node.kind === 'group') return {...node, expression: substitute(node.expression, binding, replacements)};
    if (node.kind === 'negation') return {...node, operand: substitute(node.operand, binding, replacements)};
    return fail('The affine grammar has no power nodes.');
}
function valueAt(core: Core, input: AlgebraicScalar, inputNotation = notation(input)): CovariationValueWitness {
    require(scalar(input) && admitted(input, core.input) && isCoordinateNotation(input, inputNotation));
    const binding = {symbolId: core.input.symbolId, value: input, notation: inputNotation}, replacements: StatementOccurrenceReplacement[] = [];
    const expression = substitute(core.equation.right, binding, replacements), calculation = buildExactNumericCalculation(expression, policy);
    const scaledInput = multiplyAffineScalars(core.equation.slope, input), output = addAffineScalars(scaledInput, core.equation.intercept);
    require(same(output, calculation.finalValue));
    return {input, inputNotation, scaledInput, scaledInputNotation: notation(scaledInput), output, outputNotation: notation(output),
        evaluation: {binding, replacements, calculation}};
}
const sameNotation = (first: AlgebraicNotation, second: unknown): boolean => record(second) && Object.keys(first).length === Object.keys(second).length
    && Object.entries(first).every(([field, value]) => second[field] === value);
function validValue(value: unknown, core: Core): value is CovariationValueWitness {
    if (!record(value) || !scalar(value.input) || !admitted(value.input, core.input) || !isCoordinateNotation(value.input, value.inputNotation)
        || !scalar(value.scaledInput) || !isCoordinateNotation(value.scaledInput, value.scaledInputNotation)
        || !scalar(value.output) || !isCoordinateNotation(value.output, value.outputNotation)
        || !same(value.scaledInput, multiplyAffineScalars(core.equation.slope, value.input))
        || !same(value.output, addAffineScalars(value.scaledInput, core.equation.intercept)) || !record(value.evaluation)) return false;
    const evaluation = value.evaluation;
    if (!record(evaluation.binding) || evaluation.binding.symbolId !== core.input.symbolId || !scalar(evaluation.binding.value)
        || !same(evaluation.binding.value, value.input) || !sameNotation(value.inputNotation, evaluation.binding.notation)
        || !isExactNumericCalculation(evaluation.calculation)) return false;
    const expected: StatementOccurrenceReplacement[] = [], original = substitute(core.equation.right, evaluation.binding as StatementBinding, expected);
    if (!sameTree(original, evaluation.calculation.expression) || !same(evaluation.calculation.finalValue, value.output)
        || !Array.isArray(evaluation.replacements) || evaluation.replacements.length !== expected.length || !dense(evaluation.replacements)) return false;
    const needed = new Map(expected.map(row => [row.occurrenceNodeId, row]));
    for (const row of evaluation.replacements) {
        if (!record(row) || typeof row.occurrenceNodeId !== 'string') return false;
        const reference = needed.get(row.occurrenceNodeId);
        if (!reference || row.symbolId !== reference.symbolId || !scalar(row.value) || !same(row.value, reference.value) || !sameNotation(reference.notation, row.notation)) return false;
        needed.delete(row.occurrenceNodeId);
    }
    return true;
}

type Bound = {n: bigint; d: bigint};
const bound = (value: AlgebraicScalar): Bound => ({n: BigInt(value.numerator), d: BigInt(value.denominator)});
const boundCompare = (a: Bound, b: Bound): bigint => a.n * b.d - b.n * a.d;
/** Compare hidden clipping bounds in BigInt before reducing ONLY the chosen finite endpoints. */
function graphWindow(core: Core, frame: RationalCoordinateAxes) {
    const preimage = (y: AlgebraicScalar): Bound => {
        const a = bound(y), b = bound(core.equation.intercept), m = bound(core.equation.slope);
        return {n: (a.n * b.d - b.n * a.d) * m.d, d: a.d * b.d * m.n};
    };
    const minimum = [bound(core.input.domain.minimum), bound(frame.x.minimum), preimage(frame.y.minimum)]
        .reduce((a, b) => boundCompare(a, b) >= 0n ? a : b);
    const maximum = [bound(core.input.domain.maximum), bound(frame.x.maximum), preimage(frame.y.maximum)]
        .reduce((a, b) => boundCompare(a, b) <= 0n ? a : b);
    require(boundCompare(minimum, maximum) < 0n, 'A nontrivial visible graph interval is required.');
    return {minimumInput: affineScalar(minimum.n, minimum.d), maximumInput: affineScalar(maximum.n, maximum.d)};
}
const floor = (value: AlgebraicScalar): bigint => BigInt(value.numerator) / BigInt(value.denominator);
const ceil = (value: AlgebraicScalar): bigint => (BigInt(value.numerator) + BigInt(value.denominator) - 1n) / BigInt(value.denominator);
function point(id: string, frame: RationalCoordinateAxes, value: CovariationValueWitness): RationalCoordinatePoint {
    const x = frame.x.ticks.findIndex(tick => same(tick, value.input)), y = frame.y.ticks.findIndex(tick => same(tick, value.output));
    require(x >= 0 && y >= 0, 'Each stored graph point or exact clipping endpoint must lie on the supplied ticks.');
    return makeCoordinatePoint(id, frame, x, y, {x: value.inputNotation, y: value.outputNotation});
}

/** Build one complete common law/table/graph model. Additional selected proofs live in the facade. */
export function buildAlgebraCovariationBackbone(input: CovariationBackboneInput): AlgebraCovariationBackbone {
    require(record(input));
    const pair = quantities(input.input, input.output);
    axes(input.axes); contextFacts(pair.input, pair.output, input.context);
    const proofDomain = {domainId: 'covariation-formal-input', kind: 'independent-rational-variables' as const,
        symbols: [{symbolId: pair.input.symbolId, symbol: pair.input.symbol, domain: allQ()}] as const};
    const rhsExpression = {expressionId: 'covariation-right', domainId: proofDomain.domainId, root: input.right};
    const normalization = normalizeAffineExpression(rhsExpression, proofDomain), form = normalization.rootNormalForm;
    require(form.coefficients.length === 1);
    const slope = form.coefficients[0]!.coefficient, intercept = form.constant;
    const equation = {inputSymbolId: pair.input.symbolId, outputSymbolId: pair.output.symbolId, right: input.right,
        slope, slopeNotation: notation(slope), intercept, interceptNotation: notation(intercept)};
    const core = inspectCore({...pair, context: input.context, equation, lawProof: {proofDomain, rhsExpression, normalization}});
    const atMinimumInput = valueAt(core, pair.input.domain.minimum), atMaximumInput = valueAt(core, pair.input.domain.maximum);
    require(compare(atMinimumInput.output, pair.output.domain.minimum) >= 0 && compare(atMaximumInput.output, pair.output.domain.maximum) <= 0,
        'The output universe must contain the entire affine image.');
    const window = graphWindow(core, input.axes);
    require(dense(input.tableInputs) && input.tableInputs.length >= 2);
    const table = input.tableInputs.map((row, index) => {
        require(record(row));
        const value = valueAt(core, row.input, row.inputNotation);
        require(compare(value.input, window.minimumInput) >= 0 && compare(value.input, window.maximumInput) <= 0
            && (index === 0 || compare(input.tableInputs[index - 1]!.input, value.input) < 0));
        return {rowId: `row-${index + 1}`, value};
    }) as unknown as AlgebraCovariationBackbone['table'];
    const tablePoints = table.map(row => ({rowId: row.rowId, point: point(`point-${row.rowId}`, input.axes, row.value)})) as unknown as AlgebraCovariationBackbone['graph']['tablePoints'];
    let geometry: CovariationGraphGeometry;
    if (pair.input.domain.kind === 'real') {
        const first = valueAt(core, window.minimumInput), last = valueAt(core, window.maximumInput);
        geometry = {kind: 'continuous-affine-segment', first: {value: first, point: point('visible-first', input.axes, first)},
            last: {value: last, point: point('visible-last', input.axes, last)},
            firstBoundary: same(window.minimumInput, pair.input.domain.minimum) ? 'domain-endpoint' : 'window-cut',
            lastBoundary: same(window.maximumInput, pair.input.domain.maximum) ? 'domain-endpoint' : 'window-cut'};
    } else {
        const first = ceil(window.minimumInput), last = floor(window.maximumInput);
        const inputs = input.axes.x.ticks.filter(tick => tick.denominator === 1 && BigInt(tick.numerator) >= first && BigInt(tick.numerator) <= last);
        require(BigInt(inputs.length) === last - first + 1n && inputs.length > 0, 'Every visible integer input must have an exact supplied tick.');
        const visibleValues = inputs.map((value, index) => {
            const witness = valueAt(core, value);
            return {value: witness, point: point(`visible-${index + 1}`, input.axes, witness)};
        }) as unknown as Extract<CovariationGraphGeometry, {kind: 'discrete-points'}>['visibleValues'];
        geometry = {kind: 'discrete-points', visibleValues};
    }
    return {kind: 'algebra-covariation', ...core,
        domainImage: {atMinimumInput, atMaximumInput, imageKind: pair.input.domain.kind === 'real' ? 'real-interval-image' : 'discrete-endpoint-envelope'},
        table, graph: {axes: input.axes, horizontalQuantityId: pair.input.quantityId, verticalQuantityId: pair.output.quantityId, window, tablePoints, geometry}};
}

/** Complete common coherence, independent of any optional selectedRelations extension. */
export function isAlgebraCovariationBackbone(value: unknown): value is AlgebraCovariationBackbone {
    try {
        require(record(value) && value.kind === 'algebra-covariation');
        const core = inspectCore(value);
        require(record(value.domainImage));
        const image = value.domainImage, minimum = image.atMinimumInput, maximum = image.atMaximumInput;
        require(validValue(minimum, core) && validValue(maximum, core));
        require(same(minimum.input, core.input.domain.minimum) && same(maximum.input, core.input.domain.maximum)
            && compare(minimum.output, core.output.domain.minimum) >= 0 && compare(maximum.output, core.output.domain.maximum) <= 0
            && image.imageKind === (core.input.domain.kind === 'real' ? 'real-interval-image' : 'discrete-endpoint-envelope'));
        require(dense(value.table) && value.table.length >= 2 && record(value.graph));
        const graph = value.graph;
        axes(graph.axes);
        const frame = graph.axes, window = graphWindow(core, frame);
        require(graph.horizontalQuantityId === core.input.quantityId && graph.verticalQuantityId === core.output.quantityId
            && record(graph.window) && scalar(graph.window.minimumInput) && scalar(graph.window.maximumInput)
            && same(graph.window.minimumInput, window.minimumInput) && same(graph.window.maximumInput, window.maximumInput));
        const rows = new Map<string, CovariationValueWitness>();
        let previous: AlgebraicScalar | undefined;
        for (const row of value.table) {
            require(record(row) && text(row.rowId) && !rows.has(row.rowId) && validValue(row.value, core)
                && compare(row.value.input, window.minimumInput) >= 0 && compare(row.value.input, window.maximumInput) <= 0
                && (previous === undefined || compare(previous, row.value.input) < 0));
            rows.set(row.rowId, row.value); previous = row.value.input;
        }
        const pointIds = new Map<string, RationalCoordinatePoint>();
        const validPoint = (candidate: unknown, witness: CovariationValueWitness): boolean => {
            if (!isRationalCoordinatePoint(candidate, frame) || !same(candidate.x.value, witness.input) || !same(candidate.y.value, witness.output)
                || !sameNotation(witness.inputNotation, candidate.x.notation) || !sameNotation(witness.outputNotation, candidate.y.notation)) return false;
            const saved = pointIds.get(candidate.id);
            if (saved && (!same(saved.x.value, candidate.x.value) || !same(saved.y.value, candidate.y.value))) return false;
            pointIds.set(candidate.id, candidate); return true;
        };
        require(Array.isArray(graph.tablePoints) && graph.tablePoints.length === rows.size && dense(graph.tablePoints));
        for (const link of graph.tablePoints) {
            require(record(link) && typeof link.rowId === 'string');
            const witness = rows.get(link.rowId);
            require(witness && validPoint(link.point, witness)); rows.delete(link.rowId);
        }
        require(record(graph.geometry));
        const geometry = graph.geometry;
        const located = (candidate: unknown): candidate is {value: CovariationValueWitness; point: RationalCoordinatePoint} =>
            record(candidate) && validValue(candidate.value, core) && validPoint(candidate.point, candidate.value);
        if (core.input.domain.kind === 'real') {
            return geometry.kind === 'continuous-affine-segment' && located(geometry.first) && located(geometry.last)
                && same(geometry.first.value.input, window.minimumInput) && same(geometry.last.value.input, window.maximumInput)
                && geometry.firstBoundary === (same(window.minimumInput, core.input.domain.minimum) ? 'domain-endpoint' : 'window-cut')
                && geometry.lastBoundary === (same(window.maximumInput, core.input.domain.maximum) ? 'domain-endpoint' : 'window-cut');
        }
        const first = ceil(window.minimumInput), last = floor(window.maximumInput);
        if (geometry.kind !== 'discrete-points' || !Array.isArray(geometry.visibleValues)
            || BigInt(geometry.visibleValues.length) !== last - first + 1n || !dense(geometry.visibleValues)) return false;
        return geometry.visibleValues.every((candidate, index) => located(candidate)
            && candidate.value.input.denominator === 1 && BigInt(candidate.value.input.numerator) === first + BigInt(index));
    } catch { return false; }
}

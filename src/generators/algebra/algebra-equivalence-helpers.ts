import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AffineCounterexample, AffineExpression, AffineNormalizationProof, AffineOccurrenceReplacement,
    AffineRewriteReference, AffineRewriteStep, AlgebraExpressionEquivalenceProblem, AlgebraicNotation, AlgebraicScalar,
    CommonAffineDomain, ExactAffineBinding, ExactAffineEvaluation, ExactAffineNormalForm, ExactCoefficientArithmetic,
    ExactNumericalExpressionNode, ExactSymbolicExpressionNode as Node, UniversalAffineIdentityProof} from '../../types/problems.ts';
import {buildExactNumericCalculation, isExactNumericCalculation} from '../arithmetic/exact-numeric-calculation-helpers.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {affineCoefficientArithmetic, equalAffineNormalForms, equalAffineScalars, isAffineNormalizationProof,
    isCommonAffineDomain, isExactAffineNormalForm, multiplyAffineScalars, divideAffineScalars, negateAffineScalar, normalizeAffineExpression} from './algebra-affine-helpers.ts';
import {algebraicChildren, inspectAlgebraicExpression, sameAlgebraicSyntax} from './algebra-syntax-helpers.ts';

export type AffineRewriteDescriptor = AffineRewriteReference & (
    | Readonly<{kind: 'distribution'; direction: 'factored-to-expanded' | 'expanded-to-factored'}>
    | Readonly<{kind: 'association'; direction: 'left-to-right' | 'right-to-left'}>
    | Readonly<{kind: 'collection' | 'commutation' | 'constant-arithmetic' | 'coefficient-normalization'}>
);
export type AlgebraEquivalenceBuildInput = Readonly<{
    domain: CommonAffineDomain;
    expressions: readonly [AffineExpression, AffineExpression, ...AffineExpression[]];
    sourceExpressionId: string;
    equivalentExpressionId: string;
    rewriteSteps: readonly [AffineRewriteDescriptor, ...AffineRewriteDescriptor[]];
    candidateExpressionId: string;
}>;
type Registry = ReadonlyMap<string, {expression: AffineExpression; proof: AffineNormalizationProof; nodes: readonly Node[]}>;
type Atom = {node: Node; polarity: 1 | -1};
const zero = {numerator: 0, denominator: 1}, one = {numerator: 1, denominator: 1};
const fail = (message: string): never => { throw new GeneratorValidationError('algebra-expression-equivalence', message); };
const require = (condition: unknown, message = 'Invalid local affine rewrite.'): void => { if (!condition) fail(message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const clone = <T>(value: T): T => structuredClone(value);
const notation = (value: AlgebraicScalar): AlgebraicNotation => value.denominator === 1 ? {kind: 'integer', numeral: String(value.numerator)}
    : {kind: 'fraction', numerator: value.numerator, denominator: value.denominator};
const numericPolicy = {domain: 'rational' as const, maximumAbsoluteValue: {numerator: Number.MAX_SAFE_INTEGER, denominator: 1},
    maximumNodes: Number.MAX_SAFE_INTEGER, maximumDepth: Number.MAX_SAFE_INTEGER, maximumExponent: 0};

function equal(expected: unknown, value: unknown): boolean {
    if (Object.is(expected, value)) return true;
    if (Array.isArray(expected)) return dense(value) && expected.length === value.length && expected.every((item, index) => equal(item, value[index]));
    return record(expected) && record(value) && Object.keys(expected).every(key => Object.hasOwn(value, key) && equal(expected[key], value[key]));
}
function sameTree(a: Node, b: Node): boolean {
    return a.id === b.id && sameAlgebraicSyntax(a, b) && algebraicChildren(a).every((child, index) => sameTree(child, algebraicChildren(b)[index]!));
}
const ungroup = (node: Node): Node => node.kind === 'group' ? ungroup(node.expression) : node;
function locate(node: Node, id: string, path: number[] = []): {node: Node; path: number[]} | null {
    if (node.id === id) return {node, path};
    for (const [index, child] of algebraicChildren(node).entries()) { const found = locate(child, id, [...path, index]); if (found) return found; }
    return null;
}
function at(node: Node, path: readonly number[]): Node {
    for (const index of path) { const child = algebraicChildren(node)[index]; if (!child) return fail('The rewritten subtree moved outside its original context.'); node = child; }
    return node;
}
function sameContext(before: Node, after: Node, path: readonly number[]): boolean {
    if (path.length === 0) return true;
    if (before.id !== after.id || before.kind !== after.kind) return false;
    if (before.kind === 'binary' && after.kind === 'binary' && before.operation !== after.operation) return false;
    const left = algebraicChildren(before), right = algebraicChildren(after);
    return left.length === right.length && left.every((child, index) => index === path[0]
        ? sameContext(child, right[index]!, path.slice(1)) : sameTree(child, right[index]!));
}
function registry(expressions: unknown, domain: CommonAffineDomain): Registry {
    require(isCommonAffineDomain(domain) && dense(expressions) && expressions.length >= 2, 'Expected a common all-rational domain and expression registry.');
    const result = new Map<string, {expression: AffineExpression; proof: AffineNormalizationProof; nodes: readonly Node[]}>();
    for (const value of expressions as readonly AffineExpression[]) {
        require(record(value) && text(value.expressionId) && !result.has(value.expressionId), 'Expression identifiers must be unique.');
        const proof = normalizeAffineExpression(value, domain);
        result.set(value.expressionId, {expression: value, proof, nodes: inspectAlgebraicExpression(value.root, domain.symbols)});
    }
    return result;
}
function entry(values: Registry, id: string): Registry extends ReadonlyMap<string, infer T> ? T : never {
    const found = values.get(id); if (!found) return fail('An expression reference does not resolve.'); return found;
}
function normal(proof: AffineNormalizationProof, node: Node): ExactAffineNormalForm {
    return proof.steps.find(step => step.nodeId === node.id)!.result;
}
function universal(values: Registry, domain: CommonAffineDomain, leftId: string, rightId: string): UniversalAffineIdentityProof {
    const left = entry(values, leftId).proof, right = entry(values, rightId).proof;
    require(equalAffineNormalForms(left.rootNormalForm, right.rootNormalForm), 'The proposed identity is not universally equal.');
    return {domainId: domain.domainId, leftExpressionId: leftId, rightExpressionId: rightId,
        leftNormalization: clone(left), rightNormalization: clone(right), commonNormalForm: clone(left.rootNormalForm)};
}
function validUniversal(value: unknown, values: Registry, domain: CommonAffineDomain, leftId: string, rightId: string): value is UniversalAffineIdentityProof {
    if (!record(value) || value.domainId !== domain.domainId || value.leftExpressionId !== leftId || value.rightExpressionId !== rightId) return false;
    return isAffineNormalizationProof(value.leftNormalization, entry(values, leftId).expression, domain)
        && isAffineNormalizationProof(value.rightNormalization, entry(values, rightId).expression, domain)
        && equalAffineNormalForms(value.leftNormalization.rootNormalForm, value.rightNormalization.rootNormalForm)
        && isExactAffineNormalForm(value.commonNormalForm, domain)
        && equalAffineNormalForms(value.commonNormalForm, value.leftNormalization.rootNormalForm);
}
function additive(node: Node, polarity: 1 | -1 = 1): Atom[] {
    if (node.kind === 'binary' && (node.operation === 'addition' || node.operation === 'subtraction')) return [
        ...additive(node.left, polarity), ...additive(node.right, node.operation === 'addition' ? polarity : -polarity as 1 | -1)];
    if (node.kind === 'negation') return additive(node.operand, -polarity as 1 | -1);
    return [{node, polarity}];
}
/** Separate universally constant multipliers while retaining the complete ordered nonconstant factors. */
function termFactors(atom: Atom, proof: AffineNormalizationProof, unwrapGroups = false): {coefficient: AlgebraicScalar; varying: Node[]} {
    let coefficient: AlgebraicScalar = {numerator: atom.polarity, denominator: 1};
    const varying: Node[] = [];
    function scan(node: Node): void {
        if (node.kind === 'binary' && node.operation === 'multiplication') { scan(node.left); scan(node.right); }
        else if (node.kind === 'binary' && node.operation === 'division') {
            // Affine normalization already proves this denominator universally constant and nonzero.
            coefficient = divideAffineScalars(coefficient, normal(proof, node.right).constant); scan(node.left);
        } else if (node.kind === 'negation') { coefficient = negateAffineScalar(coefficient); scan(node.operand); }
        else if (node.kind === 'group' && unwrapGroups) scan(node.expression);
        else {
            const map = normal(proof, node);
            if (map.coefficients.length === 0) coefficient = multiplyAffineScalars(coefficient, map.constant);
            else varying.push(node);
        }
    }
    scan(atom.node);
    return {coefficient, varying};
}
function deriveStep(descriptor: AffineRewriteDescriptor, values: Registry, domain: CommonAffineDomain): AffineRewriteStep {
    require(record(descriptor) && ['distribution', 'collection', 'association', 'commutation', 'constant-arithmetic', 'coefficient-normalization'].includes(descriptor.kind));
    const before = entry(values, descriptor.beforeExpressionId), after = entry(values, descriptor.afterExpressionId);
    const found = locate(before.expression.root, descriptor.beforeSubtreeId);
    require(found, 'The original subtree reference does not resolve.');
    const changed = at(after.expression.root, found!.path);
    require(changed.id === descriptor.afterSubtreeId && sameContext(before.expression.root, after.expression.root, found!.path), 'A rewrite altered its surrounding context.');
    require(!sameAlgebraicSyntax(found!.node, changed), 'A rewrite must make a genuine syntax change.');
    const retained = new Map(inspectAlgebraicExpression(found!.node, domain.symbols).map(node => [node.id, node]));
    for (const node of inspectAlgebraicExpression(changed, domain.symbols)) if (retained.has(node.id)) require(sameTree(retained.get(node.id)!, node), 'A changed/new occurrence must use a fresh identifier.');
    const reference: AffineRewriteReference = {beforeExpressionId: descriptor.beforeExpressionId, afterExpressionId: descriptor.afterExpressionId,
        beforeSubtreeId: descriptor.beforeSubtreeId, afterSubtreeId: descriptor.afterSubtreeId};
    const first = ungroup(found!.node), second = ungroup(changed);
    // The whole-map identity is necessary but never substitutes for a named local law pattern.
    require(equalAffineNormalForms(before.proof.rootNormalForm, after.proof.rootNormalForm), 'A local rewrite changed the universal affine map.');
    if (descriptor.kind === 'distribution') {
        require(['factored-to-expanded', 'expanded-to-factored'].includes(descriptor.direction));
        const expand = descriptor.direction === 'factored-to-expanded', factored = expand ? first : second, expanded = expand ? second : first;
        const factoredProof = expand ? before.proof : after.proof, expandedProof = expand ? after.proof : before.proof;
        require(factored.kind === 'binary' && factored.operation === 'multiplication', 'Distribution requires an actual scalar times a sum.');
        const product = factored as Extract<Node, {kind: 'binary'}>;
        const products = additive(expanded);
        for (const [scalarNode, sumNode] of [[product.left, product.right], [product.right, product.left]]) {
            if (normal(factoredProof, scalarNode!).coefficients.length !== 0) continue;
            const scalar = normal(factoredProof, scalarNode!).constant, addends = additive(ungroup(sumNode!));
            if (addends.length < 2 || addends.length !== products.length) continue;
            const pairs = addends.map((atom, index) => ({original: termFactors(atom, factoredProof), target: termFactors(products[index]!, expandedProof)}));
            const coefficientProducts = pairs.map(pair => affineCoefficientArithmetic('multiplication', scalar, pair.original.coefficient));
            if (!pairs.every(({original, target}, index) => equalAffineScalars(coefficientProducts[index]!.result, target.coefficient)
                && original.varying.length === target.varying.length && original.varying.every((node, part) => sameTree(node, target.varying[part]!)))) continue;
            return {...reference, kind: 'distribution', direction: descriptor.direction, scalar: clone(scalar),
                addendNodeIds: addends.map(atom => atom.node.id) as [string, string, ...string[]],
                productNodeIds: products.map(atom => atom.node.id) as [string, string, ...string[]], coefficientProducts};
        }
        return fail('Distribution must scale every ordered component of an actual affine sum.');
    }
    if (descriptor.kind === 'collection') {
        const original = additive(first), result = additive(second);
        const candidates = original.map(atom => {
            const factor = termFactors(atom, before.proof, true);
            const variable = factor.varying.length === 1 ? ungroup(factor.varying[0]!) : null;
            return variable?.kind === 'variable' ? {atom, variable, coefficient: factor.coefficient} : null;
        });
        for (const symbolId of new Set(candidates.flatMap(candidate => candidate ? [candidate.variable.symbolId] : []))) {
            const selected = candidates.filter(candidate => candidate?.variable.symbolId === symbolId) as {atom: Atom; variable: Extract<Node, {kind: 'variable'}>; coefficient: AlgebraicScalar}[];
            if (selected.length < 2) continue;
            const coefficientSums: ExactCoefficientArithmetic[] = [];
            let collectedCoefficient = selected[0]!.coefficient;
            for (const term of selected.slice(1)) { const arithmetic = affineCoefficientArithmetic('addition', collectedCoefficient, term.coefficient); coefficientSums.push(arithmetic); collectedCoefficient = arithmetic.result; }
            const selectedIds = new Set(selected.map(term => term.atom.node.id));
            const remaining = original.filter(atom => !selectedIds.has(atom.node.id));
            const collected = result.filter(atom => {
                const factor = termFactors(atom, after.proof, true), variable = factor.varying.length === 1 ? ungroup(factor.varying[0]!) : null;
                return variable?.kind === 'variable' && variable.symbolId === symbolId && equalAffineScalars(factor.coefficient, collectedCoefficient);
            });
            if (collectedCoefficient.numerator === 0 ? collected.length > 1 : collected.length !== 1) continue;
            const rest = result.filter(atom => !collected.includes(atom));
            const correct = remaining.length === 0 && collectedCoefficient.numerator === 0
                ? collected.length === 1 && rest.length === 0 || second.kind === 'number' && second.value.numerator === 0
                : remaining.length === rest.length && remaining.every((atom, index) => atom.polarity === rest[index]!.polarity && sameTree(atom.node, rest[index]!.node));
            if (!correct) continue;
            const witness = selected.map(term => ({termNodeId: term.atom.node.id, variableOccurrenceId: term.variable.id, signedCoefficient: term.coefficient}));
            return {...reference, kind: 'collection', symbolId, terms: [witness[0]!, witness[1]!, ...witness.slice(2)], coefficientSums, collectedCoefficient};
        }
        return fail('Collection must combine a complete same-symbol group and preserve every other term.');
    }
    if (descriptor.kind === 'association') {
        require(['left-to-right', 'right-to-left'].includes(descriptor.direction) && first.kind === 'binary' && second.kind === 'binary');
        const a = first as Extract<Node, {kind: 'binary'}>, b = second as Extract<Node, {kind: 'binary'}>;
        require(['addition', 'multiplication'].includes(a.operation) && b.operation === a.operation, 'Only sums/products are associative.');
        const leftToRight = descriptor.direction === 'left-to-right', oldGroup = leftToRight ? a.left : a.right, newGroup = leftToRight ? b.right : b.left;
        require(oldGroup.kind === 'group' && newGroup.kind === 'group', 'Association changes genuine written grouping.');
        const oldInner = ungroup(oldGroup), newInner = ungroup(newGroup);
        require(oldInner.kind === 'binary' && newInner.kind === 'binary' && oldInner.operation === a.operation && newInner.operation === a.operation);
        const innerA = oldInner as Extract<Node, {kind: 'binary'}>, innerB = newInner as Extract<Node, {kind: 'binary'}>;
        const operands = leftToRight ? [innerA.left, innerA.right, a.right] : [a.left, innerA.left, innerA.right];
        const targets = leftToRight ? [b.left, innerB.left, innerB.right] : [innerB.left, innerB.right, b.right];
        require(operands.every((node, index) => sameTree(node, targets[index]!)), 'Association preserves the ordered operands.');
        return {...reference, kind: 'association', operation: a.operation as 'addition' | 'multiplication', orderedOperandNodeIds: operands.map(node => node.id) as [string, string, string],
            beforeGrouping: leftToRight ? 'left' : 'right', afterGrouping: leftToRight ? 'right' : 'left'};
    }
    if (descriptor.kind === 'commutation') {
        require(first.kind === 'binary' && second.kind === 'binary');
        const a = first as Extract<Node, {kind: 'binary'}>, b = second as Extract<Node, {kind: 'binary'}>;
        require(['addition', 'multiplication'].includes(a.operation) && b.operation === a.operation && !sameAlgebraicSyntax(a.left, a.right)
            && sameTree(a.left, b.right) && sameTree(a.right, b.left), 'Commutation swaps two actual nonidentical sum/product operands.');
        return {...reference, kind: 'commutation', operation: a.operation as 'addition' | 'multiplication', operandNodeIds: [a.left.id, a.right.id]};
    }
    if (descriptor.kind === 'constant-arithmetic') {
        require(first.kind === 'binary' && second.kind === 'number');
        const binary = first as Extract<Node, {kind: 'binary'}>, left = normal(before.proof, binary.left), right = normal(before.proof, binary.right);
        require(left.coefficients.length === 0 && right.coefficients.length === 0, 'Constant arithmetic cannot evaluate assigned variables.');
        const arithmetic = affineCoefficientArithmetic(binary.operation, left.constant, right.constant);
        require(equalAffineScalars(arithmetic.result, (second as Extract<Node, {kind: 'number'}>).value));
        return {...reference, kind: 'constant-arithmetic', arithmetic};
    }
    return {...reference, kind: 'coefficient-normalization', proof: universal(values, domain, descriptor.beforeExpressionId, descriptor.afterExpressionId)};
}

const coefficient = (map: ExactAffineNormalForm, symbolId: string | null): AlgebraicScalar => symbolId === null ? map.constant
    : map.coefficients.find(row => row.symbolId === symbolId)?.coefficient ?? zero;
function difference(left: ExactAffineNormalForm, right: ExactAffineNormalForm): Extract<AlgebraExpressionEquivalenceProblem['comparison'], {kind: 'not-equivalent'}>['differingComponent'] {
    const symbolId = !equalAffineScalars(left.constant, right.constant) ? null
        : [...new Set([...left.coefficients, ...right.coefficients].map(row => row.symbolId))].sort().find(id => !equalAffineScalars(coefficient(left, id), coefficient(right, id)));
    require(symbolId !== undefined, 'A counterexample needs genuinely different affine maps.');
    return {symbolId: symbolId!, sourceCoefficient: clone(coefficient(left, symbolId!)), candidateCoefficient: clone(coefficient(right, symbolId!))};
}
function replaceVariables(node: Node, bindings: ReadonlyMap<string, ExactAffineBinding>, replacements: AffineOccurrenceReplacement[]): ExactNumericalExpressionNode {
    if (node.kind === 'variable') {
        const binding = bindings.get(node.symbolId)!;
        replacements.push({occurrenceNodeId: node.id, symbolId: node.symbolId, value: clone(binding.value), notation: clone(binding.notation)});
        return {id: node.id, kind: 'number', value: clone(binding.value), notation: clone(binding.notation)};
    }
    if (node.kind === 'binary') return {...clone(node), left: replaceVariables(node.left, bindings, replacements), right: replaceVariables(node.right, bindings, replacements)};
    if (node.kind === 'group') return {...clone(node), expression: replaceVariables(node.expression, bindings, replacements)};
    if (node.kind === 'negation') return {...clone(node), operand: replaceVariables(node.operand, bindings, replacements)};
    require(node.kind === 'number');
    return clone(node) as Extract<Node, {kind: 'number'}>;
}
function evaluate(expression: AffineExpression, bindings: readonly ExactAffineBinding[]): ExactAffineEvaluation {
    const replacements: AffineOccurrenceReplacement[] = [], numeric = replaceVariables(expression.root, new Map(bindings.map(binding => [binding.symbolId, binding])), replacements);
    return {sourceExpressionId: expression.expressionId, replacements, calculation: buildExactNumericCalculation(numeric, numericPolicy)};
}
function counterexample(values: Registry, domain: CommonAffineDomain, leftId: string, rightId: string): AffineCounterexample {
    const component = difference(entry(values, leftId).proof.rootNormalForm, entry(values, rightId).proof.rootNormalForm);
    // Keep canonical0/+1 output unchanged. A -1 basis can avoid otherwise unsafe stored intermediates.
    for (const basis of component.symbolId === null ? [zero] : [one, {numerator: -1, denominator: 1}]) {
        try {
            const bindings = domain.symbols.map(symbol => {
                const value = symbol.symbolId === component.symbolId ? basis : zero;
                return {symbolId: symbol.symbolId, value: clone(value), notation: notation(value)};
            }) as [ExactAffineBinding, ...ExactAffineBinding[]];
            const left = evaluate(entry(values, leftId).expression, bindings), right = evaluate(entry(values, rightId).expression, bindings);
            require(!equalAffineScalars(left.calculation.finalValue, right.calculation.finalValue));
            return {domainId: domain.domainId, bindings, left, right, unequalValues: {left: clone(left.calculation.finalValue), right: clone(right.calculation.finalValue)}};
        } catch { /* Try only the other explicitly supported exact storage-safe construction. */ }
    }
    return fail('No supported exact counterexample assignment has safely representable numeric work.');
}
function validEvaluation(value: unknown, expression: AffineExpression, bindings: readonly ExactAffineBinding[]): value is ExactAffineEvaluation {
    if (!record(value) || value.sourceExpressionId !== expression.expressionId || !isExactNumericCalculation(value.calculation)) return false;
    const replacements: AffineOccurrenceReplacement[] = [], numeric = replaceVariables(expression.root, new Map(bindings.map(binding => [binding.symbolId, binding])), replacements);
    const supplied = value.replacements;
    return sameTree(numeric, value.calculation.expression) && dense(supplied) && supplied.length === replacements.length
        && replacements.every(row => supplied.filter(item => equal(row, item)).length === 1);
}
function validCounterexample(value: unknown, values: Registry, domain: CommonAffineDomain, leftId: string, rightId: string): value is AffineCounterexample {
    if (!record(value) || value.domainId !== domain.domainId || !dense(value.bindings) || value.bindings.length !== domain.symbols.length) return false;
    const bindings: ExactAffineBinding[] = [], seen = new Set<string>();
    for (const binding of value.bindings) {
        if (!record(binding) || typeof binding.symbolId !== 'string' || seen.has(binding.symbolId) || !domain.symbols.some(symbol => symbol.symbolId === binding.symbolId)
            || !isCanonicalSignedRational(binding.value) || !isCoordinateNotation(binding.value, binding.notation)) return false;
        bindings.push(binding as ExactAffineBinding); seen.add(binding.symbolId);
    }
    return validEvaluation(value.left, entry(values, leftId).expression, bindings) && validEvaluation(value.right, entry(values, rightId).expression, bindings)
        && !equalAffineScalars(value.left.calculation.finalValue, value.right.calculation.finalValue)
        && equal({left: value.left.calculation.finalValue, right: value.right.calculation.finalValue}, value.unequalValues);
}

/** Derive local law witnesses and an exact universal verdict from literal syntax, never from a task/profile. */
export function buildAlgebraExpressionEquivalenceProblem(input: AlgebraEquivalenceBuildInput): AlgebraExpressionEquivalenceProblem {
    require(record(input), 'Expected literal affine expression and rewrite inputs.');
    const values = registry(input.expressions, input.domain), source = entry(values, input.sourceExpressionId);
    require(source.nodes.some(node => node.kind === 'variable'), 'The original expression must contain a declared variable.');
    require(dense(input.rewriteSteps) && input.rewriteSteps.length > 0);
    const steps = input.rewriteSteps.map(descriptor => deriveStep(descriptor, values, input.domain));
    require(steps[0]!.beforeExpressionId === input.sourceExpressionId && steps.at(-1)!.afterExpressionId === input.equivalentExpressionId
        && steps.every((step, index) => index === 0 || steps[index - 1]!.afterExpressionId === step.beforeExpressionId), 'The rewrite chain must connect the source to its equivalent result.');
    const candidate = entry(values, input.candidateExpressionId), common = {sourceExpressionId: input.sourceExpressionId, candidateExpressionId: input.candidateExpressionId};
    const comparison: AlgebraExpressionEquivalenceProblem['comparison'] = equalAffineNormalForms(source.proof.rootNormalForm, candidate.proof.rootNormalForm)
        ? {...common, kind: 'equivalent', universalProof: universal(values, input.domain, input.sourceExpressionId, input.candidateExpressionId)}
        : {...common, kind: 'not-equivalent', sourceNormalization: clone(source.proof), candidateNormalization: clone(candidate.proof),
            differingComponent: difference(source.proof.rootNormalForm, candidate.proof.rootNormalForm), counterexample: counterexample(values, input.domain, input.sourceExpressionId, input.candidateExpressionId)};
    return {kind: 'algebra-expression-equivalence', domain: clone(input.domain), expressions: clone(input.expressions), validIdentity: {
        sourceExpressionId: input.sourceExpressionId, equivalentExpressionId: input.equivalentExpressionId, steps: steps as [AffineRewriteStep, ...AffineRewriteStep[]],
        universalProof: universal(values, input.domain, input.sourceExpressionId, input.equivalentExpressionId)}, comparison};
}

/** Full-family validation accepts any correct complete induction and any admissible exact counterexample. */
export function isAlgebraExpressionEquivalenceProblem(value: unknown): value is AlgebraExpressionEquivalenceProblem {
    try {
        if (!record(value) || value.kind !== 'algebra-expression-equivalence' || !isCommonAffineDomain(value.domain)) return false;
        const domain = value.domain, values = registry(value.expressions, domain);
        if (!record(value.validIdentity) || !record(value.comparison)) return false;
        const identity = value.validIdentity, comparison = value.comparison;
        if (typeof identity.sourceExpressionId !== 'string' || typeof identity.equivalentExpressionId !== 'string'
            || !entry(values, identity.sourceExpressionId).nodes.some(node => node.kind === 'variable') || !dense(identity.steps) || identity.steps.length === 0
            || comparison.sourceExpressionId !== identity.sourceExpressionId || typeof comparison.candidateExpressionId !== 'string') return false;
        let previous = identity.sourceExpressionId;
        for (const raw of identity.steps) {
            if (!record(raw) || raw.beforeExpressionId !== previous) return false;
            const descriptor = raw.kind === 'association' ? {...raw, direction: raw.beforeGrouping === 'left' && raw.afterGrouping === 'right' ? 'left-to-right'
                : raw.beforeGrouping === 'right' && raw.afterGrouping === 'left' ? 'right-to-left' : 'invalid'} : raw;
            const expected = deriveStep(descriptor as AffineRewriteDescriptor, values, domain);
            if (expected.kind === 'coefficient-normalization') {
                if (!validUniversal(raw.proof, values, domain, expected.beforeExpressionId, expected.afterExpressionId)) return false;
            } else if (!equal(expected, raw)) return false;
            previous = expected.afterExpressionId;
        }
        if (previous !== identity.equivalentExpressionId || !validUniversal(identity.universalProof, values, domain, identity.sourceExpressionId, identity.equivalentExpressionId)) return false;
        const source = entry(values, identity.sourceExpressionId), candidate = entry(values, comparison.candidateExpressionId);
        if (comparison.kind === 'equivalent') return validUniversal(comparison.universalProof, values, domain, identity.sourceExpressionId, comparison.candidateExpressionId);
        if (comparison.kind !== 'not-equivalent' || equalAffineNormalForms(source.proof.rootNormalForm, candidate.proof.rootNormalForm)
            || !isAffineNormalizationProof(comparison.sourceNormalization, source.expression, domain)
            || !isAffineNormalizationProof(comparison.candidateNormalization, candidate.expression, domain) || !record(comparison.differingComponent)) return false;
        const component = comparison.differingComponent;
        if (component.symbolId !== null && !domain.symbols.some(symbol => symbol.symbolId === component.symbolId)) return false;
        const a = coefficient(source.proof.rootNormalForm, component.symbolId as string | null), b = coefficient(candidate.proof.rootNormalForm, component.symbolId as string | null);
        return !equalAffineScalars(a, b) && equal(a, component.sourceCoefficient) && equal(b, component.candidateCoefficient)
            && validCounterexample(comparison.counterexample, values, domain, identity.sourceExpressionId, comparison.candidateExpressionId);
    } catch { return false; }
}

import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraCovariationBackbone, AlgebraCovariationProblem, AlgebraicScalar, AlgebraicUnit,
    CovariationDependencyProof, CovariationInitialLink, CovariationOriginProof, CovariationRateLink} from '../../types/problems.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {affineCoefficientArithmetic, equalAffineScalars} from './algebra-affine-helpers.ts';
import {isAlgebraicUnitRelation} from './algebra-context-helpers.ts';
import {isAlgebraCovariationBackbone} from './algebra-covariation-backbone-helpers.ts';
import {inspectAlgebraicExpression} from './algebra-syntax-helpers.ts';

const fail = (): never => {throw new GeneratorValidationError('algebra-covariation', 'Expected a complete coherent affine covariation backbone.');};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const scalar = (value: unknown, expected: AlgebraicScalar): boolean => isCanonicalSignedRational(value) && equalAffineScalars(value, expected);
const tuple = (value: unknown, length: number): value is unknown[] => Array.isArray(value) && value.length === length
    && Array.from({length}, (_, index) => Object.hasOwn(value, index)).every(Boolean);
const zero: AlgebraicScalar = {numerator: 0, denominator: 1};

function originalInputs(backbone: AlgebraCovariationBackbone): [string, ...string[]] {
    const ids = inspectAlgebraicExpression(backbone.equation.right, backbone.lawProof.proofDomain.symbols)
        .filter(node => node.kind === 'variable').map(node => node.id);
    // The validated positive affine input coefficient guarantees an original occurrence.
    return ids as [string, ...string[]];
}
function components(backbone: AlgebraCovariationBackbone) {
    const form = backbone.lawProof.normalization.rootNormalForm;
    return {slope: form.coefficients.find(row => row.symbolId === backbone.input.symbolId)!.coefficient, intercept: form.constant};
}
type SourceFacts = {rateSource: CovariationRateLink['source']; rate: AlgebraicScalar;
    initialSource: CovariationInitialLink['source']; initial: AlgebraicScalar};
function sourceFacts(backbone: AlgebraCovariationBackbone): SourceFacts {
    const context = backbone.context;
    if (context.kind === 'constant-speed') return {rateSource: 'speed', rate: context.speed, initialSource: 'zero-distance-origin', initial: zero};
    if (context.kind === 'rental-charge') return {rateSource: 'hourlyCharge', rate: context.hourlyCharge, initialSource: 'initialCharge', initial: context.initialCharge};
    if (context.kind === 'item-purchase') return {rateSource: 'itemPrice', rate: context.itemPrice, initialSource: 'fixedCharge', initial: context.fixedCharge};
    return {rateSource: 'lengthPerTime', rate: context.lengthPerTime, initialSource: 'initialLength', initial: context.initialLength};
}

/** Designate the two quantities using complete ORIGINAL syntax/domain/axis incidences. */
export function buildCovariationDependencyProof(backbone: AlgebraCovariationBackbone): CovariationDependencyProof {
    if (!isAlgebraCovariationBackbone(backbone)) return fail();
    return {kind: 'designated-quantity-dependency',
        inputIncidence: {quantityId: backbone.input.quantityId, symbolId: backbone.input.symbolId, domainQuantityId: backbone.input.quantityId,
            occurrenceNodeIds: originalInputs(backbone), horizontalQuantityId: backbone.graph.horizontalQuantityId},
        outputIncidence: {quantityId: backbone.output.quantityId, symbolId: backbone.output.symbolId, domainQuantityId: backbone.output.quantityId,
            isolatedLeftSymbolId: backbone.equation.outputSymbolId, rightRootNodeId: backbone.equation.right.id,
            verticalQuantityId: backbone.graph.verticalQuantityId},
        lawExpressionId: backbone.lawProof.rhsExpression.expressionId,
        endpointInputValues: [backbone.domainImage.atMinimumInput.input, backbone.domainImage.atMaximumInput.input]};
}

/** Construct exact source-fact/coefficient/unit links, rather than a modeling flag. */
export function buildCovariationOriginProof(backbone: AlgebraCovariationBackbone): CovariationOriginProof {
    if (!isAlgebraCovariationBackbone(backbone)) return fail();
    const facts = sourceFacts(backbone), form = components(backbone);
    const expressionId = backbone.lawProof.rhsExpression.expressionId, rootNodeId = backbone.equation.right.id;
    return {kind: 'quantitative-origin',
        quantitySymbols: [
            {quantityId: backbone.input.quantityId, symbolId: backbone.input.symbolId, domainQuantityId: backbone.input.quantityId},
            {quantityId: backbone.output.quantityId, symbolId: backbone.output.symbolId, domainQuantityId: backbone.output.quantityId}
        ],
        rateLink: {source: facts.rateSource, expressionId, rootNodeId, inputSymbolId: backbone.input.symbolId,
            equality: affineCoefficientArithmetic('subtraction', facts.rate, form.slope)},
        initialLink: {source: facts.initialSource, expressionId, rootNodeId,
            equality: affineCoefficientArithmetic('subtraction', facts.initial, form.intercept)},
        unitRelations: [
            {operation: 'multiplication', first: backbone.context.rateUnit, second: backbone.input.unit, result: backbone.output.unit},
            {operation: 'addition', first: backbone.context.initialUnit, second: backbone.output.unit, result: backbone.output.unit}
        ]};
}

function sameIds(value: unknown, expected: readonly string[]): boolean {
    return tuple(value, expected.length) && value.every(id => typeof id === 'string' && expected.includes(id))
        && new Set(value).size === expected.length;
}
function dependency(value: unknown, backbone: AlgebraCovariationBackbone): boolean {
    if (!record(value) || value.kind !== 'designated-quantity-dependency' || !record(value.inputIncidence) || !record(value.outputIncidence)) return false;
    const input = value.inputIncidence, output = value.outputIncidence;
    return input.quantityId === backbone.input.quantityId && input.symbolId === backbone.input.symbolId
        && input.domainQuantityId === backbone.input.quantityId && input.horizontalQuantityId === backbone.graph.horizontalQuantityId
        && sameIds(input.occurrenceNodeIds, originalInputs(backbone))
        && output.quantityId === backbone.output.quantityId && output.symbolId === backbone.output.symbolId
        && output.domainQuantityId === backbone.output.quantityId && output.isolatedLeftSymbolId === backbone.equation.outputSymbolId
        && output.rightRootNodeId === backbone.equation.right.id && output.verticalQuantityId === backbone.graph.verticalQuantityId
        && value.lawExpressionId === backbone.lawProof.rhsExpression.expressionId && tuple(value.endpointInputValues, 2)
        && scalar(value.endpointInputValues[0], backbone.domainImage.atMinimumInput.input)
        && scalar(value.endpointInputValues[1], backbone.domainImage.atMaximumInput.input);
}
function equality(value: unknown, first: AlgebraicScalar, second: AlgebraicScalar): boolean {
    return record(value) && value.kind === 'binary' && value.operation === 'subtraction' && tuple(value.operands, 2)
        && scalar(value.operands[0], first) && scalar(value.operands[1], second) && scalar(value.result, zero);
}
function quantitySymbols(value: unknown, backbone: AlgebraCovariationBackbone): boolean {
    if (!tuple(value, 2)) return false;
    const quantities = [backbone.input, backbone.output], seen = new Set<string>();
    return value.every(row => {
        if (!record(row) || typeof row.quantityId !== 'string' || seen.has(row.quantityId)) return false;
        const quantity = quantities.find(item => item.quantityId === row.quantityId);
        if (!quantity || row.symbolId !== quantity.symbolId || row.domainQuantityId !== quantity.quantityId) return false;
        seen.add(row.quantityId);
        return true;
    });
}
function unit(value: unknown, expected: AlgebraicUnit): boolean {
    return record(value) && value.subject === expected.subject && isAlgebraicUnitRelation(value, expected, expected, 'addition');
}
function unitRelation(value: unknown, operation: 'addition' | 'multiplication', first: AlgebraicUnit, second: AlgebraicUnit, result: AlgebraicUnit): boolean {
    return record(value) && value.operation === operation && unit(value.first, first) && unit(value.second, second) && unit(value.result, result)
        && isAlgebraicUnitRelation(value.first, value.second, value.result, operation);
}
function origin(value: unknown, backbone: AlgebraCovariationBackbone): boolean {
    if (!record(value) || value.kind !== 'quantitative-origin' || !quantitySymbols(value.quantitySymbols, backbone)
        || !record(value.rateLink) || !record(value.initialLink) || !tuple(value.unitRelations, 2)) return false;
    const facts = sourceFacts(backbone), form = components(backbone), rate = value.rateLink, initial = value.initialLink;
    const expressionId = backbone.lawProof.rhsExpression.expressionId, rootNodeId = backbone.equation.right.id;
    return rate.source === facts.rateSource && rate.expressionId === expressionId && rate.rootNodeId === rootNodeId
        && rate.inputSymbolId === backbone.input.symbolId && equality(rate.equality, facts.rate, form.slope)
        && initial.source === facts.initialSource && initial.expressionId === expressionId && initial.rootNodeId === rootNodeId
        && equality(initial.equality, facts.initial, form.intercept)
        && unitRelation(value.unitRelations[0], 'multiplication', backbone.context.rateUnit, backbone.input.unit, backbone.output.unit)
        && unitRelation(value.unitRelations[1], 'addition', backbone.context.initialUnit, backbone.output.unit, backbone.output.unit);
}

/** Accept all three genuine proof tuples and coherent alternate incidence/unit spelling. */
export function isAlgebraCovariationProblem(value: unknown): value is AlgebraCovariationProblem {
    try {
        if (!record(value)) return false;
        const selected = value.selectedRelations;
        if (!isAlgebraCovariationBackbone(value) || !Array.isArray(selected) || selected.length > 2 || !tuple(selected, selected.length)) return false;
        return selected.length === 0 || dependency(selected[0], value)
            && (selected.length === 1 || origin(selected[1], value));
    } catch {return false;}
}

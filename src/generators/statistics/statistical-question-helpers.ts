import {GeneratorValidationError} from '../../lib/errors.ts';
import type {
    SignedRational, StatisticalColor, StatisticalIndexedResponse, StatisticalInvestigation,
    StatisticalInvestigationAttribute, StatisticalObservationOccasion, StatisticalObservationPlan,
    StatisticalObservationUnit, StatisticalQuestionsProblem, StatisticalResponse, StatisticalResponseDomain,
    StatisticalVariabilityEvidence
} from '../../types/problems.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

export type StatisticalInvestigationInput = {
    id: string;
    populationName: string;
    units: readonly [StatisticalObservationUnit, ...StatisticalObservationUnit[]];
    occasions: readonly [StatisticalObservationOccasion, ...StatisticalObservationOccasion[]];
    attribute: StatisticalInvestigationAttribute;
};

const fail = (message = 'Expected coherent investigation semantics and anticipated-variability evidence.'): never => {
    throw new GeneratorValidationError('statistical-questions', message);
};
const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
/** Canonical JSON fields are own data properties, never inherited/getter values. */
const fields = (value: unknown, names: readonly string[]): value is Record<string, unknown> => record(value)
    && names.every(name => Object.getOwnPropertyDescriptor(value, name)?.value !== undefined);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value)
    && value >= 0 && !Object.is(value, -0);

/** Check density before iterating: huge sparse arrays do not cause length-sized work. */
function dense(value: unknown, minimum: number): value is unknown[] {
    if (!Array.isArray(value) || value.length < minimum) return false;
    const indices = Object.getOwnPropertyNames(value).filter(key => {
        const index = Number(key);
        return Number.isInteger(index) && index >= 0 && index < value.length && String(index) === key;
    });
    return indices.length === value.length && indices.every(key =>
        Object.getOwnPropertyDescriptor(value, key)?.value !== undefined);
}

const colors: readonly StatisticalColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const color = (value: unknown): value is StatisticalColor => typeof value === 'string' && colors.includes(value as StatisticalColor);
const number = (numerator: number): SignedRational => ({numerator, denominator: 1});
type AttributeMeaning = {attribute: StatisticalInvestigationAttribute;
    unitKind: StatisticalObservationUnit['kind']; domain: StatisticalResponseDomain};

/** Derive the COMPLETE domain from a concrete rule, rather than from supplied outcomes. */
function attributeMeaning(value: unknown): AttributeMeaning | undefined {
    if (!fields(value, ['kind'])) return undefined;
    if (value.kind === 'upper-face-number' && fields(value, ['die']) && value.die === 'standard-six-sided') {
        return {attribute: {kind: 'upper-face-number', die: 'standard-six-sided'}, unitKind: 'die',
            domain: {kind: 'numeric', values: [number(1), number(2), number(3), number(4), number(5), number(6)]}};
    }
    if (value.kind === 'color-choice' && fields(value, ['alternatives']) && dense(value.alternatives, 2)
        && value.alternatives.every(color)
        && new Set(value.alternatives).size === value.alternatives.length) {
        const alternatives: [StatisticalColor, StatisticalColor, ...StatisticalColor[]] = [value.alternatives[0], value.alternatives[1], ...value.alternatives.slice(2)];
        return {attribute: {kind: 'color-choice', alternatives}, unitKind: 'person',
            domain: {kind: 'categorical', values: [...alternatives]}};
    }
    if (value.kind === 'side-count' && fields(value, ['shape']) && (value.shape === 'triangle' || value.shape === 'rectangle')) {
        return {attribute: {kind: 'side-count', shape: value.shape}, unitKind: value.shape,
            domain: {kind: 'numeric', values: [number(value.shape === 'triangle' ? 3 : 4)]}};
    }
    if (value.kind === 'sealed-pencil-count' && fields(value, ['pencilsPerBox']) && whole(value.pencilsPerBox)) {
        return {attribute: {kind: 'sealed-pencil-count', pencilsPerBox: value.pencilsPerBox}, unitKind: 'sealed-pencil-box',
            domain: {kind: 'numeric', values: [number(value.pencilsPerBox)]}};
    }
    return undefined;
}

const unit = (value: unknown, kind: StatisticalObservationUnit['kind']): value is StatisticalObservationUnit =>
    fields(value, ['id', 'name', 'kind']) && text(value.id) && text(value.name) && value.kind === kind;
const occasion = (value: unknown): value is StatisticalObservationOccasion =>
    fields(value, ['id', 'name']) && text(value.id) && text(value.name);

function observationPlan(value: unknown, kind: StatisticalObservationUnit['kind']): value is StatisticalObservationPlan {
    if (!fields(value, ['populationName', 'units', 'occasions', 'indices', 'observationCount']) || !text(value.populationName)
        || !dense(value.units, 1) || !dense(value.occasions, 1) || !dense(value.indices, 1)
        || !whole(value.observationCount) || value.observationCount !== value.indices.length
        || BigInt(value.units.length) * BigInt(value.occasions.length) !== BigInt(value.observationCount)
        || !value.units.every(entry => unit(entry, kind)) || !value.occasions.every(occasion)) return false;
    const units = new Set(value.units.map(entry => entry.id)), occasions = new Set(value.occasions.map(entry => entry.id));
    if (units.size !== value.units.length || occasions.size !== value.occasions.length) return false;
    const ids = new Set<string>(), pairs = new Set<string>();
    return value.indices.every(entry => {
        if (!fields(entry, ['id', 'unitId', 'occasionId']) || !text(entry.id) || !text(entry.unitId) || !text(entry.occasionId)
            || !units.has(entry.unitId) || !occasions.has(entry.occasionId) || ids.has(entry.id)) return false;
        const pair = JSON.stringify([entry.unitId, entry.occasionId]);
        if (pairs.has(pair)) return false;
        ids.add(entry.id);
        pairs.add(pair);
        return true;
    });
}

const rational = (value: unknown): value is SignedRational => fields(value, ['numerator', 'denominator']) && isCanonicalSignedRational(value);
const sameNumber = (value: unknown, expected: SignedRational): boolean => rational(value)
    && value.numerator === expected.numerator && value.denominator === expected.denominator;

function responseDomain(value: unknown, expected: StatisticalResponseDomain): value is StatisticalResponseDomain {
    if (!fields(value, ['kind', 'values']) || value.kind !== expected.kind || !dense(value.values, 1)
        || value.values.length !== expected.values.length) return false;
    const entries = value.values;
    return new Set(entries.map(entry => expected.kind === 'numeric' && rational(entry)
        ? `${entry.numerator}/${entry.denominator}` : entry)).size === entries.length
        && (expected.kind === 'numeric' ? entries.every(entry => expected.values.some(number => sameNumber(entry, number)))
            : entries.every(entry => expected.values.includes(entry as StatisticalColor)));
}

function response(value: unknown, domain: StatisticalResponseDomain): value is StatisticalResponse {
    return fields(value, ['kind', 'value']) && value.kind === domain.kind
        && (domain.kind === 'numeric' ? domain.values.some(number => sameNumber(value.value, number))
            : domain.values.includes(value.value as StatisticalColor));
}
const sameResponse = (first: StatisticalResponse, second: StatisticalResponse): boolean => first.kind === 'numeric'
    ? second.kind === 'numeric' && sameNumber(first.value, second.value)
    : second.kind === 'categorical' && first.value === second.value;

function variability(value: unknown, plan: StatisticalObservationPlan, domain: StatisticalResponseDomain): boolean {
    if (!fields(value, ['kind'])) return false;
    if (value.kind === 'single-observation') return fields(value, ['observationId']) && plan.observationCount === 1
        && value.observationId === plan.indices[0].id;
    if (value.kind === 'constant-response') return fields(value, ['response']) && domain.values.length === 1
        && response(value.response, domain);
    if (value.kind !== 'anticipated-variation' || !fields(value, ['possibilities']) || !dense(value.possibilities, 2)
        || value.possibilities.length !== 2 || plan.observationCount < 2 || domain.values.length < 2) return false;
    const ids = new Set(plan.indices.map(entry => entry.id));
    const possibility = (entry: unknown): entry is StatisticalIndexedResponse => fields(entry, ['observationId', 'response'])
        && typeof entry.observationId === 'string' && ids.has(entry.observationId) && response(entry.response, domain);
    if (!value.possibilities.every(possibility)) return false;
    const [first, second] = value.possibilities;
    return first.observationId !== second.observationId && !sameResponse(first.response, second.response);
}

function investigation(value: unknown): value is StatisticalInvestigation {
    if (!fields(value, ['id', 'observationPlan', 'attribute', 'responseDomain', 'variability']) || !text(value.id)) return false;
    const meaning = attributeMeaning(value.attribute);
    return meaning !== undefined && observationPlan(value.observationPlan, meaning.unitKind)
        && responseDomain(value.responseDomain, meaning.domain)
        && variability(value.variability, value.observationPlan, meaning.domain);
}

/** Total semantic guard; equivalent registry/evidence orders are not serialized-shape constraints. */
export function isStatisticalQuestionsProblem(value: unknown): value is StatisticalQuestionsProblem {
    try {
        if (!fields(value, ['kind', 'investigations']) || value.kind !== 'statistical-questions' || !dense(value.investigations, 1)
            || !value.investigations.every(investigation)) return false;
        return new Set(value.investigations.map(entry => entry.id)).size === value.investigations.length;
    } catch {
        return false;
    }
}

function indexedResponse(observationId: string, domain: StatisticalResponseDomain, index: number): StatisticalIndexedResponse {
    return {observationId, response: domain.kind === 'numeric'
        ? {kind: 'numeric', value: {...domain.values[index]}} : {kind: 'categorical', value: domain.values[index]}};
}

/** Construct index, domain and possibility proofs from source investigation semantics only. */
export function buildStatisticalQuestionsProblem(
    inputs: readonly [StatisticalInvestigationInput, ...StatisticalInvestigationInput[]]
): StatisticalQuestionsProblem {
    try {
        if (!dense(inputs, 1)) return fail('Supply a nonempty dense investigation collection.');
        const built = inputs.map(input => {
            if (!fields(input, ['id', 'populationName', 'units', 'occasions', 'attribute']) || !text(input.id) || !text(input.populationName)) return fail();
            const meaning = attributeMeaning(input.attribute);
            if (!meaning || !dense(input.units, 1) || !dense(input.occasions, 1)
                || !input.units.every(entry => unit(entry, meaning.unitKind)) || !input.occasions.every(occasion)) return fail();
            if (new Set(input.units.map(entry => entry.id)).size !== input.units.length
                || new Set(input.occasions.map(entry => entry.id)).size !== input.occasions.length) {
                return fail('Unit and occasion registries need unique IDs before constructing observation pairs.');
            }
            const count = BigInt(input.units.length) * BigInt(input.occasions.length);
            // A complete canonical index registry must itself fit a JavaScript array.
            if (count > 0xffff_ffffn) return fail('The complete observation-index array is not representable.');
            const cloneUnit = (entry: StatisticalObservationUnit) => ({id: entry.id, name: entry.name, kind: entry.kind});
            const cloneOccasion = (entry: StatisticalObservationOccasion) => ({id: entry.id, name: entry.name});
            const units: StatisticalObservationPlan['units'] = [cloneUnit(input.units[0]), ...input.units.slice(1).map(cloneUnit)];
            const occasions: StatisticalObservationPlan['occasions'] = [cloneOccasion(input.occasions[0]), ...input.occasions.slice(1).map(cloneOccasion)];
            const rows = units.flatMap((unit, unitIndex) => occasions.map((occasion, occasionIndex) => ({
                id: `${input.id}:observation:${unitIndex * occasions.length + occasionIndex + 1}`, unitId: unit.id, occasionId: occasion.id
            })));
            const indices: StatisticalObservationPlan['indices'] = [rows[0], ...rows.slice(1)];
            const observationPlan: StatisticalObservationPlan = {populationName: input.populationName, units, occasions, indices, observationCount: Number(count)};
            const domain = meaning.domain;
            const evidence: StatisticalVariabilityEvidence = indices.length === 1 ? {kind: 'single-observation', observationId: indices[0].id}
                : domain.values.length === 1 ? {kind: 'constant-response', response: indexedResponse(indices[0].id, domain, 0).response}
                    : {kind: 'anticipated-variation', possibilities: [indexedResponse(indices[0].id, domain, 0), indexedResponse(indices[1].id, domain, 1)]};
            return {id: input.id, observationPlan, attribute: meaning.attribute, responseDomain: domain, variability: evidence};
        });
        const investigations: StatisticalQuestionsProblem['investigations'] = [built[0], ...built.slice(1)];
        const result: StatisticalQuestionsProblem = {kind: 'statistical-questions', investigations};
        if (!isStatisticalQuestionsProblem(result)) return fail();
        return result;
    } catch (error) {
        if (error instanceof GeneratorValidationError) throw error;
        return fail('Investigation inputs must contain accessible canonical data fields.');
    }
}

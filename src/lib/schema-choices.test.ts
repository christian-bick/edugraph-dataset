import {describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import {hasAllLabels, hasCapability, hasLabel, matchAllExactLabels, ontologyNeutral,
    selectExactLabelMap, selectExactLabelSetMap} from './resolvers.ts';
import {normalizeSchemaChoices, resolveSchemaChoices, validateSchemaChoiceContracts} from './schema-choices.ts';
import {compositionalResolver, withLabelChoices, type ConfigSchema} from '../types/schema.ts';
import {random, setSeed} from './random.ts';

const labelsOf = (schema: ConfigSchema, target: string[] = []) =>
    normalizeSchemaChoices(schema, target, 'generator').map(domain =>
        domain.alternatives.map(alternative => alternative.labels));

describe('schema label choices', () => {
    it('declares factory alternatives without executing resolvers or consuming randomness', () => {
        const resolver = vi.fn(() => { throw new Error('must not run'); });
        const schema = {choice: [['a', 'b'], withLabelChoices(resolver, {kind: 'alternatives'})]} as const;
        setSeed(53);
        const expected = random();
        setSeed(53);
        expect(labelsOf(schema)).toEqual([[['a'], ['b']]]);
        expect(random()).toBe(expected);
        expect(resolver).not.toHaveBeenCalled();
    });

    it('keeps exact choices disjoint even when they resolve to the same value', () => {
        const schema = {choice: [['a', 'b'], selectExactLabelMap([['a', 1], ['b', 1]])]} as const;
        expect(labelsOf(schema, ['a', 'b'])).toEqual([[]]);
        expect(labelsOf(schema, ['a'])).toEqual([[['a']]]);
    });

    it('distinguishes all legal conjunctions from the smaller fallback set', () => {
        const schema = {choice: [['a', 'b'], selectExactLabelSetMap([
            [['a'], 1], [['a', 'b'], 2]
        ]), [['a']]]} as const;
        expect(labelsOf(schema)).toEqual([[['a']]]);
        expect(labelsOf(schema, ['a', 'b'])).toEqual([[['a', 'b']]]);
        expect(labelsOf(schema, ['b'])).toEqual([[]]);
    });

    it('preserves equivalent fallback bundles without admitting different-value supersets', () => {
        const schema = {choice: [['a', 'b', 'c'], selectExactLabelSetMap([
            [['a'], {value: 1}], [['a', 'b'], {value: 1}], [['a', 'c'], {value: 2}]
        ]), [['a'], ['a', 'b'], ['a', 'c']]]} as const;
        expect(labelsOf(schema, ['a'])).toEqual([[['a', 'b'], ['a']]]);
        const withoutFallback = {choice: [schema.choice[0], schema.choice[1]]} as const;
        expect(labelsOf(withoutFallback, ['a'])).toEqual([[['a']]]);
    });

    it('preserves disabled predicates and aggregate conjunctions without inventing opposites', () => {
        const schema = {
            flag: [['a'], hasLabel('a')],
            both: [['b', 'c'], hasAllLabels(['b', 'c'])],
            all: [['d', 'e'], matchAllExactLabels]
        } as const;
        expect(labelsOf(schema)).toEqual([[[]], [[]], [[]]]);
        const result = resolveSchemaChoices(schema, ['b', 'd', 'e'], {flag: [], both: ['b'], all: ['d', 'e']});
        expect(result).toEqual({config: {flag: false, both: false, all: ['d', 'e']}, resolvedLabels: ['b', 'd', 'e']});
    });

    it('keeps capability-aware predicates distinct from exact predicates', () => {
        const schema = {
            exact: [[Scope.NumericRange], hasLabel(Scope.NumericRange)],
            inherited: [[Scope.NumericRange], hasCapability(Scope.NumericRange)]
        } as const;
        expect(labelsOf(schema, [Scope.NumbersSmaller20])).toEqual([[[]], [[Scope.NumericRange]]]);
    });

    it('declares an empty exact default separately from random completion', () => {
        const schema = {choice: [['a'], selectExactLabelSetMap([[[], 'none'], [['a'], 'one']])]} as const;
        expect(labelsOf(schema)).toEqual([[[]]]);
        expect(resolveSchemaChoices(schema, [], {choice: []}).config.choice).toBe('none');
    });

    it('preserves predicate truth when completing explicit positive/negative fallback bundles', () => {
        const schema = {negative: [['with', 'without'], hasLabel('with'), [['with'], ['without']]]} as const;
        expect(labelsOf(schema)).toEqual([[['without']]]);
        expect(labelsOf(schema, ['with'])).toEqual([[['with']]]);
        const oneSided = {flag: [['a'], hasLabel('a'), [['a']]]} as const;
        expect(labelsOf(oneSided)).toEqual([[[]]]);
    });

    it('uses defaults from original target context, without executing their value resolver', () => {
        const schema = {unit: [['cm', 'in'], withLabelChoices(selectExactLabelMap([
            ['cm', 'metric'], ['in', 'imperial']
        ]), {kind: 'alternatives', defaults: [
            {whenAll: ['fraction'], labels: ['in']}, {labels: ['cm']}
        ]})]} as const;
        expect(labelsOf(schema)).toEqual([[['cm']]]);
        expect(labelsOf(schema, ['fraction'])).toEqual([[['in']]]);
        expect(labelsOf(schema, ['fraction', 'cm'])).toEqual([[['cm']]]);
    });

    it('keeps compositional ranges symbolic and ontology-neutral choices outside domains', () => {
        const resolver = withLabelChoices(compositionalResolver((labels: string[]) => labels.join('+')),
            {kind: 'target'});
        const neutral = vi.fn(() => 42);
        const schema = {bounds: [['min', 'max'], resolver], style: ontologyNeutral(neutral)} as const;
        expect(labelsOf(schema, ['min', 'max'])).toEqual([[['max', 'min']]]);
        expect(neutral).not.toHaveBeenCalled();
        expect(resolveSchemaChoices(schema, ['min', 'max'], {bounds: ['min', 'max']}).config)
            .toEqual({bounds: 'max+min', style: 42});
        expect(neutral).toHaveBeenCalledOnce();
    });

    it('binds field selections without leaking another field or owner into a resolver', () => {
        const observed: string[][] = [];
        const resolver = withLabelChoices((labels: string[]) => {observed.push(labels); return labels;},
            {kind: 'alternatives', contextLabels: ['declared-context']});
        const schema = {a: [['a'], resolver], b: ['b']} as const;
        const target = Object.freeze(['declared-context', 'private-view-choice']);
        resolveSchemaChoices(schema, target, {a: ['a'], b: ['b']});
        expect(observed).toEqual([['a', 'declared-context']]);
        expect(target).toEqual(['declared-context', 'private-view-choice']);
    });

    it('supplies another local selection only when that semantic dependency was declared', () => {
        const schema = {
            operation: ['addition'],
            iterated: [['iterated'], hasAllLabels(['addition', 'iterated'])]
        } as const;
        expect(resolveSchemaChoices(schema, ['iterated'], {operation: ['addition'], iterated: ['iterated']}).config)
            .toEqual({operation: 'addition', iterated: true});
    });

    it('rejects unbound, foreign, impossible and unresolved selections', () => {
        const schema = {a: [['a'], selectExactLabelMap([['a', 1]])]} as const;
        expect(() => resolveSchemaChoices(schema, [], {})).toThrow('selection is missing');
        expect(() => resolveSchemaChoices(schema, [], {b: ['b']})).toThrow('unknown selected field');
        expect(() => resolveSchemaChoices(schema, [], {a: ['b']})).toThrow('outside the admitted domain');
        const invalid = {a: [['a'], withLabelChoices(() => undefined, {kind: 'alternatives'})]} as const;
        expect(() => resolveSchemaChoices(invalid, [], {a: ['a']})).toThrow('did not resolve a value');
    });

    it('validates all bindings before executing any resolver', () => {
        const resolver = vi.fn(() => 1);
        const schema = {neutral: ontologyNeutral(resolver),
            first: [['a'], withLabelChoices(resolver, {kind: 'alternatives'})], last: ['b']} as const;
        expect(() => resolveSchemaChoices(schema, [], {first: ['a'], last: ['invalid']})).toThrow('outside');
        expect(resolver).not.toHaveBeenCalled();
    });

    it.each([
        [{a: [[], hasLabel('a')]}, 'supported labels'],
        [{a: [['a', 'a'], hasLabel('a')]}, 'unique'],
        [{a: [['a'], () => 1]}, 'no declared'],
        [{a: () => 1}, 'ontology-neutral'],
        [{a: [['a'], withLabelChoices(() => 1, {kind: 'alternatives', alternatives: []})]}, 'must not be empty'],
        [{a: [['a'], withLabelChoices(() => 1, {kind: 'alternatives', alternatives: [['b']]})]}, 'unsupported'],
        [{a: [['a'], withLabelChoices(() => 1, {kind: 'alternatives', alternatives: [['a'], ['a']]})]}, 'duplicate'],
        [{a: [['a'], withLabelChoices(() => 1, {kind: 'alternatives', defaults: [{labels: []}]})]}, 'default'],
        [{a: [['a'], withLabelChoices(() => 1, {kind: 'alternatives', equivalenceGroups: [[['a']]]})]}, 'at least two'],
        [{a: [['a'], withLabelChoices(() => 1, {kind: 'alternatives', equivalenceGroups: [[['a'], []]]})]}, 'legal'],
        [{a: [['a'], matchAllExactLabels, [['a']]]}, 'predicate semantics'],
        [{a: [['a'], selectExactLabelMap([['a', 1]]), [[]]]}, 'fallback']
    ])('reports malformed declarations before any generation (%#)', (schema, message) => {
        expect(() => validateSchemaChoiceContracts(schema as unknown as ConfigSchema)).toThrow(message);
    });
});

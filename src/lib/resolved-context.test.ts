import {describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import {withLabelChoices} from '../types/schema.ts';
import {normalizeSchemaChoices, resolveSchemaChoices, validateSchemaChoiceContracts} from './schema-choices.ts';
import {extractConfig} from './utils.ts';
import {getRandomState, setSeed} from './random.ts';

const contextual = (resolvedContext?: true) => withLabelChoices((labels: string[]) =>
    labels.includes('off') ? false : labels.includes('on') && labels.includes(Scope.StepsOf10) ? true : undefined,
{kind: 'alternatives', alternatives: [['off'], ['on']], contextLabels: [Scope.StepsOf10], resolvedContext});

describe('opt-in resolved configuration context', () => {
    it('uses only declared prior labels without changing the target or emitting them twice', () => {
        const observed = vi.fn(contextual(true));
        const resolver = withLabelChoices(observed, contextual(true).labelChoices!);
        const schema = {step: [Scope.StepsOf10], hidden: ['hidden'],
            choice: [['off', 'on'], resolver, [['off'], ['on']]]} as const;
        const target = ['on'];
        const result = extractConfig(schema, target);
        expect(result.config.choice).toBe(true);
        expect(result.resolvedLabels).toEqual([Scope.StepsOf10, 'hidden', 'on']);
        expect(target).toEqual(['on']);
        for (const [labels] of observed.mock.calls) {
            expect(labels).toContain(Scope.StepsOf10);
            expect(labels).not.toContain('hidden');
        }
        const planned = resolveSchemaChoices(schema, target,
            {step: [Scope.StepsOf10], hidden: ['hidden'], choice: ['on']});
        expect(planned.config).toEqual(result.config);
        expect(normalizeSchemaChoices(schema, target, 'generator').find(domain => domain.field === 'choice')
            ?.alternatives.map(alternative => alternative.labels)).toEqual([['on']]);
    });

    it('leaves legacy resolver inputs, values and entropy unchanged', () => {
        const seen = vi.fn((labels: string[]) => labels.includes('on'));
        const resolver = withLabelChoices(seen, {kind: 'alternatives', contextLabels: [Scope.StepsOf10]});
        const schema = {step: [Scope.StepsOf10], choice: [['off', 'on'], resolver, [['off'], ['on']]]} as const;
        setSeed(72);
        const result = extractConfig(schema, ['on']);
        const after = getRandomState();
        setSeed(72);
        const expected = extractConfig({step: schema.step}, ['on']);
        expect(result.config).toEqual({...expected.config, choice: true});
        expect(getRandomState()).toBe(after);
        for (const [labels] of seen.mock.calls) expect(labels).not.toContain(Scope.StepsOf10);
    });

    it('does not invent a later field binding or an undeclared context', () => {
        const schema = {choice: [['off', 'on'], contextual(true), [['off'], ['on']]], step: [Scope.StepsOf10]} as const;
        expect(() => extractConfig(schema, ['on'])).toThrow(/cannot complete/);
        const noOptIn = {step: [Scope.StepsOf10], choice: [['off', 'on'], contextual(), [['off'], ['on']]]} as const;
        expect(() => extractConfig(noOptIn, ['on'])).toThrow(/cannot complete/);
    });

    it('rejects an opt-in that has no declared context contract', () => {
        const schema = {choice: [['a'], withLabelChoices(() => 'a', {kind: 'alternatives', resolvedContext: true})]} as const;
        expect(() => validateSchemaChoiceContracts(schema)).toThrow(/nonempty declared context/);
        expect(() => extractConfig(schema, [])).toThrow(/nonempty declared context/);
    });
});

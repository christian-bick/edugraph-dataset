import {describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts/generated';
import {ontologyNeutral, selectExactLabelSetMap, selectExactMatch} from './resolvers.ts';
import {resolveRangeFromLabels} from './ontology.ts';
import {getRandomState, random, setSeed} from './random.ts';
import {hasStaticResolution, registerStaticResolver} from './static-resolvers.ts';
import {resolveStaticSchemaChoices} from './static-schema-resolution.ts';

describe('reviewed static configuration resolution', () => {
    it('resolves every admitted fixed binding without consuming entropy', () => {
        const schema = {
            range: [[Scope.NumbersSmaller10, Scope.NumbersSmaller100], resolveRangeFromLabels],
            cardinality: [[Scope.TwoOperands, Scope.ThreeOperands], selectExactMatch],
            profile: [[Scope.ProperFractions, Scope.ImproperFractions], selectExactLabelSetMap([
                [[Scope.ProperFractions], 'proper'], [[Scope.ImproperFractions], 'improper']
            ] as const)],
            notation: [Scope.ArabicNumerals]
        } as const;
        for (const range of [Scope.NumbersSmaller10, Scope.NumbersSmaller100]) {
            for (const cardinality of [Scope.TwoOperands, Scope.ThreeOperands]) {
                for (const profile of [Scope.ProperFractions, Scope.ImproperFractions]) {
                    setSeed(193);
                    const state = getRandomState();
                    const resolved = resolveStaticSchemaChoices(schema, [range, cardinality, profile], {
                        range: [range], cardinality: [cardinality], profile: [profile], notation: [Scope.ArabicNumerals]
                    });
                    expect(resolved).toMatchObject({status: 'resolved', config: {
                        range: {min: 0, max: range === Scope.NumbersSmaller10 ? 10 : 100},
                        cardinality, profile: profile === Scope.ProperFractions ? 'proper' : 'improper', notation: Scope.ArabicNumerals
                    }});
                    expect(getRandomState()).toBe(state);
                }
            }
        }
    });

    it('does not execute custom or ontology-neutral fields to guess whether they are deterministic', () => {
        const neutral = vi.fn(() => random());
        const custom = Object.assign(vi.fn(selectExactMatch), selectExactMatch);
        const schema = {neutral: ontologyNeutral(neutral), custom: [[Scope.TwoOperands], custom]} as const;
        expect(hasStaticResolution(custom)).toBe(false);
        expect(resolveStaticSchemaChoices(schema, [], {custom: [Scope.TwoOperands]})).toMatchObject({
            status: 'pending', fields: ['custom', 'neutral']
        });
        expect(neutral).not.toHaveBeenCalled();
        expect(custom).not.toHaveBeenCalled();
    });

    it('guards a registered resolver and restores entropy even when the violation is caught', () => {
        const invalid = registerStaticResolver(Object.assign((labels: string[]) => {
            try {random();} catch { /* the guard must remember the attempt */ }
            return labels[0];
        }, {labelResolution: 'exact' as const, labelChoices: {kind: 'alternatives' as const}}));
        setSeed(812);
        const state = getRandomState();
        expect(() => resolveStaticSchemaChoices({value: [[Scope.TwoOperands], invalid]},
            [Scope.TwoOperands], {value: [Scope.TwoOperands]})).toThrow();
        expect(getRandomState()).toBe(state);
    });
});

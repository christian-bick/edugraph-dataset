import {describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts/generated';
import {hasLabel, ontologyNeutral, selectExactLabelMap, selectExactLabelSetMap, selectExactMatch} from './resolvers.ts';
import {resolveRangeFromLabels} from './ontology.ts';
import {getRandomState, random, setSeed} from './random.ts';
import {hasStaticResolution, registerStaticResolver} from './static-resolvers.ts';
import {resolveStaticSchemaChoices} from './static-schema-resolution.ts';

describe('reviewed static configuration resolution', () => {
    it('exhausts exact mapped values and both predicate outcomes without consuming entropy', () => {
        const operationMappings = [
            [Area.Addition, 'addition'],
            [Area.AdditionPlaceValuePartitioning, 'addition'],
            [Area.Subtraction, 'subtraction'],
            [Area.SubtractionPlaceValuePartitioning, 'subtraction']
        ] as const;
        const operation = selectExactLabelMap(operationMappings);
        const regrouping = hasLabel(Area.IntegerRegrouping);
        const schema = {
            operation: [operationMappings.map(([label]) => label), operation],
            regrouping: [[Area.IntegerRegrouping], regrouping]
        } as const;
        expect(hasStaticResolution(operation)).toBe(true);
        expect(hasStaticResolution(regrouping)).toBe(true);
        for (const [label, value] of operationMappings) {
            for (const regroupingLabels of [[], [Area.IntegerRegrouping]]) {
                const target = [label, ...regroupingLabels];
                setSeed(731);
                expect(resolveStaticSchemaChoices(schema, target, {
                    operation: [label], regrouping: regroupingLabels
                })).toEqual({status: 'resolved', config: {
                    operation: value, regrouping: regroupingLabels.length > 0
                }, resolvedLabels: [...target].sort()});
                expect(getRandomState()).toBe(731);
            }
        }
    });

    it('retains unknown, ambiguous and duplicate exact-map validation', () => {
        const operation = selectExactLabelMap([
            [Area.Addition, 'addition'], [Area.Subtraction, 'subtraction']
        ] as const);
        setSeed(918);
        expect(operation([Scope.TwoOperands])).toBeUndefined();
        expect(() => operation([Area.Addition, Area.Subtraction]))
            .toThrow('Ambiguous exact label mapping');
        expect(() => selectExactLabelMap([[Area.Addition, 1], [Area.Addition, 2]]))
            .toThrow('Exact label mappings must not declare a label more than once');
        expect(() => resolveStaticSchemaChoices({operation: [[Area.Addition, Area.Subtraction], operation]},
            [Area.Addition], {operation: [Scope.TwoOperands]})).toThrow('outside the admitted domain');
        expect(getRandomState()).toBe(918);
    });

    it.each([
        hasLabel(Area.IntegerRegrouping),
        selectExactLabelMap([[Area.Addition, 'addition']] as const)
    ])('does not certify a wrapper by copying reviewed factory metadata', resolver => {
        const wrapper = Object.assign(vi.fn(resolver), resolver);
        expect(hasStaticResolution(wrapper)).toBe(false);
        expect(resolveStaticSchemaChoices({value: [[Area.Addition], wrapper]},
            [Area.Addition], {value: [Area.Addition]})).toMatchObject({status: 'pending', fields: ['value']});
        expect(wrapper).not.toHaveBeenCalled();
    });

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

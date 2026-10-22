import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {RationalOrderContextsGenerator} from './generator.ts';
import {RationalOrderContextsGeneratorSchema, spec} from './spec.ts';

describe('contextual order capability ownership and authoritative selection', () => {
    it('owns only inequality, rational values and the configured exact comparison direction', () => {
        expect(spec.generalLabels).toEqual([Area.Inequality, Scope.RationalNumbers]);
        expect(Object.keys(RationalOrderContextsGeneratorSchema)).toEqual(['relation']);
        expect(findSchemaFallbackContractIssues(RationalOrderContextsGeneratorSchema)).toEqual([]);
        expect(() => RationalOrderContextsGeneratorSchema.relation[1]([Scope.Less, Scope.Greater])).toThrow();
        expect(RationalOrderContextsGeneratorSchema.relation[1]([])).toBeUndefined();
        for (const [label, relation] of [[Scope.Less, 'less'], [Scope.Greater, 'greater']] as const) {
            const resolved = extractConfig(RationalOrderContextsGeneratorSchema, [label]);
            expect(resolved.config).toEqual({relation});
            expect(resolved.resolvedLabels).toEqual([label]);
            expect(generateWithLabels(new RationalOrderContextsGenerator(), [Area.Inequality, Scope.RationalNumbers, label])!.data.relation).toBe(relation);
        }
    });

    it('executes real plans for all four authored contextual order target permutations with exact emitted labels', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target =>
            target.id.startsWith('6.NS.C.7b-contextual-order-explanation~') || target.id.startsWith('6.NS.C.7b-contextual-order-writing~'));
        expect(targets).toHaveLength(4);
        for (const target of targets) {
            const explanation = target.labels.includes(Ability.Interpretation);
            const viewId = explanation ? 'numbers-contextual-order-explanation' : 'numbers-contextual-order-writing';
            const viewLabels = explanation ? [Ability.Interpretation, Ability.TextualArticulation, Ability.TextualReception]
                : [Ability.Formalization, Ability.TextualReception];
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId},
                targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels,
                fields: normalizeSchemaChoices(RationalOrderContextsGeneratorSchema, target.labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 16; seed++) {
                const draw = generatePlannedDraw({generator: new RationalOrderContextsGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub!.data.relation).toBe(target.labels.includes(Scope.Less) ? 'less' : 'greater');
            }
        }
    });

    it('uses complete truthful fallback choices and remains independent of learner action', () => {
        const directions = new Set<string>();
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const resolved = extractConfig(RationalOrderContextsGeneratorSchema, [Scope.RationalNumbers]);
            directions.add(resolved.config.relation!);
            expect(resolved.resolvedLabels).toEqual([resolved.config.relation === 'less' ? Scope.Less : Scope.Greater]);
        }
        expect(directions).toEqual(new Set(['less', 'greater']));
        const labels = [Area.Inequality, Scope.RationalNumbers, Scope.Greater];
        setSeed(91);
        const first = generateWithLabels(new RationalOrderContextsGenerator(), [...labels, Ability.Interpretation]);
        setSeed(91);
        expect(generateWithLabels(new RationalOrderContextsGenerator(), [...labels, Ability.Formalization])).toEqual(first);
        expect(() => new RationalOrderContextsGenerator().generate({})).toThrow();
    });
});

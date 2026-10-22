import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {RationalOrderRelationsGenerator} from './generator.ts';
import {RationalOrderRelationsGeneratorSchema, spec} from './spec.ts';

describe('strict-order schema and production plans', () => {
    it('owns Inequality/RationalNumbers plus exactly the selected strict-order Scope', () => {
        expect(spec.generalLabels).toEqual([Area.Inequality, Scope.RationalNumbers]);
        expect(Object.keys(RationalOrderRelationsGeneratorSchema)).toEqual(['relation']);
        expect(findSchemaFallbackContractIssues(RationalOrderRelationsGeneratorSchema)).toEqual([]);
        expect(() => RationalOrderRelationsGeneratorSchema.relation[1]([Scope.Less, Scope.Greater])).toThrow();
        for (const [label, relation] of [[Scope.Less, 'less'], [Scope.Greater, 'greater']] as const) {
            const resolved = extractConfig(RationalOrderRelationsGeneratorSchema, [label]);
            expect(resolved.config).toEqual({relation});
            expect(resolved.resolvedLabels).toEqual([label]);
            expect(generateWithLabels(new RationalOrderRelationsGenerator(), [label])!.data.relation).toBe(relation);
        }
    });

    it('resolves both actual Grade6 line-order targets without adding unreviewed claims', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.NS.C.7a-inequality-line-interpretation~'));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId: 'numbers-inequality-line-interpretation'},
                targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: [Scope.Numberline, Ability.Interpretation],
                fields: normalizeSchemaChoices(RationalOrderRelationsGeneratorSchema, target.labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 10; seed++) {
                const draw = generatePlannedDraw({generator: new RationalOrderRelationsGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#rational-order-relations#numbers-inequality-line-interpretation#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub!.data.relation).toBe(target.labels.includes(Scope.Less) ? 'less' : 'greater');
            }
        }
    });

    it('keeps canonical ordered values independent of learner Ability and rejects empty config', () => {
        setSeed(71);
        const first = generateWithLabels(new RationalOrderRelationsGenerator(), [Scope.Less, Ability.Interpretation]);
        setSeed(71);
        expect(generateWithLabels(new RationalOrderRelationsGenerator(), [Scope.Less, Ability.Formalization])).toEqual(first);
        expect(() => new RationalOrderRelationsGenerator().generate({})).toThrow();
    });
});

import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {RationalMagnitudeContextsGenerator} from './generator.ts';
import {RationalMagnitudeContextsGeneratorSchema, spec} from './spec.ts';

describe('contextual magnitude capability selection without ambiguous direction labels', () => {
    it('owns both exact comparison witnesses and a real signed input domain', () => {
        expect(spec.generalLabels).toEqual([Area.AbsoluteNumberMagnitude, Scope.RationalNumbers, Area.Inequality]);
        expect(Object.keys(RationalMagnitudeContextsGeneratorSchema)).toEqual(['signDomain']);
        expect(findSchemaFallbackContractIssues(RationalMagnitudeContextsGeneratorSchema)).toEqual([]);
        expect(RationalMagnitudeContextsGeneratorSchema.signDomain[1]([])).toBeUndefined();
        expect(() => RationalMagnitudeContextsGeneratorSchema.signDomain[1]([Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives])).toThrow();
        for (const [label, signDomain] of [[Scope.NumbersWithNegatives, 'signed'], [Scope.NumbersWithoutNegatives, 'nonnegative']] as const) {
            const resolved = extractConfig(RationalMagnitudeContextsGeneratorSchema, [label]);
            expect(resolved.config).toEqual({signDomain});
            expect(resolved.resolvedLabels).toEqual([label]);
            const data = generateWithLabels(new RationalMagnitudeContextsGenerator(), [Area.AbsoluteNumberMagnitude, Scope.RationalNumbers, label])!.data;
            expect(Math.min(data.first.sign, data.second.sign) < 0).toBe(signDomain === 'signed');
        }
    });

    it('executes both real authored targets and emits only invariant claims plus the chosen sign domain', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target =>
            target.id.startsWith('6.NS.C.7c-contextual-absolute-value~') || target.id.startsWith('6.NS.C.7d-order-versus-magnitude~'));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            const classification = target.labels.includes(Ability.ConceptClassification);
            const viewId = classification ? 'numbers-order-versus-magnitude' : 'numbers-contextual-absolute-value';
            const viewLabels = classification ? [Ability.ConceptClassification] : [Ability.Interpretation, Ability.Formalization];
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId},
                targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels,
                fields: normalizeSchemaChoices(RationalMagnitudeContextsGeneratorSchema, target.labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            const domains = new Set<string>();
            for (let seed = 0; seed < 40; seed++) {
                const draw = generatePlannedDraw({generator: new RationalMagnitudeContextsGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${viewId}#train#question#inst:0`, seed, attempt: 1});
                const signed = Math.min(draw.stub!.data.first.sign, draw.stub!.data.second.sign) < 0;
                const scope = signed ? Scope.NumbersWithNegatives : Scope.NumbersWithoutNegatives;
                domains.add(scope);
                expect(new Set(draw.labels)).toEqual(new Set([...target.labels, Area.Inequality, scope]));
                expect(draw.labels).not.toContain(Scope.Less);
                expect(draw.labels).not.toContain(Scope.Greater);
            }
            expect(domains).toEqual(new Set(classification ? [Scope.NumbersWithNegatives]
                : [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives]));
        }
    });

    it('resolves both complete domain fallbacks while preserving Ability independence', () => {
        const domains = new Set<string>();
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const resolved = extractConfig(RationalMagnitudeContextsGeneratorSchema, [Scope.RationalNumbers]);
            domains.add(resolved.config.signDomain!);
            expect(resolved.resolvedLabels).toEqual([resolved.config.signDomain === 'signed' ? Scope.NumbersWithNegatives : Scope.NumbersWithoutNegatives]);
        }
        expect(domains).toEqual(new Set(['signed', 'nonnegative']));
        const labels = [Area.AbsoluteNumberMagnitude, Area.Inequality, Scope.RationalNumbers, Scope.NumbersWithNegatives];
        setSeed(91);
        const first = generateWithLabels(new RationalMagnitudeContextsGenerator(), [...labels, Ability.ConceptClassification]);
        setSeed(91);
        expect(generateWithLabels(new RationalMagnitudeContextsGenerator(), [...labels, Ability.Interpretation, Ability.Formalization])).toEqual(first);
        expect(() => new RationalMagnitudeContextsGenerator().generate({})).toThrow();
    });
});

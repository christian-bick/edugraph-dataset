import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {RationalMagnitudeRelationsGenerator} from './generator.ts';
import {RationalMagnitudeRelationsGeneratorSchema, spec} from './spec.ts';

describe('absolute magnitude schema and production planning', () => {
    it('owns absolute magnitude and rational math with real complete sign-domain alternatives', () => {
        expect(spec.generalLabels).toEqual([Area.AbsoluteNumberMagnitude, Scope.RationalNumbers]);
        expect(Object.keys(RationalMagnitudeRelationsGeneratorSchema)).toEqual(['signDomain']);
        expect(RationalMagnitudeRelationsGeneratorSchema.signDomain[2]).toEqual([[Scope.NumbersWithoutNegatives], [Scope.NumbersWithNegatives]]);
        expect(findSchemaFallbackContractIssues(RationalMagnitudeRelationsGeneratorSchema)).toEqual([]);
        expect(() => RationalMagnitudeRelationsGeneratorSchema.signDomain[1]([Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives])).toThrow();
        for (const [label, signDomain] of [[Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']] as const) {
            const resolved = extractConfig(RationalMagnitudeRelationsGeneratorSchema, [label]);
            expect(resolved.config).toEqual({signDomain});
            expect(resolved.resolvedLabels).toEqual([label]);
            const data = generateWithLabels(new RationalMagnitudeRelationsGenerator(), [label])!.data;
            expect(data.point.sign === -1).toBe(signDomain === 'signed');
        }
    });

    it('resolves the actual broad magnitude target and publishes the chosen sign-domain evidence', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.NS.C.7c-absolute-value-distance~'));
        expect(targets).toHaveLength(1);
        const target = targets[0]!;
        const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId: 'numbers-absolute-value-distance'},
            targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: [Scope.Numberline, Ability.Interpretation],
            fields: normalizeSchemaChoices(RationalMagnitudeRelationsGeneratorSchema, target.labels, 'generator')});
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        const seen = new Set<string>();
        for (let seed = 0; seed < 40; seed++) {
            const draw = generatePlannedDraw({generator: new RationalMagnitudeRelationsGenerator(), viewSchema: {}, plan: result.plan,
                sampleKey: `${target.id}#rational-magnitude-relations#numbers-absolute-value-distance#train#question#inst:0`, seed, attempt: 1});
            const sign = draw.labels.includes(Scope.NumbersWithNegatives) ? Scope.NumbersWithNegatives : Scope.NumbersWithoutNegatives;
            seen.add(sign);
            expect(new Set(draw.labels)).toEqual(new Set([...target.labels, sign]));
            expect(draw.stub!.data.point.value.numerator < 0).toBe(sign === Scope.NumbersWithNegatives);
        }
        expect(seen).toEqual(new Set([Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives]));
    });

    it('keeps magnitude math independent of learner Ability and rejects empty config', () => {
        setSeed(83);
        const first = generateWithLabels(new RationalMagnitudeRelationsGenerator(), [Scope.NumbersWithoutNegatives, Ability.Interpretation]);
        setSeed(83);
        expect(generateWithLabels(new RationalMagnitudeRelationsGenerator(), [Scope.NumbersWithoutNegatives, Ability.ProcedureExecution])).toEqual(first);
        expect(() => new RationalMagnitudeRelationsGenerator().generate({})).toThrow();
    });
});

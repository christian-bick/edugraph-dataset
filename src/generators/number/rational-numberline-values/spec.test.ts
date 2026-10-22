import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeGradeSixTargets} from '../../../spec/ccss/grade-06.ts';
import {RationalNumberlineValuesGenerator} from './generator.ts';
import {RationalNumberlineValuesGeneratorSchema, spec} from './spec.ts';

const forms = [
    [Area.NumerationWithIntegers, Scope.IntegerNumbers],
    [Area.NumerationWithFractions, Scope.FractionNumbers],
    [Area.NumerationWithDecimals, Scope.DecimalNumbers]
];

describe('numberline mathematical capabilities and complete correlated numeric forms', () => {
    it('owns only selected numeration/form/sign claims, with complete exact fallback bundles', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(Object.keys(RationalNumberlineValuesGeneratorSchema)).toEqual(['numberKind', 'signDomain']);
        expect(RationalNumberlineValuesGeneratorSchema.numberKind[2]).toEqual(forms);
        expect(findSchemaFallbackContractIssues(RationalNumberlineValuesGeneratorSchema)).toEqual([]);
        expect(() => RationalNumberlineValuesGeneratorSchema.numberKind[1]([Scope.IntegerNumbers, Scope.FractionNumbers])).toThrow();
        expect(() => RationalNumberlineValuesGeneratorSchema.signDomain[1]([Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives])).toThrow();
        expect(RationalNumberlineValuesGeneratorSchema.numberKind[1]([Scope.IntegerNumbers])).toBeUndefined();
    });

    it.each(forms)('resolves complete form bundle %s/%s without additional Areas or Scopes', (...form) => {
        const numberKind = form.includes(Scope.IntegerNumbers) ? 'integer' : form.includes(Scope.FractionNumbers) ? 'fraction' : 'decimal';
        for (const sign of [Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives]) {
            const labels = [...form, sign];
            const resolved = extractConfig(RationalNumberlineValuesGeneratorSchema, labels);
            expect(resolved.config).toEqual({numberKind, signDomain: sign === Scope.NumbersWithNegatives ? 'signed' : 'nonnegative'});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set(labels));
            expect(generateWithLabels(new RationalNumberlineValuesGenerator(), labels)!.data.kind).toBe('rational-numberline-values');
        }
    });

    it('resolves every singleton form fallback to its complete truthful conjunction', () => {
        for (const form of forms) for (const label of form) {
            const resolved = extractConfig(RationalNumberlineValuesGeneratorSchema, [label, Scope.NumbersWithoutNegatives]);
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set([...form, Scope.NumbersWithoutNegatives]));
        }
    });

    it('executes authoritative production plans for all twelve actual authored Grade6 targets', () => {
        const targets = [...activeGradeSixTargets, ...implementationTodos].filter(target =>
            target.id.startsWith('6.NS.C.6c-rational-numberline-positioning~') || target.id.startsWith('6.NS.C.6c-rational-numberline-reading~'));
        expect(targets).toHaveLength(12);
        for (const target of targets) {
            const positioning = target.labels.includes(Ability.VisualArticulation);
            const ability = positioning ? Ability.VisualArticulation : Ability.VisualReception;
            const viewId = positioning ? 'numbers-rational-line-positioning' : 'numbers-rational-line-reading';
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId},
                targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: [Scope.Numberline, ability],
                fields: normalizeSchemaChoices(RationalNumberlineValuesGeneratorSchema, target.labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 8; seed++) {
                const draw = generatePlannedDraw({generator: new RationalNumberlineValuesGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(draw.stub!.data.kind).toBe('rational-numberline-values');
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
            }
        }
    });

    it('keeps canonical math independent of the learner Ability and rejects empty generation configuration', () => {
        for (const form of forms) {
            const labels = [...form, Scope.NumbersWithNegatives];
            setSeed(87);
            const first = generateWithLabels(new RationalNumberlineValuesGenerator(), [...labels, Scope.Numberline, Ability.VisualArticulation]);
            setSeed(87);
            expect(generateWithLabels(new RationalNumberlineValuesGenerator(), [...labels, Scope.Numberline, Ability.VisualReception])).toEqual(first);
        }
        expect(() => new RationalNumberlineValuesGenerator().generate({})).toThrow();
    });
});

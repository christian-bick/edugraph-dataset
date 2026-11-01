import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as rng from '../../../lib/random.ts';
import {RationalLinePositioningBody, RationalLineReadingBody} from '../../../visuals/views/numbers/rational-numberline-view.tsx';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {implementationTodos, spec as activeGradeSixTargets} from '../../../spec/ccss/grade-06.ts';
import {RationalNumberlineValuesGenerator} from './generator.ts';
import {RationalNumberlineValuesGeneratorSchema, spec} from './spec.ts';

const forms = [
    [Area.NumerationWithIntegers, Scope.IntegerNumbers],
    [Area.NumerationWithFractions, Scope.FractionNumbers, Scope.ProperFractions],
    [Area.NumerationWithDecimals, Scope.DecimalNumbers]
];

describe('numberline mathematical capabilities and complete correlated numeric forms', () => {
    it('exposes a proper step in both projections/modes for every fraction-axis configuration', () => {
        const random = vi.spyOn(rng, 'random');
        try {
            for (const signDomain of ['signed', 'nonnegative'] as const) {
                for (const [index, denominator] of [2, 3, 4, 6, 8].entries()) {
                    for (let radius = 2; radius <= 5; radius++) {
                        random.mockReturnValueOnce((radius - 2 + 0.5) / 4)
                            .mockReturnValueOnce((index + 0.5) / 5).mockReturnValueOnce(0).mockReturnValueOnce(0);
                        const data = new RationalNumberlineValuesGenerator().generate({numberKind: 'fraction', signDomain, range: createCanonicalNumericRange(5)}).data;
                        expect(data.axis.step).toEqual({numerator: 1, denominator});
                        for (const body of [RationalLineReadingBody, RationalLinePositioningBody]) {
                            for (const isSolutionView of [false, true]) for (const seed of [0, 1]) {
                                const html = renderToStaticMarkup(React.createElement(body, {data, isSolutionView, seed}))
                                    .replace(/<!--.*?-->/g, '');
                                expect(html).toContain(`Step: 1/${denominator}`);
                            }
                        }
                    }
                }
            }
        } finally {random.mockRestore();}
    });
    it('owns the zero-containing axis and selected numeration/form/sign claims with complete fallback bundles', () => {
        expect(spec.generalLabels).toEqual([Scope.NumbersWithZero]);
        expect(Object.keys(RationalNumberlineValuesGeneratorSchema)).toEqual(['numberKind', 'signDomain', 'range']);
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
            expect(resolved.config).toMatchObject({numberKind, signDomain: sign === Scope.NumbersWithNegatives ? 'signed' : 'nonnegative'});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set([...labels,
                resolved.config.range!.max === 5 ? Scope.NumbersSmaller5 : resolved.config.range!.max === 10 ? Scope.NumbersSmaller10 : Scope.NumbersSmaller20]));
            expect(generateWithLabels(new RationalNumberlineValuesGenerator(), labels)!.data.kind).toBe('rational-numberline-values');
        }
    });

    it('resolves every singleton form fallback to its complete truthful conjunction', () => {
        for (const form of forms) for (const label of form) {
            const resolved = extractConfig(RationalNumberlineValuesGeneratorSchema, [label, Scope.NumbersWithoutNegatives]);
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set([...form, Scope.NumbersWithoutNegatives,
                resolved.config.range!.max === 5 ? Scope.NumbersSmaller5 : resolved.config.range!.max === 10 ? Scope.NumbersSmaller10 : Scope.NumbersSmaller20]));
        }
    });

    it('executes authoritative production plans for all twelve actual authored Grade6 targets', () => {
        const targets = [...activeGradeSixTargets, ...implementationTodos].filter(target =>
            target.id.startsWith('6.NS.C.6c-rational-numberline-positioning~') || target.id.startsWith('6.NS.C.6c-rational-numberline-reading~'));
        expect(targets).toHaveLength(12);
        expect(targets.every(target => [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives]
            .filter(label => target.labels.includes(label)).length === 1)).toBe(true);
        for (const target of targets) {
            const positioning = target.labels.includes(Ability.VisualArticulation);
            const ability = positioning ? Ability.VisualArticulation : Ability.VisualReception;
            const viewId = positioning ? 'numbers-rational-line-positioning' : 'numbers-rational-line-reading';
            const result = planModelCompatibility(target,
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: RationalNumberlineValuesGeneratorSchema, spec},
                {viewId, generalLabels: [Scope.Numberline, ability], schema: {}, spec: {viewId, generalLabels: [Scope.Numberline, ability]}});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 8; seed++) {
                const draw = generatePlannedDraw({generator: new RationalNumberlineValuesGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(draw.stub!.data.kind).toBe('rational-numberline-values');
                const maximum = draw.stub!.data.axis.maximum;
                const bound = maximum.numerator / maximum.denominator;
                expect(new Set(draw.labels)).toEqual(new Set([...target.labels, Scope.NumbersWithZero,
                    bound <= 5 ? Scope.NumbersSmaller5 : bound <= 10 ? Scope.NumbersSmaller10 : Scope.NumbersSmaller20,
                    ...(target.labels.includes(Scope.FractionNumbers) ? [Scope.ProperFractions] : [])]));
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

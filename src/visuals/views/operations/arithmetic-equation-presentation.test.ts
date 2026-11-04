import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {extractConfig} from '../../../lib/utils.ts';
import type {ArithmeticProblem} from '../../../types/problems.ts';
import {
    resolveBoxedEquationShape, resolveVerticalEquationPresentation,
    validateBoxedEquationShape, validateVerticalEquationPresentation
} from './arithmetic-equation-presentation.ts';
import {OperationsBoxesViewSchema, spec as boxes} from './operations-boxes/spec.ts';
import {OperationsVerticalViewSchema, spec as vertical} from './operations-vertical/spec.ts';
import {OperationsBoxesInversionViewSchema, spec as boxesInversion} from './operations-boxes-inversion/spec.ts';
import {OperationsVerticalInversionViewSchema, spec as verticalInversion} from './operations-vertical-inversion/spec.ts';
import {ArithmeticOpsTriplesGeneratorSchema, spec as triples} from '../../../generators/arithmetic/arithmetic-ops-triples/spec.ts';
import {Ability} from 'edugraph-ts';
import {extractSchemaLabels} from '../../../types/schema.ts';
import {matchTarget} from '../../../lib/matching.ts';

const one = Scope.ExpressionOnOneSide, both = Scope.ExpressionOnBothSides;
const laws = [Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw];
const pair: ArithmeticProblem = {num1: 2, num2: 3, operation: 'addition', answer: 5};
const payload = (law?: 'commutative' | 'associative' | 'distributive'): ArithmeticProblem =>
    law === undefined ? pair : {...pair, num3: 4, propertyLaw: law};

function selections(generatorLabels: string[], targetLabels: string[], mode: 'boxes' | 'vertical') {
    const spec = mode === 'boxes' ? boxes : vertical;
    const schema = mode === 'boxes' ? OperationsBoxesViewSchema : OperationsVerticalViewSchema;
    const match = planModelCompatibility({id: 'equation-profile', labels: targetLabels},
        {generatorId: 'fixed-math', generalLabels: generatorLabels, schema: {},
            spec: {generatorId: 'fixed-math', generalLabels: generatorLabels}},
        {viewId: spec.viewId, generalLabels: spec.generalLabels, schema, spec});
    if (!match.supported) return [];
    const enumeration = enumerateDependencyAuditSelections(match.plan);
    expect(enumeration.status).toBe('complete');
    return enumeration.selections;
}

describe('preselected equation presentation', () => {
    it.each([undefined, 'commutative', 'associative', 'distributive'] as const)(
        'correlates both view profiles with selected %s mathematics', law => {
            const label = law === 'distributive' ? Area.DistributiveLaw
                : law === 'commutative' ? Area.CommutativeLaw : Area.AssociativeLaw;
            const generatorLabels = law === undefined ? [] : [label];
            for (const targetLabels of [[], generatorLabels]) {
                const boxed = selections(generatorLabels, targetLabels, 'boxes');
                const stacked = selections(generatorLabels, targetLabels, 'vertical');
                expect(boxed).toHaveLength(1);
                expect(stacked).toHaveLength(1);
                expect(boxed[0].labels).toContain(law === 'distributive' ? both : one);
                expect(boxed[0].labels).not.toContain(law === 'distributive' ? one : both);
                if (law === undefined) {
                    expect(stacked[0].labels).not.toContain(Area.Equation);
                    expect(stacked[0].labels).not.toContain(one);
                    expect(stacked[0].labels).not.toContain(both);
                } else {
                    expect(stacked[0].labels).toContain(Area.Equation);
                    expect(stacked[0].labels).toContain(law === 'distributive' ? both : one);
                    expect(stacked[0].labels).not.toContain(law === 'distributive' ? one : both);
                }
            }
        });

    it('rejects conflicting law/profile conjunctions without replacing the selected mathematics', () => {
        expect(selections([Area.DistributiveLaw], [one], 'boxes')).toEqual([]);
        expect(selections([Area.CommutativeLaw], [both], 'vertical')).toEqual([]);
        expect(selections([], [Area.Equation], 'vertical')).toEqual([]);
        expect(selections(laws, [], 'vertical')).toEqual([]);
        expect(selections([Area.CommutativeLaw], [one, both], 'boxes')).toEqual([]);
    });

    it('has inspectable deterministic direct fallbacks and rejects unsupported label bundles', () => {
        expect(extractConfig(OperationsBoxesViewSchema, []).config).toEqual({equationShape: 'one-side'});
        expect(extractConfig(OperationsBoxesViewSchema, [Area.DistributiveLaw]).config)
            .toEqual({equationShape: 'both-sides'});
        expect(extractConfig(OperationsVerticalViewSchema, []).config).toEqual({presentation: 'vertical'});
        for (const law of laws) {
            expect(extractConfig(OperationsVerticalViewSchema, [law]).config)
                .toEqual({presentation: law === Area.DistributiveLaw ? 'law-both-sides' : 'law-one-side'});
        }
        expect(() => resolveBoxedEquationShape([one, both])).toThrow('Ambiguous');
        expect(() => resolveVerticalEquationPresentation([Area.Equation, one, both])).toThrow('Unsupported');
        expect(resolveVerticalEquationPresentation([Area.Equation])).toBeUndefined();
        expect(resolveVerticalEquationPresentation([Area.Equation, Area.DistributiveLaw])).toBeUndefined();
        expect(resolveVerticalEquationPresentation([one, Area.CommutativeLaw])).toBeUndefined();
        expect(() => resolveVerticalEquationPresentation([Area.Equation, one, both, Area.DistributiveLaw]))
            .toThrow('Unsupported');
    });

    it.each([undefined, 'commutative', 'associative', 'distributive'] as const)(
        'validates prepared presentation against canonical %s data', law => {
            const data = payload(law);
            const shape = law === 'distributive' ? 'both-sides' : 'one-side';
            const presentation = law === undefined ? 'vertical'
                : law === 'distributive' ? 'law-both-sides' : 'law-one-side';
            expect(() => validateBoxedEquationShape(data, shape)).not.toThrow();
            expect(() => validateVerticalEquationPresentation(data, presentation)).not.toThrow();
            expect(() => validateBoxedEquationShape(data, undefined)).toThrow('prepared equation shape');
            expect(() => validateVerticalEquationPresentation(data, undefined)).toThrow('prepared presentation');
            expect(() => validateBoxedEquationShape(data, shape === 'one-side' ? 'both-sides' : 'one-side')).toThrow();
            expect(() => validateVerticalEquationPresentation(data,
                presentation === 'vertical' ? 'law-one-side' : 'vertical')).toThrow();
        });

    it('rejects an unknown property instead of rendering a different law', () => {
        expect(() => validateBoxedEquationShape({...payload('commutative'), propertyLaw: 'unknown'} as never, 'one-side'))
            .toThrow('Unsupported arithmetic property');
    });

    it.each([
        [Scope.NumbersSmaller20, [Area.Multiplication], 1],
        [Scope.NumbersSmaller100, [Area.Addition, Area.Multiplication], 2]
    ] as const)('preserves implicit distributive width fallbacks at %s in all four siblings', (upper, operations, count) => {
        const target = {id: 'implicit-width-law', labels: [Ability.ProcedureExecution,
            ...operations, Scope.SingleDigitSmallestOperand, upper]};
        const generator = {generatorId: triples.generatorId, generalLabels: triples.generalLabels,
            labels: [...triples.generalLabels, ...extractSchemaLabels(ArithmeticOpsTriplesGeneratorSchema)],
            schema: ArithmeticOpsTriplesGeneratorSchema, spec: triples, problemType: 'ArithmeticTripleProblem'};
        const siblings = [[boxes, OperationsBoxesViewSchema], [vertical, OperationsVerticalViewSchema],
            [boxesInversion, OperationsBoxesInversionViewSchema], [verticalInversion, OperationsVerticalInversionViewSchema]] as const;
        let originalBindings: string[] | undefined;
        for (const [spec, schema] of siblings) {
            const result = matchTarget(target, generator, {viewId: spec.viewId, generalLabels: spec.generalLabels,
                supportedLabels: [...spec.generalLabels, ...extractSchemaLabels(schema)], schema, spec,
                problemType: 'ArithmeticProblem'});
            expect(result.matched).toBe(true);
            if (!result.matched) throw new Error(result.reason);
            const enumeration = enumerateDependencyAuditSelections(result.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(count);
            for (const selection of enumeration.selections) {
                expect(selection.labels).toContain(Area.DistributiveLaw);
                expect(selection.labels).toContain(Area.Equation);
                expect(selection.labels).toContain(both);
                expect(selection.labels).not.toContain(one);
            }
            const bindings = enumeration.selections.map(selection => JSON.stringify(
                selection.choices.filter(choice => choice.owner === 'generator'))).sort();
            if (originalBindings === undefined) originalBindings = bindings;
            else expect(bindings).toEqual(originalBindings);
            if (spec.viewId.endsWith('inversion')) {
                expect(matchTarget({...target, labels: [...target.labels, Area.DistributiveLaw]}, generator,
                    {viewId: spec.viewId, generalLabels: spec.generalLabels,
                        supportedLabels: [...spec.generalLabels, ...extractSchemaLabels(schema)], schema, spec,
                        problemType: 'ArithmeticProblem'}).matched).toBe(false);
            }
        }
    });
});

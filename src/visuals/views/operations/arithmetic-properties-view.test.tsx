import {Ability, Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ArithmeticPropertyRelationsGenerator} from '../../../generators/arithmetic/arithmetic-property-relations/generator.ts';
import {
    ArithmeticPropertyRelationsGeneratorSchema,
    spec as generatorSpec
} from '../../../generators/arithmetic/arithmetic-property-relations/spec.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {ArithmeticPropertyProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {propertyExplanation, validateArithmeticProperty} from './arithmetic-properties-helpers.ts';
import {ArithmeticPropertiesCompletion, ArithmeticPropertiesExplanation} from './arithmetic-properties-view.tsx';
import {OperationsPropertiesViewSchema, spec as completionSpec} from './operations-properties/spec.ts';
import {
    OperationsPropertiesExplanationViewSchema,
    spec as explanationSpec
} from './operations-properties-explanation/spec.ts';

const distributive: ArithmeticPropertyProblem = {
    propertyLaw: 'distributive', operation: 'multiplication', num1: 7, num2: 13, num3: 1,
    combinedFactor: 14, partialProducts: [91, 7], answer: 98
};
const fixtures: {data: ArithmeticPropertyProblem; equation: string; missing: number[]}[] = [
    {data: {propertyLaw: 'commutative', operation: 'addition', num1: 2, num2: 3, num3: 4, answer: 9},
        equation: '2 + 3 + 4 = 4 + 3 + 2', missing: [2]},
    {data: {propertyLaw: 'commutative', operation: 'multiplication', num1: 2, num2: 3, num3: 4, answer: 24},
        equation: '2 × 3 × 4 = 4 × 3 × 2', missing: [2]},
    {data: {propertyLaw: 'associative', operation: 'addition', num1: 2, num2: 3, num3: 4, answer: 9},
        equation: '( 2 + 3 ) + 4 = 2 + ( 3 + 4 )', missing: [4]},
    {data: {propertyLaw: 'associative', operation: 'multiplication', num1: 2, num2: 3, num3: 4, answer: 24},
        equation: '( 2 × 3 ) × 4 = 2 × ( 3 × 4 )', missing: [4]},
    {data: distributive, equation: '(7 × 13) + (7 × 1) = 91 + 7 = 98', missing: [98, 98]}
];
const textContent = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const emptyBoxes = (markup: string) => markup.match(/<div class="w-\[62px\][^"]*"><\/div>/g) ?? [];
const highlightedValues = (markup: string) => [...markup.matchAll(
    /<div class="w-\[62px\][^"]*border-emerald-600[^"]*">(\d+)<\/div>/g
)].map(match => Number(match[1]));

describe('arithmetic property task projections', () => {
    it.each(fixtures)('preserves $data.propertyLaw $data.operation completion and its unknowns', ({data, equation, missing}) => {
        const question = renderToStaticMarkup(<ArithmeticPropertiesCompletion data={data} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<ArithmeticPropertiesCompletion data={data} isSolutionView />);

        expect(question).toContain('Complete the equation to show the property.');
        expect(emptyBoxes(question)).toHaveLength(missing.length);
        expect(highlightedValues(question)).toEqual([]);
        expect(emptyBoxes(solution)).toHaveLength(0);
        expect(highlightedValues(solution)).toEqual(missing);
        expect(textContent(solution)).toContain(equation);
        expect(solution).not.toContain('Explain the steps');
    });

    it.each(fixtures)('asks for how/why reasoning for $data.propertyLaw $data.operation', ({data, equation}) => {
        const snapshot = structuredClone(data);
        const question = renderToStaticMarkup(<ArithmeticPropertiesExplanation data={data} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<ArithmeticPropertiesExplanation data={data} isSolutionView />);
        const explanation = propertyExplanation(data);

        for (const markup of [question, solution]) {
            expect(textContent(markup)).toContain(equation);
            expect(markup).toContain('why');
            expect(emptyBoxes(markup)).toHaveLength(0);
            expect(highlightedValues(markup)).toEqual([]);
        }
        expect(question).toContain('Explain the steps and why they work.');
        expect(question).not.toContain(explanation.method);
        expect(question).not.toContain(explanation.reason);
        expect(question).not.toContain('bg-emerald-50');
        expect(solution).toContain('How the procedure works');
        expect(solution).toContain('Why the result stays the same');
        expect(solution).toContain(explanation.method);
        expect(solution).toContain(explanation.reason);
        expect(data).toEqual(snapshot);
    });

    it('keeps every distributive witness visible in both explanation modes', () => {
        for (const isSolutionView of [false, true]) {
            const text = textContent(renderToStaticMarkup(
                <ArithmeticPropertiesExplanation data={distributive} isSolutionView={isSolutionView} />
            ));
            expect(text).toContain('7 × (13 + 1) = 7 × 14 = 98');
            expect(text).toContain('(7 × 13) + (7 × 1) = 91 + 7 = 98');
        }
    });

    it.each([
        {propertyLaw: 'commutative', operation: 'addition', num1: 0, num2: 1, num3: 99, answer: 100},
        {propertyLaw: 'associative', operation: 'multiplication', num1: 100, num2: 1, num3: 0, answer: 0},
        {propertyLaw: 'distributive', operation: 'multiplication', num1: 1, num2: 50, num3: 50,
            combinedFactor: 100, partialProducts: [50, 50], answer: 100}
    ] satisfies ArithmeticPropertyProblem[])('accepts canonical zero and upper-bound witnesses: %j', data => {
        expect(() => validateArithmeticProperty(data, 'fixture')).not.toThrow();
    });

    it.each([
        undefined,
        {...fixtures[0].data, propertyLaw: undefined},
        {...fixtures[0].data, propertyLaw: 'unknown'},
        {...fixtures[0].data, operation: 'subtraction'},
        {...fixtures[0].data, answer: 8},
        {...fixtures[1].data, answer: 9},
        {...fixtures[0].data, num1: 101, answer: 108},
        {...fixtures[0].data, num1: -1, answer: 6},
        {...fixtures[0].data, num1: 2.5, answer: 9.5},
        {...fixtures[0].data, num1: 4, num3: 4, answer: 11},
        {propertyLaw: 'associative', operation: 'multiplication', num1: 80, num2: 90, num3: 0, answer: 0},
        {propertyLaw: 'associative', operation: 'multiplication', num1: 0, num2: 90, num3: 80, answer: 0},
        {...distributive, combinedFactor: undefined},
        {...distributive, combinedFactor: 13},
        {...distributive, partialProducts: undefined},
        {...distributive, partialProducts: [91]},
        {...distributive, partialProducts: [90, 8]},
        {...distributive, answer: 91},
        {...distributive, operation: 'addition'}
    ])('rejects missing or contradictory mathematical evidence in both leaves: %j', data => {
        for (const Component of [ArithmeticPropertiesCompletion, ArithmeticPropertiesExplanation]) {
            expect(() => renderToStaticMarkup(<Component data={data as ArithmeticPropertyProblem} isSolutionView={false} />))
                .toThrow(ViewValidationError);
        }
    });
});

describe('arithmetic property display compatibility', () => {
    const generator = {...generatorSpec, schema: ArithmeticPropertyRelationsGeneratorSchema, spec: generatorSpec};
    const views = [
        {spec: completionSpec, schema: OperationsPropertiesViewSchema, ability: Ability.ProcedureExecution,
            Component: ArithmeticPropertiesCompletion},
        {spec: explanationSpec, schema: OperationsPropertiesExplanationViewSchema, ability: Ability.ProcedureUnderstanding,
            Component: ArithmeticPropertiesExplanation}
    ];
    const laws = [
        {law: Area.CommutativeLaw, operations: [Area.Addition]},
        {law: Area.CommutativeLaw, operations: [Area.Multiplication]},
        {law: Area.AssociativeLaw, operations: [Area.Addition]},
        {law: Area.AssociativeLaw, operations: [Area.Multiplication]},
        {law: Area.DistributiveLaw, operations: [Area.Addition, Area.Multiplication]}
    ];

    it.each(views)('accepts complete bounded producer draws for $spec.viewId', ({spec, schema, ability, Component}) => {
        for (const {law, operations} of laws) {
            for (const upper of [Scope.NumbersSmaller20, Scope.NumbersSmaller100]) {
                const target = {id: 'property-bounded-fixture', labels: [
                    law, ...operations, ability, Scope.NumbersLargerZero, upper
                ]};
                const planned = planModelCompatibility(target, generator, {...spec, schema, spec});
                if (!planned.supported) throw new Error(`Bounded property fixture rejected: ${planned.reason}`);
                for (const seed of [0, 1, 2, 3]) {
                    const draw = generatePlannedDraw({
                        generator: new ArithmeticPropertyRelationsGenerator(), viewSchema: schema, plan: planned.plan,
                        sampleKey: `${target.id}#${generatorSpec.generatorId}#${spec.viewId}#train#question#inst:0`,
                        seed, attempt: 1
                    });
                    expect(draw.stub).not.toBeNull();
                    for (const isSolutionView of [false, true]) {
                        expect(() => renderToStaticMarkup(<Component
                            data={draw.stub!.data as ArithmeticPropertyProblem} isSolutionView={isSolutionView}
                        />)).not.toThrow();
                    }
                }
            }
        }
    });

    it.each(views)('rejects a producer range beyond the display capacity for $spec.viewId', ({spec, schema, ability}) => {
        const target = {id: 'property-large-fixture', labels: [
            Area.Addition, Area.CommutativeLaw, ability, Scope.NumbersLargerZero, Scope.NumbersSmaller1000
        ]};
        const unrestricted = planModelCompatibility(target, generator, {...spec, schema, spec: {...spec, compatibility: []}});
        expect(unrestricted.supported).toBe(true);
        const planned = planModelCompatibility(target, generator, {...spec, schema, spec});
        expect(planned.supported).toBe(false);
        if (planned.supported) throw new Error('Expected the property display capacity to reject this range.');
        expect(planned.ruleIds).toContain('view:arithmetic-properties-display-capacity');
    });
});

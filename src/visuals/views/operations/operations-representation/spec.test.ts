import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {ArithmeticOpsPairsGeneratorSchema as generatorSchema, spec as generatorSpec} from '../../../../generators/arithmetic/arithmetic-ops-pairs/spec.ts';
import {enumerateDependencyAuditSelections} from '../../../../lib/label-dependency-audit.ts';
import {matchTarget} from '../../../../lib/matching.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {getTargetPolicyLabels} from '../../../../lib/target-policies.ts';
import {extractSchemaLabels} from '../../../../types/schema.ts';
import type {ArithmeticPairProblem} from '../../../../types/problems.ts';
import type {GeneratorSpec} from '../../../../types/generator-spec.ts';
import {spec as kindergarten} from '../../../../spec/ccss/kindergarten.ts';
import {spec as gradeOne} from '../../../../spec/ccss/grade-01.ts';
import {spec as gradeThree} from '../../../../spec/ccss/grade-03.ts';
import {spec as verticalSpec, OperationsVerticalViewSchema} from '../operations-vertical/spec.ts';
import {spec, OperationsRepresentationViewSchema as schema} from './spec.ts';

const consumer = {viewId: spec.viewId, generalLabels: spec.generalLabels,
    supportedLabels: [...spec.generalLabels], schema, spec, problemType: 'ArithmeticPairProblem'};
const realGenerator = {generatorId: generatorSpec.generatorId, generalLabels: generatorSpec.generalLabels,
    labels: [...generatorSpec.generalLabels, ...extractSchemaLabels(generatorSchema)],
    schema: generatorSchema, spec: generatorSpec, problemType: 'ArithmeticPairProblem'};
const supported = [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller10, Area.Addition];
const selectedPlan = (labels: string[], targetLabels: string[] = []) => {
    const fixtureSpec: GeneratorSpec = {generatorId: 'selected-operation-fixture', generalLabels: labels};
    return planModelCompatibility({id: 'selected-operation', labels: targetLabels},
        {generatorId: fixtureSpec.generatorId, generalLabels: labels, schema: {}, spec: fixtureSpec}, consumer);
};

let Representation: typeof import('./view.tsx').OperationsRepresentation;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Representation = (await import('./view.tsx')).OperationsRepresentation;
});
afterAll(() => vi.unstubAllGlobals());

describe('object operation representation compatibility', () => {
    it('keeps presentation capabilities and the original target capacity boundary unchanged', () => {
        expect(spec.generalLabels).toEqual([Scope.PhysicalNumbers, Scope.ArabicNumerals, Ability.ProcedureExecution]);
        expect(schema).toEqual({});
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([...new Set(deductAdmitting([Scope.NumbersLarger10]))].sort());
        const rule = spec.compatibility!.find(rule => rule.id === 'object-operation-domain')!;
        expect(rule).toBeDefined();
        expect(rule.dependencies!.every(dependency => dependency.scope === 'generator')).toBe(true);
    });

    it.each([Area.Addition, Area.Subtraction])('accepts bounded nonnegative integer%s including zero and two-digit10', operation => {
        for (const upper of [Scope.NumbersSmaller5, Scope.NumbersSmaller10]) {
            expect(selectedPlan([Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, operation, upper]).supported).toBe(true);
            expect(selectedPlan([Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, operation, upper,
                Scope.NumbersWithZero]).supported).toBe(true);
        }
        expect(selectedPlan([Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, operation,
            Scope.NumbersSmaller10, Scope.TwoDigitLargestOperand, Scope.NumbersWithZero]).supported).toBe(true);
    });

    it.each([
        ['multiplication', [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller10, Area.Multiplication]],
        ['division', [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller10, Area.Division]],
        ['negative values', [Scope.IntegerNumbers, Scope.NumbersWithNegatives, Scope.NumbersSmaller10, Area.Addition]],
        ['noninteger values', [Scope.DecimalNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller10, Area.Addition]],
        ['missing number kind', [Scope.NumbersWithoutNegatives, Scope.NumbersSmaller10, Area.Addition]],
        ['missing sign constraint', [Scope.IntegerNumbers, Scope.NumbersSmaller10, Area.Addition]],
        ['upper20', [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller20, Area.Addition]],
        ['upper100', [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller100, Area.Subtraction]],
        ['unbounded values', [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Area.Addition]]
    ])('rejects selected%s before generation', (_, labels) => {
        const match = selectedPlan(labels as string[]);
        expect(match.supported).toBe(false);
        if (!match.supported) expect(match.ruleIds).toContain('view:object-operation-domain');
    });

    it('does not use original target labels as a substitute for selected generator constraints', () => {
        expect(selectedPlan([], supported).supported).toBe(false);
        expect(selectedPlan(supported, [Scope.NumbersLarger10]).supported).toBe(false);
    });

    it('retains only supported assignments when the target leaves the mathematical fields unspecified', () => {
        const fixtureSchema = {operation: [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division],
            numberKind: [Scope.IntegerNumbers, Scope.DecimalNumbers],
            sign: [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
            upper: [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20]} as const;
        const fixtureSpec: GeneratorSpec = {generatorId: 'broad-operation-fixture', generalLabels: []};
        const match = planModelCompatibility({id: 'broad-operation', labels: []},
            {generatorId: fixtureSpec.generatorId, generalLabels: [], schema: fixtureSchema, spec: fixtureSpec}, consumer);
        expect(match.supported).toBe(true);
        if (!match.supported) throw new Error(match.reason);
        const enumeration = enumerateDependencyAuditSelections(match.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(4);
        for (const selection of enumeration.selections) {
            expect(selection.labels).toContain(Scope.IntegerNumbers);
            expect(selection.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(selection.labels.filter(label => [Area.Addition, Area.Subtraction].includes(label as Area))).toHaveLength(1);
            expect(selection.labels.filter(label => [Scope.NumbersSmaller5, Scope.NumbersSmaller10].includes(label as Scope))).toHaveLength(1);
        }
    });

    it.each([
        ['K.OA.A.1-represent-operations~0accbd8d', 1], ['K.OA.A.1-represent-operations~3291aa29', 2],
        ['K.OA.A.1-represent-operations~39fcfac7', 3], ['K.OA.A.1-represent-operations~f2d4af07', 1],
        ['1.OA.C.6-fluency~2853da02', 2], ['1.OA.C.6-fluency~4b33287e', 1],
        ['1.OA.C.6-fluency~ea8845c2', 1], ['1.OA.C.6-fluency~ece10e8a', 3]
    ])('preserves source lineage%s and all%s selections', (targetId, count) => {
        const target = [...kindergarten, ...gradeOne].find(target => target.id === targetId)!;
        expect(target).toBeDefined();
        const matched = matchTarget(target, realGenerator, consumer);
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw new Error(matched.reason);
        const enumeration = enumerateDependencyAuditSelections(matched.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(count);
    });

    it.each(['5fb5243b', '8cd921f2', 'a9e73bf2', 'b09c1d41'])(
        'retires the unsupported Grade3 object route%s while retaining its numeric execution route', suffix => {
            const target = gradeThree.find(target => target.id === `3.OA.C.7-compute-within-100~${suffix}`)!;
            expect(target).toBeDefined();
            expect(matchTarget(target, realGenerator, consumer)).toMatchObject({matched: false});
            expect(matchTarget(target, realGenerator, {viewId: verticalSpec.viewId, generalLabels: verticalSpec.generalLabels,
                supportedLabels: [...verticalSpec.generalLabels], schema: OperationsVerticalViewSchema,
                spec: verticalSpec, problemType: 'ArithmeticProblem'}).matched).toBe(true);
        }
    );

    it.each<ArithmeticPairProblem>([
        {num1: 0, num2: 0, operation: 'addition', answer: 0},
        {num1: 10, num2: 0, operation: 'addition', answer: 10},
        {num1: 5, num2: 5, operation: 'addition', answer: 10},
        {num1: 10, num2: 10, operation: 'subtraction', answer: 0},
        {num1: 10, num2: 0, operation: 'subtraction', answer: 10}
    ])('renders the accepted endpoint payload$num1 $operation$num2 in both modes', data => {
        for (const isSolutionView of [false, true]) {
            const html = renderToStaticMarkup(createElement(Representation, {payload: {
                problem: {type: 'arithmetic', data, labels: []}, viewId: spec.viewId as 'operations-representation',
                targetLabels: [], seed: 17, isSolutionView,
                preparedView: {version: 1, viewId: spec.viewId, planHash: 'endpoint-fixture', variantHash: 'empty',
                    config: {}, labels: [], randomState: 1}
            }}));
            expect(html).not.toMatch(/Rendering Error|NaN|undefined/);
            expect(html.includes('Use the objects to solve the equation.')).toBe(!isSolutionView);
            expect(html).toContain(`>${data.num1}</span>`);
            expect(html).toContain(`>${data.num2}</span>`);
        }
    });
});

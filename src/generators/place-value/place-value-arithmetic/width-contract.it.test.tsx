import {Area, Scope} from 'edugraph-ts';
import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import * as rng from '../../../lib/random.ts';
import type {CompetencyTarget, ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {PlaceValueArithmeticProblem} from '../../../types/problems.ts';
import {spec as gradeOne} from '../../../spec/ccss/grade-01.ts';
import {spec as gradeTwo} from '../../../spec/ccss/grade-02.ts';
import {spec as concrete} from '../../../visuals/views/place-value/place-value-arithmetic-model/spec.ts';
import {spec as written} from '../../../visuals/views/place-value/place-value-arithmetic-written-method/spec.ts';
import {spec as explanation} from '../../../visuals/views/place-value/place-value-arithmetic-explanation/spec.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorSchema, spec, type PlaceValueArithmeticGeneratorConfig} from './spec.ts';
import {exactPrimaryWidths} from './width-domain.ts';

const views = [
    {...concrete, viewId: 'place-value-arithmetic-model' as const},
    {...written, viewId: 'place-value-arithmetic-written-method' as const},
    {...explanation, viewId: 'place-value-arithmetic-explanation' as const}
];
type ViewId = typeof views[number]['viewId'];
const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: PlaceValueArithmeticGeneratorSchema, spec};
const widthLabels = (a: number, b: number) => [
    [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand][String(Math.max(a, b)).length - 1]!,
    [Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand, Scope.ThreeDigitSmallestOperand][String(Math.min(a, b)).length - 1]!
];

function planned(target: CompetencyTarget, view: typeof views[number]) {
    const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
    const match = planModelCompatibility(target, model, consumer);
    expect(match.supported).toBe(true);
    if (!match.supported) throw new Error(match.reason);
    const enumeration = enumerateDependencyAuditSelections(match.plan);
    expect(enumeration.status).toBe('complete');
    return enumeration.selections.map(selection => {
        const sampleKey = `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`;
        const input = {generator: new PlaceValueArithmeticGenerator(), generatorSpec: spec, viewSpec: view, viewSchema: {},
            plan: match.plan, sampleKey, attempt: 1, seed: 17,
            replay: {version: 1 as const, sampleKey, attempt: 1, seed: 17,
                selection: createGenerationSelectionReceipt(match.plan, selection.choices)}};
        return {input, resolved: resolvePlannedConfigurations({...input, generatorSchema: PlaceValueArithmeticGeneratorSchema})};
    });
}

describe('width refinement preserves actual task lineages and all three consumers', () => {
    it.each(views.flatMap(view => [Area.Subtraction, Area.SubtractionPlaceValuePartitioning]
        .flatMap(operation => [false, true].map(regrouping => ({view, operation, regrouping})))))(
        '$view.viewId supports explicit21 $operation/regrouping=$regrouping without an addition-domain restriction',
        ({view, operation, regrouping}) => {
            const choices = planned({id: `sub21-${view.viewId}-${operation}-${regrouping}`, labels: [operation,
                Scope.TwoDigitLargestOperand, Scope.SingleDigitSmallestOperand, Scope.NumbersSmaller100,
                ...view.generalLabels, ...(regrouping ? [Area.IntegerRegrouping] : [])]}, view);
            expect(choices).toHaveLength(1);
            const draw = generatePlannedDraw(choices[0]!.input);
            expect(draw.stub).not.toBeNull();
            expect(draw.stub!.data).toMatchObject({operation: 'subtraction', operandProfile: 'general'});
            expect(draw.stub!.data.regrouping.kind).toBe(regrouping ? 'decompose-ten' : 'none');
        });
    it('gives the two identical16+4 source lineages the same exact width annotation before drawing', () => {
        const oldTarget = gradeOne.find(target => target.id === '1.NBT.C.4-model-to-written-method~808d2df5')!;
        const broadTarget = gradeTwo.find(target => target.id === '2.NBT.B.7-model-to-written-method~d14c5358')!;
        const legacy = planned(oldTarget, views[1]!).find(choice => choice.resolved.generatorConfig.largestOperandProfile === '21')!;
        const general = planned(broadTarget, views[1]!).find(choice => choice.resolved.generatorConfig.largestOperandProfile === '21')!;
        expect(legacy.resolved.labels).toEqual(general.resolved.labels);
        expect(legacy.resolved.labels).toEqual(expect.arrayContaining([Scope.TwoDigitLargestOperand, Scope.SingleDigitSmallestOperand]));
        expect(legacy.resolved.labels).not.toContain(Scope.MultipleDigitLargestOperand);
        expect(legacy.resolved.generatorConfig.requireSingleDigitSmallest).toBe(true);
        expect(general.resolved.generatorConfig.requireSingleDigitSmallest).toBe(false);
        expect(general.resolved.generatorConfig.requireTwoDigitLargest).toBe(false);
        const orders = new Set<string>();
        for (let seed = 0; seed < 64; seed++) {
            const draw = generatePlannedDraw({...general.input, seed, replay: {...general.input.replay, seed}});
            expect(draw.stub).not.toBeNull();
            expect(draw.stub!.data.operandProfile).toBe('general');
            orders.add(draw.stub!.data.num1 < draw.stub!.data.num2 ? 'small-first' : 'large-first');
            expect(draw.labels).toEqual(legacy.resolved.labels);
        }
        expect(orders).toEqual(new Set(['small-first', 'large-first']));
    });

    it.each(views.flatMap(view => exactPrimaryWidths.map(width => ({view, width}))))(
        '$view.viewId retains general cell$width with exact preselected labels and replay', ({view, width}) => {
            const upper = width === '11' ? Scope.NumbersSmaller10 : width[0] === '2' ? Scope.NumbersSmaller100 : Scope.NumbersSmaller1000;
            const target = {id: `width-${view.viewId}-${width}`, labels: [Area.Addition, upper, ...view.generalLabels]};
            const choices = planned(target, view).filter(choice => choice.resolved.generatorConfig.largestOperandProfile === width
                && !choice.resolved.generatorConfig.requireMultipleOf10);
            expect(choices.length).toBeGreaterThan(0);
            for (const choice of choices) for (let seed = 0; seed < 8; seed++) {
                const input = {...choice.input, seed, replay: {...choice.input.replay, seed}};
                const draw = generatePlannedDraw(input), state = rng.getRandomState();
                expect(draw.stub).not.toBeNull();
                const data = draw.stub!.data;
                expect(data.operandProfile).toBe('general');
                expect(data.answer).toBe(data.num1 + data.num2);
                expect(draw.labels).toEqual(expect.arrayContaining(widthLabels(data.num1, data.num2)));
                expect(draw.labels).not.toContain(Scope.MultipleDigitLargestOperand);
                expect(draw.labels).not.toContain(Scope.MultipleDigitSmallestOperand);
                expect(generatePlannedDraw(input)).toEqual(draw);
                expect(rng.getRandomState()).toBe(state);
            }
        });
});

let renderers: Record<ViewId, ComponentType<{payload: ViewRenderPayload<ViewId>}>>;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    renderers = {
        'place-value-arithmetic-model': (await import('../../../visuals/views/place-value/place-value-arithmetic-model/view.tsx')).PlaceValueArithmeticModel,
        'place-value-arithmetic-written-method': (await import('../../../visuals/views/place-value/place-value-arithmetic-written-method/view.tsx')).PlaceValueArithmeticWrittenMethod,
        'place-value-arithmetic-explanation': (await import('../../../visuals/views/place-value/place-value-arithmetic-explanation/view.tsx')).PlaceValueArithmeticExplanation
    };
});
afterAll(() => vi.unstubAllGlobals());

function collisionData(legacy: boolean): PlaceValueArithmeticProblem {
    const config: PlaceValueArithmeticGeneratorConfig = {operation: Area.Addition, requireRegrouping: true,
        requireSingleDigitSmallest: legacy, requireTwoDigitLargest: legacy, requireMultipleOf10: false,
        requireZero: false, coefficientPresence: true, range: {min: 0, max: 20}, largestOperandProfile: '21'};
    // Independent tickets: legacy has9uniform ordered pairs. The general
    // conditioned law has18pairs(a,20-a), with original mass1/(19*(20-a)).
    const firsts = Array.from({length: 19}, (_, index) => index + 1).filter(a => a !== 10);
    const total = firsts.reduce((sum, a) => sum + 1 / (19 * (20 - a)), 0);
    const before = firsts.filter(a => a < 16).reduce((sum, a) => sum + 1 / (19 * (20 - a)), 0);
    const random = vi.spyOn(rng, 'random');
    if (legacy) random.mockReturnValueOnce(5.5 / 9);
    else random.mockReturnValueOnce((before + 1 / (19 * 4) / 2) / total).mockReturnValueOnce(0);
    try {return new PlaceValueArithmeticGenerator().generate(config)!.data;}
    finally {random.mockRestore();}
}

it.each(views)('$viewId renders identical16+4 math unchanged across native domains in both modes', view => {
    const legacy = collisionData(true), general = collisionData(false);
    expect([legacy.num1, legacy.num2, legacy.answer]).toEqual([16, 4, 20]);
    expect(general).toEqual({...legacy, operandProfile: 'general'});
    for (const isSolutionView of [false, true]) {
        const render = (data: PlaceValueArithmeticProblem) => renderToStaticMarkup(createElement(renderers[view.viewId], {
            payload: {viewId: view.viewId, problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 17, isSolutionView,
                preparedView: {version: 1, viewId: view.viewId, planHash: 'a'.repeat(64), variantHash: 'b'.repeat(64),
                    config: {}, labels: [], randomState: 17}}
        }));
        const actual = render(general);
        expect(actual).toBe(render(legacy));
        expect(actual).not.toContain('ViewValidationError');
        const text = actual.replace(/<[^>]*>/g, '');
        expect(text).toContain(isSolutionView ? '20' : '16');
        if (!isSolutionView) expect(text).not.toMatch(/\b20\b/);
    }
});

// Frozen real-source lineage inventory; expected counts independently enumerated
// from native arithmetic, exact widths and the both-primary-operand predicate.
const currentSourceLineages = [
    {
        "id": "1.NBT.B.2c-multiples-of-ten~322116ef",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.B.2c-multiples-of-ten~864e16c2",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-concrete-place-value-addition~4d2f3278",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-concrete-place-value-addition~3c346185",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-concrete-place-value-addition~f15e70e4",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-concrete-place-value-addition~fbf817e9",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-concrete-place-value-addition~b4febbae",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-concrete-place-value-addition~cdd1e96d",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-model-to-written-method~0d9e009b",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-model-to-written-method~02d372e4",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-model-to-written-method~808d2df5",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-model-to-written-method~f6e0a4de",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-model-to-written-method~948840df",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-model-to-written-method~25ba6b2e",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-explain-place-value-addition~2aea53d1",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-explain-place-value-addition~5d3340b8",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-explain-place-value-addition~7428ad8d",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-explain-place-value-addition~6b473b9c",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-explain-place-value-addition~ee2f7e79",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.4-explain-place-value-addition~313fb8fe",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-concrete-place-value-subtraction~6d03556a",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-concrete-place-value-subtraction~52634bc9",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-concrete-place-value-subtraction~de2f1aa9",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-concrete-place-value-subtraction~1760ec38",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-concrete-place-value-subtraction~bd94f77d",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-model-to-written-method~e587239f",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-model-to-written-method~973978da",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-model-to-written-method~cc15c54e",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-model-to-written-method~1a251da3",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-model-to-written-method~9a5c1508",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-explain-place-value-subtraction~0458fbf7",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-explain-place-value-subtraction~3026996c",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-explain-place-value-subtraction~af2861cc",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-explain-place-value-subtraction~032cc9b5",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "1.NBT.C.6-explain-place-value-subtraction~9e3b5600",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~960f2fca",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~2f5f94dd",
        "viewId": "place-value-arithmetic-model",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~ad16ab2c",
        "viewId": "place-value-arithmetic-model",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~fc8215ba",
        "viewId": "place-value-arithmetic-model",
        "count": 4
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~f5125172",
        "viewId": "place-value-arithmetic-model",
        "count": 5
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~5dbb9242",
        "viewId": "place-value-arithmetic-model",
        "count": 1
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~2f2987df",
        "viewId": "place-value-arithmetic-model",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~e40a9918",
        "viewId": "place-value-arithmetic-model",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~9d8853a2",
        "viewId": "place-value-arithmetic-model",
        "count": 3
    },
    {
        "id": "2.NBT.B.7-concrete-regrouping~0130749a",
        "viewId": "place-value-arithmetic-model",
        "count": 4
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~2e035a3f",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~d14c5358",
        "viewId": "place-value-arithmetic-written-method",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~ff030627",
        "viewId": "place-value-arithmetic-written-method",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~03db4911",
        "viewId": "place-value-arithmetic-written-method",
        "count": 4
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~3cfc3d3f",
        "viewId": "place-value-arithmetic-written-method",
        "count": 5
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~ea385ddd",
        "viewId": "place-value-arithmetic-written-method",
        "count": 1
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~f3c08d94",
        "viewId": "place-value-arithmetic-written-method",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~4cee3805",
        "viewId": "place-value-arithmetic-written-method",
        "count": 2
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~25b139b3",
        "viewId": "place-value-arithmetic-written-method",
        "count": 3
    },
    {
        "id": "2.NBT.B.7-model-to-written-method~7682ea5d",
        "viewId": "place-value-arithmetic-written-method",
        "count": 4
    },
    {
        "id": "2.NBT.B.9-explain-strategies~8adcd14f",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "2.NBT.B.9-explain-strategies~da18e3f9",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "2.NBT.B.9-explain-strategies~c0e70882",
        "viewId": "place-value-arithmetic-explanation",
        "count": 2
    },
    {
        "id": "2.NBT.B.9-explain-strategies~59fb534b",
        "viewId": "place-value-arithmetic-explanation",
        "count": 3
    },
    {
        "id": "2.NBT.B.9-explain-strategies~6436bff1",
        "viewId": "place-value-arithmetic-explanation",
        "count": 5
    },
    {
        "id": "2.NBT.B.9-explain-strategies~4203a811",
        "viewId": "place-value-arithmetic-explanation",
        "count": 8
    },
    {
        "id": "2.NBT.B.9-explain-strategies~c1da8e15",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "2.NBT.B.9-explain-strategies~177cc5f3",
        "viewId": "place-value-arithmetic-explanation",
        "count": 1
    },
    {
        "id": "2.NBT.B.9-explain-strategies~9666e92e",
        "viewId": "place-value-arithmetic-explanation",
        "count": 3
    },
    {
        "id": "2.NBT.B.9-explain-strategies~8bf99291",
        "viewId": "place-value-arithmetic-explanation",
        "count": 3
    },
    {
        "id": "2.NBT.B.9-explain-strategies~4010f9cb",
        "viewId": "place-value-arithmetic-explanation",
        "count": 5
    },
    {
        "id": "2.NBT.B.9-explain-strategies~dbec91bb",
        "viewId": "place-value-arithmetic-explanation",
        "count": 6
    }
] as const;

it.each(currentSourceLineages)('$viewId preserves $id with $count semantic selections and replay', ({id, viewId, count}) => {
    const target = [...gradeOne, ...gradeTwo].find(candidate => candidate.id === id)!;
    expect(target).toBeDefined();
    const view = views.find(candidate => candidate.viewId === viewId)!;
    const choices = planned(target, view);
    expect(choices).toHaveLength(count);
    for (const choice of choices) {
        expect(choice.resolved.generatorConfig.requireMultipleOf10).toBe(target.labels.includes(Scope.MultiplesOf10));
        for (const seed of [0, 17, 42]) {
            const input = {...choice.input, seed, replay: {...choice.input.replay, seed}};
            const draw = generatePlannedDraw(input), state = rng.getRandomState();
            expect(draw.stub).not.toBeNull();
            const data = draw.stub!.data;
            const both = data.num1 % 10 === 0 && data.num2 % 10 === 0;
            expect(draw.labels.includes(Scope.MultiplesOf10)).toBe(both);
            expect(choice.resolved.generatorConfig.multipleOf10Presence).toBe(both);
            expect(draw.labels).toEqual(expect.arrayContaining(widthLabels(data.num1, data.num2)));
            expect(draw.labels).not.toContain(Scope.MultipleDigitLargestOperand);
            if (data.operation === 'addition') expect(draw.labels).toEqual(expect.arrayContaining([Area.Addition, Area.AdditionPlaceValuePartitioning]));
            else if (data.operandProfile === 'general' || data.answer === 0) {
                expect(draw.labels).toEqual(expect.arrayContaining([Area.Subtraction, Area.SubtractionPlaceValuePartitioning]));
            } else expect(draw.labels).not.toContain(Area.SubtractionPlaceValuePartitioning);
            expect(generatePlannedDraw(input)).toEqual(draw);
            expect(rng.getRandomState()).toBe(state);
        }
    }
});

import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {hasStaticResolution} from '../../../lib/static-resolvers.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from '../../../lib/label-dependency-annotation-resolution.ts';
import {spec as gradeOne} from '../../../spec/ccss/grade-01.ts';
import {spec as modelView} from '../../../visuals/views/place-value/place-value-arithmetic-model/spec.ts';
import {spec as explanationView} from '../../../visuals/views/place-value/place-value-arithmetic-explanation/spec.ts';
import {spec as writtenView} from '../../../visuals/views/place-value/place-value-arithmetic-written-method/spec.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorSchema, spec} from './spec.ts';
import {resolveResultZero} from './zero-result.ts';

describe('Grade-1 coefficient-zero/result-zero separation', () => {
    it('reviews the exact deterministic resolver identity and every operation/width/zero branch', () => {
        expect(hasStaticResolution(resolveResultZero)).toBe(true);
        expect(hasStaticResolution(Object.assign((labels: string[]) => resolveResultZero(labels), resolveResultZero))).toBe(false);
        expect(findSchemaFallbackContractIssues(PlaceValueArithmeticGeneratorSchema)).toEqual([]);
        for (const operation of [[], [Area.Addition], [Area.AdditionPlaceValuePartitioning],
            [Area.Subtraction], [Area.SubtractionPlaceValuePartitioning]]) {
            for (const width of [[], [Scope.TwoDigitLargestOperand]]) for (const zero of [[],
                [Scope.NumbersWithZero], [Scope.NumbersWithoutZero],
                [Scope.NumbersWithZero, Scope.NumbersWithoutZero]]) {
                const labels = [...operation, ...width, ...zero];
                const state = getRandomState();
                const first = resolveResultZero(labels);
                expect(resolveResultZero(labels)).toBe(first);
                expect(getRandomState()).toBe(state);
                const addition = operation.some(label => [Area.Addition, Area.AdditionPlaceValuePartitioning].includes(label));
                expect(first).toBe(zero.includes(Scope.NumbersWithZero) && !addition);
            }
        }
    });

    it('canonically declares visible coefficient zero while retaining positive arithmetic and entropy', () => {
        const generator = new PlaceValueArithmeticGenerator();
        for (const operation of [Area.Addition, Area.AdditionPlaceValuePartitioning]) {
            for (const extra of [[Scope.SingleDigitSmallestOperand], [Scope.SingleDigitSmallestOperand, Area.IntegerRegrouping],
                [Scope.MultiplesOf10]]) for (let seed = 0; seed < 30; seed++) {
                const labels = [operation, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller100, ...extra];
                setSeed(seed);
                const configured = extractConfig(PlaceValueArithmeticGeneratorSchema, labels);
                expect(configured.config.requireZero).toBe(false);
                expect(configured.resolvedLabels).toContain(Scope.NumbersWithZero);
                const first = generator.generate(configured.config)!;
                const state = getRandomState();
                setSeed(seed);
                const explicit = extractConfig(PlaceValueArithmeticGeneratorSchema, [...labels, Scope.NumbersWithZero]);
                expect(generator.generate(explicit.config)).toEqual(first);
                expect(getRandomState()).toBe(state);
                expect(first.data.answer).toBeGreaterThan(0);
                expect(first.data.operands.every(operand => operand.hundreds === 0)).toBe(true);
                expect(() => extractConfig(PlaceValueArithmeticGeneratorSchema,
                    [...labels, Scope.NumbersWithoutZero])).toThrow(/cannot complete/);
            }
        }
    });

    it('preserves exhaustive zero declarations across both Grade-1 source bands', () => {
        const targets = gradeOne.filter(target => target.id.startsWith('1.NBT.C.4-')
            && target.labels.includes(Area.AdditionPlaceValuePartitioning)
            && target.labels.includes(Scope.TwoDigitLargestOperand));
        expect(targets).toHaveLength(18);
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: PlaceValueArithmeticGeneratorSchema, spec};
        for (const target of targets) {
            const view = target.id.includes('explain') ? explanationView
                : target.id.includes('model-to-written') ? writtenView : modelView;
            const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
            const match = planModelCompatibility(target, model, consumer);
            expect(match.supported).toBe(true);
            if (!match.supported) throw new Error(match.reason);
            const selections = enumerateDependencyAuditSelections(match.plan);
            expect(selections.status).toBe('complete');
            expect(selections.selections).toHaveLength(1);
            for (const selection of selections.selections) {
                const resolved = resolveDependencyAuditAnnotation({id: target.id, plan: match.plan,
                    selection, generator: model, view: consumer});
                expect(resolved.annotationResolution.status).toBe('exhaustive');
                expect(resolved.labels).toContain(Scope.NumbersWithZero);
                expect(resolved.labels).not.toContain(Scope.NumbersWithoutZero);
            }
            expect(planModelCompatibility({...target, id: `${target.id}-zero`,
                labels: [...target.labels, Scope.NumbersWithZero]}, model, consumer).supported).toBe(true);
            expect(planModelCompatibility({...target, id: `${target.id}-absence`,
                labels: [...target.labels, Scope.NumbersWithoutZero]}, model, consumer).supported).toBe(false);
        }
    });

    it('keeps the whole-tens subtraction omission exception and explicit zero result', () => {
        const generator = new PlaceValueArithmeticGenerator();
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const stub = generateWithLabels(generator, [Area.Subtraction, Scope.MultiplesOf10,
                Scope.NumbersSmaller100, zero])!;
            expect(stub.labels).toContain(zero);
            expect(stub.data.answer === 0).toBe(zero === Scope.NumbersWithZero);
        }
    });
});

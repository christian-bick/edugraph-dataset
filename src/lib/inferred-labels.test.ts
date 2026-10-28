import {describe, expect, expectTypeOf, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import type {GeneratorSpec} from '../types/generator-spec.ts';
import type {ViewSpec} from '../types/view-spec.ts';
import type {ModuleSpec} from '../types/module-spec.ts';
import {selectExactMatch} from './resolvers.ts';
import {resolveInferredLabels, InferredLabelContractError} from './inferred-labels.ts';
import {getRandomState, random, setRandomState, setSeed} from './random.ts';
import {assertLabelDependencyCoverage} from './label-dependency-coverage.ts';

const schema = {operation: [[Area.Addition, Area.Subtraction], selectExactMatch],
    detail: (() => undefined) as any} as const;
const config = {operation: Area.Addition, detail: {values: [1, 2], range: {min: 0, max: 10}}};
const input = {schema, config, labels: [Area.Addition, Scope.IntegerNumbers], owner: 'generator' as const};
const spec = (infer: (value: any) => any, produces: readonly string[] = [Scope.SingleDigitLargestOperand]): ModuleSpec<any> =>
    ({generalLabels: [Scope.IntegerNumbers], inferredLabels: [{produces, infer}]});
const evaluate = (value: ModuleSpec<any>) => resolveInferredLabels({...input, spec: value});

describe('inferred label contract', () => {
    it('passes the same complete read-only configuration independently and deduplicates output IDs', () => {
        const snapshots: unknown[] = [];
        const infer = vi.fn(value => {snapshots.push(value); expect(value).toEqual(config);
            return [Scope.SingleDigitLargestOperand, Scope.SingleDigitLargestOperand];});
        const second = vi.fn(value => {snapshots.push(value); expect(Object.keys(value).sort()).toEqual(['detail', 'operation']);
            return [Scope.SingleDigitLargestOperand, Scope.NumbersWithoutZero];});
        const definition = {generalLabels: [Scope.IntegerNumbers], inferredLabels: [
            {produces: [Scope.SingleDigitLargestOperand], infer},
            {produces: [Scope.SingleDigitLargestOperand, Scope.NumbersWithoutZero], infer: second}
        ]};
        setSeed(37);
        const result = evaluate(definition);
        expect(result).toEqual([...input.labels, Scope.SingleDigitLargestOperand, Scope.NumbersWithoutZero]);
        expect(snapshots[0]).toBe(snapshots[1]); expect(snapshots[0]).not.toBe(config);
        expect(infer).toHaveBeenCalledTimes(1); expect(second).toHaveBeenCalledTimes(1);
        expect(getRandomState()).toBe(37); expect(config.detail.values).toEqual([1, 2]);
    });
    it('does not treat produces as actual labels and preserves absence of inference', () => {
        expect(evaluate(spec(() => []))).toEqual(input.labels);
        expect(resolveInferredLabels(input)).toEqual(input.labels);
        expect(evaluate({generalLabels: [], inferredLabels: []})).toEqual(input.labels);
    });
    it('requires every schema attribute to have been resolved', () => {
        expect(() => resolveInferredLabels({...input, config: {operation: Area.Addition}, spec: spec(() => [])}))
            .toThrow('Configuration is unresolved: detail');
        expect(() => resolveInferredLabels({...input, config: null as any, spec: spec(() => [])}))
            .toThrow(InferredLabelContractError);
    });
    it('preserves sparse-array length and absent entries in the immutable snapshot', () => {
        const values = new Array(3); values[1] = 5;
        const infer = vi.fn(value => {expect(value.detail.values).toEqual(values);
            expect(value.detail.values.length).toBe(3); expect(0 in value.detail.values).toBe(false); return [];});
        resolveInferredLabels({...input, config: {...config, detail: {...config.detail, values}}, spec: spec(infer)});
        expect(infer).toHaveBeenCalledOnce();
    });
    it.each([null, {}, 'not-an-array', [null]])('rejects malformed declarations %s', inferredLabels => {
        expect(() => evaluate({generalLabels: [], inferredLabels} as any)).toThrow(InferredLabelContractError);
    });
    it.each([null, {}, 'label', [42], Promise.resolve([])])('rejects invalid callback results %s', result => {
        expect(() => evaluate(spec(() => result))).toThrow('must return a label array');
    });
    it('rejects asynchronous rules before invoking them', () => {
        const invoke = vi.fn();
        expect(() => evaluate(spec(async () => {invoke(); return [];}))).toThrow('synchronous');
        expect(invoke).not.toHaveBeenCalled();
    });
    it('rejects undeclared, unknown or organizational outputs', () => {
        expect(() => evaluate(spec(() => [Scope.NumbersWithZero]))).toThrow('undeclared');
        for (const label of ['unknown', Area.Arithmetic]) expect(() => evaluate(spec(() => [label], [label])))
            .toThrow(InferredLabelContractError);
    });
    it('deduplicates same-owner claims while enforcing generator role and existing schema ownership', () => {
        const infer = vi.fn(() => [Scope.IntegerNumbers]);
        expect(evaluate(spec(infer, [Scope.IntegerNumbers]))).toEqual(input.labels);
        expect(infer).toHaveBeenCalledOnce();
        expect(() => evaluate(spec(() => [Ability.ProcedureExecution], [Ability.ProcedureExecution]))).toThrow('Abilities');
        expect(evaluate(spec(() => [Area.Addition], [Area.Addition]))).toEqual(input.labels);
        const invalid = {...spec(() => []), generalLabels: [Area.Addition]};
        expect(() => evaluate(invalid)).toThrow('SPEC-7');
    });
    it('retains conflicting claims for the existing final annotation validator to reject', () => {
        const definition = spec(() => [Scope.NumbersWithZero], [Scope.NumbersWithZero]);
        const labels = resolveInferredLabels({...input, spec: definition,
            labels: [...input.labels, Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives]});
        expect(labels).toContain(Scope.NumbersWithoutZero); expect(labels).toContain(Scope.NumbersWithZero);
        expect(() => assertLabelDependencyCoverage({generatorId: 'generator', viewId: 'view', labels}))
            .toThrow('LD-ZERO-CONFLICT-01');
    });
    it.each([
        (value: any) => {value.operation = Area.Subtraction;},
        (value: any) => {value.detail.range.max = 20;},
        (value: any) => {value.detail.values.push(3);},
        (value: any) => {delete value.detail.range.min;},
        (value: any) => {Object.defineProperty(value, 'extra', {value: 1});},
        (value: any) => {Object.setPrototypeOf(value, null);},
        (value: any) => {Object.preventExtensions(value);}
    ])('rejects attempted mutation without affecting the original configuration', mutation => {
        const before = structuredClone(config);
        expect(() => evaluate(spec(value => {try {mutation(value);} catch { /* Still rejected. */ } return [];})))
            .toThrow('mutation');
        expect(config).toEqual(before);
    });
    it.each([() => random(), () => Math.random(), () => setSeed(5), () => setRandomState(5), () => getRandomState()])(
        'rejects random consumption or state mutation', attempt => {
            setSeed(91);
            expect(() => evaluate(spec(() => {attempt(); return [];}))).toThrow(InferredLabelContractError);
            expect(getRandomState()).toBe(91);
        });
    it('wraps callback failures as non-retryable annotation contracts', () => {
        expect(() => evaluate(spec(() => {throw 'bad rule';}))).toThrow('bad rule');
    });
    it('rejects non-plain or cyclic configuration rather than exposing mutable internals', () => {
        const cycle: any = {}; cycle.self = cycle;
        for (const detail of [new Map(), cycle, () => 1, {get x() {return 1;}}]) {
            expect(() => resolveInferredLabels({...input, config: {...config, detail} as any, spec: spec(() => [])}))
                .toThrow(InferredLabelContractError);
        }
    });
    it('types the complete owner configuration from its own schema, including nested read-only values', () => {
        const ownSchema = {operation: [Area.Addition, Area.Subtraction]} as const;
        const typed: GeneratorSpec<typeof ownSchema> = {generatorId: 'typed', generalLabels: [], inferredLabels: [{
            produces: [Scope.NumbersWithoutZero], infer(value) {
                expectTypeOf(value.operation).toEqualTypeOf<typeof Area.Addition | typeof Area.Subtraction>();
                if (false) {
                    // @ts-expect-error Inference receives a read-only configuration.
                    value.operation = Area.Addition;
                    // @ts-expect-error Other owners' configuration is unavailable.
                    value.layout;
                }
                return [];
            }
        }]};
        expect(resolveInferredLabels({schema: ownSchema, config: {operation: Area.Addition}, spec: typed,
            labels: [], owner: 'generator'})).toEqual([]);
        const viewSchema = {layout: Object.assign(() => ({size: {width: 10}, items: [1]}), {ontologyNeutral: true as const})};
        const view: ViewSpec<typeof viewSchema> = {viewId: 'view', generalLabels: [], inferredLabels: [{
            produces: [Scope.NumbersWithoutZero], infer(value) {
                expectTypeOf(value.layout.size.width).toEqualTypeOf<number>();
                if (false) {
                    // @ts-expect-error Nested owner configuration is read-only too.
                    value.layout.size.width = 2;
                    // @ts-expect-error Arrays cannot be mutated by an inference callback.
                    value.layout.items.push(2);
                }
                return [];
            }
        }]};
        expect(resolveInferredLabels({schema: viewSchema, config: {layout: viewSchema.layout()}, spec: view,
            labels: [], owner: 'view'})).toEqual([]);
    });
});

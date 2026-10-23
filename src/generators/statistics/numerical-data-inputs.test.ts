import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NumericalDataScalar} from '../../types/problems.ts';
import {isNumericalRelationSet, numericalDataInput, numericalDataInputCount, numericalRelationSets as sets} from './numerical-data-inputs.ts';

const value = (q: NumericalDataScalar) => `${q.numerator}/${q.denominator}`;
const compare = (a: NumericalDataScalar, b: NumericalDataScalar) => BigInt(a.numerator) * BigInt(b.denominator) - BigInt(b.numerator) * BigInt(a.denominator);
const originals = [
    ['1/2', '1/1', '1/1', '3/2', '2/1', '3/1'], ['1/1', '2/1', '4/1', '5/1'],
    ['2/1', '2/1', '3/1', '3/1', '3/1', '4/1', '4/1'], ['1/1', '2/1', '3/1', '4/1', '9/1'],
    ['2/1', '2/1', '3/1', '3/1', '3/1', '4/1', '4/1', '15/1'], ['-5/1', '-4/1', '-4/1', '-3/1', '-3/1', '-2/1', '6/1'],
    ['3/1', '3/1', '3/1', '3/1'], ['0/1', '2/1', '2/1', '4/1', '7/1'],
    ['1/4', '1/2', '1/2', '3/4', '1/1'], ['-3/2', '-1/1', '-1/2', '0/1', '5/2']
];

describe('numerical-data literal source inputs', () => {
    it('retains the ten independently specified collections, including repeated values and both designs', () => {
        expect(numericalDataInputCount(sets.mean)).toBe(30);
        for (let index = 0; index < 10; index++) {
            const input = numericalDataInput(sets.mean, index);
            expect(input.records.map(row => value(row.value))).toEqual(originals[index]);
            expect(input.study.units.length).toBe(input.study.selection === 'distinct-units' ? input.records.length : 1);
            expect(input.study.occasions.length).toBe(input.study.selection === 'distinct-units' ? 1 : input.records.length);
            expect(new Set(input.records.map(row => `${row.unitId}#${row.occasionId}`)).size).toBe(input.records.length);
            for (const row of input.records) {
                expect(input.study.units.some(unit => unit.id === row.unitId)).toBe(true);
                expect(input.study.occasions.some(occasion => occasion.id === row.occasionId)).toBe(true);
            }
            expect(input.quartileConvention).toBe('median-of-halves-excluding-odd-center');
            expect(input.whiskerConvention).toBe('observed-minimum-maximum');
            expect(input).not.toHaveProperty('replacement');
            expect(Object.keys(input).sort()).toEqual(['axes', 'departureCriterion', 'histogramEdges', 'quartileConvention', 'records', 'relations', 'study', 'whiskerConvention']);
        }
    });

    it('constructs exactly the feasible pools for every theorem set and scales actual values without changing counts or precision', () => {
        for (const [name, relations] of Object.entries(sets)) {
            const size = name === 'departure' ? 5 : name === 'sensitivity' ? 7 : name.startsWith('distribution') ? 9 : 10;
            expect(numericalDataInputCount(relations)).toBe(size * 3);
            for (let selection = 0; selection < size * 3; selection++) {
                const base = numericalDataInput(relations, selection % size), input = numericalDataInput(relations, selection);
                const multiplier = BigInt(1 + Math.floor(selection / size));
                expect(input.records).toHaveLength(base.records.length);
                expect(input.axes.count).toEqual(base.axes.count);
                expect(input.study).toEqual(base.study);
                for (let i = 0; i < input.records.length; i++) {
                    const q = input.records[i].value, original = base.records[i].value, attribute = input.study.attribute;
                    expect(BigInt(q.numerator) * BigInt(original.denominator)).toBe(BigInt(original.numerator) * multiplier * BigInt(q.denominator));
                    if (attribute.kind === 'count') { expect(q.denominator).toBe(1); expect(q.numerator).toBeGreaterThanOrEqual(0); }
                    else {
                        const p = attribute.precision;
                        expect((BigInt(q.numerator) * BigInt(p.denominator)) % (BigInt(q.denominator) * BigInt(p.numerator))).toBe(0n);
                        if (attribute.kind !== 'temperature') expect(q.numerator).toBeGreaterThanOrEqual(0);
                    }
                }
                expect(input.axes.value.ticks.length).toBeLessThanOrEqual(9);
                expect(input.axes.value.ticks[input.axes.value.zeroIndex].numerator).toBe(0);
                expect(input.relations).toEqual(relations);
                if (relations.some(kind => kind === 'observed-variability')) expect(input.records.some(row => compare(row.value, input.records[0].value) !== 0n)).toBe(true);
                if (relations.some(kind => kind === 'criterion-backed-departure')) {
                    const criterion = input.departureCriterion!;
                    const ordinary = input.records.filter(row => compare(row.value, criterion.lower) >= 0n && compare(row.value, criterion.upper) <= 0n);
                    expect(ordinary.length).toBeGreaterThan(input.records.length / 2);
                    expect(ordinary.length).toBeLessThan(input.records.length);
                    const old = base.departureCriterion!;
                    expect(BigInt(criterion.minimumSeparation.numerator) * BigInt(old.minimumSeparation.denominator))
                        .toBe(BigInt(old.minimumSeparation.numerator) * multiplier * BigInt(criterion.minimumSeparation.denominator));
                }
                if (relations.some(kind => kind === 'single-record-replacement')) {
                    expect(input.replacement!.referenceSource).toBe('documented-routine-value');
                    expect(input.records.filter(row => row.id === input.replacement!.recordId)).toHaveLength(1);
                    expect(input.replacement!.value).not.toEqual(input.records.find(row => row.id === input.replacement!.recordId)!.value);
                    if (input.study.goal.kind === 'equally-allocated-total') expect(input.study.attribute.kind).not.toBe('temperature');
                } else expect(input).not.toHaveProperty('replacement');
            }
        }
    });

    it('accepts exactly genuine relation sets, independent of order, and handles sparse or hostile input cheaply', () => {
        for (const relations of Object.values(sets)) { expect(isNumericalRelationSet(relations)).toBe(true); expect(isNumericalRelationSet([...relations].reverse())).toBe(true); }
        const sparse = new Array(1); Object.setPrototypeOf(sparse, {0: 'arithmetic-mean'});
        const hostile = new Proxy([], {get() { throw new Error('hostile'); }});
        const getter = ['arithmetic-mean']; Object.defineProperty(getter, 0, {get() { throw new Error('getter'); }});
        for (const invalid of [undefined, null, {}, 'arithmetic-mean', [], ['arithmetic-mean', 'arithmetic-mean'], ['arithmetic-mean', 'quartiles'],
            ['unknown'], new Array(1), new Array(1_000_000_000), sparse, hostile, getter]) expect(isNumericalRelationSet(invalid)).toBe(false);
        expect(() => numericalDataInputCount(['unknown'] as unknown as typeof sets.mean)).toThrow(GeneratorValidationError);
        expect(() => numericalDataInput(['unknown'] as unknown as typeof sets.mean, 0)).toThrow(GeneratorValidationError);
        for (const index of [-1, 30, 1.5, NaN, Infinity]) expect(() => numericalDataInput(sets.mean, index)).toThrow(GeneratorValidationError);
    });

    it('creates fresh source objects without sharing mutable measurement or record state', () => {
        const first = numericalDataInput(sets.mean, 0), expected = structuredClone(first);
        Object.defineProperty(first.records[0].value, 'numerator', {value: 999});
        Object.defineProperty(first.study.units[0], 'name', {value: 'changed'});
        if (first.study.attribute.kind !== 'count') Object.defineProperty(first.study.attribute.precision, 'numerator', {value: 999});
        expect(numericalDataInput(sets.mean, 0)).toEqual(expected);
    });
});

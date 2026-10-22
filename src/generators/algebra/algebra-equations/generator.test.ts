import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {AlgebraicEquationProblem, AlgebraicScalar} from '../../../types/problems.ts';
import {isAlgebraicEquationProblem} from '../algebra-statement-helpers.ts';
import {AlgebraEquationsGenerator} from './generator.ts';

/** Independent cross-product truth test for the complete admitted elementary grammar. */
function trueAt(data: AlgebraicEquationProblem, input: AlgebraicScalar): boolean {
    const p = data.form.kind === 'additive' ? data.form.addend : data.form.coefficient, total = data.form.total;
    const [a, b, c, d, e, f] = [input.numerator, input.denominator, p.numerator, p.denominator, total.numerator, total.denominator].map(BigInt);
    return data.form.kind === 'additive' ? (a! * d! + c! * b!) * f! === e! * b! * d! : a! * c! * f! === e! * b! * d!;
}
function scalarValues(value: unknown): AlgebraicScalar[] {
    if (!value || typeof value !== 'object') return [];
    if ('numerator' in value && 'denominator' in value) return [value as AlgebraicScalar];
    return Object.values(value).flatMap(scalarValues);
}
const relations = ['instantiated-predicate', 'finite-extension', 'nonnegative-sum-preimage', 'nonnegative-product-preimage'] as const;

describe('elementary predicates, complete extensions and quantitative preimages', () => {
    it.each(relations)('constructs exact %s with independent candidate and ambient semantics', relation => {
        const generator = new AlgebraEquationsGenerator(), kinds = new Set<string>(), truth = new Set<boolean>(), forms = new Set<string>();
        for (let seed = 0; seed < 64; seed++) {
            setSeed(seed); const stub = generator.generate({relation}), data = stub.data;
            expect(Object.keys(stub)).toEqual(['data']); expect(isAlgebraicEquationProblem(data)).toBe(true);
            expect(data.statement.left.kind).toBe('binary'); expect(data.statement.right.kind).toBe('number');
            expect(data.candidateChecks).toHaveLength(data.candidateUniverse.length);
            for (const [index, check] of data.candidateChecks.entries()) {
                const candidate = data.candidateUniverse[index]!;
                expect(check.candidateId).toBe(candidate.id); expect(check.binding).toEqual({symbolId: 'x', value: candidate.value, notation: candidate.notation});
                expect(check.comparison.truth).toBe(trueAt(data, candidate.value)); truth.add(check.comparison.truth);
                expect(check.right.replacements).toEqual([]); expect(check.right.calculation.reductions).toEqual([]);
            }
            const selected = data.candidateChecks.filter(check => trueAt(data, check.binding.value));
            expect(data.restrictedSolutions).toEqual({candidateIds: selected.map(check => check.candidateId), values: selected.map(check => check.binding.value)});
            expect(data.candidateChecks.filter(check => JSON.stringify(check.binding) === JSON.stringify(data.assignment))).toHaveLength(1);
            if (relation === 'finite-extension') {
                expect(data.ambientDomain).toEqual({kind: 'finite', values: data.candidateUniverse.map(candidate => candidate.value)});
                expect(data.ambientChecks.map(check => check.comparison.truth)).toEqual(data.candidateChecks.map(check => check.comparison.truth));
                expect(data.solutionCardinality).toEqual({kind: 'finite', count: selected.length});
            } else {
                expect(data.ambientDomain.kind).toBe('numeric'); expect(data.ambientChecks).toEqual([]);
                if (relation.startsWith('nonnegative-')) {
                    expect(data.context.kind).toBe(relation === 'nonnegative-sum-preimage' ? 'combined-amounts' : 'equal-groups');
                    expect(data.form.kind).toBe(relation === 'nonnegative-sum-preimage' ? 'additive' : 'multiplicative');
                    expect(scalarValues(data).every(value => value.numerator >= 0)).toBe(true);
                    expect(data.ambientSolution.kind).toBe('singleton');
                } else if (data.ambientDomain.kind === 'numeric') expect(data.ambientDomain.values).toEqual({kind: 'rational', lower: null, upper: null, excludedValues: []});
            }
            if (data.solutionWitness.kind === 'isolated-variable') {
                expect(data.solutionWitness.verification?.comparison.truth).toBe(data.solutionWitness.admissible ? true : undefined);
                if (data.solutionWitness.admissible) expect(trueAt(data, data.solutionWitness.algebraicValue)).toBe(true);
            }
            kinds.add(data.ambientSolution.kind); forms.add(data.form.kind);
        }
        expect(truth).toEqual(new Set([false, true]));
        if (relation === 'finite-extension') for (const kind of ['empty', 'all-domain', 'singleton']) expect(kinds.has(kind)).toBe(true);
        if (!relation.startsWith('nonnegative-')) expect(forms).toEqual(new Set(['additive', 'multiplicative']));
    });

    it('preserves finite-decimal and unreduced fraction spelling and exactly replays seeded mathematics', () => {
        const generator = new AlgebraEquationsGenerator(), forms = new Set<string>();
        for (let seed = 0; seed < 64; seed++) {
            setSeed(seed); const first = generator.generate({relation: 'nonnegative-sum-preimage'});
            setSeed(seed); expect(generator.generate({relation: 'nonnegative-sum-preimage'})).toEqual(first);
            first.data.candidateUniverse.forEach(candidate => forms.add(candidate.notation.kind));
        }
        expect(forms).toEqual(new Set(['integer', 'decimal', 'fraction']));
        for (const config of [null, undefined, {}, {relation: []}, {relation: false}, {relation: 'solve'}, {relation: 'addition'}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});

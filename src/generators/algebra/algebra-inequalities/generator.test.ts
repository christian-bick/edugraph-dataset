import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {isAlgebraicInequalityProblem} from '../algebra-statement-helpers.ts';
import {AlgebraInequalitiesGenerator} from './generator.ts';

const relations = ['instantiated-predicate', 'finite-extension', 'rational-half-line', 'quantitative-threshold'] as const;
describe('strict predicate domains and complete solution sets', () => {
    it.each(relations)('constructs genuine %s domains in both strict directions', relation => {
        const generator = new AlgebraInequalitiesGenerator(), kinds = new Set<string>(), truth = new Set<boolean>(), forms = new Set<string>();
        for (const direction of ['less', 'greater'] as const) for (let seed = 0; seed < 64; seed++) {
            setSeed(seed); const stub = generator.generate({relation, direction}), data = stub.data;
            expect(Object.keys(stub)).toEqual(['data']); expect(isAlgebraicInequalityProblem(data)).toBe(true);
            expect(data.statement.left.kind).toBe('variable'); expect(data.statement.right.kind).toBe('number'); expect(data.statement.operator).toBe(direction);
            const independentlyTrue = data.candidateUniverse.filter(candidate => {
                const difference = BigInt(candidate.value.numerator) * BigInt(data.bound.value.denominator) - BigInt(data.bound.value.numerator) * BigInt(candidate.value.denominator);
                const actual = direction === 'less' ? difference < 0n : difference > 0n;
                expect(data.candidateChecks.find(check => check.candidateId === candidate.id)!.comparison.truth).toBe(actual); truth.add(actual); return actual;
            });
            expect(data.restrictedSolutions).toEqual({candidateIds: independentlyTrue.map(candidate => candidate.id), values: independentlyTrue.map(candidate => candidate.value)});
            expect(data.candidateChecks.filter(check => JSON.stringify(check.binding) === JSON.stringify(data.assignment))).toHaveLength(1);
            expect(data.solutionLine.axis.ticks[data.solutionLine.boundary.tickIndex]).toEqual(data.bound.value);
            if (relation === 'finite-extension') {
                expect(data.ambientDomain).toEqual({kind: 'finite', values: data.candidateUniverse.map(candidate => candidate.value)});
                expect(data.ambientChecks).toHaveLength(data.candidateUniverse.length);
                expect(data.solutionCardinality).toEqual({kind: 'finite', count: independentlyTrue.length});
            } else {
                expect(data.ambientDomain.kind).toBe('numeric');
                if (data.ambientDomain.kind !== 'numeric') throw Error('Fixture domain');
                const domain = data.ambientDomain.values;
                expect(data.solutionCardinality).toEqual({kind: 'infinite'});
                if (relation === 'rational-half-line') {
                    expect([domain.lower, domain.upper]).toEqual([null, null]);
                    expect(data.ambientSolution).toMatchObject({kind: 'ray', boundary: data.bound.value, direction, boundaryIncluded: false,
                        infiniteFamily: {base: data.bound.value, direction: direction === 'less' ? 'subtract' : 'add'}});
                } else {
                    expect(data.ambientSolution.kind).toBe('interval');
                    if (relation === 'instantiated-predicate') { expect(domain.lower).not.toBeNull(); expect(domain.upper).not.toBeNull(); }
                    else { expect(domain.lower).toEqual({value: {numerator: 0, denominator: 1}, inclusive: true}); expect(domain.upper).toBeNull(); expect(data.bound.value.numerator).toBeGreaterThan(0); }
                }
            }
            kinds.add(data.ambientSolution.kind); forms.add(data.bound.notation.kind);
        }
        expect(truth).toEqual(new Set([false, true])); expect(forms).toEqual(new Set(['integer', 'decimal', 'fraction']));
        if (relation === 'finite-extension') expect(kinds).toEqual(new Set(['empty', 'all-domain', 'finite']));
    });

    it('replays exactly and rejects missing/invented relation and strict-direction configuration', () => {
        const generator = new AlgebraInequalitiesGenerator();
        setSeed(17); const first = generator.generate({relation: 'rational-half-line', direction: 'less'});
        setSeed(17); expect(generator.generate({relation: 'rational-half-line', direction: 'less'})).toEqual(first);
        for (const config of [null, undefined, {}, {relation: 'rational-half-line'}, {direction: 'less'}, {relation: [], direction: 'less'},
            {relation: 'graph', direction: 'less'}, {relation: 'rational-half-line', direction: 'equal'}, {relation: 'rational-half-line', direction: false}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});

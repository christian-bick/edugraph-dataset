import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {AlgebraicScalar, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {isAlgebraVariableMeaningProblem} from '../algebra-variable-meaning-helpers.ts';
import {AlgebraVariableModelsGenerator} from './generator.ts';

type Fraction = readonly [bigint, bigint];
const fraction = (value: AlgebraicScalar): Fraction => [BigInt(value.numerator), BigInt(value.denominator)];
const plus = ([a,b]: Fraction, [c,d]: Fraction): Fraction => [a*d+c*b,b*d];
const times = ([a,b]: Fraction, [c,d]: Fraction): Fraction => [a*c,b*d];
const equal = ([a,b]: Fraction, [c,d]: Fraction): boolean => a*d === c*b;
/** Independent exact substitution, without the production normalizer or arithmetic engine. */
function evaluate(node: Node, input: Fraction): Fraction {
    if (node.kind === 'number') return fraction(node.value);
    if (node.kind === 'variable') return input;
    if (node.kind === 'group') return evaluate(node.expression,input);
    if (node.kind !== 'binary') throw Error('Unexpected generated arithmetic.');
    const first=evaluate(node.left,input), second=evaluate(node.right,input);
    if (node.operation === 'addition') return plus(first,second);
    if (node.operation === 'multiplication') return times(first,second);
    throw Error('Unexpected generated operation.');
}
function nodes(node: Node): Node[] {
    return [node,...(node.kind === 'binary' ? [...nodes(node.left),...nodes(node.right)] : node.kind === 'group' ? nodes(node.expression) : [])];
}
const roles = ['particular-unknown', 'arbitrary-generalized-number'] as const;

describe('particular conditions and universally quantified named-domain relations', () => {
    it.each(roles)('constructs genuine %s mathematics, not a requested interpretation flag', role => {
        const generator=new AlgebraVariableModelsGenerator(), domains=new Set<string>(), quantities=new Set<string>(), families=new Set<string>();
        let zero=false, negative=false, fractional=false;
        for (let seed=0; seed<96; seed++) {
            setSeed(seed); const stub=generator.generate({role}), data=stub.data;
            expect(Object.keys(stub)).toEqual(['data']); expect(data.kind).toBe('algebra-variable-models');
            expect(isAlgebraVariableMeaningProblem(data)).toBe(true); expect(data.role.kind).toBe(role);
            expect(Object.keys(data).sort()).toEqual(['domain','expressions','kind','proofDomain','quantity','relation','role','symbol']);
            expect(data.proofDomain.symbols).toEqual([{...data.symbol,domain:{kind:'rational',lower:null,upper:null,excludedValues:[]}}]);
            expect(data.proofDomain.domainId).not.toBe(data.domain.domainId);
            const [left,right]=data.expressions;
            expect(data.relation).toEqual({leftExpressionId:left.expressionId,rightExpressionId:right.expressionId});
            expect([left.domainId,right.domainId]).toEqual([data.proofDomain.domainId,data.proofDomain.domainId]);
            const occurrences=[...nodes(left.root),...nodes(right.root)];
            expect(occurrences.some(node=>node.kind==='variable')).toBe(true);
            expect(occurrences.filter(node=>node.kind==='variable').every(node=>node.symbolId===data.symbol.symbolId)).toBe(true);
            domains.add(data.domain.name); quantities.add(data.quantity.kind);
            families.add(`${left.root.id}:${right.root.id}:${occurrences.some(node=>node.kind==='group')}`);
            if (data.quantity.kind==='count') expect(data.domain.name).toBe('nonnegative-integers');
            if (data.quantity.kind==='length') expect(data.domain.name).toBe('nonnegative-rational-numbers');
            if (data.role.kind==='particular-unknown') {
                const value=data.role.uniqueValueWitness.uniqueValue, input=fraction(value);
                expect(equal(evaluate(left.root,input),evaluate(right.root,input))).toBe(true);
                expect(equal(evaluate(left.root,plus(input,[1n,1n])),evaluate(right.root,plus(input,[1n,1n])))).toBe(false);
                expect(data.role.uniqueValueWitness.verification.comparison.truth).toBe(true);
                if (data.domain.name.endsWith('integers')) expect(value.denominator).toBe(1);
                if (data.domain.name.startsWith('nonnegative-')) expect(value.numerator).toBeGreaterThanOrEqual(0);
                zero ||= value.numerator===0; negative ||= value.numerator<0; fractional ||= value.denominator>1;
            } else {
                expect(data.role.quantifier).toBe('for-every-domain-member');
                expect(data.role.domainInclusion).toBe('named-domain-subset-of-rationals');
                const proof=data.role.universalProof;
                expect(proof.leftNormalization.rootNormalForm).toEqual(proof.rightNormalization.rootNormalForm);
                for (const input of [[-3n,1n],[0n,1n],[1n,2n],[2n,1n],[10n,1n]] as const) {
                    expect(equal(evaluate(left.root,input),evaluate(right.root,input))).toBe(true);
                }
            }
        }
        expect(domains).toEqual(new Set(['rational-numbers','integers','nonnegative-rational-numbers','nonnegative-integers']));
        expect(quantities).toEqual(new Set(['number','count','length'])); expect(families.size).toBe(3);
        if (role==='particular-unknown') expect([zero,negative,fractional]).toEqual([true,true,true]);
    });

    it('retains original numeric spelling and replays the entire payload and PRNG continuation', () => {
        const generator=new AlgebraVariableModelsGenerator(), spellings=new Set<string>();
        for (const role of roles) for (let seed=0; seed<24; seed++) {
            setSeed(seed); const first=generator.generate({role}), state=getRandomState(), next=random();
            setSeed(seed); expect(generator.generate({role})).toEqual(first); expect(getRandomState()).toBe(state); expect(random()).toBe(next);
            first.data.expressions.flatMap(expression=>nodes(expression.root)).forEach(node=>{
                if (node.kind==='number') {
                    spellings.add(node.notation.kind);
                    if (node.notation.kind==='fraction') expect(node.notation.denominator).toBe(node.value.denominator*2);
                    if (node.notation.kind==='decimal') expect(node.notation.scale).toBe(2);
                }
            });
        }
        expect(spellings).toEqual(new Set(['integer','fraction','decimal']));
    });

    it('rejects missing, empty, malformed and learner-task configurations', () => {
        const generator=new AlgebraVariableModelsGenerator();
        for (const config of [null,undefined,{}, {role:[]},{role:false},{role:'interpret'},{role:'solve'},{role:'independent'}]) {
            expect(()=>generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});

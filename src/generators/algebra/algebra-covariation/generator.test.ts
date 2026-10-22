import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {AlgebraCovariationProblem, AlgebraicScalar, CovariationValueWitness, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {isAlgebraCovariationProblem} from '../algebra-covariation-helpers.ts';
import {AlgebraCovariationGenerator} from './generator.ts';

type Fraction = readonly [bigint, bigint];
const fraction = (value: AlgebraicScalar): Fraction => [BigInt(value.numerator), BigInt(value.denominator)];
const plus = ([a,b]: Fraction, [c,d]: Fraction): Fraction => [a*d+c*b,b*d];
const times = ([a,b]: Fraction, [c,d]: Fraction): Fraction => [a*c,b*d];
const equal = ([a,b]: Fraction, [c,d]: Fraction): boolean => a*d===c*b;
/** Independent original-tree substitution; no production coefficient or calculation helper. */
function evaluate(node: Node, input: Fraction): Fraction {
    if (node.kind==='number') return fraction(node.value);
    if (node.kind==='variable') return input;
    if (node.kind==='group') return evaluate(node.expression,input);
    if (node.kind!=='binary') throw Error('Unexpected canonical arithmetic.');
    const first=evaluate(node.left,input),second=evaluate(node.right,input);
    if (node.operation==='addition') return plus(first,second);
    if (node.operation==='multiplication') return times(first,second);
    throw Error('Unexpected canonical operation.');
}
function nodes(node: Node): Node[] {
    return [node,...(node.kind==='binary'?[...nodes(node.left),...nodes(node.right)]:[])];
}
const variants=['numerical-correspondence','designated-dependency','quantitative-origin'] as const;
function checkValue(data: AlgebraCovariationProblem, value: CovariationValueWitness) {
    const input=fraction(value.input),slope=fraction(data.equation.slope),intercept=fraction(data.equation.intercept);
    expect(equal(fraction(value.scaledInput),times(slope,input))).toBe(true);
    expect(equal(fraction(value.output),plus(times(slope,input),intercept))).toBe(true);
    expect(equal(fraction(value.output),evaluate(data.equation.right,input))).toBe(true);
    expect(value.evaluation.binding.symbolId).toBe(data.input.symbolId);
    expect(value.evaluation.binding.value).toEqual(value.input);
    expect(value.evaluation.calculation.finalValue).toEqual(value.output);
    const occurrences=nodes(data.equation.right).filter(node=>node.kind==='variable').map(node=>node.id);
    expect(new Set(value.evaluation.replacements.map(row=>row.occurrenceNodeId))).toEqual(new Set(occurrences));
}

describe('one affine quantity correspondence with genuine selected relations', () => {
    it.each(variants)('constructs complete %s models across real and count domains', relations => {
        const generator=new AlgebraCovariationGenerator(),contexts=new Set<string>(),forms=new Set<string>(),boundaries=new Set<string>();
        let proportional=false,nonproportional=false,nonintegral=false,positiveMinimum=false;
        for (let seed=0;seed<72;seed++) {
            setSeed(seed);const stub=generator.generate({relations}),data=stub.data;
            expect(Object.keys(stub)).toEqual(['data']);expect(isAlgebraCovariationProblem(data)).toBe(true);
            expect(data.selectedRelations).toHaveLength(variants.indexOf(relations));
            expect(data.input.quantityId).not.toBe(data.output.quantityId);expect(data.input.symbolId).not.toBe(data.output.symbolId);
            expect(data.output.domain.kind).toBe('real');expect(data.equation.slope.numerator).toBeGreaterThan(0);
            contexts.add(data.context.kind);forms.add(`${data.equation.right.id}:${data.equation.right.kind==='binary'?data.equation.right.left.kind:''}`);
            proportional ||= data.equation.intercept.numerator===0;nonproportional ||= data.equation.intercept.numerator>0;
            nonintegral ||= data.equation.slope.denominator>1;positiveMinimum ||= data.input.domain.minimum.numerator>0;
            expect(data.lawProof.proofDomain.symbols).toEqual([{symbolId:data.input.symbolId,symbol:data.input.symbol,
                domain:{kind:'rational',lower:null,upper:null,excludedValues:[]}}]);
            expect(data.lawProof.rhsExpression.root).toEqual(data.equation.right);
            checkValue(data,data.domainImage.atMinimumInput);checkValue(data,data.domainImage.atMaximumInput);
            expect(data.domainImage.atMinimumInput.input).toEqual(data.input.domain.minimum);
            expect(data.domainImage.atMaximumInput.input).toEqual(data.input.domain.maximum);
            data.table.forEach(row=>checkValue(data,row.value));
            expect(new Set(data.graph.tablePoints.map(point=>point.rowId))).toEqual(new Set(data.table.map(row=>row.rowId)));
            for (const plotted of data.graph.tablePoints) {
                const row=data.table.find(row=>row.rowId===plotted.rowId)!;
                expect(plotted.point.x.value).toEqual(row.value.input);expect(plotted.point.y.value).toEqual(row.value.output);
            }
            const geometry=data.graph.geometry;
            if (data.input.domain.kind==='integer') {
                expect(data.context.kind).toBe('item-purchase');expect(data.domainImage.imageKind).toBe('discrete-endpoint-envelope');
                expect(geometry.kind).toBe('discrete-points');
                if (geometry.kind!=='discrete-points') throw Error('Count geometry must be discrete.');
                const first=Number(BigInt(data.graph.window.minimumInput.numerator)/BigInt(data.graph.window.minimumInput.denominator));
                const last=Number(BigInt(data.graph.window.maximumInput.numerator)/BigInt(data.graph.window.maximumInput.denominator));
                expect(geometry.visibleValues.map(row=>row.value.input.numerator)).toEqual(Array.from({length:last-first+1},(_,i)=>first+i));
                geometry.visibleValues.forEach(row=>{expect(row.value.input.denominator).toBe(1);checkValue(data,row.value);expect(row.point.y.value).toEqual(row.value.output);});
            } else {
                expect(data.domainImage.imageKind).toBe('real-interval-image');expect(geometry.kind).toBe('continuous-affine-segment');
                if (geometry.kind!=='continuous-affine-segment') throw Error('Real geometry must be the full segment.');
                checkValue(data,geometry.first.value);checkValue(data,geometry.last.value);
                expect(geometry.first.value.input).toEqual(data.graph.window.minimumInput);expect(geometry.last.value.input).toEqual(data.graph.window.maximumInput);
                boundaries.add(geometry.lastBoundary);expect(geometry.firstBoundary).toBe('domain-endpoint');
            }
            if (relations!=='numerical-correspondence') {
                const dependency=data.selectedRelations[0]!;expect(dependency.kind).toBe('designated-quantity-dependency');
                expect(new Set(dependency.inputIncidence.occurrenceNodeIds)).toEqual(new Set(nodes(data.equation.right).filter(node=>node.kind==='variable').map(node=>node.id)));
                expect(dependency.lawExpressionId).toBe(data.lawProof.rhsExpression.expressionId);
            }
            if (relations==='quantitative-origin') {
                const origin=data.selectedRelations[1]!;expect(origin.kind).toBe('quantitative-origin');
                expect(origin.rateLink.equality.result).toEqual({numerator:0,denominator:1});expect(origin.initialLink.equality.result).toEqual({numerator:0,denominator:1});
            }
        }
        expect(contexts).toEqual(new Set(['constant-speed','rental-charge','item-purchase','constant-production']));
        expect(forms.size).toBe(3);expect(boundaries).toEqual(new Set(['domain-endpoint','window-cut']));
        expect([proportional,nonproportional,nonintegral,positiveMinimum]).toEqual([true,true,true,true]);
    });

    it('retains numeral forms and exact payload plus RNG continuation without copying relation config', () => {
        const generator=new AlgebraCovariationGenerator(),spellings=new Set<string>();
        for (let seed=0;seed<18;seed++) {
            let backbone: unknown,state: number|undefined,next: number|undefined;
            for (const relations of variants) {
                setSeed(seed);const first=generator.generate({relations}),after=getRandomState(),continuation=random();
                setSeed(seed);expect(generator.generate({relations})).toEqual(first);expect(getRandomState()).toBe(after);expect(random()).toBe(continuation);
                const {selectedRelations,...common}=first.data;expect(selectedRelations).toHaveLength(variants.indexOf(relations));
                if (backbone===undefined) {backbone=common;state=after;next=continuation;} else {expect(common).toEqual(backbone);expect(after).toBe(state);expect(continuation).toBe(next);}
                expect(first.data).not.toHaveProperty('relations');expect(first.data).not.toHaveProperty('task');
                nodes(first.data.equation.right).forEach(node=>{if(node.kind==='number')spellings.add(node.notation.kind);});
            }
        }
        expect(spellings).toEqual(new Set(['integer','fraction','decimal']));
    });

    it('rejects missing, empty, malformed and learner-action configurations', () => {
        const generator=new AlgebraCovariationGenerator();
        for (const config of [null,undefined,{}, {relations:[]},{relations:false},{relations:'model'},{relations:'interpret'},{relations:'plot'}]) {
            expect(()=>generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});

import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {AlgebraicScalar, PolygonAreaDissectionProblem} from '../../../types/problems.ts';
import {isPolygonAreaDissectionProblem} from '../polygon-area-helpers.ts';
import {PolygonAreaDissectionGenerator} from './generator.ts';

type Q = readonly [bigint, bigint];
const q = (value: AlgebraicScalar): Q => [BigInt(value.numerator), BigInt(value.denominator)];
const add = ([a,b]: Q,[c,d]: Q): Q => [a*d+c*b,b*d];
const sub = ([a,b]: Q,[c,d]: Q): Q => [a*d-c*b,b*d];
const mul = ([a,b]: Q,[c,d]: Q): Q => [a*c,b*d];
const same = ([a,b]: Q,[c,d]: Q): boolean => a*d===c*b;
type Vector = readonly [Q,Q];
const dot = ([ax,ay]: Vector,[bx,by]: Vector): Q => add(mul(ax,bx),mul(ay,by));
const cross = ([ax,ay]: Vector,[bx,by]: Vector): Q => sub(mul(ax,by),mul(ay,bx));
/** Independent rational shoelace oracle; no production geometry/calculation code. */
function area(data: PolygonAreaDissectionProblem, boundary: readonly string[]): Q {
    const points = new Map(data.points.map(point=>[point.id,point]));
    const twice = boundary.reduce<Q>((sum,id,index)=>{
        const first=points.get(id)!,second=points.get(boundary[(index+1)%boundary.length]!)!;
        return add(sum,sub(mul(q(first.x),q(second.y)),mul(q(first.y),q(second.x))));
    },[0n,1n]);
    return [twice[0]<0n?-twice[0]:twice[0],2n*twice[1]];
}
const families=['right-triangle','acute-triangle','obtuse-triangle','parallelogram','rhombus','trapezoid','kite','polygon'] as const;

describe('complete polygon partitions and rigid copy assemblies',()=>{
    it.each(families)('constructs genuine %s source models with an exact independent area',family=>{
        const generator=new PolygonAreaDissectionGenerator();
        for(let seed=0;seed<12;seed++) {
            setSeed(seed);const stub=generator.generate({family}),data=stub.data;
            expect(Object.keys(stub)).toEqual(['data']);expect(isPolygonAreaDissectionProblem(data)).toBe(true);
            expect(same(q(data.source.area),area(data,data.source.boundary))).toBe(true);
            expect(same(q(data.assembly.areaSum.total),area(data,data.assembly.targetBoundary))).toBe(true);
            expect(same(q(data.assembly.areaSum.total),mul(q(data.source.area),[BigInt(data.assembly.copyCount),1n]))).toBe(true);
            for(const cell of data.source.cells) {
                const base=data.measures.find(row=>row.measureId===cell.base.measureId)!,height=data.measures.find(row=>row.measureId===cell.height.measureId)!;
                expect(same(q(cell.area),mul(mul(q(base.value),q(height.value)),[1n,2n]))).toBe(true);
                expect(same(q(cell.area),area(data,cell.vertices))).toBe(true);
            }
            expect(data.assembly.placements).toHaveLength(data.source.cells.length*data.assembly.copyCount);
            expect(data.assembly.copyCount).toBe(family==='right-triangle'?2:1);
            expect(data.assembly.areaDerivation.kind).toBe(['right-triangle','parallelogram'].includes(family)?'rectangle-product':'triangle-area-sum');
            const angles=data.source.shapeFacts.angles.map(angle=>angle.kind);
            const registry=new Map(data.points.map(point=>[point.id,point])),boundary=data.source.boundary.map(id=>registry.get(id)!);
            const vector=(from:typeof boundary[number],to:typeof boundary[number]): Vector=>[sub(q(to.x),q(from.x)),sub(q(to.y),q(from.y))];
            const sides=boundary.map((point,index)=>vector(point,boundary[(index+1)%boundary.length]!));
            const products=boundary.map((point,index)=>dot(vector(point,boundary[(index+boundary.length-1)%boundary.length]!),vector(point,boundary[(index+1)%boundary.length]!)));
            if(family==='right-triangle')expect(angles.filter(kind=>kind==='right')).toHaveLength(1);
            if(family==='acute-triangle')expect(angles).toEqual(['acute','acute','acute']);
            if(family==='obtuse-triangle')expect(angles.filter(kind=>kind==='obtuse')).toHaveLength(1);
            if(family==='right-triangle')expect(products.filter(product=>product[0]===0n)).toHaveLength(1);
            if(family==='acute-triangle')expect(products.every(product=>product[0]>0n)).toBe(true);
            if(family==='obtuse-triangle')expect(products.filter(product=>product[0]<0n)).toHaveLength(1);
            if(family==='parallelogram')expect([cross(sides[0]!,sides[2]!)[0],cross(sides[1]!,sides[3]!)[0]]).toEqual([0n,0n]);
            if(family==='trapezoid')expect(cross(sides[0]!,sides[2]!)[0]===0n||cross(sides[1]!,sides[3]!)[0]===0n).toBe(true);
            if(family==='rhombus') {
                expect(data.source.shapeFacts.equalLengthEdgeGroups.map(group=>group.length)).toEqual([4]);
                expect(sides.every(side=>same(dot(side,side),dot(sides[0]!,sides[0]!)))).toBe(true);
            }
            if(family==='kite') {
                expect(data.source.shapeFacts.equalLengthEdgeGroups.map(group=>group.length)).toEqual([2,2]);
                expect(same(dot(sides[0]!,sides[0]!),dot(sides[1]!,sides[1]!))).toBe(true);
                expect(same(dot(sides[2]!,sides[2]!),dot(sides[3]!,sides[3]!))).toBe(true);
            }
            if(family==='polygon')expect(data.source.boundary.length).toBeGreaterThanOrEqual(5);
            expect(data).not.toHaveProperty('family');expect(data).not.toHaveProperty('task');expect(data).not.toHaveProperty('prompt');
        }
    });

    it('replays the complete model and exact PRNG continuation',()=>{
        const generator=new PolygonAreaDissectionGenerator();
        for(const family of families) {
            setSeed(713);const first=generator.generate({family}),state=getRandomState(),next=random();
            setSeed(713);expect(generator.generate({family})).toEqual(first);expect(getRandomState()).toBe(state);expect(random()).toBe(next);
        }
    });

    it('does not distinguish identical mathematics only by its story context',()=>{
        const generator=new PolygonAreaDissectionGenerator();
        setSeed(718099412);const train=generator.generate({family:'rhombus'}).data;
        setSeed(569449089);const validation=generator.generate({family:'rhombus'}).data;
        expect(validation).toEqual(train);
        const byMathematics=new Map<string,Set<string>>(),areas=new Set<string>(),contexts=new Set<string>();
        for(let seed=0;seed<64;seed++) {
            setSeed(seed);const data=generator.generate({family:'rhombus'}).data;
            const {context,...mathematics}=data,key=JSON.stringify(mathematics);
            const seen=byMathematics.get(key)??new Set<string>();seen.add(context.kind);byMathematics.set(key,seen);
            areas.add(`${data.source.area.numerator}/${data.source.area.denominator}`);contexts.add(context.kind);
        }
        expect(areas).toEqual(new Set(['3/1','12/1','27/1','48/1']));
        expect(contexts).toEqual(new Set(['floor-region','garden-bed','fabric-panel']));
        expect([...byMathematics.values()].every(seen=>seen.size===1)).toBe(true);
    });

    it('rejects missing, malformed and learner-action configurations',()=>{
        const generator=new PolygonAreaDissectionGenerator();
        for(const config of [null,undefined,{}, {family:[]},{family:false},{family:'compose'},{family:'decompose'},{family:'rectangle'}]) {
            expect(()=>generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});

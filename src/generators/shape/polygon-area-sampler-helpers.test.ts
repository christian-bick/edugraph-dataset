import {describe, expect, it} from 'vitest';
import {buildPolygonAreaDissectionProblem} from './polygon-area-helpers.ts';
import {makePolygonAreaSamplerBlueprint, type PolygonAreaSamplerFamily, type PolygonAreaSamplerScale} from './polygon-area-sampler-helpers.ts';

const families: readonly PolygonAreaSamplerFamily[]=['right-triangle','acute-triangle','obtuse-triangle','parallelogram','rhombus','trapezoid','kite','polygon'];
const originalAreas=[6,12,3,8,12,13.5,8,17.5];
const scales=[0.5,1,1.5,2];
describe('literal geometry sampling premises',()=>{
    it('covers all eight mathematical families and four visible rational scales',()=>{
        for(const [index,family] of families.entries()) for(const scaleIndex of [0,1,2,3] as const) {
            const input=makePolygonAreaSamplerBlueprint(family,scaleIndex,'garden-bed','convex');
            const data=buildPolygonAreaDissectionProblem(input),expected=originalAreas[index]!*scales[scaleIndex]!**2;
            expect(data.source.area.numerator/data.source.area.denominator).toBe(expected);
            expect(data.context.kind).toBe('garden-bed');expect(data.units.area.name).toBe('square meters');
            const sourceIds=new Set(data.context.dimensions.map(row=>row.measureId));
            expect(input.measures.filter(row=>row.kind==='measured-length').every(row=>sourceIds.has(row.measureId))).toBe(true);
            expect(data.assembly.areaSum.total.numerator/data.assembly.areaSum.total.denominator).toBe(expected*data.assembly.copyCount);
        }
    });

    it('includes convex, concave star and non-star oblique polygons with complete atomic cuts',()=>{
        const cases=[['convex',17.5,4],['star',16,8],['nonstar',23,5]] as const;
        for(const [variant,expected,cuts] of cases) {
            const data=buildPolygonAreaDissectionProblem(makePolygonAreaSamplerBlueprint('polygon',1,'floor-region',variant));
            expect(data.source.area.numerator/data.source.area.denominator).toBe(expected);expect(data.source.cuts).toHaveLength(cuts);
            expect(data.source.shapeFacts.angles.some(angle=>angle.kind==='reflex')).toBe(variant!=='convex');
            if(variant==='nonstar') {
                const points=new Map(data.points.map(point=>[point.id,point]));
                const vertical=data.source.cuts.filter(cut=>points.get(cut.fromId)!.x.numerator===points.get(cut.toId)!.x.numerator);
                expect(vertical).toHaveLength(2);
                for(const cut of vertical)expect([points.get(cut.fromId)!.y.numerator,points.get(cut.toId)!.y.numerator].sort((a,b)=>a-b)).toEqual([0,2]);
            }
        }
    });

    it('keeps fractional givens and all semantic contexts without inventing task fields',()=>{
        for(const kind of ['floor-region','garden-bed','fabric-panel'] as const) {
            const input=makePolygonAreaSamplerBlueprint('kite',0,kind,'star');
            expect(input.context.kind).toBe(kind);expect(input.measures.some(row=>row.kind==='measured-length'&&row.value.denominator===2)).toBe(true);
            expect(input).not.toHaveProperty('area');expect(input).not.toHaveProperty('shapeFacts');expect(input).not.toHaveProperty('task');
        }
    });

    it('rejects unknown sampler inputs',()=>{
        const invoke=(family: unknown,scale: unknown,kind: unknown,variant: unknown)=>makePolygonAreaSamplerBlueprint(family as never,scale as PolygonAreaSamplerScale,kind as never,variant as never);
        for(const args of [['triangle',1,'floor-region','convex'],['kite',-1,'floor-region','convex'],['kite',1,'pool','convex'],['polygon',1,'floor-region','fan']]) {
            expect(()=>invoke(...args as [unknown,unknown,unknown,unknown])).toThrow();
        }
    });
});

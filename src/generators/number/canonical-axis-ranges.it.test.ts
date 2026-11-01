import {afterEach,describe,expect,it,vi} from 'vitest';
import * as rng from '../../lib/random.ts';
import {createCanonicalNumericRange,hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {RationalMagnitudeRelationsGenerator} from './rational-magnitude-relations/generator.ts';
import {RationalOrderRelationsGenerator} from './rational-order-relations/generator.ts';

afterEach(()=>vi.restoreAllMocks());
const range=createCanonicalNumericRange(5);
const numeric=(v:{numerator:number;denominator:number})=>v.numerator/v.denominator;

describe('canonical upper5 for required zero-based rational axes',()=>{
 it('covers every generated magnitude scale and location in both sign domains',()=>{
  const random=vi.spyOn(rng,'random'),generator=new RationalMagnitudeRelationsGenerator();let count=0;
  for(const signDomain of ['nonnegative','signed'] as const)for(let radius=2;radius<=5;radius++)for(let denominator=1;denominator<=4;denominator++){
   const choices=signDomain==='signed'?radius:radius+1;
   for(let point=0;point<choices;point++){
    random.mockReturnValueOnce((radius-1.5)/4).mockReturnValueOnce((denominator-0.5)/4).mockReturnValueOnce((point+0.5)/choices);
    const {data}=generator.generate({signDomain});
    expect(data.axis.maximum.numerator/data.axis.maximum.denominator).toBe(radius/denominator);
    expect(hasCanonicalRangeWitness([0,numeric(data.point.value),numeric(data.distance.length),
     ...data.axis.ticks.map(numeric)],range)).toBe(true);count++;
   }
  }
  expect(count).toBe(128);
 });

 it('covers every strict rational pair on every generated scale in both directions',()=>{
  const random=vi.spyOn(rng,'random'),generator=new RationalOrderRelationsGenerator();let count=0;
  for(const relation of ['less','greater'] as const)for(let radius=2;radius<=5;radius++)for(let denominator=1;denominator<=4;denominator++){
   const tickCount=2*radius+1;
   for(let lower=0;lower<tickCount-1;lower++)for(let upper=lower+1;upper<tickCount;upper++){
    random.mockReturnValueOnce((radius-1.5)/4).mockReturnValueOnce((denominator-0.5)/4)
     .mockReturnValueOnce((lower+0.5)/(tickCount-1)).mockReturnValueOnce((upper-lower-0.5)/(tickCount-lower-1));
    const {data}=generator.generate({relation});
    expect(hasCanonicalRangeWitness([0,numeric(data.first.value),numeric(data.second.value),
     ...data.axis.ticks.map(numeric)],range)).toBe(true);count++;
   }
  }
  expect(count).toBe(976);
 });
});

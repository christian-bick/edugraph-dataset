import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import * as rng from '../../lib/random.ts';
import {createCanonicalNumericRange,hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {NumbersFactorsMultiplesView} from '../../visuals/views/numbers/factors-multiples-view.tsx';
import {NumbersPrimeClassificationGenerator} from './numbers-prime-classification/generator.ts';
import {NumbersCompositeClassificationGenerator} from './numbers-composite-classification/generator.ts';

describe('classification range witness projections',()=>{
    it('preserves the classified number and required factor evidence in both modes',()=>{
        const draw=vi.spyOn(rng,'random');
        let rendered=0;
        try{
            for(const prime of [true,false])for(const upper of [5,10,20,100]){
                const range=createCanonicalNumericRange(upper);
                const candidates=Array.from({length:98},(_,index)=>index+2).filter(number=>{
                    const count=Array.from({length:number},(_,index)=>index+1).filter(factor=>number%factor===0).length;
                    return number>range.maximumAbove&&number<=upper&&(count===2)===prime;
                });
                for(const[index,number]of candidates.entries()){
                    draw.mockReset().mockReturnValue((index+0.5)/candidates.length);
                    const{data}=(prime?new NumbersPrimeClassificationGenerator():new NumbersCompositeClassificationGenerator()).generate({range});
                    expect(data.number).toBe(number);
                    expect(hasCanonicalRangeWitness([data.number,...data.factors,data.factorCount],range)).toBe(true);
                    for(const isSolutionView of [false,true]){
                        const text=renderToStaticMarkup(createElement(NumbersFactorsMultiplesView,{
                            expectedKinds:[data.kind],payload:{problem:{type:'arithmetic',data,labels:[]},isSolutionView,seed:0}as never
                        })).replace(/<[^>]*>/g,' ');
                        expect(text).toContain(`Is ${number} prime or composite?`);
                        expect(text.includes('All positive factors')).toBe(isSolutionView);
                        expect(text.includes('Unique factor pairs')).toBe(isSolutionView);
                        if(!isSolutionView)expect(text).toContain('Evidence:');
                        rendered++;
                    }
                }
            }
            expect(rendered).toBe(196);
        }finally{draw.mockRestore();}
    });
});

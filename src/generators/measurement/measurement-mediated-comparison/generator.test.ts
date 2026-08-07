import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MediatedLengthComparisonProblem} from '../../../types/problems.ts';
import {MeasurementMediatedComparisonGenerator} from './generator.ts';

const expectedAnswer = (data: MediatedLengthComparisonProblem): 'A' | 'C' =>
    data.premises[0].relation === data.askedRelation ? 'A' : 'C';

describe('MeasurementMediatedComparisonGenerator', () => {
    const generator = new MeasurementMediatedComparisonGenerator();

    it('strictly validates relation configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('rejects unsupported comparison relations', () => {
        expect(generator.generate({relation: Scope.Equal} as any)).toBeNull();
    });

    it('creates compatible A-B and B-C premises without direct A-C evidence', () => {
        for (const relation of [Scope.Greater, Scope.Less] as const) {
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const stub = generator.generate({relation});
                expect(stub).not.toBeNull();
                const data = stub!.data as MediatedLengthComparisonProblem;

                expect(data.objects).toEqual([{id: 'A'}, {id: 'B'}, {id: 'C'}]);
                expect(data.intermediary).toBe('B');
                expect(data.premises).toEqual([
                    {subject: 'A', relation: data.premises[0].relation, reference: 'B'},
                    {subject: 'B', relation: data.premises[0].relation, reference: 'C'}
                ]);
                expect(data.askedRelation).toBe(relation === Scope.Greater ? 'longer' : 'shorter');
                expect(data.answer).toBe(expectedAnswer(data));
                expect(data.premises).not.toContainEqual(
                    expect.objectContaining({subject: 'A', reference: 'C'})
                );
            }
        }
    });

    it('varies which endpoint is longer', () => {
        const premiseRelations = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({relation: Scope.Greater});
            premiseRelations.add(stub!.data.premises[0].relation);
        }
        expect(premiseRelations).toEqual(new Set(['longer', 'shorter']));
    });
});

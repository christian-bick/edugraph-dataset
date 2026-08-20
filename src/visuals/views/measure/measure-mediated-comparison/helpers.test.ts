import {describe, expect, it} from 'vitest';
import {MediatedLengthComparisonProblem} from '../../../../types/problems.ts';
import {
    deriveMediatedAnswer,
    ribbonWidthsForChain,
    validateMediatedComparisonProblem
} from './helpers.ts';

function problem(
    chainRelation: 'longer' | 'shorter',
    askedRelation: 'longer' | 'shorter'
): MediatedLengthComparisonProblem {
    return {
        objects: [{id: 'A'}, {id: 'B'}, {id: 'C'}],
        intermediary: 'B',
        premises: [
            {subject: 'A', relation: chainRelation, reference: 'B'},
            {subject: 'B', relation: chainRelation, reference: 'C'}
        ],
        askedRelation,
        answer: deriveMediatedAnswer(chainRelation, askedRelation)
    };
}

describe('measure-mediated-comparison helpers', () => {
    it.each([
        ['longer', ['A', 'B', 'C']],
        ['shorter', ['C', 'B', 'A']]
    ] as const)('maps a %s chain to ordered ribbon lengths with one stable intermediary', (relation, order) => {
        const widths = ribbonWidthsForChain(relation);

        expect(widths[order[0]]).toBeGreaterThan(widths[order[1]]);
        expect(widths[order[1]]).toBeGreaterThan(widths[order[2]]);
        expect(widths.B).toBe(124);
    });

    it.each([
        ['longer', 'longer', 'A'],
        ['longer', 'shorter', 'C'],
        ['shorter', 'longer', 'C'],
        ['shorter', 'shorter', 'A']
    ] as const)('derives %s from a %s chain as endpoint %s', (chain, asked, expected) => {
        expect(deriveMediatedAnswer(chain, asked)).toBe(expected);
        expect(() => validateMediatedComparisonProblem(problem(chain, asked))).not.toThrow();
    });

    it.each([
        {...problem('longer', 'longer'), intermediary: 'A'},
        {...problem('longer', 'longer'), objects: [{id: 'A'}, {id: 'C'}, {id: 'B'}]},
        {
            ...problem('longer', 'longer'),
            premises: [
                {subject: 'A', relation: 'longer', reference: 'B'},
                {subject: 'C', relation: 'longer', reference: 'B'}
            ]
        },
        {
            ...problem('longer', 'longer'),
            premises: [
                {subject: 'A', relation: 'longer', reference: 'B'},
                {subject: 'B', relation: 'shorter', reference: 'C'}
            ]
        },
        {
            ...problem('longer', 'longer'),
            premises: [
                {subject: 'A', relation: 'longer', reference: 'B'},
                {subject: 'B', relation: 'longer', reference: 'C'},
                {subject: 'A', relation: 'longer', reference: 'C'}
            ]
        },
        {...problem('longer', 'longer'), answer: 'C'}
    ])('rejects an invalid mediated relation: %o', invalidProblem => {
        expect(() => validateMediatedComparisonProblem(
            invalidProblem as MediatedLengthComparisonProblem
        )).toThrow(/A-to-B-to-C relation chain/);
    });
});

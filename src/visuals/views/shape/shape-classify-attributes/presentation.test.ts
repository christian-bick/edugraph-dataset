import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../../lib/random.ts';
import {ShapeClassifyAttributesGenerator} from '../../../../generators/shape/shape-classify-attributes/generator.ts';
import {
    definingOptions,
    grade4Presentation,
    RECTANGULAR_PRISM_NET_FACES,
    subsumptionOptions,
    withOptionIds
} from './presentation.ts';

const generator = new ShapeClassifyAttributesGenerator();

describe('shape classification presentation', () => {
    it('renders a rectangular-prism net with six visibly non-square faces', () => {
        expect(RECTANGULAR_PRISM_NET_FACES).toHaveLength(6);
        expect(RECTANGULAR_PRISM_NET_FACES.every(face => face.width !== face.height)).toBe(true);
    });

    it('assigns deterministic view-owned option order and IDs', () => {
        const values = [{value: 1}, {value: 2}, {value: 3}, {value: 4}];
        expect(withOptionIds(values, 17)).toEqual(withOptionIds(values, 17));
        expect(withOptionIds(values, 17).map(option => option.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(withOptionIds(values, 17).map(option => option.value))
            .not.toEqual(withOptionIds(values, 18).map(option => option.value));
    });

    it('derives defining options from a typed fact', () => {
        setSeed(42);
        const data = generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [],
            criteria: []
        })!.data;
        if (data.task !== undefined) throw new Error('Expected a defining-attribute problem.');

        const options = definingOptions(data, 42);
        expect(options).toHaveLength(4);
        expect(options.filter(option => option.kind === 'defining')).toHaveLength(1);
        expect(options.map(option => option.id)).toEqual(['A', 'B', 'C', 'D']);
    });

    it('derives category membership and language from canonical shape data', () => {
        const data = generator.generate({
            subsumption: true,
            shapes: [Area.Square],
            attributeCounts: [],
            criteria: []
        })!.data;
        if (data.task !== 'classify-quadrilateral-subcategory') {
            throw new Error('Expected a quadrilateral subsumption problem.');
        }

        const options = subsumptionOptions(data, 9);
        expect(options.find(option => option.satisfies)?.category).toBe('quadrilateral');
    });

    it('derives Grade 4 prompts, answers, and option identities from geometry truth', () => {
        const data = generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [],
            criteria: [Area.ParallelismRelation]
        })!.data;
        if (data.task !== 'classify-line-relation') throw new Error('Expected line classification.');

        const presentation = grade4Presentation(data, 11);
        expect(presentation.prompt).toContain('parallel sides');
        expect(presentation.answerIds).toHaveLength(2);
        expect(presentation.options.filter(option => option.satisfies).map(option => option.id))
            .toEqual(presentation.answerIds);
        expect(presentation.answerStatement).toContain(presentation.answerIds.join(' and '));
    });
});

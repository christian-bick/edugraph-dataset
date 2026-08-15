import {beforeEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as shapeHelpers from '../helpers.ts';
import {
    getDefiningAttributeStatements,
    getShapeDefinition,
    NON_DEFINING_ATTRIBUTE_STATEMENTS
} from '../helpers.ts';
import {ShapeClassifyAttributesGenerator} from './generator.ts';
import {Area, Scope} from 'edugraph-ts';

const legacyConfig = {
    subsumption: false,
    shapes: [],
    attributeCounts: []
};

describe('ShapeClassifyAttributesGenerator', () => {
    let generator: ShapeClassifyAttributesGenerator;

    beforeEach(() => {
        generator = new ShapeClassifyAttributesGenerator();
        setSeed(42);
    });

    it('has the shape problem type and accepts its default config', () => {
        expect(generator.type).toBe('shape');
        expect(generator.generate(legacyConfig)).not.toBeNull();
    });

    it('rejects a null config before generating', () => {
        expect(() => generator.generate(null as never)).toThrow(
            '[Generator: shape-classify-attributes] Validation Error'
        );
    });

    it('returns null when a selected ontology label has no shape mapping', () => {
        const shapeNameSpy = vi.spyOn(shapeHelpers, 'shapeNameFromLabel').mockReturnValueOnce(null);

        expect(generator.generate(legacyConfig)).toBeNull();
        expect(shapeNameSpy).toHaveBeenCalledOnce();
    });

    it('generates exactly one defining option and three non-defining options', () => {
        const stub = generator.generate(legacyConfig)!;
        expect('shape' in stub.data).toBe(true);
        if (stub.data.task !== undefined) return;
        const {shape, definition, options, answer} = stub.data;
        const definingOptions = options.filter(option => option.kind === 'defining');
        const nonDefiningOptions = options.filter(option => option.kind === 'non-defining');

        expect(options).toHaveLength(4);
        expect(options.map(option => option.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(definingOptions).toHaveLength(1);
        expect(nonDefiningOptions).toHaveLength(3);
        expect(nonDefiningOptions.map(option => option.text).sort()).toEqual(
            [...NON_DEFINING_ATTRIBUTE_STATEMENTS].sort()
        );
        expect(getDefiningAttributeStatements(shape)).toContain(definingOptions[0].text);
        expect(definition).toEqual(getShapeDefinition(shape));
        expect(answer).toBe(definingOptions[0].id);
    });

    it('varies shapes, defining statements and answer positions across seeds', () => {
        const shapes = new Set<string>();
        const definingStatements = new Set<string>();
        const answerPositions = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const stub = generator.generate(legacyConfig)!;
            if (stub.data.task !== undefined) throw new Error('Expected a legacy classification problem.');
            const definingOption = stub.data.options.find(option => option.kind === 'defining')!;

            shapes.add(stub.data.shape);
            definingStatements.add(definingOption.text);
            answerPositions.add(stub.data.answer);
        }

        expect(shapes.size).toBe(5);
        expect(definingStatements.size).toBeGreaterThanOrEqual(6);
        expect(answerPositions.size).toBe(4);
    });

    it('is deterministic for the same seed', () => {
        setSeed('classification-example');
        const first = generator.generate(legacyConfig);
        setSeed('classification-example');
        const second = generator.generate(legacyConfig);

        expect(second).toEqual(first);
    });

    it('classifies polygons by a visibly countable vertex total', () => {
        const stub = generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.VertexCount]
        })!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.data.options).toHaveLength(4);
        expect(stub.data.options.filter(option => option.satisfies)).toHaveLength(1);
        expect(stub.data.options.find(option => option.id === stub.data.answer)?.count)
            .toBe(stub.data.requiredCount);
    });

    it('honors a specifically requested polygon in vertex-count mode', () => {
        const stub = generator.generate({
            subsumption: false,
            shapes: [Area.Pentagon],
            attributeCounts: [Scope.VertexCount]
        })!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.requiredCount).toBe(5);
        expect(stub.tags).toEqual([Area.Pentagon]);
    });

    it('classifies a cube from inspectable equal-face alternatives', () => {
        const stub = generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.FaceCount, Scope.Equal]
        })!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data).toMatchObject({attribute: 'equal-faces', requiredCount: 6});
        expect(stub.data.options.find(option => option.id === stub.data.answer)?.shape).toBe('cube');
    });

    it.each([
        [Area.Rhombus, 'rhombus'],
        [Area.Rectangle, 'rectangle'],
        [Area.Square, 'square']
    ] as const)('classifies %s as a quadrilateral from visible attributes', (label, shape) => {
        const stub = generator.generate({subsumption: true, shapes: [label], attributeCounts: []})!;

        expect(stub.data.task).toBe('classify-quadrilateral-subcategory');
        if (stub.data.task !== 'classify-quadrilateral-subcategory') return;
        expect(stub.data.shape).toBe(shape);
        expect(stub.data.attributes).toContain('4 straight sides');
        expect(stub.data.category).toBe('quadrilateral');
        expect(stub.data.options.find(option => option.id === stub.data.answer))
            .toMatchObject({category: 'quadrilateral', satisfies: true});
        expect(stub.tags).toEqual([label]);
    });

    it('rejects contradictory attribute-count configurations', () => {
        expect(() => generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.VertexCount, Scope.FaceCount, Scope.Equal]
        })).toThrow('Attribute-count labels must select either vertex count or equal face count.');
    });
});

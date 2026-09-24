import {Ability, Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {labelSetHash} from '../../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {ShapeClassifyAttributesGenerator} from './generator.ts';
import {ShapeClassifyAttributesGeneratorSchema, spec} from './spec.ts';

function generateWithPlannedLabels(generator: ShapeClassifyAttributesGenerator, labels: string[]) {
    const domains = normalizeSchemaChoices(generator.schema, labels, 'generator');
    if (domains.some(domain => domain.alternatives.length !== 1)) {
        throw new Error('Spec regression requires one complete attribute selection per field.');
    }
    const bindings = Object.fromEntries(domains.map(domain => [domain.field, domain.alternatives[0].labels]));
    const resolved = resolveSchemaChoices(generator.schema, labels, bindings);
    const stub = generator.generate(resolved.config);
    return stub ? {...stub, labels: resolved.resolvedLabels} : null;
}

describe('ShapeClassifyAttributesGenerator spec integration', () => {
    let generator: ShapeClassifyAttributesGenerator;

    beforeEach(() => {
        generator = new ShapeClassifyAttributesGenerator();
        setSeed(42);
    });

    it('declares the shape-recognition and shape-attribute capabilities', () => {
        expect(spec.generalLabels).toEqual([Area.ShapeClassification]);
        expect(ShapeClassifyAttributesGeneratorSchema.attributeCounts[0]).toContain(Scope.ShapeAttributes);
    });

    it('resolves the broad shape-attributes context', () => {
        const stub = generateWithPlannedLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.labels).toContain(Scope.ShapeAttributes);
    });

    it('generates the quadrilateral subsumption target', () => {
        const stub = generateWithPlannedLabels(generator, [
            Area.ShapeSubsumption,
            Scope.ShapeAttributes,
            Ability.ConceptClassification,
            Ability.VisualRecognition,
            Area.Rhombus
        ]);

        expect(stub?.data.task).toBe('classify-quadrilateral-subcategory');
    });

    it('does not turn incidental runtime shape selection into a schema capability', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithPlannedLabels(generator, [
                Area.ShapeClassification,
                Scope.ShapeAttributes
            ])!;
            if (!('shape' in stub.data)) throw new Error('Expected a legacy classification problem.');
            expect(stub.labels).toEqual([Scope.ShapeAttributes]);
        }
    });

    it.each([
        [[], [Scope.ShapeAttributes], []],
        [[Scope.ShapeAttributes], [Scope.ShapeAttributes], []],
        [[Scope.VertexCount], [Scope.VertexCount], [Scope.VertexCount]],
        [[Scope.ShapeAttributes, Scope.VertexCount], [Scope.VertexCount], [Scope.VertexCount]],
        [[Scope.AngleCount], [Scope.AngleCount], [Scope.AngleCount]],
        [[Scope.ShapeAttributes, Scope.AngleCount], [Scope.AngleCount], [Scope.AngleCount]],
        [[Scope.FaceCount, Scope.Equal], [Scope.Equal, Scope.FaceCount], [Scope.FaceCount, Scope.Equal]],
        [[Scope.ShapeAttributes, Scope.FaceCount, Scope.Equal], [Scope.Equal, Scope.FaceCount], [Scope.FaceCount, Scope.Equal]]
    ])('resolves the complete attribute mode for %j without changing count semantics', (requested, emitted, config) => {
        const schema = {attributeCounts: ShapeClassifyAttributesGeneratorSchema.attributeCounts};
        const [domain] = normalizeSchemaChoices(schema, requested, 'generator');
        expect(domain.alternatives.map(alternative => alternative.labels)).toEqual([emitted]);
        const planned = resolveSchemaChoices(schema, requested, {attributeCounts: emitted});
        expect(planned.config.attributeCounts).toEqual(config);
        expect(planned.resolvedLabels).toEqual(emitted);
    });

    it('rejects incompatible count modes from metadata alone', () => {
        const schema = {attributeCounts: ShapeClassifyAttributesGeneratorSchema.attributeCounts};
        const [domain] = normalizeSchemaChoices(schema,
            [Scope.ShapeAttributes, Scope.VertexCount, Scope.AngleCount], 'generator');
        expect(domain.alternatives).toEqual([]);
    });

    it('resolves the vertex-count classification path', () => {
        const stub = generateWithPlannedLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.VertexCount
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.labels).toContain(Scope.VertexCount);
    });

    it('resolves the angle-count classification path', () => {
        const stub = generateWithPlannedLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.AngleCount,
            Ability.ConceptClassification
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.attribute).toBe('angles');
        expect(stub.labels).toContain(Scope.AngleCount);
        expect(stub.data.options.filter(option => option.satisfies)).toHaveLength(1);
    });

    it('resolves the equal-face-count classification path', () => {
        const stub = generateWithPlannedLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.FaceCount,
            Scope.Equal
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data).toMatchObject({attribute: 'equal-faces', requiredCount: 6});
        expect(stub.labels).toEqual(expect.arrayContaining([Scope.FaceCount, Scope.Equal]));
        expect(stub.labels).not.toContain(Area.Cube);
    });

    it.each([
        [Area.ParallelismRelation, 'classify-line-relation', 'de328e3a'],
        [Area.PerpendicularityRelation, 'classify-line-relation', 'f9f6aed4'],
        [Area.RightAngle, 'classify-angle-size', 'e71f1a71'],
        [Area.AcuteAngle, 'classify-angle-size', '01ffd3a5'],
        [Area.ObtuseAngle, 'classify-angle-size', '9764bcf9']
    ] as const)('resolves the corrected Grade 4 %s classification target', (
        criterion,
        task,
        expectedHash
    ) => {
        const labels = [
            Area.ShapeClassification,
            criterion,
            Scope.ShapeAttributes,
            Ability.ConceptClassification
        ];
        expect(labelSetHash(labels)).toBe(expectedHash);
        const stub = generateWithPlannedLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
        expect(stub!.labels).toContain(criterion);
    });

    it('resolves the corrected Grade 4 right-triangle category target', () => {
        const labels = [
            Area.ShapeSubsumption,
            Area.RightTriangle,
            Area.RightAngle,
            Scope.ShapeAttributes,
            Ability.ConceptClassification,
            Ability.VisualRecognition
        ];
        expect(labelSetHash(labels)).toBe('7352de55');
        const stub = generateWithPlannedLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('classify-right-triangle-category');
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Area.ShapeSubsumption,
            Area.RightTriangle,
            Area.RightAngle
        ]));
    });

    it.each([
        [Area.ParallelismRelation, 'classify-line-relation'],
        [Area.PerpendicularityRelation, 'classify-line-relation'],
        [Area.RightAngle, 'classify-angle-size'],
        [Area.AcuteAngle, 'classify-angle-size'],
        [Area.ObtuseAngle, 'classify-angle-size']
    ] as const)('generates a truthful classification payload for overlapping 4.G.A.1 %s recognition', (
        criterion,
        task
    ) => {
        const stub = generateWithPlannedLabels(generator, [criterion, Ability.VisualRecognition]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
    });
});

import {describe, expect, it} from 'vitest';
import {fileURLToPath} from 'node:url';
import {buildCompatibleModulePairIndex, matchesTarget, matchTargets} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';

const expectedViews = new Map([
    ['measurement-unit-equivalences', [
        'measure-conversion-derivation', 'measure-conversion-to-smaller', 'measure-conversion-table'
    ]],
    ['measurement-conversion-values', ['measure-conversion-bidirectional']],
    ['measurement-unit-scale', ['measure-conversion-derivation', 'measure-unit-scale-relation']]
]);
const viewPaths = new Map([
    ['measure-conversion-derivation', 'measurement/measure-conversion-derivation'],
    ['measure-conversion-to-smaller', 'measurement/measure-conversion-to-smaller'],
    ['measure-conversion-bidirectional', 'measurement/measure-conversion-bidirectional'],
    ['measure-conversion-table', 'measure/measure-conversion-table'],
    ['measure-unit-scale-relation', 'measure/measure-unit-scale-relation']
]);

const loadConversionCatalog = () => Promise.all([
    loadGeneratorModelCatalog(undefined, undefined, new Map(
        [...expectedViews.keys()].map(id => [id, fileURLToPath(new URL(`./${id}/spec.ts`, import.meta.url))])
    )),
    loadViewModelCatalog(undefined, undefined, new Map(
        [...viewPaths].map(([id, path]) => [id, fileURLToPath(new URL(`../../visuals/views/${path}/spec.ts`, import.meta.url))])
    ))
]);

describe('unit-relation payload contracts', () => {
    it('routes concrete payload families and shared union consumers without label guards', async () => {
        // Load only the entry points whose shared contract this integration test protects.
        const [generatorCatalog, viewCatalog] = await loadConversionCatalog();
        const viewIds = new Set([...expectedViews.values()].flat());
        const generators = generatorCatalog.filter(generator => expectedViews.has(generator.generatorId));
        const views = viewCatalog.filter(view => viewIds.has(view.viewId));
        expect(generators).toHaveLength(3);
        expect(views).toHaveLength(5);

        // No ontology precondition is needed to distinguish these payload families.
        for (const view of views) {
            expect(view.spec.compatibility ?? []).toEqual([]);
        }
        const index = buildCompatibleModulePairIndex(generators, views);
        for (const generator of generators) {
            const accepted = expectedViews.get(generator.generatorId)!;
            expect(index.orderedPairs
                .filter(pair => pair.generator.generatorId === generator.generatorId)
                .map(pair => pair.view.viewId).sort()).toEqual([...accepted].sort());

            for (const view of views.filter(view => !accepted.includes(view.viewId))) {
                // Even complete positive label coverage cannot admit an incompatible payload.
                expect(matchesTarget(view.generalLabels, generator, view))
                    .toEqual({matched: false, reason: 'incompatible-type'});
            }
        }
    });

    it('retains every production conversion target and validates all admitted annotations', async () => {
        const [[generators, views], targets] = await Promise.all([
            loadConversionCatalog(), loadMatchingTargets('ccss')
        ]);
        const conversionGenerators = generators.filter(generator => generator.generatorId !== 'measurement-unit-scale');
        const families = [
            '4.MD.A.1-relative-unit-sizes',
            '4.MD.A.1-convert-larger-to-smaller',
            '4.MD.A.1-two-column-tables',
            '5.MD.A.1-convert-within-system'
        ];
        const conversionTargets = targets.filter(target => families.some(family => target.id.startsWith(`${family}~`)));
        expect(conversionTargets).toHaveLength(35);
        const {tuples} = matchTargets(conversionTargets, conversionGenerators, views);
        expect(new Set(tuples.map(tuple => tuple.target.id)))
            .toEqual(new Set(conversionTargets.map(target => target.id)));
        expect(tuples).toHaveLength(49);

        const evaluator = createLabelDependencyEvaluator();
        let selectionCount = 0;
        for (const tuple of tuples) {
            const enumeration = enumerateDependencyAuditSelections(tuple.plan);
            expect(enumeration.status).toBe('complete');
            selectionCount += enumeration.selections.length;
            for (const selection of enumeration.selections) {
                const evaluation = evaluator.evaluate(selection.labels);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.filter(assessment =>
                    assessment.status === 'missing' && assessment.facet !== 'range')).toEqual([]);
                if (tuple.generatorId === 'measurement-conversion-values') {
                    expect(evaluation.assessments.filter(assessment => assessment.status === 'missing')).toEqual([]);
                }
            }
        }
        expect(selectionCount).toBe(80);
    }, 30_000);
});

import {describe, expect, it} from 'vitest';
import {generatorOutputContractChanged, planDevelopmentValidation} from './development-plan.ts';

const specs = ['ccss', 'fixture'];

describe('development validation plan', () => {
    it.each(['docs/plan/nested/review.md', '.agents/skills/review/references/example.md'])(
        'schedules documentation validation for %s', file => {
            const plan = planDevelopmentValidation([file], specs);
            expect(plan.checks).toEqual(['docs']);
            expect(plan.reasons.docs).toEqual([file]);
        }
    );

    it.each(['src/lib/docs-discovery.ts', 'src/lib/docs-validator.ts', 'src/scripts/validate-docs.ts'])(
        'runs the documentation gate when its implementation changes: %s', file => {
            const plan = planDevelopmentValidation([file], specs);
            expect(plan.checks).toEqual(['types', 'related-tests', 'docs']);
            expect(plan.specs).toEqual([]);
        }
    );

    it('compares declared output contracts and conservatively routes unknown declarations', () => {
        const previous = 'class Demo implements ProblemGenerator<FirstProblem> { value = 1; }';
        expect(generatorOutputContractChanged(previous,
            'class Demo implements ProblemGenerator<FirstProblem> { value = 2; }')).toBe(false);
        expect(generatorOutputContractChanged(previous,
            'class Demo implements ProblemGenerator<SecondProblem> { value = 1; }')).toBe(true);
        expect(generatorOutputContractChanged(previous, 'class Demo { value = 1; }')).toBe(true);
        expect(generatorOutputContractChanged(null, previous)).toBe(true);
    });
    it('maps one view-spec edit to all matching contracts but not documentation', () => {
        const plan = planDevelopmentValidation([
            'src/visuals/views/arithmetic/active-vocabulary/spec.ts'
        ], specs, ['ccss']);

        expect(plan.checks).toEqual([
            'types',
            'related-tests',
            'generator-view-specs',
            'labels'
        ]);
        expect(plan.specs).toEqual(['ccss']);
        expect(plan.reasons.docs).toBeUndefined();
    });

    it.each(specs)('keeps a %s standard-spec edit scoped to that module', spec => {
        const plan = planDevelopmentValidation([`src/spec/${spec}/grade-4.ts`], specs, ['ccss']);
        expect(plan.checks).toEqual(['types', 'related-tests']);
        expect(plan.specs).toEqual([spec]);
    });

    it('includes an explicitly changed isolated module alongside production checks', () => {
        const plan = planDevelopmentValidation(['package-lock.json', 'src/spec/fixture/targets.ts'], specs, ['ccss']);
        expect(plan.specs).toEqual(['ccss', 'fixture']);
    });

    it('does not expand a matching-library test edit into production matching', () => {
        const plan = planDevelopmentValidation(['src/lib/generation-cache.test.ts'], specs, ['ccss']);
        expect(plan.checks).toEqual(['types', 'related-tests']);
        expect(plan.specs).toEqual([]);
    });

    it('runs fresh scoped coverage for a changed generator implementation', () => {
        const plan = planDevelopmentValidation(['src/generators/counting/counting-basic/generator.ts'], specs, ['ccss']);
        expect(plan.checks).toEqual(['types', 'related-tests', 'implementation-contracts', 'labels', 'generator-coverage']);
        expect(plan.specs).toEqual([]);
    });

    it('routes a changed or uncertain generator output contract through pair and active-target checks', () => {
        const file = 'src/generators/counting/counting-basic/generator.ts';
        const plan = planDevelopmentValidation([file], specs, ['ccss'], [], [file]);
        expect(plan.checks).toEqual(['types', 'related-tests', 'implementation-contracts', 'generator-view-specs', 'labels', 'generator-coverage']);
        expect(plan.specs).toEqual(['ccss']);
    });

    it('treats a removed implementation as a capability-wide structural change', () => {
        const file = 'src/generators/counting/counting-basic/generator.ts';
        const plan = planDevelopmentValidation([file], specs, ['ccss'], [file]);
        expect(plan.checks).toEqual(['types', 'related-tests', 'implementation-contracts', 'generator-view-specs', 'labels']);
        expect(plan.specs).toEqual(['ccss']);
    });

    it('classifies work with a constant number of steps per changed file', () => {
        const files = Array.from({length: 100}, (_, index) => `docs/plan/change-${index}.md`);
        const plan = planDevelopmentValidation(files, specs);
        expect(plan.work).toEqual({files_classified: 100, classification_steps: 600});
        expect(plan.checks).toEqual(['docs']);
    });

    it('routes ontology dependency changes through matching and production-spec checks', () => {
        const plan = planDevelopmentValidation(
            ['package-lock.json'],
            specs,
            ['ccss']
        );
        expect(plan.checks).toEqual(['types', 'generator-view-specs', 'labels']);
        expect(plan.specs).toEqual(['ccss']);
    });

    it.each(['src/lib/spec-ownership.ts', 'src/lib/model-catalog.ts'])(
        'keeps %s in affected module and standards gates', file => {
            const plan = planDevelopmentValidation([file], specs, ['ccss']);
            expect(plan.checks).toEqual(['types', 'related-tests', 'generator-view-specs', 'labels']);
            expect(plan.specs).toEqual(['ccss']);
        });

    it.each(['src/scripts/validate-generator-view-specs.ts', 'src/scripts/generator-view-spec-validation.ts'])(
        'runs the public gate when %s changes', file => {
            const plan = planDevelopmentValidation([file], specs, ['ccss']);
            expect(plan.checks).toEqual(['types', 'related-tests', 'generator-view-specs']);
        });

    it('does not treat the explorer-only canonical tree as a dataset input', () => {
        const plan = planDevelopmentValidation(
            ['public/coverage/ccss-tree.json'],
            specs,
            ['ccss']
        );
        expect(plan.checks).toEqual([]);
        expect(plan.specs).toEqual([]);
    });
});

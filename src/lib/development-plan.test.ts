import {describe, expect, it} from 'vitest';
import {planDevelopmentValidation} from './development-plan.ts';

const specs = ['ccss', 'test'];

describe('development validation plan', () => {
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

    it('keeps a standard-spec edit scoped to that module', () => {
        const plan = planDevelopmentValidation(['src/spec/ccss/grade-4.ts'], specs);
        expect(plan.checks).toEqual(['types', 'related-tests']);
        expect(plan.specs).toEqual(['ccss']);
    });

    it('does not expand a matching-library test edit into production matching', () => {
        const plan = planDevelopmentValidation(['src/lib/generation-cache.test.ts'], specs, ['ccss']);
        expect(plan.checks).toEqual(['types', 'related-tests']);
        expect(plan.specs).toEqual([]);
    });

    it('runs fresh scoped coverage for a changed generator implementation', () => {
        const plan = planDevelopmentValidation(['src/generators/counting/counting-basic/generator.ts'], specs, ['ccss']);
        expect(plan.checks).toEqual(['types', 'related-tests', 'labels', 'generator-coverage']);
        expect(plan.specs).toEqual([]);
    });

    it('treats a removed implementation as a capability-wide structural change', () => {
        const file = 'src/generators/counting/counting-basic/generator.ts';
        const plan = planDevelopmentValidation([file], specs, ['ccss'], [file]);
        expect(plan.checks).toEqual(['types', 'related-tests', 'generator-view-specs', 'labels']);
        expect(plan.specs).toEqual(['ccss']);
    });

    it('classifies work with a constant number of steps per changed file', () => {
        const files = Array.from({length: 100}, (_, index) => `docs/plan/change-${index}.md`);
        const plan = planDevelopmentValidation(files, specs);
        expect(plan.work).toEqual({files_classified: 100, classification_steps: 600});
        expect(plan.checks).toEqual(['docs']);
    });
});

import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {StatisticalInvestigation, StatisticalResponse} from '../../../types/problems.ts';
import {isStatisticalQuestionsProblem} from '../statistical-question-helpers.ts';
import {StatisticalQuestionsGenerator} from './generator.ts';
import type {StatisticalQuestionsGeneratorConfig} from './spec.ts';

const responseKey = (response: StatisticalResponse) => response.kind === 'categorical' ? response.value
    : `${response.value.numerator}/${response.value.denominator}`;

function independentlyVerify(investigation: StatisticalInvestigation) {
    const plan = investigation.observationPlan;
    expect(plan.observationCount).toBe(plan.units.length * plan.occasions.length);
    const pairs = plan.indices.map(index => `${index.unitId}#${index.occasionId}`);
    expect(new Set(pairs)).toEqual(new Set(plan.units.flatMap(unit => plan.occasions.map(occasion => `${unit.id}#${occasion.id}`))));
    const attribute = investigation.attribute;
    const expected = attribute.kind === 'upper-face-number' ? ['1/1', '2/1', '3/1', '4/1', '5/1', '6/1']
        : attribute.kind === 'color-choice' ? attribute.alternatives
            : [`${attribute.kind === 'side-count' ? attribute.shape === 'triangle' ? 3 : 4 : attribute.pencilsPerBox}/1`];
    const domain = investigation.responseDomain;
    expect(new Set(domain.kind === 'numeric' ? domain.values.map(value => `${value.numerator}/${value.denominator}`) : domain.values)).toEqual(new Set(expected));
    const proof = investigation.variability;
    if (proof.kind === 'anticipated-variation') {
        expect(plan.observationCount).toBeGreaterThan(1);
        expect(['upper-face-number', 'color-choice']).toContain(attribute.kind);
        expect(proof.possibilities[0].observationId).not.toBe(proof.possibilities[1].observationId);
        expect(responseKey(proof.possibilities[0].response)).not.toBe(responseKey(proof.possibilities[1].response));
        for (const possible of proof.possibilities) {
            expect(plan.indices.some(index => index.id === possible.observationId)).toBe(true);
            expect(expected).toContain(responseKey(possible.response));
        }
    } else if (proof.kind === 'single-observation') {
        expect(plan.observationCount).toBe(1);
        expect(proof.observationId).toBe(plan.indices[0].id);
    } else {
        expect(expected).toHaveLength(1);
        expect(responseKey(proof.response)).toBe(expected[0]);
    }
}

describe('StatisticalQuestionsGenerator', () => {
    const generator = new StatisticalQuestionsGenerator(), config = {anticipatedVariation: 'present'} as const;

    it('always supplies the full variable/single/constant contrast with independently correct anticipated domains', () => {
        const attributes = new Set<string>(), collectionForms = new Set<string>();
        for (let seed = 0; seed < 480; seed++) {
            setSeed(seed);
            const problem = generator.generate(config);
            expect(isStatisticalQuestionsProblem(problem.data)).toBe(true);
            expect(problem.data.investigations).toHaveLength(3);
            expect(problem.data.investigations.map(row => row.variability.kind)).toEqual(['anticipated-variation', 'single-observation', 'constant-response']);
            problem.data.investigations.forEach(independentlyVerify);
            for (const row of problem.data.investigations) attributes.add(row.attribute.kind === 'side-count' ? row.attribute.shape : row.attribute.kind);
            const variable = problem.data.investigations[0];
            collectionForms.add(variable.observationPlan.units.length === 1 ? 'repeated-occasion' : 'multiple-units');
            // Ready learner prompts, classification prose and realized data are absent.
            expect(Object.keys(problem)).toEqual(['data']);
            expect(Object.keys(problem.data)).toEqual(['kind', 'investigations']);
            for (const row of problem.data.investigations) expect(Object.keys(row).sort()).toEqual(['attribute', 'id', 'observationPlan', 'responseDomain', 'variability']);
        }
        expect(attributes).toEqual(new Set(['upper-face-number', 'color-choice', 'triangle', 'rectangle', 'sealed-pencil-count']));
        expect(collectionForms).toEqual(new Set(['repeated-occasion', 'multiple-units']));
    });

    it('generates no anticipated variation in the absent branch while preserving uncertain single responses', () => {
        for (let seed = 0; seed < 480; seed++) {
            setSeed(seed);
            const problem = generator.generate({anticipatedVariation: 'absent'});
            expect(isStatisticalQuestionsProblem(problem.data)).toBe(true);
            expect(problem.data.investigations).toHaveLength(2);
            expect(problem.data.investigations.map(row => row.variability.kind)).toEqual(['single-observation', 'constant-response']);
            problem.data.investigations.forEach(independentlyVerify);
            const single = problem.data.investigations[0];
            expect(single.responseDomain.values.length).toBeGreaterThan(1);
            expect(single.observationPlan.observationCount).toBe(1);
            expect(problem.data.investigations.some(row => row.variability.kind === 'anticipated-variation')).toBe(false);
            expect(Object.keys(problem.data)).toEqual(['kind', 'investigations']);
        }
    });

    it('replays full data and continuation and uses one source-instance random draw', () => {
        setSeed(1761); const expectedSelection = random(), expectedState = getRandomState(), next = random();
        expect(expectedSelection).toBeGreaterThanOrEqual(0);
        for (const anticipatedVariation of ['present', 'absent'] as const) {
            setSeed(1761); const first = generator.generate({anticipatedVariation});
            expect(getRandomState()).toBe(expectedState); expect(random()).toBe(next);
            setSeed(1761); expect(generator.generate({anticipatedVariation})).toEqual(first); expect(random()).toBe(next);
        }
    });

    it('rejects missing and unsupported config before consuming randomness', () => {
        for (const invalid of [{}, {anticipatedVariation: undefined}, {anticipatedVariation: 'observed-spread'},
            {mathematicalRelation: 'anticipated-variability'}]) {
            setSeed(317); const state = getRandomState();
            expect(() => generator.generate(invalid as StatisticalQuestionsGeneratorConfig)).toThrow(GeneratorValidationError);
            expect(getRandomState()).toBe(state);
        }
    });
});

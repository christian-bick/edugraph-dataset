import {describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {
    CompatibilityContractError, CompatibilityLimitError, planCompatibility,
    rejectTargetLabels, requireTargetLabels, sampleGenerationPlan,
    validateCompatibilityRules, validateGenerationPlan, validateGenerationSelectionReceipt
} from './compatibility.ts';
import type {
    CompatibilityPlanningInput, CompatibilityRule, GenerationPlan, LabelChoiceDomain
} from '../types/compatibility.ts';
import {random, setSeed} from './random.ts';

const identity = {targetId: 'target', generatorId: 'generator', viewId: 'view'};
const domain = (field: string, owner: 'generator' | 'view' = 'generator'): LabelChoiceDomain => ({
    owner, field, alternatives: [{id: 'off', labels: []}, {id: 'on', labels: [field]}]
});
const input = (overrides: Partial<CompatibilityPlanningInput> = {}): CompatibilityPlanningInput => ({
    identity, targetLabels: [], generatorLabels: [], viewLabels: [], fields: [], ...overrides
});
const admitted = (overrides: Partial<CompatibilityPlanningInput> = {}): GenerationPlan => {
    const result = planCompatibility(input(overrides));
    expect(result.supported).toBe(true);
    if (!result.supported) throw new Error(JSON.stringify(result));
    return result.plan;
};
const exact = <TScope extends 'target' | 'generator' | 'view'>(scope: TScope, label: string) => ({scope, label});
const sameBits: CompatibilityRule = {
    id: 'same-bits', dependencies: [exact('generator', 'a'), exact('view', 'b')],
    predicate: labels => labels.exact('generator', 'a') === labels.exact('view', 'b')
};
const correlated = () => admitted({fields: [domain('a'), domain('b', 'view')], viewRules: [sameBits]});

/** A deliberately small exhaustive expander, independent of planner grouping. */
function assignments(plan: GenerationPlan): string[][] {
    let rows: string[][] = [[]];
    for (const field of plan.domains) rows = rows.flatMap(row => field.alternatives.map(alternative => [...row, alternative.id]));
    return rows.filter(row => plan.groups.every(group => {
        const selected = group.fields.map(field => row[plan.domains.findIndex(domain => domain.owner === field.owner && domain.field === field.field)]);
        return group.assignments.some(allowed => allowed.every((id, index) => id === selected[index]));
    }));
}

describe('metadata compatibility planning', () => {
    it('keeps unrelated choices factored without consuming seeded or global randomness', () => {
        const globalRandom = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Unexpected randomness'); });
        try {
            setSeed(193);
            const expected = random();
            setSeed(193);
            const result = planCompatibility(input({fields: Array.from({length: 80}, (_, index) => domain(`field-${index}`))}));
            expect(result.supported).toBe(true);
            if (!result.supported) return;
            expect(result.plan.groups).toEqual([]);
            expect(result.work.assignmentsVisited).toBe(0);
            expect(result.plan.domains).toHaveLength(80);
            expect(random()).toBe(expected);
            expect(globalRandom).not.toHaveBeenCalled();
        } finally {
            globalRandom.mockRestore();
        }
    });

    it('matches exhaustive truth tables for every predicate on three independent bits', () => {
        for (let truthTable = 0; truthTable < 256; truthTable++) {
            const result = planCompatibility(input({
                fields: [domain('a'), domain('b'), domain('c')],
                generatorRules: [{id: 'truth-table', predicate: labels => {
                    const index = Number(labels.exact('generator', 'a')) * 4
                        + Number(labels.exact('generator', 'b')) * 2 + Number(labels.exact('generator', 'c'));
                    return (truthTable & (1 << index)) !== 0;
                }}]
            }));
            const expected = Array.from({length: 8}, (_, index) => index).filter(index => truthTable & (1 << index));
            if (!expected.length) expect(result.supported).toBe(false);
            else {
                expect(result.supported).toBe(true);
                if (!result.supported) continue;
                expect(assignments(result.plan).map(row => Number(row[0] === 'on') * 4
                    + Number(row[1] === 'on') * 2 + Number(row[2] === 'on'))).toEqual(expected);
            }
        }
    });

    it('retains joint correlations and samples only accepted pairs', () => {
        const plan = correlated();
        expect(plan.groups).toHaveLength(1);
        expect(assignments(plan)).toEqual([['off', 'off'], ['on', 'on']]);
        expect(sampleGenerationPlan(plan, () => 0).choices.map(choice => choice.alternativeId)).toEqual(['off', 'off']);
        expect(sampleGenerationPlan(plan, () => 0.999).choices.map(choice => choice.alternativeId)).toEqual(['on', 'on']);
    });

    it('merges overlapping dependencies transitively without multiplying independent fields', () => {
        const result = planCompatibility(input({
            fields: [domain('a'), domain('b'), domain('c'), ...Array.from({length: 30}, (_, index) => domain(`independent-${index}`))],
            generatorRules: [
                {id: 'ab', dependencies: [exact('generator', 'a'), exact('generator', 'b')], predicate: labels => !labels.exact('generator', 'a') || labels.exact('generator', 'b')},
                {id: 'bc', dependencies: [exact('generator', 'b'), exact('generator', 'c')], predicate: labels => !labels.exact('generator', 'b') || labels.exact('generator', 'c')}
            ]
        }));
        expect(result.supported).toBe(true);
        expect(result.work.assignmentsVisited).toBe(8);
        expect(result.work.dependencyGroups).toBe(1);
        expect(result.work.predicateEvaluations).toBe(8);
        expect(result.work.projectionCacheHits).toBe(8);
    });

    it('scales indexing and context work linearly across independent constrained groups', () => {
        const build = (count: number) => planCompatibility(input({
            fields: Array.from({length: count}, (_, index) => domain(`field-${index}`)),
            generatorRules: Array.from({length: count}, (_, index) => ({
                id: `rule-${index}`, dependencies: [exact('generator', `field-${index}`)],
                predicate: (labels: Parameters<CompatibilityRule<'generator'>['predicate']>[0]) => labels.exact('generator', `field-${index}`)
            }))
        }));
        const small = build(40);
        const large = build(80);
        expect(small.supported).toBe(true);
        expect(large.supported).toBe(true);
        for (const counter of ['labelIndexVisits', 'dependencyFieldVisits', 'contextLabelVisits', 'assignmentsVisited', 'predicateEvaluations'] as const) {
            expect(small.work[counter]).toBeGreaterThan(0);
            expect(large.work[counter]).toBe(2 * small.work[counter]);
        }
        expect(large.work.dependencyGroups).toBe(80);
    });

    it('does not join fields when their alternatives always cover the target', () => {
        const result = planCompatibility(input({targetLabels: [Scope.NumericRange], fields: Array.from({length: 80}, (_, index) => ({
            owner: 'generator', field: `range-${index}`,
            alternatives: [{id: 'ten', labels: [Scope.NumbersSmaller10]}, {id: 'twenty', labels: [Scope.NumbersSmaller20]}]
        }))}));
        expect(result.supported).toBe(true);
        expect(result.work.dependencyGroups).toBe(0);
        expect(result.work.assignmentsVisited).toBe(0);
    });

    it('does not allow generator rules to observe selected view labels', () => {
        const bad = {id: 'foreign', predicate: (labels: any) => labels.has('view', 'x')};
        expect(() => planCompatibility(input({generatorRules: [bad]}))).toThrow(/forbidden scope/);
        expect(() => validateCompatibilityRules([{...bad, dependencies: [exact('view', 'x')]}], 'generator')).toThrow(/Invalid dependency scope/);
    });

    it('keeps fallback capabilities separate from original participation requirements', () => {
        const result = planCompatibility(input({
            fields: [{owner: 'generator', field: 'capability', alternatives: [{id: 'fallback', labels: [Scope.IntegerNumbers]}]}],
            viewRules: [requireTargetLabels('requires-original', [Scope.IntegerNumbers])]
        }));
        expect(result).toMatchObject({supported: false, reason: 'incompatible-rules', ruleIds: ['view:requires-original']});
    });

    it('preserves conjunctive required policies and specialization-aware rejected policies', () => {
        const inherited = {targetLabels: [Scope.NumbersSmaller10, Area.Addition], generatorLabels: [Scope.NumbersSmaller10, Area.Addition]};
        expect(planCompatibility(input({...inherited, viewRules: [requireTargetLabels('needs-both', [Scope.NumericRange, Area.Addition])]})).supported).toBe(true);
        expect(planCompatibility(input({...inherited, viewRules: [requireTargetLabels('needs-both', [Scope.NumericRange, Area.Subtraction])]})).supported).toBe(false);
        expect(planCompatibility(input({...inherited, viewRules: [rejectTargetLabels('no-range', [Scope.NumericRange])]})).supported).toBe(false);
        expect(planCompatibility(input({...inherited, viewRules: [rejectTargetLabels('no-subtraction', [Area.Subtraction])]})).supported).toBe(true);
    });

    it('distinguishes exact queries from capability queries', () => {
        const plan = admitted({
            generatorLabels: [Scope.NumbersSmaller10],
            generatorRules: [{id: 'query-modes', dependencies: [exact('generator', Scope.NumericRange)], predicate: labels =>
                labels.has('generator', Scope.NumericRange) && !labels.exact('generator', Scope.NumericRange)}]
        });
        expect(plan.domains).toEqual([]);
    });

    it('discovers dependency contributions from ontology descendants', () => {
        const plan = admitted({
            fields: [{owner: 'generator', field: 'range', alternatives: [{id: 'none', labels: []}, {id: 'small', labels: [Scope.NumbersSmaller10]}]}],
            generatorRules: [{id: 'bounded', dependencies: [exact('generator', Scope.NumericRange)], predicate: labels => labels.has('generator', Scope.NumericRange)}]
        });
        expect(plan.domains[0].alternatives.map(alternative => alternative.id)).toEqual(['small']);
    });

    it('checks selected target coverage instead of the union of possible capabilities', () => {
        const result = planCompatibility(input({targetLabels: [Area.Addition, Area.Subtraction], fields: [{
            owner: 'generator', field: 'operation', alternatives: [{id: 'add', labels: [Area.Addition]}, {id: 'subtract', labels: [Area.Subtraction]}]
        }]}));
        expect(result).toMatchObject({supported: false, reason: 'uncovered-target'});
    });

    it('preserves disjunctive coverage correlations when multiple fields can fulfill a request', () => {
        const plan = admitted({targetLabels: [Area.Addition], fields: [
            {owner: 'generator', field: 'a', alternatives: [{id: 'off', labels: []}, {id: 'on', labels: [Area.Addition]}]},
            {owner: 'view', field: 'b', alternatives: [{id: 'off', labels: []}, {id: 'on', labels: [Area.Addition]}]}
        ]});
        expect(assignments(plan)).toEqual([['off', 'on'], ['on', 'off'], ['on', 'on']]);
    });

    it('accepts invariant coverage and ignores non-ontology target identifiers', () => {
        expect(admitted({targetLabels: ['custom-target-tag', Area.Addition], generatorLabels: [Area.Addition]}).groups).toEqual([]);
        expect(planCompatibility(input({targetLabels: [Area.Addition]}))).toMatchObject({supported: false, reason: 'uncovered-target', labels: [Area.Addition]});
    });

    it('treats empty domains as unsupported and explicit empty selections as legal', () => {
        expect(planCompatibility(input({fields: [{owner: 'generator', field: 'none', alternatives: []}]}))).toMatchObject({supported: false, reason: 'empty-domain'});
        expect(admitted({fields: [{owner: 'generator', field: 'empty', alternatives: [{id: 'disabled', labels: []}]}]}).domains).toHaveLength(1);
    });

    it('respects preferences after compatibility filtering and retains incomparable tradeoffs', () => {
        const preferred = (field: string, high: 'off' | 'on'): LabelChoiceDomain => ({...domain(field), alternatives: domain(field).alternatives.map(alternative => ({...alternative, priority: alternative.id === high ? 2 : 0}))});
        const independent = admitted({fields: [preferred('a', 'on')]});
        expect(assignments(independent)).toEqual([['on']]);
        const constrained = admitted({fields: [preferred('a', 'on')], generatorRules: [{id: 'only-off', predicate: labels => !labels.exact('generator', 'a')}]});
        expect(assignments(constrained)).toEqual([['off']]);
        const tradeoff = admitted({fields: [preferred('a', 'on'), {...preferred('b', 'off'), owner: 'view'}], viewRules: [sameBits]});
        expect(assignments(tradeoff)).toEqual([['off', 'off'], ['on', 'on']]);
        const dominated = admitted({fields: [preferred('a', 'on'), {...preferred('b', 'on'), owner: 'view'}], viewRules: [sameBits]});
        expect(assignments(dominated)).toEqual([['on', 'on']]);
        const firstDominates = admitted({fields: [preferred('a', 'off'), {...preferred('b', 'off'), owner: 'view'}], viewRules: [sameBits]});
        expect(assignments(firstDominates)).toEqual([['off', 'off']]);
    });

    it('produces canonical content independent of declarations and source-input identities', () => {
        const first = admitted({inputHash: 'source-1', fields: [domain('b', 'view'), domain('a')], viewRules: [sameBits], generatorLabels: ['z', 'y']});
        const second = admitted({inputHash: 'source-2', fields: [domain('a'), {...domain('b', 'view'), alternatives: [...domain('b', 'view').alternatives].reverse()}], viewRules: [sameBits], generatorLabels: ['y', 'z', 'z']});
        expect(first.hash).toBe(second.hash);
        expect(first.inputHash).not.toBe(second.inputHash);
        expect(validateGenerationPlan(JSON.parse(JSON.stringify(first)))).toEqual(first);
    });
});

describe('compatibility declaration errors and bounds', () => {
    it.each([
        {id: '', predicate: () => true},
        {id: 'invalid', predicate: true},
        {id: 'invalid', predicate: () => true, dependencies: [{scope: 'payload', label: 'x'}]},
        {id: 'invalid', predicate: () => true, dependencies: [{scope: 'target', label: ''}]},
        {id: 'invalid', predicate: () => true, dependencies: [exact('target', 'x'), exact('target', 'x')]},
        {id: 'invalid', predicate: () => true, description: ''},
        {id: 'invalid', predicate: () => true, dependencies: {}},
        {id: 'invalid', predicate: () => true, payload: true}
    ])('rejects malformed rule declarations %#', rule => {
        expect(() => validateCompatibilityRules([rule as any], 'view')).toThrow(CompatibilityContractError);
    });

    it('rejects duplicate rule identities and does not execute predicates during validation', () => {
        const predicate = vi.fn(() => true);
        validateCompatibilityRules([{id: 'one', predicate}], 'view');
        expect(predicate).not.toHaveBeenCalled();
        expect(() => validateCompatibilityRules([{id: 'one', predicate}, {id: 'one', predicate}], 'view')).toThrow(/Duplicate/);
    });

    it('reports callback errors, non-boolean results and undeclared queries as contract defects', () => {
        const evaluate = (rule: any) => () => planCompatibility(input({viewRules: [rule]}));
        expect(evaluate({id: 'throws', predicate: () => { throw new Error('broken'); }})).toThrow(/threw during/);
        expect(evaluate({id: 'async', predicate: () => Promise.resolve(true)})).toThrow(/must return a boolean/);
        expect(evaluate({id: 'undeclared', dependencies: [], predicate: (labels: any) => labels.has('target', 'x')})).toThrow(/undeclared dependency/);
        expect(evaluate({id: 'scope', predicate: (labels: any) => labels.has('payload', 'x')})).toThrow(/forbidden scope/);
    });

    it.each([
        {fields: [{...domain('a'), owner: 'payload'}]},
        {fields: [domain('a'), domain('a')]},
        {fields: [{...domain('a'), field: ''}]},
        {fields: [{...domain('a'), alternatives: [{id: 'same', labels: []}, {id: 'same', labels: []}]}]},
        {fields: [{...domain('a'), alternatives: [{id: 'bad', labels: ['']}] }]},
        {fields: [{...domain('a'), alternatives: [{id: 'bad', labels: [], priority: Infinity}]}]}
    ])('rejects malformed choice domains %#', ({fields}) => {
        expect(() => planCompatibility(input({fields: fields as any}))).toThrow(CompatibilityContractError);
    });

    it('fails explicitly before enumerating groups outside the bounded profile', () => {
        expect(() => planCompatibility(input({fields: [domain('a'), domain('b'), domain('c')], maxAssignmentsPerGroup: 7,
            generatorRules: [{id: 'wide', predicate: () => true}]}))).toThrow(CompatibilityLimitError);
        expect(() => planCompatibility(input({maxAssignmentsPerGroup: 0}))).toThrow(/positive safe integer/);
        expect(() => planCompatibility(input({maxAssignmentsPerGroup: 2.5}))).toThrow(/positive safe integer/);
    });
});

describe('plan persistence and selection receipts', () => {
    it('round-trips seeded selections and keeps variant identities independent of unrelated alternatives', () => {
        const first = admitted({fields: [domain('a')]});
        const second = admitted({fields: [{...domain('a'), alternatives: [...domain('a').alternatives, {id: 'third', labels: ['extra']}]}]});
        const receipt = sampleGenerationPlan(first, () => 0);
        expect(validateGenerationSelectionReceipt(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(receipt)))).toEqual(receipt);
        expect(sampleGenerationPlan(second, () => 0).variantHash).toBe(receipt.variantHash);
        expect(second.hash).not.toBe(first.hash);
        expect(sampleGenerationPlan(admitted({fields: [domain('a')], generatorLabels: ['new-invariant']}), () => 0).variantHash).not.toBe(receipt.variantHash);
        setSeed('repeatable');
        const draw = sampleGenerationPlan(correlated(), random);
        setSeed('repeatable');
        expect(sampleGenerationPlan(correlated(), random)).toEqual(draw);
    });

    it('samples uniformly over complete rows without weighting a compressed group as one alternative', () => {
        const plan = admitted({fields: [domain('a'), domain('b', 'view'), domain('free')], viewRules: [{
            id: 'not-both', dependencies: sameBits.dependencies,
            predicate: labels => !(labels.exact('generator', 'a') && labels.exact('view', 'b'))
        }]});
        const found = new Set<string>();
        for (let row = 0; row < 3; row++) for (let free = 0; free < 2; free++) {
            const draws = [(row + 0.5) / 3, (free + 0.5) / 2];
            const receipt = sampleGenerationPlan(plan, () => draws.shift()!);
            found.add(receipt.variantHash);
            expect(draws).toHaveLength(0);
        }
        expect(found.size).toBe(6);
    });

    it('does not draw entropy for fixed selections and rejects invalid random outputs', () => {
        const random = vi.fn(() => 0);
        sampleGenerationPlan(admitted(), random);
        expect(random).not.toHaveBeenCalled();
        for (const invalid of [-1, 1, NaN, Infinity]) expect(() => sampleGenerationPlan(admitted({fields: [domain('a')]}), () => invalid)).toThrow(/\[0, 1\)/);
    });

    it('rejects stale, tampered and noncanonical plans', () => {
        const plan = correlated();
        expect(() => validateGenerationPlan({...plan, version: 0})).toThrow(/Unsupported generation plan version/);
        expect(() => validateGenerationPlan({...plan, hash: 'changed'})).toThrow(/hash mismatch/);
        expect(() => validateGenerationPlan({...plan, domains: [...plan.domains].reverse()})).toThrow(/canonical/);
        expect(() => validateGenerationPlan({...plan, payload: {}})).toThrow(/unknown fields/);
        expect(() => validateGenerationPlan({...plan, groups: [{...plan.groups[0], assignments: [['on']]}]})).toThrow(/arity/);
        expect(() => validateGenerationPlan({...plan, groups: [{...plan.groups[0], assignments: [['missing', 'on']]}]})).toThrow(/Unknown selected/);
        expect(() => validateGenerationPlan({...plan, groups: [plan.groups[0], plan.groups[0]]})).toThrow(/multiple group positions/);
        expect(() => validateGenerationPlan({...plan, groups: [{...plan.groups[0], assignments: [...plan.groups[0].assignments, plan.groups[0].assignments[0]]}]})).toThrow(/unique and canonical/);
    });

    it('canonicalizes several independent correlated groups through serialization', () => {
        const plan = admitted({
            fields: [domain('a'), domain('b', 'view'), domain('c'), domain('d', 'view')],
            viewRules: [sameBits, {
                id: 'second-pair', dependencies: [exact('generator', 'c'), exact('view', 'd')],
                predicate: labels => labels.exact('generator', 'c') === labels.exact('view', 'd')
            }]
        });
        expect(plan.groups).toHaveLength(2);
        expect(assignments(plan)).toHaveLength(4);
        expect(validateGenerationPlan(JSON.parse(JSON.stringify(plan)))).toEqual(plan);
    });

    it('rejects incomplete, mismatched and correlated-invalid receipts', () => {
        const plan = correlated();
        const receipt = sampleGenerationPlan(plan, () => 0);
        expect(() => validateGenerationSelectionReceipt(plan, {...receipt, version: 0})).toThrow(/receipt version/);
        expect(() => validateGenerationSelectionReceipt(plan, {...receipt, planHash: 'other'})).toThrow(/different generation plan/);
        expect(() => validateGenerationSelectionReceipt(plan, {...receipt, choices: []})).toThrow(/every domain/);
        expect(() => validateGenerationSelectionReceipt(plan, {...receipt, choices: [...receipt.choices].reverse()})).toThrow(/canonical/);
        expect(() => validateGenerationSelectionReceipt(plan, {...receipt, choices: receipt.choices.map(choice => ({...choice, alternativeId: 'missing'}))})).toThrow(/unknown alternative/);
        expect(() => validateGenerationSelectionReceipt(plan, {...receipt, choices: [receipt.choices[0], {...receipt.choices[1], alternativeId: 'on'}]})).toThrow(/correlation/);
        expect(() => validateGenerationSelectionReceipt(plan, {...receipt, variantHash: 'wrong'})).toThrow(/variant hash/);
    });
});

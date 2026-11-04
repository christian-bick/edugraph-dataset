import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {planCompatibility} from '../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../lib/utils.ts';
import {basicCountingProfiles} from './basic-counting-domain.ts';
import {CountingBasicGeneratorSchema, spec as enumerationSpec} from './counting-basic/spec.ts';
import {CountingTotalGeneratorSchema, spec as totalSpec} from './counting-total/spec.ts';

const families = [
    {contract: 'enumeration', schema: CountingBasicGeneratorSchema, spec: enumerationSpec},
    {contract: 'total', schema: CountingTotalGeneratorSchema, spec: totalSpec}
] as const;
const aliases = [
    {labels: [], parity: 'any', alternatives: [[]]},
    {labels: [Area.EvenDivisibility], parity: 'even', alternatives: [[Area.EvenDivisibility], [Area.EvenDivisibility, Scope.EvenNumbers]]},
    {labels: [Scope.EvenNumbers], parity: 'even', alternatives: [[Scope.EvenNumbers], [Area.EvenDivisibility, Scope.EvenNumbers]]},
    {labels: [Area.EvenDivisibility, Scope.EvenNumbers], parity: 'even', alternatives: [[Area.EvenDivisibility, Scope.EvenNumbers]]},
    {labels: [Area.UnevenDivisibility], parity: 'odd', alternatives: [[Area.UnevenDivisibility], [Area.UnevenDivisibility, Scope.OddNumbers]]},
    {labels: [Scope.OddNumbers], parity: 'odd', alternatives: [[Scope.OddNumbers], [Area.UnevenDivisibility, Scope.OddNumbers]]},
    {labels: [Area.UnevenDivisibility, Scope.OddNumbers], parity: 'odd', alternatives: [[Area.UnevenDivisibility, Scope.OddNumbers]]}
] as const;
const parityLabels = new Set<string>([Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers, Scope.OddNumbers]);
const labelSetKey = (labels: readonly string[]) => JSON.stringify([...labels].sort());

describe('basic counting canonical profile contracts', () => {
    it.each(families)('declares only canonical mathematical range and parity choices for $contract', ({schema}) => {
        expect(Object.keys(schema)).toEqual(['parity', 'range']);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(schema.range[0]).not.toContain(Scope.NumbersLargerZero);
        expect(schema.range[2]).toHaveLength(3);
    });

    it.each(families.flatMap(family => basicCountingProfiles(family.contract).map(profile => ({...family, ...profile}))))(
        'resolves every parity alias directly and through its declared plan for $contract/$range.min..$range.max', ({schema, spec, range, labels}) => {
            for (const alias of aliases) {
                const targetLabels = [...labels, ...alias.labels];
                const result = planCompatibility({identity: {targetId: 'counting-profile', generatorId: spec.generatorId,
                    viewId: 'counting-profile'}, targetLabels, generatorLabels: spec.generalLabels!, viewLabels: [],
                    fields: normalizeSchemaChoices(schema, targetLabels, 'generator')});
                expect(result.supported).toBe(true);
                if (!result.supported) throw new Error('Every declared count/parity profile must be supported.');
                const selections = enumerateDependencyAuditSelections(result.plan);
                expect(selections.status).toBe('complete');
                expect(selections.selections).toHaveLength(alias.alternatives.length);
                expect(selections.selections.map(selection => labelSetKey(selection.labels.filter(label => parityLabels.has(label)))).sort())
                    .toEqual(alias.alternatives.map(labelSetKey).sort());
                for (const selection of selections.selections) {
                    const bindings = Object.fromEntries(selection.choices.map(choice => {
                        const field = result.plan.domains.find(field => field.field === choice.field)!;
                        return [choice.field, field.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels];
                    }));
                    const direct = extractConfig(schema, selection.labels);
                    const planned = resolveSchemaChoices(schema, targetLabels, bindings);
                    expect(direct.config).toEqual({range, parity: alias.parity});
                    expect(direct.config).toEqual(planned.config);
                    expect(new Set(planned.resolvedLabels)).toEqual(new Set([...labels, ...bindings.parity!]));
                    const selectedParity = selection.labels.filter(label => parityLabels.has(label));
                    const directAlternatives = aliases.find(candidate => labelSetKey(candidate.labels) === labelSetKey(selectedParity))!.alternatives;
                    // Direct completion can add the equivalent paired claim; its mathematical config stays exact.
                    expect(directAlternatives.map(alternative => labelSetKey([...labels, ...alternative])))
                        .toContain(labelSetKey(direct.resolvedLabels));
                }
            }
        });

    it.each(families)('rejects contradictory parity claims for $contract', ({schema}) => {
        expect(() => extractConfig(schema, [Area.EvenDivisibility, Scope.OddNumbers, Scope.NumbersSmaller20])).toThrow();
    });
});

import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {setSeed} from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {NumberArrayGenerator} from './generator.ts';
import {NumberArrayGeneratorSchema, spec} from './spec.ts';
import {arrayCandidates, arrayOperations, arrayProfiles, arrayQuantities} from './profiles.ts';

describe('NumberArrayGenerator spec integration', () => {
    const generator = new NumberArrayGenerator();

    it('resolves every feasible configuration identically through direct and planned bindings', () => {
        expect(findSchemaFallbackContractIssues(NumberArrayGeneratorSchema)).toEqual([]);
        for (const [area, operation] of arrayOperations) {
            for (const requireTwoOperands of [false, true]) {
                for (const {profile, labels: profileLabels} of arrayProfiles) {
                    if (!arrayCandidates(operation, requireTwoOperands, profile).length) continue;
                    const arity = requireTwoOperands ? [Scope.TwoOperands] : [];
                    const labels = [area, ...arity, ...profileLabels];
                    const direct = extractConfig(NumberArrayGeneratorSchema, labels);
                    const planned = resolveSchemaChoices(NumberArrayGeneratorSchema, labels, {
                        operation: [area], requireTwoOperands: arity, profile: profileLabels
                    });
                    expect(planned.config).toEqual(direct.config);
                    const data = generator.generate(direct.config)!.data;
                    expect(hasCanonicalRangeWitness(arrayQuantities(data), profile.range)).toBe(true);
                }
            }
        }
    });

    it('keeps unspecified arity in the five-by-five source envelope', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const labels = [Area.Addition, Scope.NumberArray];
            const {config, resolvedLabels} = extractConfig(NumberArrayGeneratorSchema, labels);
            const data = generator.generate(config)!.data;
            expect(data.columns).toBeLessThanOrEqual(5);
            expect(resolvedLabels).not.toContain(Scope.TwoOperands);
            expect(resolvedLabels.some(label => /Digit(?:Smallest|Largest)Operand$/.test(label))).toBe(false);
            const arity = normalizeSchemaChoices(NumberArrayGeneratorSchema, labels, 'generator')
                .find(domain => domain.field === 'requireTwoOperands')!;
            expect(arity.alternatives.map(choice => choice.labels)).toEqual([[]]);
        }
    });

    it('resolves explicit binary addition above20 with truthful two-digit operand widths', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(generator, [Area.Addition, Scope.TwoOperands, Scope.NumbersSmaller100])!;
            expect(data.data.rows).toBe(2);
            expect(data.data.columns).toBeGreaterThanOrEqual(11);
            expect(data.data.columns).toBeLessThanOrEqual(20);
            expect(data.labels).toContain(Scope.TwoDigitSmallestOperand);
            expect(data.labels).toContain(Scope.TwoDigitLargestOperand);
            expect(data.labels).not.toContain(Scope.SingleDigitSmallestOperand);
        }
        expect(() => generateWithLabels(generator, [Area.Addition, Scope.TwoOperands, Area.IteratedOperation])).toThrow();
    });

    it('completes requested operand widths through the supported binary profile', () => {
        const labels = [Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller100];
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const direct = extractConfig(NumberArrayGeneratorSchema, labels);
            expect(direct.config.requireTwoOperands).toBe(true);
            expect(direct.resolvedLabels).toContain(Scope.TwoOperands);
            const profileLabels = direct.resolvedLabels.filter(label =>
                label !== Area.Addition && label !== Scope.TwoOperands);
            const planned = resolveSchemaChoices(NumberArrayGeneratorSchema, labels, {
                operation: [Area.Addition], requireTwoOperands: [Scope.TwoOperands], profile: profileLabels
            });
            expect(planned.config).toEqual(direct.config);
            const data = generator.generate(direct.config)!.data;
            expect(data.rows).toBe(2);
            expect(data.columns).toBeGreaterThanOrEqual(11);
            expect(data.columns).toBeLessThanOrEqual(20);
        }
        expect(() => extractConfig(NumberArrayGeneratorSchema, [
            Area.Addition, Scope.SingleDigitLargestOperand, Scope.NumbersSmaller100
        ])).toThrow();
    });

    it('keeps interpretation claims out of the canonical array relation', () => {
        expect(spec.generalLabels).not.toContain(Area.GroupRecognition);
        expect(spec.generalLabels).not.toContain(Scope.EqualShares);
    });

    it('resolves a basic number-array target', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Scope.NumberArray,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.rows).toBeGreaterThanOrEqual(2);
    });

    it('resolves iterated-operation targets into at least three equal addends', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Area.IteratedOperation,
            Scope.NumberArray,
            Ability.Formalization
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.addends.length).toBeGreaterThanOrEqual(3);
        expect(new Set(stub!.data.addends).size).toBe(1);
        expect(stub!.labels).toContain(Area.IteratedOperation);
    });

    it.each([
        [Area.Multiplication, 'multiplication'],
        [Area.PartitiveDivision, 'partitive-division'],
        [Area.QuotativeDivision, 'quotative-division']
    ] as const)('resolves %s equal-group interpretation targets', (area, operation) => {
        const stub = generateWithLabels(generator, [
            area,
            Scope.EqualShares,
            Scope.NumberArray,
            Scope.NumbersSmaller100,
            Ability.Interpretation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.labels).toContain(area);
    });
});

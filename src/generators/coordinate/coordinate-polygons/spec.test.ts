import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import type {RationalCoordinatePoint} from '../../../types/problems.ts';
import {CoordinatePolygonsGenerator} from './generator.ts';
import {CoordinatePolygonsGeneratorSchema, spec} from './spec.ts';

describe('polygon ownership, actual mathematical proofs and exact schema fallback', () => {
    it('keeps invariant geometry separate from selected distance equations and sign domain', () => {
        expect(spec.generalLabels).toEqual([Area.Polygon, Scope.RationalNumbers]);
        expect(Object.keys(CoordinatePolygonsGeneratorSchema)).toEqual(['signDomain', 'distanceEvidence', 'range']);
        expect(CoordinatePolygonsGeneratorSchema.distanceEvidence[2]).toEqual([[], [Area.CoordinateDistance]]);
        expect(findSchemaFallbackContractIssues(CoordinatePolygonsGeneratorSchema)).toEqual([]);
        expect(CoordinatePolygonsGeneratorSchema.distanceEvidence[1]([])).toBe('geometry-only');
        expect(CoordinatePolygonsGeneratorSchema.distanceEvidence[1]([Area.CoordinateDistance])).toBe('side-equations');
        expect(() => CoordinatePolygonsGeneratorSchema.signDomain[1]([Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives])).toThrow();
        for (const [sign, signDomain] of [[Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']] as const) {
            for (const proof of [[], [Area.CoordinateDistance]]) {
                const labels = [Area.Polygon, Scope.RationalNumbers, sign, ...proof];
                const resolved = extractConfig(CoordinatePolygonsGeneratorSchema, labels);
                expect(resolved.config).toEqual({signDomain, distanceEvidence: proof.length === 0 ? 'geometry-only' : 'side-equations',
                    range: {min: 0, max: Number.MAX_SAFE_INTEGER}});
                expect(new Set(resolved.resolvedLabels)).toEqual(new Set([sign, ...proof]));
                const data = generateWithLabels(new CoordinatePolygonsGenerator(), labels)!.data;
                expect(data.sideDistanceEquations.length > 0).toBe(proof.length > 0);
            }
        }
    });

    it('resolves meaningful inclusive20/100 bounds and broad production targets without a magnitude label', () => {
        for (const [label, maximum] of [[Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const) {
            const labels = [Area.Polygon, Scope.RationalNumbers, Scope.NumbersWithoutNegatives, label];
            const resolved = extractConfig(CoordinatePolygonsGeneratorSchema, labels);
            expect(resolved.config.range).toEqual({min: 0, max: maximum});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set([Scope.NumbersWithoutNegatives, label]));
            expect(generateWithLabels(new CoordinatePolygonsGenerator(), labels)!.data.sideDistanceEquations).toEqual([]);
        }
    });

    it('executes all eight real authored polygon targets with exact emitted labels and proof disposition', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target =>
            target.id.startsWith('6.G.A.3-coordinate-polygon-construction~') || target.id.startsWith('6.G.A.3-coordinate-polygon-side-length~'));
        expect(targets).toHaveLength(8);
        for (const target of targets) {
            const sideLength = target.labels.includes(Area.CoordinateDistance);
            const story = target.labels.includes(Ability.TextualReception);
            const viewId = `coordinate-polygon-${sideLength ? 'side-length' : 'construction'}${story ? '-story' : ''}`;
            const viewLabels = [Scope.CartesianCoordinateSystem,
                ...(sideLength ? [Ability.ProcedureExecution] : [Area.ShapePlotting, Ability.VisualArticulation]),
                ...(story ? [Ability.TextualReception] : [])];
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId},
                targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels,
                fields: normalizeSchemaChoices(CoordinatePolygonsGeneratorSchema, target.labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 16; seed++) {
                const draw = generatePlannedDraw({generator: new CoordinatePolygonsGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub!.data.sideDistanceEquations.length > 0).toBe(sideLength);
                expect(draw.stub!.data.vertices.some((vertex: RationalCoordinatePoint) => vertex.x.sign < 0 || vertex.y.sign < 0)).toBe(target.labels.includes(Scope.NumbersWithNegatives));
            }
        }
    });

    it('changes mathematical evidence without choosing learner action or changing the underlying geometry', () => {
        const labels = [Area.Polygon, Scope.RationalNumbers, Scope.NumbersWithoutNegatives];
        setSeed(309); const geometry = generateWithLabels(new CoordinatePolygonsGenerator(), [...labels, Area.ShapePlotting, Ability.VisualArticulation])!.data;
        setSeed(309); const equations = generateWithLabels(new CoordinatePolygonsGenerator(), [...labels, Area.CoordinateDistance, Ability.ProcedureExecution])!.data;
        expect({...equations, sideDistanceEquations: []}).toEqual(geometry);
        expect(equations.sideDistanceEquations).toHaveLength(1);
        setSeed(309); expect(generateWithLabels(new CoordinatePolygonsGenerator(), [...labels, Ability.TextualReception])!.data).toEqual(geometry);
        expect(() => new CoordinatePolygonsGenerator().generate({})).toThrow();
    });
});

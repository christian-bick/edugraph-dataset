import { describe, it, expect } from 'vitest';
import {
    DISTANCE_SCALE_LABELS,
    capabilitySatisfies,
    getCapabilityAncestors,
    getStructuralAncestors,
    resolveDistanceScale,
    resolveRangeFromLabels
} from './ontology.ts';
import { Scope, Area, bundledContext } from 'edugraph-ts';

describe('Ontology Helper', () => {
    describe('capabilitySatisfies', () => {
        it('should return true for identity', () => {
            expect(capabilitySatisfies(Scope.NumbersSmaller10, Scope.NumbersSmaller10)).toBe(true);
        });

        it('accepts a specialization for a broader requested capability', () => {
            expect(capabilitySatisfies(Scope.NumbersSmaller10, Scope.NumericRange)).toBe(true);
        });

        it('does not accept a broader capability for its specialization', () => {
            expect(capabilitySatisfies(Scope.NumericRange, Scope.NumbersSmaller10)).toBe(false);
        });

        it('does not treat structural partOf ancestry as capability inheritance', () => {
            expect(capabilitySatisfies(Scope.Tapemeter, Scope.LengthMeasurement)).toBe(false);
        });

        it('should return false for unrelated concepts', () => {
            expect(capabilitySatisfies(Scope.NumbersSmaller10, Area.Addition)).toBe(false);
        });
    });

    describe('getCapabilityAncestors', () => {
        it('includes the concept and its transitive specializations', () => {
            const ancestors = getCapabilityAncestors(Scope.NumbersSmaller10);
            expect(ancestors.has(Scope.NumbersSmaller10)).toBe(true);
            expect(ancestors.has(Scope.NumericRange)).toBe(true);
        });

        it('returns unknown concepts as self-only closures', () => {
            expect([...getCapabilityAncestors('urn:unknown')]).toEqual(['urn:unknown']);
        });
    });

    describe('getStructuralAncestors', () => {
        it('includes both partOf and specializes structure', () => {
            expect(getStructuralAncestors(Scope.Tapemeter).has(Scope.LengthMeasurement)).toBe(true);
            expect(getStructuralAncestors(Scope.CentimeterScale)
                .has(Scope.MetricDistanceScale)).toBe(true);
        });
    });

    describe('adopted ontology boundaries', () => {
        it.each([Area.EvenDivisibility, Area.UnevenDivisibility])(
            'keeps collection parity %s separate from executed division', label => {
                expect(capabilitySatisfies(label, Area.DivisibilityOfCollections)).toBe(true);
                expect(capabilitySatisfies(label, Area.DivisionOfCollections)).toBe(false);
            }
        );

        it.each([Area.PerfectDivisibility, Area.ImperfectDivisibility])(
            'does not infer a collection-division claim from numeric %s', label => {
                expect(getStructuralAncestors(label).has(Area.DivisibilityRules)).toBe(true);
                expect(capabilitySatisfies(label, Area.DivisionOfCollections)).toBe(false);
            }
        );

        it.each([
            [Area.DivisionOfCollections, Area.PartitionOfCollections],
            [Area.NumericSubstitution, Area.AlgebraicSubstitution],
            [Area.AssociativeLaw, Area.OperationAssociativity],
            [Area.CommutativeLaw, Area.OperationCommutativity],
            [Area.DistributiveLaw, Area.OperationDistributivity],
            [Area.FractionSimplification, Area.FractionEquivalence],
            [Area.FractionReferenceDistanceComparison, Area.FractionReferenceComparison],
            [Area.EquilateralTriangle, Area.AcuteTriangle],
            [Area.EquilateralTriangle, Area.IsoscelesTriangle],
            [Area.Square, Area.Rhombus],
            [Area.Parallelogram, Area.Trapezoid],
            [Area.CoordinateDistance, Area.LengthCalculation],
            [Area.PerimeterCalculation, Area.LengthCalculation],
            [Area.SurfaceAreaCalculation, Area.AreaCalculation],
            [Area.Sphere, Area.SolidOfRevolution],
            [Area.UnitFactorScaling, Area.UnitConversion],
            [Area.UnitMagnitudeScaling, Area.UnitConversion],
            [Area.ArithmeticMean, Area.CentralTendencyMeasure],
            [Area.Median, Area.CentralTendencyMeasure],
            [Area.Mode, Area.CentralTendencyMeasure]
        ])('matches adopted specialization %s to %s in one direction', (specific, broader) => {
            expect(capabilitySatisfies(specific, broader)).toBe(true);
            expect(capabilitySatisfies(broader, specific)).toBe(false);
        });

        it('does not promote interval organization or translated rates to capabilities', () => {
            expect(getStructuralAncestors(Area.NumberIntervals).has(Area.NumberSense)).toBe(true);
            expect(capabilitySatisfies(Area.NumberIntervals, Area.Numeration)).toBe(false);
            expect(capabilitySatisfies(Area.AverageRateOfChange, Area.FunctionSlope)).toBe(false);
            expect(capabilitySatisfies(Area.InstantaneousRateOfChange, Area.FunctionSlope)).toBe(false);
        });

        it.each([
            Area.DivisibilityRules,
            Area.GeometricFoundations,
            Area.FunctionInterpretation,
            Area.FunctionStructure,
            Area.ComplexNumberFoundations,
            Area.MarkovChainAbsorption,
            Area.SequenceTheorems,
            Area.SetOperations,
            Area.SetProperties,
            Area.SetRelations,
            Area.StatisticalInference
        ])('keeps organizer %s out of annotation vocabularies', label => {
            expect(bundledContext.inspectLabel(label)).toMatchObject({status: 'known', eligible: false});
        });

        it.each([
            Area.FunctionSlope,
            Area.MathematicalNotation,
            Area.SetCardinality,
            Area.CentralTendencyMeasure,
            Area.Cone,
            Area.Cylinder,
            Area.Iteration,
            Area.IteratedOperation
        ])('retains eligible descriptor %s without forcing a narrower label', label => {
            expect(bundledContext.inspectLabel(label)).toMatchObject({status: 'known', eligible: true});
        });
    });

    describe('resolveRangeFromLabels', () => {
        it('should resolve default range when no range labels are present', () => {
            const range = resolveRangeFromLabels([]);
            expect(range.min).toBe(0);
            expect(range.max).toBe(Number.MAX_SAFE_INTEGER);
        });

        it('should resolve to the tightest max boundary (SmallerThan) when multiple smallerThan labels exist', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersSmaller100,
                Scope.NumbersSmaller10,
                Scope.NumbersSmaller20,
                Scope.NumbersSmaller5,
            ]);
            expect(range.max).toBe(5);
        });

        it('should resolve to the tightest min boundary (LargerThan) when multiple largerThan labels exist', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersLarger10,
                Scope.NumbersLarger100,
                Scope.NumbersLarger20,
            ]);
            expect(range.min).toBe(100);
        });

        it('should resolve both boundaries correctly', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersSmaller100,
                Scope.NumbersLarger20,
            ]);
            expect(range.min).toBe(20);
            expect(range.max).toBe(100);
        });

        it('should resolve the inclusive 120 boundaries', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersSmaller120,
                Scope.NumbersLarger120,
            ]);
            expect(range.min).toBe(120);
            expect(range.max).toBe(120);
        });

        it('should prefer the tighter 100 boundary over 120', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersSmaller120,
                Scope.NumbersSmaller100,
                Scope.NumbersLarger100,
                Scope.NumbersLarger120,
            ]);
            expect(range.min).toBe(120);
            expect(range.max).toBe(100);
        });

        it('should resolve the five-value boundaries', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersSmaller5,
                Scope.NumbersLarger5,
            ]);
            expect(range.min).toBe(5);
            expect(range.max).toBe(5);
        });
    });

    describe('resolveDistanceScale', () => {
        it.each([
            [Scope.CentimeterScale, 'metric'],
            [Scope.MeterScale, 'metric'],
            [Scope.InchScale, 'imperial'],
            [Scope.FootScale, 'imperial'],
            [Scope.SegmentScale, 'abstract']
        ] as const)('classifies %s through its ontology family', (label, family) => {
            expect(resolveDistanceScale([label])).toEqual({label, family});
        });

        it('honors the schema-supported scale subset', () => {
            expect(resolveDistanceScale(
                [Scope.InchScale],
                [Scope.CentimeterScale, Scope.MeterScale]
            )).toBeUndefined();
            expect(DISTANCE_SCALE_LABELS).toContain(Scope.SegmentScale);
        });

        it('does not infer an arbitrary concrete unit from a family label', () => {
            expect(resolveDistanceScale([Scope.ImperialDistanceScale])).toBeUndefined();
        });
    });
});

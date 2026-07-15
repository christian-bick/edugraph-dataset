import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from './kindergarten.ts';

export const Grade1Spec: CompetencyTarget[] = [
    // ==========================================
    // 1. Grade 1 Ordering (1.NBT)
    // ==========================================
    {
        id: '1.NBT.A.1-ordering-with-zero',
        labels: [Area.NumerationWithIntegers, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithZero, Ability.ProcedureExecution],
        constraints: { includesZero: true }
    },
    {
        id: '1.NBT.A.1-ordering-without-zero',
        labels: [Area.NumerationWithIntegers, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithoutZero, Ability.ProcedureExecution],
        constraints: { includesZero: false }
    },

    // ==========================================
    // 2. Grade 1 Time (1.MD)
    // ==========================================
    {
        id: '1.MD.B.3-time-hour',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.HourIntervals, Ability.ProcedureExecution],
        constraints: { interval: 3600 }
    },
    {
        id: '1.MD.B.3-time-half-hour',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.MinuteIntervals, Ability.ProcedureExecution],
        constraints: { interval: 1800 }
    },
    {
        id: '1.MD.B.3-time-quarter-hour',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.MinuteIntervals, Ability.ProcedureExecution],
        constraints: { interval: 900 }
    },
    {
        id: '1.MD.B.3-time-minute',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.MinuteIntervals, Ability.ProcedureExecution],
        constraints: { interval: 60 }
    },
    {
        id: '1.MD.B.3-time-second',
        labels: [Area.MeasuringTime, Scope.AnalogClock, Scope.SecondIntervals, Ability.ProcedureExecution],
        constraints: { interval: 1 }
    }
];

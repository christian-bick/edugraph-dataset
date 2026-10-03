import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {NumbersDecimalRoundingLineViewSchema, spec} from './spec.ts';

describe('numbers-decimal-rounding-line spec', () => {
    it('owns one fixed numeral rounding task without mathematical view options', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.ProcedureExecution]);
        expect(NumbersDecimalRoundingLineViewSchema).toEqual({});
    });
});

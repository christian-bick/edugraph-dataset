import {describe, expect, it, vi} from 'vitest';

// Model catalogs must load declarations without loading the mathematical source
// sampler. This fails immediately if either spec reintroduces that dependency.
vi.mock('./numerical-expression-domain.ts', () => {
    throw new Error('Catalog declarations must not load numerical expression source domains.');
});

import {ArithmeticNumericalExpressionsGeneratorSchema as syntax} from './arithmetic-numerical-expressions/spec.ts';
import {ArithmeticNumericalExpressionCalculationsGeneratorSchema as calculation} from './arithmetic-numerical-expression-calculations/spec.ts';

describe('declarative numerical expression catalog profiles', () => {
    it('loads both complete schema declarations without importing sampling implementations', () => {
        expect(syntax.profile[2]).toHaveLength(7);
        expect(calculation.profile[2]).toHaveLength(14);
    });
});

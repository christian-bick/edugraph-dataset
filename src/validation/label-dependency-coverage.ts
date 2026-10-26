/** Reviewed enforcement coverage. The Area gate remains owned by the dependency graph. */
export const labelDependencyCoverage = {
    version: 1,
    reportOnlyFacets: ['range'],
    profiles: {
        nonnegative: {
            numeric: ['numberKind', 'numeralSystem', 'base', 'sign', 'zero'],
            operands: ['operandCount', 'operandDigits'],
            deferred: []
        },
        signed: {
            numeric: ['numberKind', 'numeralSystem', 'base', 'sign', 'zero'],
            operands: ['operandCount'],
            deferred: ['operandDigits']
        },
        underdetermined: {
            numeric: ['numeralSystem', 'base'],
            operands: ['operandCount'],
            deferred: ['numberKind', 'sign', 'zero', 'operandDigits']
        }
    },
    arithmetic: [
        {
            generators: ['arithmetic-ops-pairs', 'arithmetic-ops-triples', 'arithmetic-ops-four'],
            variants: ['integer-equation']
        },
        {
            generators: ['arithmetic-ops-triples'],
            variants: ['property-commutative', 'property-associative', 'property-distributive']
        }
    ],
    arithmeticViews: ['operations-boxes', 'operations-boxes-inversion', 'operations-vertical', 'operations-vertical-inversion'],
    counting: [
        {generator: 'counting-basic', variant: 'object-counting', views: [
            'counting-conservation', 'counting-objects-simple', 'counting-objects-parity',
            'counting-objects-one-to-one', 'counting-objects-cardinality'
        ]},
        {generator: 'counting-selection', variant: 'count-out', views: ['counting-objects-count-out']}
    ],
    countingFacets: ['numberKind', 'numeralSystem', 'base', 'sign', 'zero'],
    explanationViews: ['counting-objects-simple'],
    deferredReasons: {
        signed: 'Signed smallest/largest operand-digit profiles remain outside reviewed enforcement.',
        underdetermined: 'The hidden operand and dependent values are not established by this question.'
    }
} as const;

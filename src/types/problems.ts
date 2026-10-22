export type ArithmeticOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';

/**
 * A numerical expression with mathematical grouping independent of its displayed delimiter.
 * Every value is exact: operation values equal the result of their children, and a group
 * has the same value as its enclosed expression. Generators select representable results.
 */
export type NumericalExpressionNode =
    | {kind: 'number'; value: number}
    | {
        kind: 'operation';
        operation: ArithmeticOperation;
        left: NumericalExpressionNode;
        right: NumericalExpressionNode;
        value: number;
    }
    | {kind: 'group'; expression: NumericalExpressionNode; value: number};

/**
 * Ability-neutral expression data shared by writing, evaluation, and interpretation views.
 * When present, the expression is structurally `factor` times `reference`; their exact
 * values must satisfy that relation without requiring either value to be shown to a learner.
 */
export type NumericalExpressionProblem = {
    expression: NumericalExpressionNode;
    multiplicativeComparison?: {
        reference: NumericalExpressionNode;
        factor: number;
    };
};

type ArithmeticProblemBase = {
    operation: ArithmeticOperation;
    answer: number;
};

export type ArithmeticPairProblem = ArithmeticProblemBase & {
    num1: number;
    num2: number;
    num3?: undefined;
    propertyLaw?: undefined;
    blankPart?: undefined;
};

export type ArithmeticTripleProblem = ArithmeticProblemBase & {
    num1: number;
    num2: number;
    num3: number;
    propertyLaw?: 'commutative' | 'associative' | 'distributive';
    combinedFactor?: number;
    partialProducts?: [number, number];
    blankPart?: undefined;
};

/**
 * The same three addends or factors under a change of order or grouping.
 * Commutative witnesses have distinct first and last values to make the swap visible.
 */
export type ArithmeticReorderingPropertyProblem = {
    operation: 'addition' | 'multiplication';
    propertyLaw: 'commutative' | 'associative';
    num1: number;
    num2: number;
    num3: number;
    answer: number;
};

/** A product of a sum, its two partial products, and their common total. */
export type ArithmeticDistributivePropertyProblem = {
    operation: 'multiplication';
    propertyLaw: 'distributive';
    num1: number;
    num2: number;
    num3: number;
    combinedFactor: number;
    partialProducts: [number, number];
    answer: number;
};

export type ArithmeticPropertyProblem = ArithmeticReorderingPropertyProblem | ArithmeticDistributivePropertyProblem;

export type ArithmeticFourProblem = ArithmeticProblemBase & {
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    propertyLaw?: undefined;
    blankPart?: undefined;
};

/** Shared payload accepted by arithmetic views that render both pairs and triples. */
export type ArithmeticProblem = ArithmeticPairProblem | ArithmeticTripleProblem | ArithmeticFourProblem;

export type StandardAlgorithmOperation = 'addition' | 'subtraction';

export type StandardAlgorithmColumnStep = {
    placeValue: 1 | 10 | 100 | 1000 | 10000 | 100000;
    topDigit: number;
    bottomDigit: number;
    regroupIn: 0 | 1;
    regroupOut: 0 | 1;
    workingValue: number;
    resultDigit: number;
};

export type StandardAlgorithmProblem = {
    task: 'standard-algorithm';
    operation: StandardAlgorithmOperation;
    topValue: number;
    bottomValue: number;
    result: number;
    columns: readonly StandardAlgorithmColumnStep[];
};

export type KnownFactDerivationStrategy =
    | 'commutative'
    | 'associative'
    | 'inverse-division'
    | 'place-value-scaling';

export type KnownMultiplicationFact = {
    firstFactor: number;
    secondFactor: number;
    product: number;
};

export type KnownFactDerivationProblem = {
    strategy: KnownFactDerivationStrategy;
    operation: 'multiplication' | 'division';
    knownFact: KnownMultiplicationFact;
    derivedOperands: readonly [number, number] | readonly [number, number, number];
    answer: number;
};

export type IntegerAddSubtractStrategy =
    | 'addition-counting-on'
    | 'subtraction-counting-back'
    | 'addition-make-ten'
    | 'addition-near-doubles'
    | 'addition-compensation'
    | 'subtraction-compensation'
    | 'subtraction-make-ten'
    | 'subtraction-think-addition';

export type IntegerAddSubtractStrategyStep = {
    kind: 'decomposition';
    whole: number;
    parts: readonly [number, number];
} | {
    kind: 'operation';
    operation: 'addition' | 'subtraction';
    leftOperand: number;
    rightOperand: number;
    result: number;
};

type IntegerAddSubtractStrategyEvidence<TStrategy extends IntegerAddSubtractStrategy> = {
    task: 'integer-add-subtract-strategy';
    strategy: TStrategy;
    operation: 'addition' | 'subtraction';
    leftOperand: number;
    rightOperand: number;
    answer: number;
    adjustment: number;
    steps: readonly IntegerAddSubtractStrategyStep[];
};

export type AdditionCountingOnProblem = IntegerAddSubtractStrategyEvidence<'addition-counting-on'>;
export type SubtractionCountingBackProblem = IntegerAddSubtractStrategyEvidence<'subtraction-counting-back'>;
export type AdditionMakeTenProblem = IntegerAddSubtractStrategyEvidence<'addition-make-ten'>;
export type AdditionNearDoublesProblem = IntegerAddSubtractStrategyEvidence<'addition-near-doubles'>;
export type AdditionCompensationProblem = IntegerAddSubtractStrategyEvidence<'addition-compensation'>;
export type SubtractionCompensationProblem = IntegerAddSubtractStrategyEvidence<'subtraction-compensation'>;
export type SubtractionMakeTenProblem = IntegerAddSubtractStrategyEvidence<'subtraction-make-ten'>;
export type SubtractionThinkAdditionProblem = IntegerAddSubtractStrategyEvidence<'subtraction-think-addition'>;

export type IntegerFlexibleStrategyProblem =
    | AdditionMakeTenProblem
    | AdditionNearDoublesProblem
    | AdditionCompensationProblem
    | SubtractionCompensationProblem
    | SubtractionMakeTenProblem
    | SubtractionThinkAdditionProblem;

export type IntegerAddSubtractStrategyProblem =
    | AdditionCountingOnProblem
    | SubtractionCountingBackProblem
    | IntegerFlexibleStrategyProblem;

export type MultiplicativeComparisonProblem = {
    referenceQuantity: number;
    scaleFactor: number;
    comparedQuantity: number;
    operation: 'multiplication' | 'division';
};

export type MultiplicationPlaceValuePart = {
    digit: number;
    placeValue: 1 | 10 | 100 | 1000;
    value: number;
};

export type MultiplicationOperandDecomposition = {
    operand: number;
    parts: readonly MultiplicationPlaceValuePart[];
};

export type MultiplicationPartialProduct = {
    largestPart: MultiplicationPlaceValuePart;
    smallestPart: MultiplicationPlaceValuePart;
    product: number;
};

export type MultiDigitMultiplicationProblem = {
    task: 'multi-digit-multiplication';
    largestOperand: number;
    smallestOperand: number;
    largestOperandDigits: 1 | 2 | 3 | 4;
    smallestOperandDigits: 1 | 2;
    largestDecomposition: MultiplicationOperandDecomposition;
    smallestDecomposition: MultiplicationOperandDecomposition;
    partialProducts: readonly MultiplicationPartialProduct[];
    product: number;
};

/** One multiplicand digit multiplied by one multiplier digit, right to left. */
export type StandardMultiplicationDigitStep = {
    /** Zero-based decimal place in the unshifted partial product. */
    placeIndex: number;
    multiplicandDigit: number;
    carryIn: number;
    /** multiplicandDigit * the row's multiplierDigit + carryIn. */
    workingValue: number;
    resultDigit: number;
    carryOut: number;
};

/** One conventional partial-product row, including rows for zero multiplier digits. */
export type StandardMultiplicationPartialRow = {
    /** Zero-based decimal place of this digit in the multiplier. */
    shiftPlaces: number;
    multiplierDigit: number;
    /** One step per multiplicand digit, ordered from ones to highest place. */
    columns: readonly StandardMultiplicationDigitStep[];
    /** Carry after the highest multiplicand digit; the leading digit when nonzero. */
    leadingCarry: number;
    unshiftedProduct: number;
    alignedProduct: number;
};

/** One column in the sum of the place-aligned partial-product rows. */
export type StandardMultiplicationSumColumn = {
    placeIndex: number;
    /** One digit per partial row, in the same order as partialRows. */
    addendDigits: readonly number[];
    carryIn: number;
    workingValue: number;
    resultDigit: number;
    carryOut: number;
};

/**
 * Exact conventional vertical multiplication of positive whole-number factors.
 * The multiplicand has 2–4 digits, the multiplier has 2–3, and both are at least 10.
 * All values are safe integers. partialRows are ordered by multiplier digits from
 * ones upward, including zero digits; row j has shiftPlaces = j and multiplierDigit
 * = floor(multiplier / 10^j) % 10. Each row's columns run from ones upward with
 * carryIn initially zero and then equal to the preceding carryOut. Each step has
 * workingValue = multiplicandDigit * multiplierDigit + carryIn,
 * resultDigit = workingValue % 10, and carryOut = floor(workingValue / 10).
 * leadingCarry equals the final carryOut, unshiftedProduct equals multiplicand
 * times multiplierDigit, and alignedProduct = unshiftedProduct * 10^shiftPlaces.
 * sumColumns likewise run from ones upward with one column per product digit.
 * Each addend digit comes from its row's alignedProduct; carryIn starts at zero
 * and then equals the preceding carryOut. Each workingValue is carryIn plus
 * sum(addendDigits), with resultDigit = workingValue % 10 and carryOut =
 * floor(workingValue / 10). The result digits reconstruct product =
 * multiplicand * multiplier = sum(alignedProduct), and the final carryOut is zero.
 */
export type StandardMultiplicationProblem = {
    kind: 'whole-number-standard-multiplication';
    multiplicand: number;
    multiplier: number;
    product: number;
    partialRows: readonly StandardMultiplicationPartialRow[];
    sumColumns: readonly StandardMultiplicationSumColumn[];
};

/** One positional long-division subtraction, ending at the stated original dividend column. */
export type StandardDivisionStep = {
    columnIndex: number;
    placeValue: number;
    previousRemainder: number;
    /** The first step consumes a prefix; every subsequent step consumes one digit. */
    broughtDownDigits: readonly number[];
    partialDividend: number;
    quotientDigit: number;
    product: number;
    remainder: number;
    nextBringDown?: {sourceColumn: number; digit: number; partialDividend: number};
};

/**
 * Exact base-ten standard division of a multi-digit whole dividend by a positive
 * whole divisor. The first step consumes the shortest dividend prefix at least
 * the divisor, or all digits when the quotient is zero. Subsequent steps consume
 * every remaining digit, including after a zero remainder. A step's partial
 * dividend is previousRemainder * 10^broughtDownDigits.length plus those digits;
 * product = divisor * quotientDigit and remainder = partialDividend - product,
 * with 0 <= remainder < divisor. Steps and quotient digits have equal length;
 * quotientStartColumn is the first step's columnIndex. Written quotient digits
 * retain internal/trailing zeros and have no leading zero except the sole 0.
 * Place values are 10^(dividendDigits.length - 1 - columnIndex). The optional
 * nextBringDown records the next step's original source digit and partial value.
 * Globally dividend = divisor * quotient + remainder. All numbers are safe integers.
 */
export type StandardDivisionProblem = {
    kind: 'whole-number-standard-division';
    base: 10;
    dividend: number;
    divisor: number;
    quotient: number;
    remainder: number;
    dividendDigits: readonly number[];
    quotientStartColumn: number;
    quotientDigits: readonly number[];
    steps: readonly StandardDivisionStep[];
};

/**
 * Exact nonnegative base-ten value coefficient / 10^scale. Coefficient and scale
 * are safe integers, 0 <= scale <= 15 keeps decimal powers safe, and numeral is their exact positional spelling:
 * no scientific notation or redundant integer leading zeros, exactly scale
 * fractional digits, and an integer zero below one. Supplied trailing zeros remain.
 */
export type ExactDecimalValue = {
    coefficient: number;
    scale: number;
    numeral: string;
};

/** One addition or subtraction column, ordered from the rightmost place upward. */
export type DecimalStandardAddSubtractColumn = {
    placeExponent: number;
    topDigit: number;
    bottomDigit: number;
    regroupIn: 0 | 1;
    regroupOut: 0 | 1;
    /** Addition: a+b+in. Subtraction: a-in+10*out, before subtracting b. */
    workingValue: number;
    resultDigit: number;
};

/**
 * Original decimal forms plus their common-scale alignment and complete column
 * trace. Alignment scale is max(original scales); coefficients/numerals append
 * zeros exactly. Result retains that scale. Columns cover every fractional place
 * and at least the ones place, all operand digits, and an addition overflow when
 * present. Regroup state connects adjacent columns and ends at zero. Subtraction
 * is nonnegative; workingValue is after borrowing and never a temporary -1.
 */
export type DecimalStandardAddSubtractProblem = {
    kind: 'decimal-standard-add-subtract';
    base: 10;
    operation: 'addition' | 'subtraction';
    top: ExactDecimalValue;
    bottom: ExactDecimalValue;
    result: ExactDecimalValue;
    alignment: {
        scale: number;
        topCoefficient: number;
        bottomCoefficient: number;
        topNumeral: string;
        bottomNumeral: string;
    };
    columns: readonly DecimalStandardAddSubtractColumn[];
};

/**
 * Full integer coefficient multiplication followed by exact decimal placement.
 * Operand digit arrays are minimal, most significant first (zero is [0]). Every
 * multiplier digit has a partial row, including zero digits; every multiplicand
 * digit has a carry step. The existing row/column arithmetic invariants apply
 * without the old whole-number operand-width restrictions. Sum columns cover
 * minimal unscaled-product digits (one column when zero). Product coefficient
 * equals unscaledProduct and its scale equals the sum of original scales.
 * Decimal-placement coefficientDigits are minimal; paddedDigits have at least
 * totalScale+1 positions and decimalIndex = paddedDigits.length-totalScale.
 */
export type DecimalStandardMultiplicationProblem = {
    kind: 'decimal-standard-multiplication';
    base: 10;
    multiplicand: ExactDecimalValue;
    multiplier: ExactDecimalValue;
    multiplicandDigits: readonly number[];
    multiplierDigits: readonly number[];
    product: ExactDecimalValue;
    unscaledProduct: number;
    partialRows: readonly StandardMultiplicationPartialRow[];
    sumColumns: readonly StandardMultiplicationSumColumn[];
    decimalPlacement: {
        totalScale: number;
        coefficientDigits: readonly number[];
        paddedDigits: readonly number[];
        decimalIndex: number;
    };
};

export type DecimalStandardDivisionStep = {
    endColumnIndex: number;
    quotientPlaceExponent: number;
    source: 'original' | 'extension-zero';
    previousRemainder: number;
    broughtDownDigits: readonly number[];
    partialDividend: number;
    quotientDigit: number;
    product: number;
    remainder: number;
};

/**
 * Exact terminating division, preserving original decimal forms. Both operands
 * are multiplied by 10^originalDivisor.scale; the normalized divisor is its
 * original positive coefficient. The normalized dividend can remain decimal.
 * sourceDigits spell that normalized dividend with the point omitted, retaining
 * its integer zero and supplied fractional zeros; decimalIndex counts integer
 * digits. The first step consumes the shortest integer prefix >= divisor, or
 * all integer digits with quotient 0. Later steps consume one original digit,
 * then extension zeros only when needed. All original digits are consumed even
 * after remainder 0. Step exponent is decimalIndex-1-endColumnIndex; each partial
 * equals previousRemainder*10^broughtDownDigits.length plus those digits, product
 * equals normalizedDivisor*quotientDigit, and remainder is partial-product in
 * [0,normalizedDivisor). The final remainder is 0. Quotient digits correspond
 * exactly to steps, including internal and decimal zeros; a below-one quotient
 * has a written ones-place 0. Quotient display scale retains original normalized
 * fractional precision or the greater precision needed for exact termination.
 * Every coefficient, power and integer working value in the payload is safe.
 */
export type DecimalStandardDivisionProblem = {
    kind: 'decimal-standard-division';
    base: 10;
    dividend: ExactDecimalValue;
    divisor: ExactDecimalValue;
    quotient: ExactDecimalValue;
    normalization: {
        shiftPlaces: number;
        powerOfTen: number;
        dividend: ExactDecimalValue;
        divisor: number;
    };
    sourceDigits: readonly number[];
    decimalIndex: number;
    quotientStartColumn: number;
    quotientDigits: readonly number[];
    steps: readonly DecimalStandardDivisionStep[];
};

export type DivisionPlaceValuePart = {
    digit: number;
    placeValue: 1 | 10 | 100 | 1000;
    value: number;
};

export type DivisionOperandDecomposition = {
    operand: number;
    parts: readonly DivisionPlaceValuePart[];
};

export type DivisionPartialQuotientStep = {
    /** Decimal quotient digit, 0–9; a zero-place step is representable. */
    quotientDigit: number;
    placeValue: 1 | 10 | 100 | 1000;
    partialQuotient: number;
    remainingBefore: number;
    partialProduct: number;
    remainingAfter: number;
};

/**
 * Exact base-ten partial-quotient division. The dividend has 1–4 digits and the
 * divisor has 1–2 digits, matching their recorded widths and decompositions.
 * Ordered steps subtract divisor * partialQuotient from the running amount;
 * their chunks sum to quotient, and the final remaining amount is remainder.
 * In all cases dividend = divisor * quotient + remainder, with 0 <= remainder
 * < divisor. A zero remainder is valid for exact division, and zero quotient
 * digits may be represented without changing this payload shape.
 */
export type MultiDigitDivisionProblem = {
    task: 'multi-digit-division';
    dividend: number;
    divisor: number;
    quotient: number;
    remainder: number;
    dividendDigits: 1 | 2 | 3 | 4;
    divisorDigits: 1 | 2;
    dividendDecomposition: DivisionOperandDecomposition;
    divisorDecomposition: DivisionOperandDecomposition;
    partialQuotients: readonly DivisionPartialQuotientStep[];
};

export type PositiveFactorPair = {
    lowerFactor: number;
    upperFactor: number;
};

export type PositiveFactorEvidence = {
    number: number;
    /** Complete ascending list of the number's positive factors. */
    factors: readonly number[];
    factorCount: number;
    /** Unique factor pairs, ordered from the smallest lower factor upward. */
    factorPairs: readonly PositiveFactorPair[];
};

export type FactorPairsProblem = PositiveFactorEvidence & {
    kind: 'factor-pairs';
};

export type OneDigitMultipleTestProblem = {
    kind: 'one-digit-multiple-test';
    candidate: number;
    divisor: number;
    quotient: number;
    remainder: 0;
    isMultiple: true;
};

export type PrimeClassificationProblem = PositiveFactorEvidence & {
    kind: 'prime-classification';
    classification: 'prime';
};

export type CompositeClassificationProblem = PositiveFactorEvidence & {
    kind: 'composite-classification';
    classification: 'composite';
};

export type FactorClassificationProblem =
    | PrimeClassificationProblem
    | CompositeClassificationProblem;

export type FactorPairsOrMultipleTestProblem = FactorPairsProblem | OneDigitMultipleTestProblem;

export type FactorMultipleRelationsProblem =
    | FactorPairsProblem
    | OneDigitMultipleTestProblem
    | FactorClassificationProblem;

/** A full common-factor extraction, with positive original addends at most 100. */
export type FullCommonFactorDistributionProblem = {
    kind: 'full-common-factor-distribution';
    addends: readonly [number, number];
    sum: number;
    /** Complete ascending positive common divisors; the last is gcd > 1. */
    commonDivisors: readonly number[];
    gcd: number;
    residualAddends: readonly [number, number];
    residualSum: number;
    /** Complete common-divisor list proves the residual addends are coprime. */
    residualCommonDivisors: readonly [1];
    /** gcd times each residual, in original addend order. */
    distributedProducts: readonly [number, number];
};

export type CommonDivisorWitness = {
    kind: 'defined';
    value: number;
    commonDivisors: readonly number[];
    /** inputs = value times these nonnegative, coprime cofactors. */
    cofactors: readonly [number, number];
    cofactorCommonDivisors: readonly [1];
} | {kind: 'undefined-zero-pair'};

export type CommonMultipleWitness = {
    kind: 'positive';
    value: number;
    /** The opposite GCD cofactors: inputs[i] times commonMultipliers[i] = value. */
    commonMultipliers: readonly [number, number];
    commonProducts: readonly [number, number];
} | {
    kind: 'zero-extension';
    value: 0;
    /** Complete indices of zero inputs; the zero extension applies iff nonempty. */
    zeroInputIndices: readonly (0 | 1)[];
    /** Both inputs times zero, without division by an input or a claimed least positive value. */
    zeroProducts: readonly [0, 0];
};

/**
 * Both canonical relations for whole inputs 0..100. GCD(0,0) is undefined;
 * LCM is extended to zero when either input is zero. Positive LCM uses the
 * supplied coprime GCD cofactors u,v: L = gcd*u*v = first*v = second*u.
 * No field selects a learner task; either pair view accepts every witness branch.
 */
export type CommonFactorMultipleProblem = {
    kind: 'common-factor-multiple-relations';
    inputs: readonly [number, number];
    gcd: CommonDivisorWitness;
    lcm: CommonMultipleWitness;
};

export type ArithmeticWordProblemTwoStep = {
    kind: 'two-step';
    num1: number;
    num2: number;
    num3: number;
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    answer: number;
};

export type RemainderInterpretation = 'use-quotient' | 'round-up' | 'use-remainder';

export type ArithmeticWordProblemInterpretedRemainder = {
    kind: 'interpreted-remainder';
    dividend: number;
    divisor: number;
    quotient: number;
    remainder: number;
};

export type ArithmeticWordProblemLetterEquation = {
    kind: 'letter-equation';
    operands: readonly [number, number, number];
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    answer: number;
};

export type ArithmeticWordProblemRounding = {
    kind: 'rounding';
    operands: readonly [number, number, number];
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    answer: number;
    roundingPlace: 10 | 100 | 1000 | 10000 | 100000;
    roundedAnswer: number;
};

export type ArithmeticWordProblemGrade4 =
    | ArithmeticWordProblemInterpretedRemainder
    | ArithmeticWordProblemLetterEquation
    | ArithmeticWordProblemRounding;

/** Generator contract shared by legacy and Grade 4 multi-step word problems. */
export type ArithmeticWordProblemMultistep = ArithmeticWordProblemTwoStep | ArithmeticWordProblemGrade4;

/** Shared payload accepted by the reusable one-step and multi-step word-problem view. */
export type ArithmeticWordProblemWithin100 = ArithmeticPairProblem | ArithmeticWordProblemTwoStep;
export type ArithmeticWordProblem = ArithmeticPairProblem | ArithmeticWordProblemMultistep;

export type ArithmeticDecomposeProblem = {
    targetNumber: number;
    pair1: [number, number];
    pair2: [number, number];
};

export type EquationJudgmentProblem = {
    num1: number;
    num2: number;
    operation: 'addition' | 'subtraction';
    answer: number;
};

export type ArithmeticEstimationProblem = {
    /** Inclusive integer domain for the exact relation and its rounded evidence. */
    numberDomain: {min: number; max: number};
    num1: number;
    num2: number;
    operation: ArithmeticOperation;
    roundedNum1: number;
    roundedNum2: number;
    roundingPlace: 10;
    exactAnswer: number;
    estimatedAnswer: number;
};

export type ArithmeticPatternOperation = 'addition' | 'multiplication';

export type ArithmeticOperationTablePatternProblem = {
    kind: 'operation-table';
    operation: ArithmeticPatternOperation;
    operands: readonly number[];
    values: readonly (readonly number[])[];
};

export type ArithmeticPatternRecurrence =
    | {
        kind: 'add-constant';
        start: number;
        operand: number;
    }
    | {
        kind: 'multiply-constant';
        start: number;
        operand: number;
    }
    | {
        kind: 'position-multiple';
        factor: number;
    };

export type ArithmeticPatternEmergentFeature =
    | {kind: 'alternating-parity'}
    | {kind: 'even-after-start'}
    | {kind: 'operand-order-invariance'}
    | {kind: 'two-step-recurrence'; combinedOperand: number}
    | {kind: 'constant-difference'; difference: number};

export type ArithmeticPatternLawWitness =
    | {
        law: 'commutative';
        operands: readonly [number, number];
        result: number;
    }
    | {
        law: 'associative';
        operands: readonly [number, number, number];
        result: number;
    }
    | {
        law: 'distributive';
        multiplier: number;
        addends: readonly [number, number];
        result: number;
    };

export type ArithmeticRecurrencePatternProblem = {
    kind: 'recurrence';
    recurrence: ArithmeticPatternRecurrence;
    terms: readonly number[];
    emergentFeature: ArithmeticPatternEmergentFeature;
    lawWitness?: ArithmeticPatternLawWitness;
};

export type ArithmeticPatternProblem =
    | ArithmeticOperationTablePatternProblem
    | ArithmeticRecurrencePatternProblem;

/** Terms include the start at index zero and advance by the stated increment. */
export type ArithmeticPairedPatternSequence = {
    start: number;
    rule: {kind: 'add-constant'; increment: number};
    terms: readonly number[];
};

/** When present, the second term at every position follows this exact relation to the first. */
export type ArithmeticPairedPatternCorrespondence =
    | {kind: 'multiplicative'; factor: number}
    | {kind: 'additive'; difference: number};

/** Complete, aligned numerical sequences; correspondence is present when that relation is claimed. */
export type ArithmeticPairedPatternProblem = {
    kind: 'paired-additive-patterns';
    first: ArithmeticPairedPatternSequence;
    second: ArithmeticPairedPatternSequence;
    correspondence?: ArithmeticPairedPatternCorrespondence;
};

/**
 * Ordered pairs derived from two aligned additive patterns. Both sequences and
 * points have equal length; points[i] is {x: first.terms[i], y: second.terms[i]}.
 * The first component is horizontal and the second is vertical. All values are
 * nonnegative safe integers, and at least one point lies on an axis.
 */
export type CoordinatePatternPairsProblem = {
    kind: 'coordinate-pattern-pairs';
    first: ArithmeticPairedPatternSequence;
    second: ArithmeticPairedPatternSequence;
    points: readonly {x: number; y: number}[];
};

/**
 * One mathematical two-axis frame. Both axes start at the same (0, 0) origin;
 * their positive unit vectors (1, 0) and (0, 1) have dot product zero. Each
 * axis has its own uniform positive tick step, and `tickValues` lists exactly
 * 0, step, 2 × step, ... through its final tick (4–8 intervals). The x-axis
 * names the x-coordinate and the y-axis names the y-coordinate.
 *
 * `travel` gives separate nonnegative safe-integer distances from the origin
 * in the positive x/right and y/up directions, each equal to a displayed tick
 * value. A view may project these as ordered-pair notation and ask for their
 * interpretation; the payload neither forms that notation nor selects a
 * learner action, point-plotting task, prompt, or blank.
 */
export type CoordinateSystemProblem = Readonly<{
    kind: 'coordinate-system-foundations';
    origin: Readonly<{x: 0; y: 0}>;
    rightAngleDegrees: 90;
    axes: Readonly<{
        horizontal: Readonly<{
            axisName: 'x';
            coordinateName: 'x';
            positiveUnitVector: Readonly<{x: 1; y: 0}>;
            tickStep: 1 | 2;
            tickValues: readonly number[];
        }>;
        vertical: Readonly<{
            axisName: 'y';
            coordinateName: 'y';
            positiveUnitVector: Readonly<{x: 0; y: 1}>;
            tickStep: 1 | 2;
            tickValues: readonly number[];
        }>;
    }>;
    travel: Readonly<{
        xUnits: number;
        yUnits: number;
    }>;
}>;

export type ContextualCoordinateValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ContextualCoordinateLocationId = 'pond' | 'garden' | 'playground';
export type ContextualCoordinateLocation<Id extends ContextualCoordinateLocationId> = Readonly<{
    id: Id;
    xValue: ContextualCoordinateValue;
    yValue: ContextualCoordinateValue;
}>;

/**
 * Three distinct park locations measured from the named gate. `xValue` is the
 * number of blocks east of the gate and `yValue` the number of blocks north;
 * each is a positive safe integer at most 8, so every location is in the
 * nonnegative first quadrant. No two locations have the same (xValue, yValue).
 * `referenceLocationId` designates one existing landmark in the situation;
 * it does not prescribe a learner action. Both quantities share the gate as
 * their zero reference and use the same block unit. Views supply the prose,
 * Cartesian axes, plotted markers, ordered-pair notation, and task wording.
 */
export type ContextualCoordinateProblem = Readonly<{
    kind: 'contextual-coordinate-locations';
    situation: Readonly<{
        kind: 'park-map';
        originLandmark: 'park-gate';
        horizontalQuantity: Readonly<{
            kind: 'eastward-distance';
            positiveDirection: 'east';
            unitId: 'block';
        }>;
        verticalQuantity: Readonly<{
            kind: 'northward-distance';
            positiveDirection: 'north';
            unitId: 'block';
        }>;
    }>;
    locations: readonly [
        ContextualCoordinateLocation<'pond'>,
        ContextualCoordinateLocation<'garden'>,
        ContextualCoordinateLocation<'playground'>
    ];
    referenceLocationId: ContextualCoordinateLocationId;
}>;

export type LegacyIntegerRoundingProblem = {
    number: number;
    roundingPlace: 10 | 100;
    lowerMultiple: number;
    midpoint: number;
    upperMultiple: number;
    roundedValue: number;
    direction: 'down' | 'up';
    distanceLower: number;
    distanceUpper: number;
    isMidpointTie: boolean;
};

export type MultiDigitIntegerRoundingProblem = {
    task: 'multi-digit-integer-rounding';
    number: number;
    roundingPlace: 10 | 100 | 1000 | 10000 | 100000;
    lowerMultiple: number;
    midpoint: number;
    upperMultiple: number;
    roundedValue: number;
    direction: 'down' | 'up';
    distanceLower: number;
    distanceUpper: number;
    isMidpointTie: boolean;
};

export type IntegerRoundingProblem =
    | LegacyIntegerRoundingProblem
    | MultiDigitIntegerRoundingProblem;

/** One requested decimal rounding place and its exact unit in ten-thousandths. */
export type DecimalRoundingPlace =
    | {name: 'hundreds'; quantumInTenThousandths: 1000000}
    | {name: 'tens'; quantumInTenThousandths: 100000}
    | {name: 'ones'; quantumInTenThousandths: 10000}
    | {name: 'tenths'; quantumInTenThousandths: 1000}
    | {name: 'hundredths'; quantumInTenThousandths: 100}
    | {name: 'thousandths'; quantumInTenThousandths: 10};

/**
 * Exact decimal rounding evidence: all numeric fields are safe integers measured
 * in ten-thousandths. The input is nonnegative with input % 10000 !== 0.
 * With q = roundingPlace.quantumInTenThousandths, lower and upper are adjacent
 * multiples (upper = lower + q) and lower < input < upper. Midpoint = lower + q/2;
 * positive distances are input - lower and upper - input, summing to q.
 * The rounded value is the nearer candidate; equal distances tie upward.
 */
export type DecimalRoundingProblem = {
    kind: 'decimal-place-rounding';
    inputInTenThousandths: number;
    roundingPlace: DecimalRoundingPlace;
    lowerCandidateInTenThousandths: number;
    upperCandidateInTenThousandths: number;
    midpointInTenThousandths: number;
    roundedInTenThousandths: number;
    direction: 'down' | 'up';
    isMidpointTie: boolean;
    distanceToLowerInTenThousandths: number;
    distanceToUpperInTenThousandths: number;
};

export type EqualGroupsOperation =
    | 'addition'
    | 'multiplication'
    | 'partitive-division'
    | 'quotative-division';

export type EqualGroupsProblem = {
    operation: EqualGroupsOperation;
    groupCount: number;
    groupSize: number;
    total: number;
    answer: number;
};

export type NumberArrayProblem = EqualGroupsProblem & {
    rows: number;
    columns: number;
    addends: number[];
};

export type EqualGroupsCollectionProblem = EqualGroupsProblem;

export type PlaceValueTeenProblem = {
    ones: number;
    target: number;
};

export type PlaceValueTensBundlesProblem = {
    tens: number;
    ones: 0;
    target: number;
    hundreds?: never;
};

export type PlaceValueHundredsBundlesProblem = {
    hundreds: number;
    tens: 0 | 10;
    ones: 0;
    target: number;
};

export type PlaceValueBundlesProblem = PlaceValueTensBundlesProblem | PlaceValueHundredsBundlesProblem;

export type PlaceValueMakeTenProblem = {
    givenNumber: number;
    missingNumber: number;
    target: 10;
};

export type WholeNumberPlaceName =
    | 'ones'
    | 'tens'
    | 'hundreds'
    | 'thousands'
    | 'ten-thousands'
    | 'hundred-thousands'
    | 'millions';

export type WholeNumberPlaceValue = {
    name: WholeNumberPlaceName;
    exponent: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    digit: number;
    value: number;
};

export type LegacyPlaceValueExpandedProblem = {
    number: number;
    terms: number[];
};

export type MultiDigitPlaceValueExpandedProblem = {
    task: 'multi-digit-expanded-form';
    number: number;
    terms: number[];
    placeValues: WholeNumberPlaceValue[];
};

export type PlaceValueExpandedProblem =
    | LegacyPlaceValueExpandedProblem
    | MultiDigitPlaceValueExpandedProblem;

export type PlaceValueDigits = {hundreds: number; tens: number; ones: number};

export type PlaceValueArithmeticOperandProfile =
    | 'general'
    | 'two-digit-single-digit'
    | 'two-digit-multiple-of-ten'
    | 'multiples-of-ten';

export type PlaceValueRegroupingEvidence = {
    kind: 'none' | 'compose-ten' | 'decompose-ten';
    onesBefore: number;
    onesAfter: number;
    tensExchanged: 0 | 1;
};

export type PlaceValueArithmeticStep = {
    kind: 'combine-ones' | 'compose-ten' | 'decompose-ten' | 'combine-tens' | 'subtract-ones' | 'subtract-tens' | 'result';
    place: 'ones' | 'tens' | 'hundreds' | 'result';
};

export type PlaceValueArithmeticProblem = {
    num1: number;
    num2: number;
    answer: number;
    operation: 'addition' | 'subtraction';
    operandProfile: PlaceValueArithmeticOperandProfile;
    operands: [PlaceValueDigits, PlaceValueDigits];
    result: PlaceValueDigits;
    regrouping: PlaceValueRegroupingEvidence;
    strategySteps: readonly [PlaceValueArithmeticStep, PlaceValueArithmeticStep, PlaceValueArithmeticStep];
};

export type PlaceValueName =
    | 'ones'
    | 'tens'
    | 'hundreds'
    | 'thousands'
    | 'ten-thousands'
    | 'hundred-thousands';

export type PlaceValueScalingPlace = {
    name: PlaceValueName;
    exponent: 0 | 1 | 2 | 3 | 4 | 5;
    /** Zero-based index in the left-to-right `digits` array. */
    digitIndex: number;
    value: number;
};

export type PlaceValueScalingProblem = {
    task: 'adjacent-place-scaling';
    number: number;
    /** Six base-ten digits ordered from hundred-thousands through ones. */
    digits: readonly [number, number, number, number, number, number];
    repeatedDigit: number;
    leftPlace: PlaceValueScalingPlace;
    rightPlace: PlaceValueScalingPlace;
    scaleFactor: 10;
};

export type DecimalScalingPlaceName =
    | 'hundreds'
    | 'tens'
    | 'ones'
    | 'tenths'
    | 'hundredths'
    | 'thousandths';

export type DecimalScalingExponent = -3 | -2 | -1 | 0 | 1 | 2;

export type DecimalScalingPlace = {
    name: DecimalScalingPlaceName;
    exponent: DecimalScalingExponent;
    /** Zero-based position in the left-to-right base-ten chart. */
    digitIndex: 0 | 1 | 2 | 3 | 4 | 5;
    /** Exact place unit and selected digit contribution, both in thousandths. */
    unitInThousandths: number;
    digitValueInThousandths: number;
};

/**
 * Exact adjacent-place evidence across whole and fractional base-ten places.
 * Digits run from hundreds to thousandths. The places contain the same nonzero
 * digit, are adjacent, and satisfy higherValue = 10 * lowerValue and
 * lowerValue = higherValue / 10. Fractional digits are zero in whole cases.
 */
export type DecimalAdjacentPlaceScalingProblem = {
    kind: 'decimal-adjacent-place-scaling';
    digits: readonly [number, number, number, number, number, number];
    numberInThousandths: number;
    repeatedDigit: number;
    higherPlace: DecimalScalingPlace;
    lowerPlace: DecimalScalingPlace;
    scale: {factor: 10; reciprocalNumerator: 1; reciprocalDenominator: 10};
};

/** The empty product 10^0 = 1 has no repeated factors. */
export type PowerTenPower =
    | Readonly<{base: 10; exponent: 0; value: 1; repeatedFactors: readonly []}>
    | Readonly<{base: 10; exponent: 1; value: 10; repeatedFactors: readonly [10]}>
    | Readonly<{base: 10; exponent: 2; value: 100; repeatedFactors: readonly [10, 10]}>;

/** A source digit's exact whole-number contribution before and after scaling. */
export type WholePowerTenPlaceShift = Readonly<{
    digitIndex: number;
    digit: number;
    originalPlaceExponent: number;
    productPlaceExponent: number;
    originalContribution: number;
    productContribution: number;
}>;

export type WholePowerTenZeroPattern =
    | Readonly<{
        kind: 'positive';
        originalTrailingZeros: number;
        introducedTrailingZeros: number;
        productTrailingZeros: number;
    }>
    | Readonly<{
        kind: 'zero';
        originalTrailingZeros: null;
        introducedTrailingZeros: 0;
        productTrailingZeros: null;
    }>;

export type WholePowerTenScaleStep = Readonly<{
    original: number;
    power: PowerTenPower;
    product: number;
    /** One entry for each source numeral digit, including an existing zero. */
    placeShifts: readonly WholePowerTenPlaceShift[];
    zeroPattern: WholePowerTenZeroPattern;
}>;

/**
 * The primary series fixes one positive original across exponents 0, 1, and 2.
 * The two additional witnesses distinguish pre-existing trailing zeros from
 * the special result 0, for which a trailing-zero count is undefined.
 */
export type WholeNumberPowerTenScalingProblem = Readonly<{
    kind: 'whole-number-power-ten-scaling';
    primarySeries: readonly [
        WholePowerTenScaleStep,
        WholePowerTenScaleStep,
        WholePowerTenScaleStep
    ];
    existingZeroWitness: WholePowerTenScaleStep;
    zeroWitness: WholePowerTenScaleStep;
}>;

/** Exact nonnegative decimal: value = unscaled / 10^scale. */
export type PowerTenDecimalValue = Readonly<{
    unscaled: number;
    scale: number;
    numeral: string;
}>;

/** A nonzero source digit's exact place-value change. */
export type DecimalPowerTenPlaceShift = Readonly<{
    digitIndex: number;
    digit: number;
    originalPlaceExponent: number;
    resultPlaceExponent: number;
    originalContribution: PowerTenDecimalValue;
    resultContribution: PowerTenDecimalValue;
}>;

export type DecimalPowerTenScaleStep = Readonly<{
    power: PowerTenPower;
    before: PowerTenDecimalValue;
    after: PowerTenDecimalValue;
    placeShifts: readonly DecimalPowerTenPlaceShift[];
    /** True when a nonzero digit moves across the ones/tenths boundary. */
    crossesUnitsPlace: boolean;
}>;

/**
 * One selected operation and one exact starting decimal across 10^0, 10^1,
 * and 10^2. At least the 10^2 row crosses the units place.
 */
export type DecimalPowerTenScalingProblem = Readonly<{
    kind: 'decimal-power-ten-scaling';
    operation: 'multiplication' | 'division';
    series: readonly [
        DecimalPowerTenScaleStep,
        DecimalPowerTenScaleStep,
        DecimalPowerTenScaleStep
    ];
}>;

/** Formalize the value or the positive-length repeated-ten product as 10^n. */
export type PowerTenNotationProblem = Readonly<{
    kind: 'power-ten-notation';
    power: PowerTenPower;
}>;

/**
 * An exact nonnegative base-ten value through thousandths. The chosen precision
 * is the last necessary fractional place: its final digit is nonzero. The
 * three digits always include zero placeholders, so 5.008 has wholePart 5,
 * digits [0, 0, 8], numerator 8, denominator 1000, and valueInThousandths
 * 5008. The numeral is the canonical written form of the same value.
 */
export type DecimalWritingProblem = Readonly<{
    kind: 'decimal-writing';
    base: 10;
    wholePart: number;
    valueInThousandths: number;
    canonicalNumeral: string;
    fractionalPart:
        | Readonly<{
            precision: 'tenths';
            digits: readonly [number, 0, 0];
            numerator: number;
            denominator: 10;
        }>
        | Readonly<{
            precision: 'hundredths';
            digits: readonly [number, number, 0];
            numerator: number;
            denominator: 100;
        }>
        | Readonly<{
            precision: 'thousandths';
            digits: readonly [number, number, number];
            numerator: number;
            denominator: 1000;
        }>;
}>;

export type DecimalExpandedPlace = Readonly<{
    name: WholeNumberPlaceName | 'tenths' | 'hundredths' | 'thousandths';
    /** Base-ten place exponent; the fractional places are -1, -2, and -3. */
    exponent: number;
    digit: number;
    /** Exact place unit, e.g. 100/1, 1/10, or 1/1000. */
    unitNumerator: number;
    unitDenominator: 1 | 10 | 100 | 1000;
    /** Exactly digit * unitNumerator / unitDenominator * 1000. */
    contributionInThousandths: number;
}>;

/**
 * Exact decimal decomposition through thousandths. `places` is ordered from
 * the highest whole place through thousandths without gaps, retaining zero
 * placeholders. `sumTerms` contains precisely the nonzero places in the same
 * order (at least two), and their exact contributions sum to the value. The
 * numeral, whole part, padded fractional digits, and precision all agree with
 * `valueInThousandths`.
 */
export type DecimalPlaceValueExpandedProblem = Readonly<{
    kind: 'decimal-place-value-expanded';
    base: 10;
    wholePart: number;
    fractionalDigits: readonly [number, number, number];
    fractionalPrecision: 1 | 2 | 3;
    valueInThousandths: number;
    canonicalNumeral: string;
    places: readonly DecimalExpandedPlace[];
    sumTerms: readonly DecimalExpandedPlace[];
}>;

export type DecimalPlaceComparisonPlace =
    | 'hundreds' | 'tens' | 'ones'
    | 'tenths' | 'hundredths' | 'thousandths';

/**
 * Exact value is `valueInThousandths / 1000`. The three whole and three
 * fractional digits are aligned with the same places on both operands;
 * `displayPrecision` independently controls the numeral's trailing zeros.
 */
export type DecimalPlaceComparisonOperand = Readonly<{
    wholePart: number;
    wholeDigits: readonly [number, number, number];
    fractionalDigits: readonly [number, number, number];
    displayPrecision: 1 | 2 | 3;
    displayNumeral: string;
    valueInThousandths: number;
}>;

type DecimalPlaceComparisonBase = Readonly<{
    kind: 'decimal-place-comparison';
    base: 10;
    left: DecimalPlaceComparisonOperand;
    right: DecimalPlaceComparisonOperand;
}>;

/**
 * The relation compares the exact thousandths values. An inequality witness
 * names the first unequal place after every listed higher place agrees;
 * equality witnesses agreement at all six aligned places. Thus `2.3` and
 * `2.300` can be equal despite different displayed precision.
 */
export type DecimalPlaceComparisonProblem = DecimalPlaceComparisonBase & (
    | Readonly<{
        relation: 'greater' | 'less';
        witness: Readonly<{
            kind: 'first-difference';
            decidingPlace: DecimalPlaceComparisonPlace;
            higherEqualPlaces: readonly DecimalPlaceComparisonPlace[];
            leftDigit: number;
            rightDigit: number;
        }>;
    }>
    | Readonly<{
        relation: 'equal';
        witness: Readonly<{
            kind: 'all-places-equal';
            equalPlaces: readonly DecimalPlaceComparisonPlace[];
        }>;
    }>
);

export type DecimalAddSubtractPlace = 'hundredths' | 'tenths' | 'ones';

/**
 * An exact nonnegative decimal below 10. The aligned digits are always
 * [ones, tenths, hundredths], including zero placeholders; the numeral is the
 * canonical, unpadded writing of valueInHundredths / 100.
 */
export type DecimalAddSubtractNumber = Readonly<{
    valueInHundredths: number;
    canonicalNumeral: string;
    alignedDigits: readonly [number, number, number];
}>;

/** Ordered from hundredths through ones, even when a place has digit zero. */
export type DecimalAddSubtractColumnStep = Readonly<{
    place: DecimalAddSubtractPlace;
    firstDigit: number;
    secondDigit: number;
    regroupIn: 0 | 1;
    regroupOut: 0 | 1;
    workingUnits: number;
    resultDigit: number;
}>;

/** Counts of drawable whole squares, tenth rods, and hundredth cells. */
export type DecimalAddSubtractUnitCounts = Readonly<{
    ones: number;
    tenths: number;
    hundredths: number;
}>;

export type DecimalAddSubtractModelStep =
    | Readonly<{
        kind: 'join-second' | 'remove-second';
        before: DecimalAddSubtractUnitCounts;
        after: DecimalAddSubtractUnitCounts;
    }>
    | Readonly<{
        kind: 'compose-ten' | 'decompose-one';
        /** The lower of the two adjacent places involved in the exchange. */
        lowerPlace: 'hundredths' | 'tenths';
        before: DecimalAddSubtractUnitCounts;
        after: DecimalAddSubtractUnitCounts;
    }>;

/**
 * Exact base-ten arithmetic through hundredths. All three values are integer
 * hundredths in [0, 999], with result = first +/- second. `columns` records
 * the written calculation in hundredths, tenths, ones order. In addition,
 * workingUnits = firstDigit + secondDigit + regroupIn, resultDigit is its
 * remainder mod 10, and regroupOut is the carry. In subtraction,
 * workingUnits = firstDigit - regroupIn + 10 * regroupOut, and resultDigit =
 * workingUnits - secondDigit; regroupOut borrows from the next higher place.
 * The final regroupOut is zero.
 *
 * `model.initial` is the first operand's unit counts. Addition joins the
 * second operand then composes tens from lower units, ending at the normalized
 * result counts. Subtraction decomposes higher units as needed, then removes
 * the second operand componentwise. Each exchange preserves the represented
 * hundredths and each step's `after` equals the next step's `before`. Thus a
 * zero-tenths cascade such as 1.02 - 0.38 records one whole becoming ten
 * tenths before one tenth becomes ten hundredths.
 */
export type DecimalAddSubtractProblem = Readonly<{
    kind: 'decimal-add-subtract';
    base: 10;
    scale: 100;
    operation: 'addition' | 'subtraction';
    first: DecimalAddSubtractNumber;
    second: DecimalAddSubtractNumber;
    result: DecimalAddSubtractNumber;
    columns: readonly [
        DecimalAddSubtractColumnStep,
        DecimalAddSubtractColumnStep,
        DecimalAddSubtractColumnStep
    ];
    model: Readonly<{
        initial: DecimalAddSubtractUnitCounts;
        steps: readonly DecimalAddSubtractModelStep[];
        final: DecimalAddSubtractUnitCounts;
    }>;
}>;

export type DecimalMultiplicationPlace = 'ones' | 'tenths' | 'hundredths';

/**
 * One nonzero place contribution along an operand's grid axis. Partitions are
 * ordered ones, tenths, hundredths, omit zero digits, and occupy consecutive
 * integer hundredth-unit intervals starting at zero.
 */
export type DecimalMultiplicationPartition = Readonly<{
    place: DecimalMultiplicationPlace;
    digit: number;
    valueInHundredths: number;
    startInHundredths: number;
}>;

/** Exact nonnegative operand below 10, with [ones, tenths, hundredths] digits. */
export type DecimalMultiplicationOperand = Readonly<{
    valueInHundredths: number;
    canonicalNumeral: string;
    alignedDigits: readonly [number, number, number];
    partitions: readonly DecimalMultiplicationPartition[];
}>;

/** A disjoint rectangle for one Cartesian pair of operand place partitions. */
export type DecimalMultiplicationRegion = Readonly<{
    firstPartitionIndex: number;
    secondPartitionIndex: number;
    columnStart: number;
    rowStart: number;
    columns: number;
    rows: number;
    cellCount: number;
    productInTenThousandths: number;
}>;

/**
 * Exact area model for decimal multiplication. The first operand partitions
 * the horizontal axis and the second partitions the vertical axis. Grid
 * width and height equal their respective integer-hundredths values. Each
 * cell has area 1/10000, so cellCount = width * height = product in exact
 * integer ten-thousandths. Every Cartesian pair of nonzero partitions has
 * one region, in first-then-second partition order, whose offsets and side
 * lengths match those partitions; the regions tile the grid without overlap
 * or gaps. Each region's cellCount = columns * rows = its exact partial
 * product, and the partial products sum to the whole product. Zero operands
 * have no partitions on their axis and an empty grid/region set. Canonical
 * generation bounds the countable grid to at most 1440 cells.
 */
export type DecimalMultiplicationProblem = Readonly<{
    kind: 'decimal-multiplication-model';
    base: 10;
    operandScale: 100;
    productScale: 10000;
    first: DecimalMultiplicationOperand;
    second: DecimalMultiplicationOperand;
    product: Readonly<{
        valueInTenThousandths: number;
        canonicalNumeral: string;
    }>;
    areaGrid: Readonly<{
        widthInHundredths: number;
        heightInHundredths: number;
        cellAreaInTenThousandths: 1;
        cellCount: number;
        regions: readonly DecimalMultiplicationRegion[];
    }>;
}>;

/** A decimal operand represented exactly as an integer count of hundredths. */
export type DecimalDivisionOperand = Readonly<{
    valueInHundredths: number;
    canonicalNumeral: string;
    /** Ones, tenths, hundredths, including positional zero placeholders. */
    alignedDigits: readonly [number, number, number];
}>;

/** One divisor-sized grouping bar, measured in hundredth-unit cells. */
export type DecimalDivisionGroupingBar = Readonly<{
    kind: 'full' | 'partial';
    /** Zero-based position in the ordered full-then-partial bar sequence. */
    index: number;
    capacityCells: number;
    filledCells: number;
    quotientContributionInTenThousandths: number;
}>;

export type DecimalDivisionPlace =
    | 'ones'
    | 'tenths'
    | 'hundredths'
    | 'thousandths'
    | 'ten-thousandths';

/** One exact step of dividing integer hundredth-unit counts. */
export type DecimalDivisionStep = Readonly<{
    place: DecimalDivisionPlace;
    partialDividend: number;
    quotientDigit: number;
    subtrahend: number;
    remainder: number;
}>;

/**
 * Exact decimal division with a concrete grouping and a written unit-count
 * trace. Dividend and nonzero divisor are integer hundredths with three
 * aligned digits; the quotient is an exact integer ten-thousandths, so
 * dividendInHundredths * 10000 is divisible by divisorInHundredths. The
 * canonical quotient numeral uses its minimum required precision (0–4).
 *
 * Grouping bars each have divisorInHundredths cells of value 0.01. The first
 * floor(dividend / divisor) bars are full, followed by at most one partial
 * bar with the remainder's cells. Filled cells sum to the dividend's
 * hundredth count; each bar's exact quotient contribution is
 * filledCells * 10000 / capacityCells, and contributions sum to the quotient.
 * Canonical samples use at most 16 cells per bar, four full bars and 80 drawn
 * cells so the model remains countable.
 *
 * The division trace starts at the ones place with the dividend's hundredth
 * count. Later partial dividends are ten times the preceding remainder. Each
 * step subtracts divisorInHundredths * quotientDigit, records a nonnegative
 * remainder below the divisor, and includes zero quotient digits, if needed.
 * Steps follow place order through ten-thousandths and stop at zero remainder;
 * their digits reconstruct the quotient exactly. The inverse witnesses
 * dividend = divisor * quotient in millionths without decimal rounding.
 */
export type DecimalDivisionProblem = Readonly<{
    kind: 'decimal-division-model';
    base: 10;
    operandScale: 100;
    quotientScale: 10000;
    dividend: DecimalDivisionOperand;
    divisor: DecimalDivisionOperand;
    quotient: Readonly<{
        valueInTenThousandths: number;
        canonicalNumeral: string;
        precision: 0 | 1 | 2 | 3 | 4;
        /** Ones through ten-thousandths, including zero placeholders. */
        alignedDigits: readonly [number, number, number, number, number];
    }>;
    grouping: Readonly<{
        unitValueInHundredths: 1;
        cellsPerGroup: number;
        fullGroupCount: number;
        remainderCells: number;
        bars: readonly DecimalDivisionGroupingBar[];
    }>;
    divisionTrace: Readonly<{
        dividendUnitCount: number;
        divisorUnitCount: number;
        steps: readonly DecimalDivisionStep[];
    }>;
    inverse: Readonly<{
        divisorTimesQuotientInMillionths: number;
        dividendInMillionths: number;
    }>;
}>;

export type CountingProblem = {
    numObjects: number;
    simpleAnswer: number;
    parity?: 'even' | 'odd';
};

/** Cardinalities of a nonempty subset and its containing collection. */
export type CountingSelectionProblem = {
    /** Subset cardinality, within the configured numeric bounds. */
    numObjects: number;
    /** Containing collection cardinality: numObjects <= availableCount <= upper bound. */
    availableCount: number;
    simpleAnswer: number;
    /** When constrained, the parity of the subset cardinality. */
    parity?: 'even' | 'odd';
};

export type CountingOffsetProblem<TStep extends 1 | 10 | 100> = {
    numObjects: number;
    incDecType: 'inc' | 'dec';
    incDecAnswer: number;
    simpleAnswer: number;
    stepSize: TStep;
    startPlaceValue: {hundreds?: number; tens: number; ones: number};
    resultPlaceValue: {hundreds?: number; tens: number; ones: number};
};

export type CountingOneOffsetProblem = CountingOffsetProblem<1>;
export type CountingTenOffsetProblem = CountingOffsetProblem<10>;
export type CountingHundredOffsetProblem = CountingOffsetProblem<100>;
export type CountingSmallOffsetProblem = CountingOneOffsetProblem | CountingTenOffsetProblem;
export type CountingIncDecProblem = CountingSmallOffsetProblem | CountingHundredOffsetProblem;

export type CountingSequenceProblem = {
    sequence: number[];
    stepSize: 1 | 5 | 10 | 100;
};



export type CountingClassifyCountProblem = {
    categories: Record<string, number>;
    numObjects: number;
};

export type CountingClassifySortProblem = {
    categories: Record<string, number>;
    numObjects: number;
    relation: 'most' | 'least' | 'ascending' | 'descending';
    /** Equal-count categories share a group; groups have strictly increasing counts. */
    ascendingGroups: string[][];
    minimumCategories: string[];
    maximumCategories: string[];
};

export type MeasurementStandardProblem = {
    bandLength: number;
    problemLength: number;
    useDecimals?: boolean;
    tool?: 'ruler' | 'tape';
};

export type MeasurementEstimateProblem = {
    referenceSize: 'small' | 'large';
    estimateVariant: 0 | 1 | 2;
    referenceVariant: 0 | 1 | 2 | 3;
};

export type MeasurementToolSelectionProblem = {
    object: 'pencil' | 'book' | 'table' | 'door';
    correctTool: 'ruler' | 'tape';
};

export type MeasurementConversionPairId =
    | 'kilometer-meter'
    | 'meter-centimeter'
    | 'kilogram-gram'
    | 'pound-ounce'
    | 'liter-milliliter'
    | 'hour-minute'
    | 'minute-second';

export type MeasurementConversionUnitId =
    | 'kilometer'
    | 'meter'
    | 'centimeter'
    | 'kilogram'
    | 'gram'
    | 'pound'
    | 'ounce'
    | 'liter'
    | 'milliliter'
    | 'hour'
    | 'minute'
    | 'second';

export type MeasurementConversionPair = {
    id: MeasurementConversionPairId;
    quantityKind: 'length' | 'weight' | 'liquid-volume' | 'time';
    scalingKind: 'magnitude' | 'factor';
    largerUnit: MeasurementConversionUnitId;
    smallerUnit: MeasurementConversionUnitId;
    factor: 16 | 60 | 100 | 1000;
};

export type GenericUnitScaleRelationProblem = {
    largeUnitCount: number;
    smallUnitCount: number;
    unitsPerLarge: number;
};

export type MeasurementUnitEquivalence = {
    largerValue: number;
    smallerValue: number;
};

/**
 * One exact equality for the pair's two units. Both counts are positive safe
 * integers in hundredths, and smallerHundredths = largerHundredths * pair.factor.
 */
export type MeasurementConversionExactEquality = {
    largerHundredths: number;
    smallerHundredths: number;
};

/**
 * Two symmetric conversion equalities, available for either task direction.
 * Integer examples have integral quantities on both sides of each equality.
 * Decimal examples have a fractional larger-unit quantity in each equality.
 */
export type MeasurementConversionNumericExamples = {
    numberKind: 'integer' | 'decimal';
    equalities: readonly [
        MeasurementConversionExactEquality,
        MeasurementConversionExactEquality
    ];
};

export type StandardUnitEquivalencesProblem = {
    pair: MeasurementConversionPair;
    equivalents: readonly MeasurementUnitEquivalence[];
    /** Absent for the legacy five-row unit-equivalence profile. */
    numericExamples?: MeasurementConversionNumericExamples;
};

export type MeasurementConversionProblem =
    | GenericUnitScaleRelationProblem
    | StandardUnitEquivalencesProblem;

/**
 * A two-step measurement relation: convert the source quantity into the other
 * unit, then add another quantity already expressed in that target unit.
 * `conversion` obeys the pair factor; all counts are positive safe integers in
 * hundredths. The converted target count is the equality's smaller count when
 * sourceSide is 'larger', or its larger count when sourceSide is 'smaller'.
 * `totalTargetHundredths` equals that count plus `additionalTargetHundredths`.
 * Integer stories have every count divisible by 100. Decimal stories have a
 * fractional source or additional given quantity. The view chooses the prompt
 * and which result to withhold.
 */
export type MeasurementConversionStoryProblem = {
    kind: 'measurement-conversion-story';
    pair: MeasurementConversionPair;
    numberKind: 'integer' | 'decimal';
    sourceSide: 'larger' | 'smaller';
    conversion: MeasurementConversionExactEquality;
    additionalTargetHundredths: number;
    totalTargetHundredths: number;
};

export type MeasurementWordProblemKind =
    | 'length'
    | 'time'
    | 'liquid-volume'
    | 'weight'
    | 'money';

export type MeasurementWordProblemNumberKind = 'integer' | 'fraction' | 'decimal';

export type MeasurementWordProblemUnitId =
    | 'meter'
    | 'hour'
    | 'liter'
    | 'kilogram'
    | 'dollar';

export type MeasurementWordProblemUnit = {
    id: MeasurementWordProblemUnitId;
    singular: string;
    plural: string;
    symbol: string;
    symbolPlacement: 'prefix' | 'suffix';
};

/** Exact measured value. Its numeric value is numerator / denominator. */
export type MeasurementWordProblemValue = {
    numerator: number;
    denominator: number;
};

export type MeasurementWordProblemMeasuredOperand = {
    role: 'measured';
    value: MeasurementWordProblemValue;
};

export type MeasurementWordProblemGroupOperand = {
    role: 'group-count';
    count: number;
};

type MeasurementWordProblemBase = {
    measurementKind: MeasurementWordProblemKind;
    numberKind: MeasurementWordProblemNumberKind;
    unitId: MeasurementWordProblemUnitId;
    answer: MeasurementWordProblemValue;
};

export type MeasurementWordProblemAdditive = MeasurementWordProblemBase & {
    operation: 'addition' | 'subtraction';
    operands: readonly [MeasurementWordProblemMeasuredOperand, MeasurementWordProblemMeasuredOperand];
};

export type MeasurementWordProblemMultiplication = MeasurementWordProblemBase & {
    operation: 'multiplication';
    operands: readonly [MeasurementWordProblemGroupOperand, MeasurementWordProblemMeasuredOperand];
};

export type MeasurementWordProblemDivision = MeasurementWordProblemBase & {
    operation: 'division';
    operands: readonly [MeasurementWordProblemMeasuredOperand, MeasurementWordProblemGroupOperand];
};

export type MeasurementWordProblemGrade4 =
    | MeasurementWordProblemAdditive
    | MeasurementWordProblemMultiplication
    | MeasurementWordProblemDivision;

export type MeasurementNumberLineKind = MeasurementWordProblemKind;
export type MeasurementNumberLineUnitId = MeasurementWordProblemUnitId;

/** Exact number-line value. Its numeric value is numerator / denominator. */
export type MeasurementNumberLineValue = {
    numerator: number;
    denominator: number;
};

export type MeasurementNumberLineProblem = {
    measurementKind: MeasurementNumberLineKind;
    numberKind: 'fraction' | 'decimal';
    unitId: MeasurementNumberLineUnitId;
    tickValues: readonly MeasurementNumberLineValue[];
    targetIndex: number;
};

export type MeasurementLengthDifferenceProblem = {
    longerLength: number;
    shorterLength: number;
    difference: number;
    unitId: 'centimeter';
};

export type MeasurementAttributeProblem = {
    attribute: 'length' | 'height' | 'weight';
};

export type MeasurementCompareProblem = {
    attribute: 'length' | 'weight';
    relation: 'greater' | 'less';
    magnitudes: {
        smaller: number;
        larger: number;
    };
};

export type MeasurementOrderProblem = {
    magnitudes: readonly [number, number, number];
    direction: 'ascending' | 'descending';
};

export type LengthComparisonRelation = 'longer' | 'shorter';

export type MediatedLengthComparisonProblem = {
    premises: [
        {subject: 'A'; relation: LengthComparisonRelation; reference: 'B'},
        {subject: 'B'; relation: LengthComparisonRelation; reference: 'C'}
    ];
    askedRelation: LengthComparisonRelation;
    answer: 'A' | 'C';
};

export type LegacyComparisonProblem = {
    num1: number;
    num2: number;
    relation: 'less' | 'greater' | 'equal';
};

export type MultiDigitComparisonEvidence =
    | {
        kind: 'first-difference';
        placeName: WholeNumberPlaceName;
        exponent: 0 | 1 | 2 | 3 | 4 | 5 | 6;
        leftDigit: number;
        rightDigit: number;
        leftPlaceValue: number;
        rightPlaceValue: number;
    }
    | {
        kind: 'all-equal';
    };

export type MultiDigitComparisonProblem = {
    task: 'multi-digit-place-value-comparison';
    num1: number;
    num2: number;
    relation: 'less' | 'greater' | 'equal';
    evidence: MultiDigitComparisonEvidence;
};

export type ComparisonProblem = LegacyComparisonProblem | MultiDigitComparisonProblem;

export type OrderingProblem = {
    numbers: readonly number[];
};

export type LegacyWritingProblem = {
    number: number;
};

export type MultiDigitWritingProblem = {
    number: number;
    placeValues: WholeNumberPlaceValue[];
};

export type WritingProblem =
    | LegacyWritingProblem
    | MultiDigitWritingProblem;

/** Shared payload accepted by the number-line view for representation and pair arithmetic. */
export type NumberLineProblem = WritingProblem | ArithmeticPairProblem;

export type TimeIntervalSeconds = 1 | 60 | 1800 | 3600;

export type TimeProblem = {
    secondsSinceMidnight: number;
    intervalSeconds: TimeIntervalSeconds;
    period?: 'ante-meridiem' | 'post-meridiem';
};

export type ElapsedTimeProblem = {
    startMinutesSinceMidnight: number;
    endMinutesSinceMidnight: number;
    elapsedMinutes: number;
    minutesToNextHour: number;
    minutesAfterHour: number;
    crossesHour: true;
};

export type TimeIntervalWordProblem = {
    operation: 'addition' | 'subtraction';
    startTime: string;
    endTime: string;
    elapsedMinutes: number;
    referenceHour: number;
    startOffsetMinutes: number;
    endOffsetMinutes: number;
};

export type LiquidVolumeMeasurementProblem = {
    measurementKind: 'liquid-volume';
    object: 'measuring-jug';
    unit: 'L';
    value: number;
    capacity: number;
    tickStep: 1;
};

export type MassMeasurementProblem = {
    measurementKind: 'mass';
    object: 'apple' | 'book' | 'toy-car' | 'watermelon' | 'backpack' | 'suitcase';
    unit: 'g' | 'kg';
    value: number;
    instrument: 'digital-scale';
};

export type MassVolumeMeasurementProblem = LiquidVolumeMeasurementProblem | MassMeasurementProblem;

export type LiquidVolumeEstimateProblem = {
    measurementKind: 'liquid-volume';
    container: 'water-bottle' | 'juice-carton' | 'watering-can' | 'bucket';
    unit: 'L';
    estimateLiters: 1 | 2 | 5 | 10;
    referenceLiters: 1;
};

export type MassEstimateProblem = {
    measurementKind: 'mass';
    object: 'crayon' | 'apple' | 'book' | 'backpack' | 'chair' | 'bicycle';
    unit: 'g' | 'kg';
    estimate: number;
    referenceCount: number;
    referenceObject: 'paperclip' | 'one-kilogram-bag';
    referenceValue: 1;
};

export type MassVolumeEstimateProblem = LiquidVolumeEstimateProblem | MassEstimateProblem;

export type CurrencyItem = {
    kind: 'coin' | 'banknote';
    denominationCents: number;
    count: number;
};

export type CurrencyAmount = {
    items: CurrencyItem[];
    totalCents: number;
};

export type CurrencyArithmeticProblem = {
    operation: 'addition' | 'subtraction';
    amounts: [CurrencyAmount, CurrencyAmount];
    answerCents: number;
};

export type MeasurementObservation = {
    object: 'pencil' | 'crayon' | 'ribbon' | 'key' | 'brush' | 'block';
    value: number;
};

export type MeasurementExtremaRelation = {
    operation: 'addition' | 'subtraction';
    shortest: number;
    longest: number;
    answer: number;
};

/**
 * Six lengths in one measurement unit and plot frame. `subdivisions` is the
 * denominator of the unit lattice: every observation has an integer value
 * when multiplied by it. For fractional denominators (2, 4, or 8), at least
 * one observation has an odd scaled numerator, witnessing that exact
 * denominator rather than only a coarser fraction.
 */
export type MeasurementDataProblem = {
    unit: 'cm' | 'in';
    subdivisions: 1 | 2 | 4 | 8;
    observations: MeasurementObservation[];
};

export type MeasurementExtremaProblem = MeasurementDataProblem & {
    extremaRelation: MeasurementExtremaRelation;
};

/**
 * Every numerator is an exact count of 1/denominator cups. Binary operands
 * identify plotted beaker levels: addition uses the two least-filled beakers,
 * and subtraction uses the fullest and second-least-filled beakers. Those
 * ranked levels are unambiguous. Multiplication uses the unique modal level;
 * its frequency equals the number of observations at that level. Division
 * redistributes the sum of all five plotted amounts equally into five beakers.
 * Each result is exact on the same denominator lattice.
 */
export type MeasurementLinePlotFractionRelation =
    | {operation: 'addition'; operandNumerators: readonly [number, number]; resultNumerator: number}
    | {operation: 'subtraction'; minuendNumerator: number; subtrahendNumerator: number; resultNumerator: number}
    | {operation: 'multiplication'; operandNumerator: number; frequency: number; resultNumerator: number}
    | {operation: 'division'; totalNumerator: number; recipientCount: 5; shareNumerator: number};

/**
 * Five identical beakers of liquid measured in cups in one frame. Each
 * observation is a positive safe integer numerator in the shared 1/d cup
 * lattice (d = denominator) and fits from 1 through 3 cups. At least one
 * observation has an odd numerator, witnessing the exact selected half,
 * quarter, or eighth denominator. The relation's selected plotted operands
 * and result retain that denominator witness. Arithmetic and any division
 * intermediate are exact integer-numerator equalities; the view chooses the
 * story wording, unknowns, and solution presentation.
 */
export type MeasurementLinePlotFractionProblem = {
    kind: 'beaker-liquid-line-plot';
    unit: 'cup';
    denominator: 2 | 4 | 8;
    observationNumerators: readonly [number, number, number, number, number];
    relation: MeasurementLinePlotFractionRelation;
};

export type UnitCubeCell = {
    column: number;
    row: number;
    layer: number;
};

/**
 * A complete packing by congruent unit cubes. `generic` defines one abstract
 * length unit u; the other identifiers use centimeters, inches, or feet.
 * Every cube has edge length 1 in that linear unit, face area 1 square unit,
 * and volume 1 corresponding cubic unit.
 *
 * `occupiedCells` lists every integer coordinate in the Cartesian product
 * [0, columns) × [0, rows) × [0, layers), exactly once, ordered first by
 * layer, then row, then column. Each coordinate denotes the closed side-1
 * cube at that position. Their interiors do not overlap, shared faces may
 * touch, and their union fills the bounded solid without gaps. `cubeCount`
 * equals both the number of cells and columns × rows × layers, so the solid's
 * volume is exactly `cubeCount` cubic units. When present, `countingTrace`
 * bijectively enumerates `occupiedCells` in the same canonical order with
 * ordinals 1 through `cubeCount`; basic packings omit it. Views choose the
 * learner action rather than the generator encoding a prompt or blank.
 */
export type UnitCubeVolumeProblem = {
    kind: 'unit-cube-packing';
    unitId: 'generic' | 'cm' | 'in' | 'ft';
    unitCubeEdgeLength: 1;
    bounds: {columns: 2 | 3 | 4; rows: 2 | 3; layers: 1 | 2};
    occupiedCells: readonly UnitCubeCell[];
    countingTrace?: readonly {cell: UnitCubeCell; ordinal: number}[];
    cubeCount: number;
};

/** Measurements supplied for a volume formula; both forms describe the same prism. */
export type RectangularPrismMeasuredInput =
    | Readonly<{
        kind: 'three-edges';
        lengthUnits: number;
        widthUnits: number;
        heightUnits: number;
    }>
    | Readonly<{
        kind: 'base-area-height';
        baseAreaSquareUnits: number;
        heightUnits: number;
    }>;

export type RectangularPrismCellGroup = Readonly<{
    index: number;
    cells: readonly Readonly<UnitCubeCell>[];
    cubeCount: number;
}>;

/**
 * Exact packing and product witnesses for one rectangular prism. The abstract
 * linear unit is u: every occupied cell is a side-1 cube of volume 1 u³.
 * `occupiedCells` contains every coordinate in [0, length) × [0, width) ×
 * [0, height) exactly once, in layer-row-column order. The cubes have disjoint
 * interiors and fill the prism without gaps. `heightLayers` partitions those
 * cells by layer index, in ascending order, with length × width cells each.
 *
 * The exact equalities are baseAreaSquareUnits = length × width and
 * cubeCount = volumeCubicUnits = length × width × height =
 * baseAreaSquareUnits × height. The measured input repeats the corresponding
 * canonical values and identifies whether a formula receives three edge
 * lengths or the two operands base area and height. When present,
 * `countedPackingEquivalence` explicitly connects the complete packing to
 * measured volume: cubesPerLayer = length × width = baseAreaSquareUnits,
 * layerCount = height, countedCubes = cubesPerLayer × layerCount = cubeCount,
 * and countedVolumeCubicUnits = countedCubes × 1 = volumeCubicUnits.
 * `modeledTripleProduct`, when present, binds the ordered three factors
 * length, width, height to the same unit-cube layer geometry and their product.
 * These two relation witnesses are mutually exclusive and require three-edge
 * measured input. An associative regrouping requires `modeledTripleProduct`.
 * If present,
 * `associativeRegrouping` partitions the same occupied cells by column into
 * length slices of width × height cells and witnesses
 * (length × width) × height = length × (width × height).
 * All counts, dimensions, and products are positive safe integers. The payload
 * contains no prompt, unknown, or solution wording; views choose the task.
 */
export type RectangularPrismVolumeProblem = Readonly<{
    kind: 'rectangular-prism-volume';
    unitId: 'generic';
    unitCubeEdgeLength: 1;
    dimensions: Readonly<{length: 2 | 3 | 4; width: 2 | 3; height: 2 | 3}>;
    occupiedCells: readonly Readonly<UnitCubeCell>[];
    heightLayers: readonly RectangularPrismCellGroup[];
    baseAreaSquareUnits: number;
    cubeCount: number;
    volumeCubicUnits: number;
    measuredInput: RectangularPrismMeasuredInput;
    countedPackingEquivalence?: Readonly<{
        cubesPerLayer: number;
        layerCount: number;
        countedCubes: number;
        unitCubeVolumeCubicUnits: 1;
        countedVolumeCubicUnits: number;
    }>;
    modeledTripleProduct?: Readonly<{
        factors: readonly [number, number, number];
        cubesPerLayer: number;
        layerCount: number;
        product: number;
    }>;
    associativeRegrouping?: Readonly<{
        widthHeightProduct: number;
        columnSlices: readonly RectangularPrismCellGroup[];
    }>;
}>;

export type CompositePrismPart = Readonly<{
    id: 'left' | 'right';
    origin: Readonly<UnitCubeCell>;
    dimensions: Readonly<{length: 2 | 3 | 4; depth: 2 | 3; height: 2 | 3 | 4}>;
    volumeCubicUnits: number;
}>;

export type CompositePrismPartProduct<Id extends 'left' | 'right'> = Readonly<{
    partId: Id;
    factors: readonly [number, number, number];
    productCubicUnits: number;
}>;

/**
 * A connected stepped solid made from exactly two axis-aligned rectangular
 * prisms, measured in one abstract linear unit u and cubic unit u³. Parts are
 * ordered left, right. The left origin is (0, 0, 0); the right origin is
 * (left.length, 0, 0). They have the same positive depth and unequal heights.
 * Their half-open interiors are disjoint. The explicit shared face is the
 * column plane at left.length with row span [0, depth) and layer span
 * [0, min(left.height, right.height)); it has positive area and zero volume.
 * Thus the two parts meet along a face and exhaust the stepped union with no
 * overlap or unassigned component. Each part volume is exactly length × depth
 * × height, and `volumeSum` adds the left and right volumes to the whole.
 *
 * When present, `calculationEvidence` records both ordered three-factor
 * products and the exact addition equation for the same total. It is a
 * mathematical witness, not a prompt, blank, or requested learner action.
 * All dimensions, areas, and volumes are positive safe integers.
 */
export type CompositePrismVolumeProblem = Readonly<{
    kind: 'composite-prism-volume';
    unitId: 'generic';
    parts: readonly [
        CompositePrismPart & Readonly<{id: 'left'}>,
        CompositePrismPart & Readonly<{id: 'right'}>
    ];
    sharedFace: Readonly<{
        planeColumn: number;
        rowSpan: readonly [0, number];
        layerSpan: readonly [0, number];
        areaSquareUnits: number;
        volumeCubicUnits: 0;
    }>;
    volumeSum: Readonly<{
        addendsCubicUnits: readonly [number, number];
        totalCubicUnits: number;
    }>;
    calculationEvidence?: Readonly<{
        partProducts: readonly [
            CompositePrismPartProduct<'left'>,
            CompositePrismPartProduct<'right'>
        ];
        sumEquation: Readonly<{
            addendsCubicUnits: readonly [number, number];
            resultCubicUnits: number;
        }>;
    }>;
}>;

export type StatisticalCategoryId = 'apple' | 'book' | 'kite';

export type StatisticalCategory = {
    id: StatisticalCategoryId;
    count: number;
};

export type StatisticalGraphProblem = {
    categories: readonly [StatisticalCategory, StatisticalCategory, StatisticalCategory];
    scale: 1 | 2 | 5 | 10;
    operation?: 'addition' | 'subtraction';
    operandCategoryIds?: [StatisticalCategoryId, StatisticalCategoryId]
        | [StatisticalCategoryId, StatisticalCategoryId, StatisticalCategoryId];
    intermediate?: number;
    answer?: number;
};

// --- Shape Split Problem Types ---

export type ShapeNamingProblem = {
    shape: ShapeNamingName;
    definition?: ShapeDefinition;
};

export type ShapePositionProblem = {
    relation: 'above' | 'below' | 'beside' | 'nextTo' | 'behind' | 'ahead';
};

export type ShapeEnvShapesProblem = {
    target: string;
    answer: string;
};

export type ShapeClassifyDimProblem = {
    shapeType: '2d' | '3d';
    shape: string;
};

export type ShapeComparisonName =
    | 'triangle'
    | 'square'
    | 'rectangle'
    | 'hexagon'
    | 'circle'
    | 'cube'
    | 'cone'
    | 'cylinder'
    | 'sphere';

export type ShapeComparisonAttribute = 'sides' | 'vertices' | 'faces' | 'edges';

export type ShapeComparisonItem = {
    shape: ShapeComparisonName;
    count: number;
};

export type ShapeCompareAttributesProblem = {
    dimension: '2d' | '3d';
    attribute: ShapeComparisonAttribute;
    shapes: readonly [ShapeComparisonItem, ShapeComparisonItem];
    relation: 'more';
    answer: ShapeComparisonName;
};

export type ShapeSameAttributeProblem = {
    attribute: 'rollable' | 'stackable' | 'foldable';
    answer: 'sphere' | 'cube' | 'rectangle';
};

export type PlaneShapeName =
    | 'circle'
    | 'triangle'
    | 'rhombus'
    | 'square'
    | 'rectangle'
    | 'quadrilateral'
    | 'pentagon'
    | 'hexagon';

export type ShapeNamingName = PlaneShapeName | 'cube' | 'sphere' | 'cone' | 'cylinder';

export type ShapeDefinition = {
    sideCount: 0 | 3 | 4 | 5 | 6;
    vertexCount: 0 | 3 | 4 | 5 | 6;
    closed: true;
    boundary: 'curved' | 'straight';
    equalSides?: boolean;
    rightAngleCount?: 0 | 4;
};

export type ShapeAttributeOption = {
    id: 'A' | 'B' | 'C' | 'D';
    text: string;
    kind: 'defining' | 'non-defining';
};

export type ShapeDefiningAttribute =
    | {kind: 'closed'}
    | {kind: 'boundary'; value: 'curved' | 'straight'}
    | {kind: 'side-count'; value: ShapeDefinition['sideCount']}
    | {kind: 'vertex-count'; value: ShapeDefinition['vertexCount']}
    | {kind: 'equal-sides'; value: true}
    | {kind: 'right-angle-count'; value: 4};

export type ShapeDefiningAttributeClassificationProblem = {
    shape: PlaneShapeName;
    definition: ShapeDefinition;
    definingAttribute: ShapeDefiningAttribute;
    task?: undefined;
};

export type ShapeCountAttribute = 'vertices' | 'angles' | 'equal-faces';

export type ShapeCountOptionName =
    | PlaneShapeName
    | 'cube'
    | 'rectangular-prism'
    | 'triangular-prism'
    | 'square-pyramid';

export type ShapeCountOption = {
    shape: ShapeCountOptionName;
    count: number;
    satisfies: boolean;
};

export type ShapeCountClassificationProblem = {
    task: 'classify-count';
    attribute: ShapeCountAttribute;
    requiredCount: number;
    options: ShapeCountOption[];
};

export type QuadrilateralSubtypeName = 'rhombus' | 'rectangle' | 'square';

export type ShapeCategoryOption = {
    category: 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon';
    satisfies: boolean;
};

export type ShapeSubsumptionProblem = {
    task: 'classify-quadrilateral-subcategory';
    shape: QuadrilateralSubtypeName;
    definition: ShapeDefinition;
    category: 'quadrilateral';
};

export type ShapeHierarchyCategory = 'quadrilateral' | 'rectangle' | 'rhombus' | 'square';
export type ShapeHierarchyProperty = 'four-straight-sides' | 'four-right-angles' | 'four-equal-sides';
export type ShapeHierarchyVertex = Readonly<{x: number; y: number}>;

export type ShapeHierarchyInheritance =
    | Readonly<{broader: 'rectangle'; narrower: 'square'; property: 'four-right-angles'}>
    | Readonly<{broader: 'rhombus'; narrower: 'square'; property: 'four-equal-sides'}>;

type ShapeHierarchyFigure<K extends string, A extends 0 | 4, E extends boolean,
    M extends readonly ShapeHierarchyCategory[]> = Readonly<{
        kind: K;
        vertices: readonly [
            ShapeHierarchyVertex, ShapeHierarchyVertex,
            ShapeHierarchyVertex, ShapeHierarchyVertex
        ];
        rightAngleCount: A;
        allSidesEqual: E;
        memberships: M;
    }>;

export type ShapeHierarchyClassificationCases = readonly [
    ShapeHierarchyFigure<'other-quadrilateral', 0, false, readonly ['quadrilateral']>,
    ShapeHierarchyFigure<'rectangle-only', 4, false, readonly ['rectangle', 'quadrilateral']>,
    ShapeHierarchyFigure<'rhombus-only', 0, true, readonly ['rhombus', 'quadrilateral']>,
    ShapeHierarchyFigure<'square', 4, true,
        readonly ['square', 'rectangle', 'rhombus', 'quadrilateral']>
];

/**
 * A four-category plane-shape diamond. Each listed attribute holds for every
 * member of that category, and each inclusion means every narrower-category
 * member belongs to the broader category. The square is directly contained in
 * BOTH rectangle and rhombus; both are contained in quadrilateral. The
 * inheritance witness selects a true broader property of the square without
 * prescribing a learner action.
 *
 * `classificationCases` is present only for the ShapeClassification profile.
 * Its four simple quadrilaterals have distinct cyclic integer vertices in a
 * bounded plane grid; squared side lengths and vertex dot products exactly
 * verify the stated equality/right-angle facts and complete memberships.
 * The non-square rectangle and rhombus witness the two distinct branches.
 * When absent, the category relations still form a valid inheritance problem.
 * Views choose prompts, blanks, answer presentation, and diagram layout.
 */
export type ShapeCategoryHierarchyProblem = Readonly<{
    kind: 'shape-category-hierarchy';
    categoryAttributes: Readonly<{
        quadrilateral: readonly ['four-straight-sides'];
        rectangle: readonly ['four-straight-sides', 'four-right-angles'];
        rhombus: readonly ['four-straight-sides', 'four-equal-sides'];
        square: readonly ['four-straight-sides', 'four-right-angles', 'four-equal-sides'];
    }>;
    directInclusions: readonly [
        Readonly<{narrower: 'rectangle'; broader: 'quadrilateral'}>,
        Readonly<{narrower: 'rhombus'; broader: 'quadrilateral'}>,
        Readonly<{narrower: 'square'; broader: 'rectangle'}>,
        Readonly<{narrower: 'square'; broader: 'rhombus'}>
    ];
    inheritance: ShapeHierarchyInheritance;
    classificationCases?: ShapeHierarchyClassificationCases;
}>;

export type ShapeClassificationCoordinate = {
    x: number;
    y: number;
};

export type ShapeClassificationStroke = {
    start: ShapeClassificationCoordinate;
    end: ShapeClassificationCoordinate;
};

export type ShapeClassificationMarker =
    | {
        kind: 'angle-arc';
        center: ShapeClassificationCoordinate;
        radius: number;
        startDegrees: number;
        endDegrees: number;
    }
    | {
        kind: 'right-angle';
        points: [
            ShapeClassificationCoordinate,
            ShapeClassificationCoordinate,
            ShapeClassificationCoordinate
        ];
    }
    | {
        kind: 'parallel';
        strokes: [
            ShapeClassificationStroke,
            ShapeClassificationStroke
        ];
    };

export type ShapeClassificationFigure = {
    vertices: ShapeClassificationCoordinate[];
    sides: ShapeClassificationStroke[];
};

export type ShapeLineRelationOption = {
    figure: ShapeClassificationFigure;
    relations: Array<'parallel' | 'perpendicular'>;
    evidenceStrokes: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker | null;
    satisfies: boolean;
};

export type ShapeLineRelationClassificationProblem = {
    task: 'classify-line-relation';
    criterion: 'parallel' | 'perpendicular';
    options: [
        ShapeLineRelationOption,
        ShapeLineRelationOption,
        ShapeLineRelationOption,
        ShapeLineRelationOption
    ];
};

export type ShapeAngleClassOption = {
    figure: ShapeClassificationFigure;
    angleClasses: Array<'right' | 'acute' | 'obtuse'>;
    angleClass: 'right' | 'acute' | 'obtuse';
    evidenceRays: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker;
    satisfies: boolean;
};

export type ShapeAngleClassificationProblem = {
    task: 'classify-angle-size';
    criterion: 'right' | 'acute' | 'obtuse';
    options: [
        ShapeAngleClassOption,
        ShapeAngleClassOption,
        ShapeAngleClassOption,
        ShapeAngleClassOption
    ];
};

export type ShapeRightTriangleOption = {
    figure: ShapeClassificationFigure;
    angleClasses: Array<'right' | 'acute' | 'obtuse'>;
    angleClass: 'right' | 'acute' | 'obtuse';
    evidenceRays: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker;
    satisfies: boolean;
};

export type RightTriangleCategoryProblem = {
    task: 'classify-right-triangle-category';
    options: [
        ShapeRightTriangleOption,
        ShapeRightTriangleOption,
        ShapeRightTriangleOption,
        ShapeRightTriangleOption
    ];
    category: 'triangle';
};

export type ShapeAttributeClassificationProblem =
    | ShapeDefiningAttributeClassificationProblem
    | ShapeCountClassificationProblem
    | ShapeSubsumptionProblem
    | ShapeLineRelationClassificationProblem
    | ShapeAngleClassificationProblem
    | RightTriangleCategoryProblem;

export type LineSymmetryCoordinate = {
    x: number;
    y: number;
};

export type LineSymmetryCorrespondence = {
    firstVertex: number;
    secondVertex: number;
};

export type LineSymmetryAxis = {
    equation: {
        a: number;
        b: number;
        c: number;
    };
    correspondences: LineSymmetryCorrespondence[];
};

export type LineSymmetryFigure = {
    kind: 'isosceles-triangle' | 'rectangle' | 'square' | 'scalene-triangle' | 'parallelogram';
    vertices: LineSymmetryCoordinate[];
    validAxes: LineSymmetryAxis[];
};

export type ShapeLineSymmetryProblem = {
    figures: LineSymmetryFigure[];
};

export type ShapeEdgeCompositionProblem = {
    target: 'triangle' | 'square' | 'rectangle' | 'hexagon';
    sides: 3 | 4 | 6;
    corners: 3 | 4 | 6;
};

export type ShapePolygonDefinitionProblem = {
    kind: 'polygon-definition';
    target: Exclude<PlaneShapeName, 'circle' | 'rhombus'>;
    definition: ShapeDefinition;
};

export type ShapeCircleDefinitionProblem = {
    kind: 'circle-definition';
    target: 'circle';
    definition: ShapeDefinition;
};

export type ShapeExcludedQuadrilateralProblem = {
    kind: 'excluded-quadrilateral';
    target: 'quadrilateral';
    definition: ShapeDefinition;
    excludedCategories: ['rhombus', 'rectangle', 'square'];
};

export type ShapeAttributeCountSpecificationProblem = {
    kind: 'attribute-count';
    target: Exclude<PlaneShapeName, 'circle' | 'rhombus'> | 'cube';
    sides: number;
    corners: number;
    attribute: ShapeCountAttribute;
    requiredCount: number;
};

export type ShapeConstructionProblem = ShapePolygonDefinitionProblem | ShapeAttributeCountSpecificationProblem;
export type ShapeDrawingDefinitionProblem = ShapePolygonDefinitionProblem | ShapeCircleDefinitionProblem;

export type ShapeCompositionTargetId =
    | 'rectangle'
    | 'square'
    | 'triangle'
    | 'hexagon'
    | 'trapezoid'
    | 'half-circle'
    | 'quarter-circle'
    | 'cube'
    | 'rectangular-prism'
    | 'cone'
    | 'cylinder';

export type ShapeCompositionComponentId =
    | 'small-triangle'
    | 'tiny-triangle'
    | 'eighth-circle-piece'
    | 'sixteenth-circle-piece'
    | 'small-cube'
    | 'half-cone'
    | 'quarter-cone-piece'
    | 'short-cylinder'
    | 'cylinder-segment';

export type ShapeCompositionShapeId = ShapeCompositionTargetId | ShapeCompositionComponentId;

export type ShapeCompositionLeaf = {
    kind: 'primitive';
    shape: ShapeCompositionShapeId;
};

export type ShapeCompositionComposite = {
    kind: 'composite';
    shape: ShapeCompositionShapeId;
    inputs: ShapeCompositionNode[];
};

export type ShapeCompositionNode = ShapeCompositionLeaf | ShapeCompositionComposite;

export type ShapeCompositionRoot = ShapeCompositionComposite & {
    shape: ShapeCompositionTargetId;
};

export type ShapeComposeShapesProblem = {
    compositionTree: ShapeCompositionRoot;
    /** Primitive leaves have depth 0; a composite adds one to its deepest input. */
    compositionDepth: 1 | 2;
};

/** Mathematical regions in a common coordinate frame, independent of their projection. */
export type ShapeAssemblyRegion =
    | {kind: 'polygon'; points: [number, number][]}
    | {kind: 'sector'; radius: number; start: number; end: number}
    | {kind: 'box'; min: [number, number, number]; max: [number, number, number]}
    | {kind: 'radial-solid'; solid: 'cone' | 'cylinder'; radius: number;
        start: number; end: number; bottom: number; top: number};

/** Parts correspond, in order, to the inputs in the semantic composition tree. */
export type ShapeAssembly = {region: ShapeAssemblyRegion; parts: ShapeAssembly[]};

export type ShapeAssemblyProblem = ShapeComposeShapesProblem & {assembly: ShapeAssembly};

export type FractionShape = 'circle' | 'rectangle';
export type FractionParts = 2 | 3 | 4 | 6 | 8;
export type FractionShareName = 'half' | 'fourth' | 'quarter';

export type FractionNumberLineStep = {
    /** Step endpoints measured in denominator-sized units from zero. */
    fromNumerator: number;
    toNumerator: number;
};

export type FractionNumberLineProblem = {
    task: 'locate-fraction';
    numerator: number;
    denominator: FractionParts;
    wholeCount: 1 | 2;
    steps: FractionNumberLineStep[];
};

export type FractionValue = {
    numerator: number;
    denominator: FractionParts;
};

export type ProperFractionEquivalenceProblem = {
    task: 'relate-equivalent-fractions';
    first: FractionValue;
    second: FractionValue;
    scaleFactor: 2 | 3 | 4;
    relation: 'equal';
};

/** Exact n/n = 1 witness; the numerator and denominator equal the pair's scaleFactor. */
export type FractionUnitMultiplier =
    | {numerator: 2; denominator: 2; value: 1}
    | {numerator: 3; denominator: 3; value: 1}
    | {numerator: 4; denominator: 4; value: 1};

/** The unit-scaling view requires the witness; existing equivalence views accept the base shape. */
export type ProperFractionUnitScalingProblem = ProperFractionEquivalenceProblem & {
    unitMultiplier: FractionUnitMultiplier;
};

export type WholeNumberFractionEquivalenceProblem = {
    task: 'represent-whole-as-fraction';
    wholeNumber: 1 | 2 | 3;
    fraction: FractionValue;
    relation: 'equal';
};

export type DecimalFractionValue = {
    numerator: number;
    denominator: 10 | 100;
};

export type TenthsHundredthsGridCell = {
    index: number;
    row: number;
    column: number;
    tenthGroupIndex: number;
    xPercent: number;
    yPercent: number;
    widthPercent: 10;
    heightPercent: 10 | 100;
    shaded: boolean;
    source: 'first-addend' | 'second-addend' | null;
};

export type TenthsHundredthsGridGroup = {
    source: 'first-addend' | 'second-addend';
    label: string;
    startCell: number;
    cellCount: number;
};

export type TenthsHundredthsGridModel = {
    display: string;
    rows: 1 | 10;
    columns: 10;
    partCount: 10 | 100;
    shadedCount: number;
    groups: TenthsHundredthsGridGroup[];
    cells: TenthsHundredthsGridCell[];
};

export type TenthsToHundredthsProblem = {
    task: 'tenths-to-hundredths';
    tenths: DecimalFractionValue & {denominator: 10};
    hundredths: DecimalFractionValue & {denominator: 100};
    scaleFactor: 10;
    sharedWhole: 1;
    relation: 'equal';
};

export type FractionEquivalenceProblem =
    | ProperFractionUnitScalingProblem
    | WholeNumberFractionEquivalenceProblem
    | TenthsToHundredthsProblem;

export type FractionScalingProblem = ProperFractionUnitScalingProblem | TenthsToHundredthsProblem;

export type FractionLineProblem = FractionNumberLineProblem | FractionEquivalenceProblem;

export type LegacyFractionComparisonProblem = {
    task: 'compare-fractions';
    first: FractionValue;
    second: FractionValue;
    family: 'common-denominator' | 'common-numerator';
    relation: 'greater' | 'less';
    sharedWhole: 1;
};

export type UnlikeFractionComparisonProblem = {
    task: 'compare-unlike-fractions';
    first: FractionValue;
    second: FractionValue;
    relation: 'greater' | 'equal' | 'less';
    strategy: 'benchmark-half';
    sharedWhole: 1;
    benchmark: {
        numerator: 1;
        denominator: 2;
    };
    firstBenchmarkRelation: 'greater' | 'equal' | 'less';
    secondBenchmarkRelation: 'greater' | 'equal' | 'less';
};

export type FractionComparisonProblem =
    | LegacyFractionComparisonProblem
    | UnlikeFractionComparisonProblem;

export type FractionBenchmarkRational = Readonly<{
    numerator: number;
    denominator: number;
}>;

export type FractionBenchmarkQuarterTick = 0 | 1 | 2 | 3 | 4;

export type FractionBenchmarkOperand = Readonly<{
    value: FractionBenchmarkRational;
    lowerTick: FractionBenchmarkQuarterTick;
    upperTick: FractionBenchmarkQuarterTick;
    relationToHalf: 'less' | 'equal' | 'greater';
}>;

/**
 * Exact same-whole fraction arithmetic with quarter-unit reference bounds.
 * Operands are proper, positive fractions with positive safe-integer
 * denominators (including fifths); all stored rationals have positive safe-
 * integer denominators and are in lowest terms. Each operand lies between
 * lowerTick/4 and upperTick/4, inclusively. Equal ticks mean an exact quarter;
 * otherwise the ticks are adjacent. `relationToHalf` compares the same operand
 * to 2/4. All comparisons use the one unit identified by `sharedWhole`.
 *
 * `exactResult` is first ± second. For addition, the closed result bounds are
 * (first.lowerTick + second.lowerTick)/4 through
 * (first.upperTick + second.upperTick)/4. For subtraction, they are
 * (first.lowerTick - second.upperTick)/4 through
 * (first.upperTick - second.lowerTick)/4. The sampled values and bounds are
 * nonnegative. A reasonable candidate equals the exact result; an
 * unreasonable one lies strictly outside these bounds.
 *
 * `approximation` is present only in the NumericApproximation mathematical
 * profile. Its ticks are nearest quarter replacements (upper wins a tie), at
 * least one replacement differs from its operand, and `estimatedResult` is
 * their exact sum or difference. This is mathematical evidence, not a prompt,
 * selected unknown, or answer wording; both views accept either profile.
 */
export type FractionBenchmarkArithmeticProblem = Readonly<{
    kind: 'fraction-benchmark-arithmetic';
    operation: 'addition' | 'subtraction';
    sharedWhole: 1;
    first: FractionBenchmarkOperand;
    second: FractionBenchmarkOperand;
    exactResult: FractionBenchmarkRational;
    resultBounds: Readonly<{
        lower: FractionBenchmarkRational;
        upper: FractionBenchmarkRational;
    }>;
    candidate: Readonly<{
        value: FractionBenchmarkRational;
        judgment: 'reasonable' | 'unreasonable';
    }>;
    approximation?: Readonly<{
        kind: 'nearest-quarter';
        firstTick: FractionBenchmarkQuarterTick;
        secondTick: FractionBenchmarkQuarterTick;
        estimatedResult: FractionBenchmarkRational;
    }>;
}>;

/** Exact, nonnegative quotient value. A denominator is positive; the original
 * division form may deliberately be unreduced, including 0/b and a multiple
 * of b written as a/b. All components are safe integers. */
export type FractionQuotientValue = Readonly<{
    numerator: number;
    denominator: number;
}>;

/** The dimensioned story equality is groupCount × measurePerGroup = totalMeasure. */
export type FractionQuotientEquationWitness = Readonly<{
    totalMeasure: FractionQuotientValue;
    groupCount: FractionQuotientValue;
    measurePerGroup: FractionQuotientValue;
}>;

type FractionQuotientCommon = Readonly<{
    kind: 'fraction-quotient';
    /** The original operand roles are retained; dividend ÷ divisor = quotient. */
    dividend: FractionQuotientValue;
    divisor: FractionQuotientValue;
    quotient: FractionQuotientValue;
    /** Explicit exact reconstruction, quotient × divisor = dividend. */
    inverse: Readonly<{
        quotientFactor: FractionQuotientValue;
        divisorFactor: FractionQuotientValue;
        reconstructedDividend: FractionQuotientValue;
    }>;
    /** Present only when a contextual equation is a selected mathematical profile. */
    equationWitness?: FractionQuotientEquationWitness;
    /** Present only for the expanded inverse-multiplication profile. */
    multiplicationWitness?: Readonly<{
        /** Raw numerator and denominator products before any reduction. */
        unreducedProduct: FractionQuotientValue;
        reconstructedDividend: FractionQuotientValue;
    }>;
}>;

/**
 * Three exact, Ability-neutral interpretations of division. All values are
 * nonnegative; divisors are nonzero. Whole counts and original unit-fraction
 * denominators are small enough to draw: whole counts are at most 6, integer
 * divisors are 1–6, unit-fraction denominators are 2–6, and explicit part
 * counts are at most 36. A rational equality means cross-product equality,
 * never binary floating-point approximation.
 *
 * In whole-by-whole, a whole units divided among b recipients gives the
 * unreduced quotient a/b, even when a is zero or divisible by b. Cutting each
 * whole into b parts gives a×b total parts and a parts per recipient.
 * In unit-fraction-by-whole, 1/b of a measured unit shared among n recipients
 * becomes n pieces of size 1/(b×n), one per recipient. In whole-by-unit-fraction,
 * n whole measured units contain n×b groups of size 1/b; n may be zero.
 * These original roles and typed quantity units support sharing and group-count
 * stories without embedding task wording, a requested unknown, or answer prose.
 *
 * `inverse` always reconstructs the dividend exactly from the original
 * divisor and quotient. The optional `equationWitness` records the contextual
 * equality, with groupCount=divisor and measurePerGroup=quotient for sharing,
 * or groupCount=quotient and measurePerGroup=divisor for group counting. The
 * optional `multiplicationWitness` records the literal numerator/denominator
 * product of quotient and divisor before reduction, equal to the dividend.
 */
export type FractionQuotientProblem = FractionQuotientCommon & (
    | Readonly<{
        orientation: 'whole-by-whole';
        model: Readonly<{
            kind: 'equal-sharing';
            wholeUnitCount: number;
            recipientCount: number;
            partsPerWhole: number;
            totalParts: number;
            partsPerRecipient: number;
        }>;
        story: Readonly<{
            material: 'ribbon' | 'rope';
            measureUnit: 'meter';
            recipientUnit: 'person';
        }>;
    }>
    | Readonly<{
        orientation: 'unit-fraction-by-whole';
        model: Readonly<{
            kind: 'unit-part-sharing';
            wholePartitionCount: number;
            recipientCount: number;
            refinedPartitionCount: number;
            sharedFineParts: number;
        }>;
        story: Readonly<{
            material: 'ribbon' | 'rope';
            measureUnit: 'meter';
            recipientUnit: 'person';
        }>;
    }>
    | Readonly<{
        orientation: 'whole-by-unit-fraction';
        model: Readonly<{
            kind: 'unit-part-group-count';
            wholeUnitCount: number;
            partsPerWhole: number;
            groupCount: number;
        }>;
        story: Readonly<{
            material: 'ribbon' | 'rope';
            measureUnit: 'meter';
            groupUnit: 'piece';
        }>;
    }>
);

export type FractionDivisionContext =
    | {
        kind: 'sharing';
        material: 'juice';
        measureUnit: 'liter';
        groupUnit: 'batch';
        totalMeasure: FractionQuotientValue;
        groupCount: FractionQuotientValue;
        measurePerGroup: FractionQuotientValue;
    }
    | {
        kind: 'measured-groups';
        material: 'juice';
        measureUnit: 'liter';
        groupUnit: 'serving';
        totalMeasure: FractionQuotientValue;
        groupCount: FractionQuotientValue;
        measurePerGroup: FractionQuotientValue;
    }
    | {
        kind: 'rectangle';
        lengthUnit: 'meter';
        areaUnit: 'square meter';
        area: FractionQuotientValue;
        firstSide: FractionQuotientValue;
        secondSide: FractionQuotientValue;
    };

/**
 * General nonnegative fraction division retains the original expressed operand forms.
 * Fraction roles have denominator 2, 3, 4 or 6; integer roles have denominator 1.
 * Operand magnitudes are at most 4 and the divisor is positive. The quotient is reduced;
 * reciprocal is the literal original d/c and reciprocalProduct is the literal ad/bc.
 * Inverse and optional mathematical witnesses preserve exact cross-product equality.
 *
 * The numerical model uses LCM(b,d) ticks per whole, independently of physical units.
 * Groups have width divisorTicks; filledTicks equals that width except in the final
 * partial group. Their contiguous intervals cover the dividend, and coverageTicks
 * includes both the full final group frame and a divisor reference. Zero has no groups.
 * Contexts assign the same canonical values to truthful physical roles; sharing uses
 * divisor batches, measured groups use quotient servings-worth, and rectangles have
 * positive area, first side = divisor, second side = quotient, with aspect at most 6.
 * No field selects a learner task or a requested unknown.
 */
export type FractionDivisionRelationProblem = {
    kind: 'fraction-division-relation';
    operandProfile: 'fraction-by-fraction' | 'fraction-by-integer' | 'integer-by-fraction';
    dividend: FractionQuotientValue;
    divisor: FractionQuotientValue;
    quotient: FractionQuotientValue;
    reciprocal: FractionQuotientValue;
    reciprocalProduct: FractionQuotientValue;
    inverse: {
        quotientFactor: FractionQuotientValue;
        divisorFactor: FractionQuotientValue;
        reconstructedDividend: FractionQuotientValue;
    };
    model: {
        kind: 'common-unit-groups';
        ticksPerWhole: number;
        dividendTicks: number;
        divisorTicks: number;
        completeGroups: number;
        remainderTicks: number;
        fractionalGroup: FractionQuotientValue;
        coverageTicks: number;
        groups: {startTick: number; endTick: number; filledTicks: number}[];
    };
    context: FractionDivisionContext;
    equationWitness?: {
        firstFactor: FractionQuotientValue;
        secondFactor: FractionQuotientValue;
        product: FractionQuotientValue;
    };
    multiplicationWitness?: {
        unreducedProduct: FractionQuotientValue;
        reconstructedDividend: FractionQuotientValue;
    };
};

/** The five shared division tasks preserve the legacy producer while admitting general operands. */
export type FractionDivisionProblem = FractionQuotientProblem | FractionDivisionRelationProblem;

/** Positive exact rational value; original operand forms need not be reduced. */
export type FractionProductValue = Readonly<{
    numerator: number;
    denominator: number;
}>;

export type FractionProductFractionOperand = Readonly<{
    form: 'fraction';
    numerator: number;
    denominator: number;
}>;

export type FractionProductMixedOperand = Readonly<{
    form: 'mixed';
    whole: number;
    fractionNumerator: number;
    denominator: number;
    improperNumerator: number;
}>;

type FractionProductCommon = Readonly<{
    kind: 'fraction-product';
    sharedWhole: 1;
    /** Dimensionless a/b factor and measured reference quantity q. */
    multiplierValue: FractionProductValue;
    quantityValue: FractionProductValue;
    product: FractionProductValue;
    /** One measured length supplies the reference for every equal part and result. */
    context: Readonly<{
        material: 'ribbon' | 'rope';
        measureUnit: 'meter';
    }>;
    partition: Readonly<{
        /** b equal parts divide each copy of q itself, even when q is fractional. */
        equalPartsPerCopy: number;
        /** a selected q/b parts; mixed a/b uses its improper numerator. */
        selectedPartCount: number;
        /** The least number of q copies able to contain all selected parts. */
        copyCount: number;
        availablePartCount: number;
        onePartValue: FractionProductValue;
        /** a × q, before division by b. */
        scaledQuantity: FractionProductValue;
    }>;
    /** Explicit dimensioned equality in the Area.Equation mathematical profile. */
    equationWitness?: Readonly<{
        factor: FractionProductValue;
        referenceMeasure: FractionProductValue;
        productMeasure: FractionProductValue;
        measureUnit: 'meter';
    }>;
}>;

/**
 * Ability-neutral fraction-of-quantity multiplication. All integer components
 * are positive safe integers except a mixed operand's whole, which is at least
 * one. Fraction factors may be proper or improper. Fraction-form q may also be
 * a whole value written with denominator one; contextual word profiles use two
 * noninteger factors. Mixed-form profiles retain both original mixed notations
 * and their exact improper values, with improperNumerator = whole × denominator
 * + fractionNumerator and 0 < fractionNumerator < denominator. In the fraction
 * arm, each canonical value repeats its original numerator and denominator
 * exactly, without reducing them; in the mixed arm, its numerator is the
 * corresponding improperNumerator and its denominator is unchanged. This
 * preserves the selected-part count named by the original factor.
 *
 * Let multiplierValue = a/b and quantityValue = q. The partition witness has
 * equalPartsPerCopy = b, selectedPartCount = a, copyCount = ceil(a/b),
 * availablePartCount = copyCount × b, onePartValue = q/b, and
 * scaledQuantity = a × q. Each copy is the entire measured quantity q, divided
 * into b equal parts; exactly a of these parts are selected across the copies.
 * Thus product = a × (q/b) = (a × q)/b. All equalities are exact rational
 * cross-products. The numerator and denominator have distinct model roles,
 * including when the multiplier is improper or written as a mixed number.
 * For legible models, 2 ≤ b ≤ 6, 1 ≤ a < 3b, 1 ≤ copyCount ≤ 3, and
 * availablePartCount ≤ 18. The measured quantity q is positive and at most
 * six units; its original denominator is at most six.
 * `equationWitness`, when present, repeats multiplierValue × quantityValue =
 * product as factor × referenceMeasure = productMeasure with meter units; no prompt, blank, or requested
 * reasoning is stored in the payload. All three views accept both operand forms
 * and both presence states of the optional witness.
 */
export type FractionProductProblem = FractionProductCommon & (
    | Readonly<{
        operandForm: 'fractions';
        multiplier: FractionProductFractionOperand;
        quantity: FractionProductFractionOperand;
    }>
    | Readonly<{
        operandForm: 'mixed-numbers';
        multiplier: FractionProductMixedOperand;
        quantity: FractionProductMixedOperand;
    }>
);

/** An exact positive rational measured in the outer rectangle's chosen unit. */
export type FractionRectangleAreaRational = Readonly<{
    numerator: number;
    denominator: number;
}>;

/** Zero-based cell in the complete Cartesian grid of congruent square tiles. */
export type FractionRectangleTileCell = Readonly<{
    row: number;
    column: number;
}>;

/**
 * Ability-neutral fractional rectangle and exact square-tile lattice. The
 * outer rectangle starts at (0, 0), has two unequal positive, nonintegral
 * rational side lengths in one linear unit, and is distinct from each square
 * tile. Every rational has positive safe-integer components. Its area is the
 * exact side product in square units, with no floating-point approximation.
 *
 * Let the original length and width be a/b and c/d. The grid denominator L
 * is lcm(b, d); its square tile has side 1/L linear unit and area 1/L² square
 * unit. Columns = aL/b, rows = cL/d, tileCount = rows × columns, and
 * tiledAreaSquareUnits = tileCount/L² = areaSquareUnits = ac/bd. Cells list
 * every (row, column) in row-major order, each exactly once, with
 * 0 <= row < rows and 0 <= column < columns. Their closed boundaries may
 * meet, but their interiors do not overlap; together they cover the outer
 * rectangle without gaps. Rows and columns differ because the outer sides
 * are unequal. L, rows, columns, and tileCount are bounded for a legible
 * square-cell rendering; the generator keeps tileCount <= 100.
 *
 * `tileProof`, when present, adds the explicit row-area and counted-tile
 * equality chain for the selected tiling proof profile. Its tileCount and
 * tileArea repeat the grid's exact factors, oneRowArea is columns/L²,
 * countedArea is tileCount × tileArea = rows × oneRowArea, and
 * sideProductArea is (a/b) × (c/d); both areas equal areaSquareUnits exactly.
 * The common lattice and tile-sum value remain present when it is absent,
 * so every consuming view can render every producer member. No prompt,
 * unknown, requested reasoning, or layout choice appears in this payload.
 */
export type FractionRectangleAreaProblem = Readonly<{
    kind: 'fraction-rectangle-area';
    linearUnit: 'unit';
    squareUnit: 'square-unit';
    outerRectangle: Readonly<{
        length: FractionRectangleAreaRational;
        width: FractionRectangleAreaRational;
    }>;
    areaSquareUnits: FractionRectangleAreaRational;
    tileGrid: Readonly<{
        partitionDenominator: number;
        squareTile: Readonly<{
            side: FractionRectangleAreaRational;
            areaSquareUnits: FractionRectangleAreaRational;
        }>;
        rows: number;
        columns: number;
        tileCount: number;
        cells: readonly FractionRectangleTileCell[];
        tiledAreaSquareUnits: FractionRectangleAreaRational;
    }>;
    tileProof?: Readonly<{
        tileCount: number;
        tileAreaSquareUnits: FractionRectangleAreaRational;
        oneRowAreaSquareUnits: FractionRectangleAreaRational;
        countedAreaSquareUnits: FractionRectangleAreaRational;
        sideProductAreaSquareUnits: FractionRectangleAreaRational;
    }>;
}>;

/** Exact positive rational; the original fraction form is retained. */
export type FractionScaleRational = Readonly<{
    numerator: number;
    denominator: number;
}>;

/**
 * Ability-neutral comparison of a positive reference quantity q with its
 * fractionally scaled value (a/b)q. Every rational component is a safe integer,
 * each denominator is positive, q > 0, a > 0, and b > 1. The scale factor keeps
 * its original a/b notation, including a = b for the equality case. `product`
 * equals (a/b)q exactly; rational equality uses cross-products, not floating
 * point. `relation` compares both a/b with one and `product` with q, so it is
 * greater iff a > b, less iff a < b, and equal iff a = b.
 *
 * `onePart` is q/b: b such parts reconstruct q and a reconstruct `product`.
 * `partDifferenceCount` is signed a - b, an exact witness for how the two
 * quantities differ in those equal parts. `wholeNumberAnalogy` records the
 * familiar enlargement 2q > q using the same reference q. These are
 * mathematical facts shared by comparison and explanation views. A view
 * selects its own learner question, unknown placement, wording, and display.
 */
export type FractionScaleComparisonProblem = Readonly<{
    kind: 'fraction-scale-comparison';
    reference: FractionScaleRational;
    scaleFactor: FractionScaleRational;
    product: FractionScaleRational;
    relation: 'greater' | 'less' | 'equal';
    onePart: FractionScaleRational;
    partDifferenceCount: number;
    wholeNumberAnalogy: Readonly<{
        factor: 2;
        product: FractionScaleRational;
    }>;
}>;

export type FractionArithmeticOperation = 'addition' | 'subtraction';

export type LikeDenominatorFractionValue = {
    numerator: number;
    denominator: FractionParts;
};

export type MixedFractionValue = {
    whole: number;
    numerator: number;
    denominator: FractionParts;
};

export type FractionArithmeticCommon = {
    denominator: FractionParts;
    sharedWhole: 1;
};

export type FractionBinaryOperationProblem = FractionArithmeticCommon & {
    task: 'fraction-operation';
    operation: FractionArithmeticOperation;
    first: LikeDenominatorFractionValue;
    second: LikeDenominatorFractionValue;
    result: LikeDenominatorFractionValue;
};

export type FractionDecomposition = {
    terms: LikeDenominatorFractionValue[];
};

export type FractionDecompositionSource =
    | {kind: 'proper'; value: LikeDenominatorFractionValue}
    | {kind: 'mixed'; value: MixedFractionValue};

export type FractionDecompositionProblem = FractionArithmeticCommon & {
    task: 'decompose';
    operation: 'addition';
    source: FractionDecompositionSource;
    decompositions: [FractionDecomposition, FractionDecomposition];
};

export type MixedFractionOperationProblem = FractionArithmeticCommon & {
    task: 'mixed-operation';
    operation: FractionArithmeticOperation;
    first: MixedFractionValue;
    second: MixedFractionValue;
    result: MixedFractionValue;
};

/** One original fractional operand in an unlike-denominator operation. */
export type UnlikeFractionOperand = Readonly<{
    numerator: number;
    denominator: FractionParts;
}>;

/** Exact conversion of an original operand to the selected common denominator. */
export type UnlikeFractionConversion = Readonly<{
    factor: number;
    /** The original fractional numerator multiplied by factor. */
    fractionalNumeratorAtCommonDenominator: number;
    /** For mixed values, also includes whole * commonDenominator. */
    improperNumeratorAtCommonDenominator: number;
}>;

/** A normalized rational result; zero has denominator one. */
export type UnlikeFractionResult = Readonly<{
    numerator: number;
    denominator: number;
}>;

/** A normalized mixed result with 0 <= numerator < denominator. */
export type UnlikeMixedResult = Readonly<{
    whole: number;
    numerator: number;
    denominator: number;
}>;

/**
 * Exact same-whole addition or subtraction of operands with different
 * original denominators. `commonDenominator` is a positive multiple of both
 * originals and need not be their least common multiple. For each operand,
 * factor = commonDenominator / original.denominator; the fractional numerator
 * is original.numerator * factor, and the improper numerator is
 * (original.whole * original.denominator + original.numerator) * factor,
 * taking original.whole as zero for the fraction branch.
 *
 * The common-denominator result numerator is the sum or nonnegative
 * difference of the two converted improper numerators. `result` is the exact
 * reduced value: cross-products with `resultAtCommonDenominator` agree. The
 * mixed branch uses a proper reduced fractional part (denominator one when
 * that part is zero). `storyContext` identifies the measured whole, without
 * supplying a prompt, unknown, or answer prose. Canonical model samples use
 * at most 24 common-denominator parts per whole.
 */
export type UnlikeFractionArithmeticCommon = {
    operation: FractionArithmeticOperation;
    sharedWhole: 1;
    commonDenominator: number;
    firstConversion: UnlikeFractionConversion;
    secondConversion: UnlikeFractionConversion;
    resultAtCommonDenominator: Readonly<{
        numerator: number;
        denominator: number;
    }>;
};

export type UnlikeFractionOperationProblem = UnlikeFractionArithmeticCommon & {
    task: 'unlike-fraction-operation';
    first: UnlikeFractionOperand;
    second: UnlikeFractionOperand;
    result: UnlikeFractionResult;
    storyContext: 'route-length';
};

export type UnlikeMixedOperationProblem = UnlikeFractionArithmeticCommon & {
    task: 'unlike-mixed-operation';
    first: MixedFractionValue;
    second: MixedFractionValue;
    result: UnlikeMixedResult;
    storyContext: 'route-length';
};

export type FractionMultiplicationCommon = FractionArithmeticCommon & {
    operation: 'multiplication';
    wholeFactor: number;
    product: LikeDenominatorFractionValue;
};

export type UnitFractionMultipleProblem = FractionMultiplicationCommon & {
    task: 'unit-fraction-multiple';
    unitFraction: LikeDenominatorFractionValue;
};

export type WholeNumberFractionProductProblem = FractionMultiplicationCommon & {
    task: 'whole-number-fraction-product';
    fractionFactor: LikeDenominatorFractionValue;
};

export type TenthsHundredthsAdditionProblem = {
    task: 'tenths-hundredths-addition';
    operation: 'addition';
    denominator: 100;
    sharedWhole: 1;
    firstTenths: {numerator: number; denominator: 10};
    secondHundredths: {numerator: number; denominator: 100};
    convertedFirst: {numerator: number; denominator: 100};
    result: {numerator: number; denominator: 100};
    conversionFactor: 10;
};

export type DecimalNotationValue = {
    numerator: number;
    denominator: 10 | 100;
    wholeDigit: 0;
    tenthsDigit: number;
    hundredthsDigit: number | null;
    hundredthsNumerator: number;
};

export type DecimalNotationProblem = {
    task: 'decimal-notation';
    sharedWhole: 1;
    relation: 'equal';
    value: DecimalNotationValue;
};

export type DecimalComparisonOperand = {
    precision: 'tenths' | 'hundredths';
    wholeDigit: 0;
    tenthsDigit: number;
    hundredthsDigit: number | null;
    normalizedHundredths: number;
};

export type DecimalComparisonProblem = {
    task: 'compare-decimals';
    sharedWhole: 1;
    relation: 'greater' | 'equal' | 'less';
    left: DecimalComparisonOperand;
    right: DecimalComparisonOperand;
    firstDecidingPlace: 'tenths' | 'hundredths' | 'equal';
};

export type FractionArithmeticProblem =
    | FractionBinaryOperationProblem
    | FractionDecompositionProblem
    | MixedFractionOperationProblem
    | UnlikeFractionOperationProblem
    | UnlikeMixedOperationProblem
    | UnitFractionMultipleProblem
    | WholeNumberFractionProductProblem
    | TenthsHundredthsAdditionProblem;

export type FractionArithmeticExecutionProblem =
    | FractionBinaryOperationProblem
    | MixedFractionOperationProblem
    | UnlikeFractionOperationProblem
    | UnlikeMixedOperationProblem
    | WholeNumberFractionProductProblem
    | TenthsHundredthsAdditionProblem;

export type ShapePartitionProblem = {
    kind: 'partition';
    shape: FractionShape;
    parts: FractionParts;
};

export type ShapeUnitShareComparisonProblem = {
    kind: 'share-comparison';
    shape: FractionShape;
    leftParts: 4;
    relation: 'less';
    rightParts: 2;
};

export type ShapeFractionRegionProblem = {
    kind: 'selected-region';
    shape: FractionShape;
    parts: FractionParts;
    numerator: number;
};

export type ShapePatternToken = {
    shape: 'square' | 'triangle';
    orientation: 0 | 90 | 180 | 270;
};

export type ShapePatternTerm = {
    position: number;
    tokens: ShapePatternToken[];
};

type ShapePatternProblemBase = {
    sequence: ShapePatternTerm[];
};

export type ShapePatternProblem = ShapePatternProblemBase & (
    | {
        patternKind: 'growth-parity';
        recurrence: {
            kind: 'add-square';
            initialSquareCount: 1;
            squareCountIncrease: 1;
        };
        emergentFeature: {
            kind: 'position-count-parity';
        };
    }
    | {
        patternKind: 'rotation-axis';
        recurrence: {
            kind: 'quarter-turn-clockwise';
            initialOrientation: 0;
            quarterTurnsPerTerm: 1;
        };
        emergentFeature: {
            kind: 'position-axis-parity';
        };
    }
);

export type SquareArrayDimension = 1 | 2 | 3 | 4 | 5;

export type SquareAreaUnitId =
    | 'square-unit'
    | 'square-centimeter'
    | 'square-meter'
    | 'square-inch'
    | 'square-foot';

export type EqualSquarePartitionProblem = {
    kind: 'equal-square-partition';
    rows: Exclude<SquareArrayDimension, 1>;
    columns: Exclude<SquareArrayDimension, 1>;
    partCount: number;
};

export type UnitSquareGridProblem = {
    kind: 'unit-square-grid';
    rows: SquareArrayDimension;
    columns: SquareArrayDimension;
    tileCount: number;
    unitId: SquareAreaUnitId;
};

export type RectangleAreaProblem = {
    kind: 'rectangle-area';
    length: number;
    width: number;
    area: number;
    unitId: SquareAreaUnitId;
};

export type DistributiveAreaDecompositionProblem = {
    kind: 'distributive';
    height: number;
    leftWidth: number;
    rightWidth: number;
    totalWidth: number;
    leftArea: number;
    rightArea: number;
    totalArea: number;
};

export type RectilinearAreaDecompositionProblem = {
    kind: 'rectilinear';
    leftWidth: number;
    rightWidth: number;
    totalHeight: number;
    bottomHeight: number;
    leftArea: number;
    rightArea: number;
    totalArea: number;
};

export type AreaDecompositionProblem =
    | DistributiveAreaDecompositionProblem
    | RectilinearAreaDecompositionProblem;

export type PolygonVertex = {
    x: number;
    y: number;
};

type GeometryPerimeterProblemBase = {
    shape: 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon';
    vertices: PolygonVertex[];
    sideLengths: number[];
    perimeter: number;
};

export type PolygonPerimeterProblem = GeometryPerimeterProblemBase;

type RectanglePerimeterFormulaBase = {
    shape: 'rectangle';
    length: number;
    width: number;
    perimeter: number;
};

export type RectanglePerimeterProblem = RectanglePerimeterFormulaBase;

export type GeometryPerimeterProblem =
    | PolygonPerimeterProblem
    | RectanglePerimeterProblem;

export type RectangleMeasures = {
    width: number;
    height: number;
    area: number;
    perimeter: number;
};

type AreaPerimeterRelationBase = {
    first: RectangleMeasures;
    second: RectangleMeasures;
};

export type AreaPerimeterRelationProblem = AreaPerimeterRelationBase & (
    | {
        relation: 'equal-perimeter';
    }
    | {
        relation: 'equal-area';
    }
);

export type PartitionPoint = {x: number; y: number};

export type PartitionBoundary =
    | {kind: 'segment'; start: PartitionPoint; end: PartitionPoint}
    | {
        kind: 'cubic';
        start: PartitionPoint;
        segments: {control1: PartitionPoint; control2: PartitionPoint; end: PartitionPoint}[];
    };

/** Two partitions of the same origin-centered whole, in mathematical rather than pixel coordinates. */
export type ShapePartitionEquivalenceProblem = {
    whole:
        | {shape: 'rectangle'; width: number; height: number}
        | {shape: 'circle'; radius: number};
    boundaries: [PartitionBoundary, PartitionBoundary];
};

export type AngleArcFraction =
    | {numerator: 1; denominator: 6}
    | {numerator: 1; denominator: 4}
    | {numerator: 1; denominator: 3}
    | {numerator: 1; denominator: 2};

type AngleRelationBase = {
    fullTurnDegrees: 360;
    angleDegrees: number;
};

export type AngleArcFractionProblem = AngleRelationBase & {
    kind: 'fractional-arc';
    arcFraction: AngleArcFraction;
};

export type AngleUnitPartitionProblem = AngleRelationBase & {
    kind: 'equal-angle-partition';
    parts: 360;
    angleDegrees: 1;
};

export type AngleUnitIterationProblem = AngleRelationBase & {
    kind: 'angle-iteration';
    unitDegrees: 1;
    count: number;
};

export type ProtractorAngleMeasure = 23 | 37 | 52 | 68 | 90 | 112 | 127 | 143 | 158;
export type SketchAngleMeasure = 30 | 45 | 60 | 75 | 90 | 105 | 120 | 135 | 150;

export type AngleMeasure = ProtractorAngleMeasure | SketchAngleMeasure;

export type AngleMeasurementProblem = {
    angleMeasure: AngleMeasure;
};

export type AngleArithmeticProblem = {
    operation: 'addition' | 'subtraction';
    adjacentAngleMeasures: [number, number];
    wholeAngleMeasure: number;
};

export type GeometryPrimitiveKind =
    | 'point'
    | 'line'
    | 'line-segment'
    | 'ray'
    | 'right-angle'
    | 'acute-angle'
    | 'obtuse-angle'
    | 'perpendicular-lines'
    | 'parallel-lines';

export type GeometryPrimitiveCoordinate = {
    x: number;
    y: number;
};

export type GeometryPrimitivePoint = GeometryPrimitiveCoordinate & {
    id: string;
    label: string;
    labelPosition: GeometryPrimitiveCoordinate;
};

export type GeometryPrimitiveStroke = {
    id: string;
    start: GeometryPrimitiveCoordinate;
    end: GeometryPrimitiveCoordinate;
    arrowStart: boolean;
    arrowEnd: boolean;
};

export type GeometryPrimitiveMarker =
    | {
        kind: 'angle-arc';
        center: GeometryPrimitiveCoordinate;
        radius: number;
        startDegrees: number;
        endDegrees: number;
    }
    | {
        kind: 'right-angle';
        points: [
            GeometryPrimitiveCoordinate,
            GeometryPrimitiveCoordinate,
            GeometryPrimitiveCoordinate
        ];
    }
    | {
        kind: 'parallel';
        strokes: [
            [GeometryPrimitiveCoordinate, GeometryPrimitiveCoordinate],
            [GeometryPrimitiveCoordinate, GeometryPrimitiveCoordinate]
        ];
    };

export type GeometryPrimitiveScene = {
    points: GeometryPrimitivePoint[];
    strokes: GeometryPrimitiveStroke[];
    markers: GeometryPrimitiveMarker[];
};

export type GeometryPrimitiveCandidateId = 'A' | 'B' | 'C' | 'D';

export type GeometryPrimitiveCandidate = {
    id: GeometryPrimitiveCandidateId;
    kind: GeometryPrimitiveKind;
    scene: GeometryPrimitiveScene;
};

export type GeometryPrimitivesProblem = {
    primitiveKind: GeometryPrimitiveKind;
};


/** Safe reduced integer components, positive denominator, canonical zero 0/1, and no negative zero. */
export type SignedRational = {numerator: number; denominator: number};
export type RationalSign = -1 | 0 | 1;

/** Complete exact uniform scale containing zero; symmetry belongs to each producer. */
export type SignedRationalAxis = {
    minimum: SignedRational;
    maximum: SignedRational;
    step: SignedRational;
    ticks: readonly SignedRational[];
    zeroIndex: number;
};

export type SignedRationalLocation = {
    value: SignedRational;
    tickIndex: number;
    sign: RationalSign;
    /** Supplied nonnegative absolute value, in the same canonical rational form. */
    magnitude: SignedRational;
};

export type SignedRationalContextMetadata =
    | {kind: 'temperature'; reference: 'celsius-zero'; unit: 'degrees-celsius'}
    | {kind: 'elevation'; reference: 'sea-level'; unit: 'meters'}
    | {kind: 'balance'; reference: 'settled-balance'; unit: 'dollars'}
    | {kind: 'charge'; reference: 'neutral-net-charge'; unit: 'coulombs'};

export type SignedContextObservation = {
    id: string;
    value: SignedRational;
    /** Supplied nonnegative absolute value. */
    magnitude: SignedRational;
    sign: RationalSign;
};

/** The reference is semantic metadata; a zero observation is an actual value, not an absent record. */
export type SignedRationalContextProblem = {
    kind: 'signed-rational-contexts';
    context: SignedRationalContextMetadata;
    observations: readonly [SignedContextObservation, ...SignedContextObservation[]];
};

/** Symmetric 5..11-tick axis and complete negation, reflection and distance witnesses. */
export type RationalOppositeRelationProblem = {
    kind: 'rational-opposite-relations';
    axis: SignedRationalAxis;
    original: SignedRationalLocation;
    opposite: SignedRationalLocation;
    doubleOpposite: SignedRationalLocation;
    zeroFixedPoint: {
        value: SignedRational;
        opposite: SignedRational;
        tickIndex: number;
        oppositeTickIndex: number;
    };
    oppositePair: {
        negative: SignedRationalLocation;
        positive: SignedRationalLocation;
        commonMagnitude: SignedRational;
    };
    unequalSignedPair: {
        negative: SignedRationalLocation;
        positive: SignedRationalLocation;
        equalMagnitude: false;
    };
};

/** Exact display form; unreduced fractions and decimal trailing zeros retain their supplied spelling. */
export type SignedRationalNotation =
    | {kind: 'integer'; numeral: string}
    | {kind: 'fraction'; numerator: number; denominator: number}
    | {kind: 'decimal'; coefficient: number; scale: number; numeral: string};

export type FormattedSignedRationalLocation = SignedRationalLocation & {notation: SignedRationalNotation};
/** Complete uniform scale; zero may be an endpoint and x/y scales may differ. */
export type RationalCoordinateAxis = SignedRationalAxis & {
    tickNotations: readonly SignedRationalNotation[];
    stepNotation: SignedRationalNotation;
};
export type CoordinateLocationTag =
    | 'quadrant-I' | 'quadrant-II' | 'quadrant-III' | 'quadrant-IV'
    | 'x-axis' | 'y-axis' | 'origin';
export type RationalCoordinatePoint = {
    id: string;
    x: FormattedSignedRationalLocation;
    y: FormattedSignedRationalLocation;
    locationTag: CoordinateLocationTag;
};
export type RationalCoordinateAxes = {x: RationalCoordinateAxis; y: RationalCoordinateAxis};

export type CoordinatePointsProblem = {
    kind: 'coordinate-points';
    axes: RationalCoordinateAxes;
    points: readonly [RationalCoordinatePoint, ...RationalCoordinatePoint[]];
};

/** Each step links exact points and preserves distance to its supplied perpendicular foot. */
export type CoordinateReflectionStep = {
    axis: 'x' | 'y';
    before: RationalCoordinatePoint;
    after: RationalCoordinatePoint;
    unchanged: {component: 'x' | 'y'; value: SignedRational};
    negated: {
        component: 'x' | 'y';
        before: SignedRational;
        after: SignedRational;
        valueChanged: boolean;
    };
    mirror: {
        foot: RationalCoordinatePoint;
        beforeDistance: SignedRational;
        afterDistance: SignedRational;
    };
};
/** Steps connect in order; coherent repeated-axis involutions are valid members as well. */
export type CoordinateReflectionRelationProblem = {
    kind: 'coordinate-reflection-relations';
    axes: RationalCoordinateAxes;
    original: RationalCoordinatePoint;
    steps: readonly [CoordinateReflectionStep] | readonly [CoordinateReflectionStep, CoordinateReflectionStep];
};

/** Complete exact scale with at least three ticks and one located value, retaining supplied notation. */
export type RationalNumberlineValuesProblem = {
    kind: 'rational-numberline-values';
    axis: RationalCoordinateAxis;
    /** Value equals the supplied axis tick; sign, magnitude and notation agree exactly. */
    point: FormattedSignedRationalLocation;
};

export type StrictRationalOrder = 'less' | 'greater';
export type RationalMagnitudeOrder = StrictRationalOrder | 'equal';
export type OrderedSignedContextMetadata = Extract<SignedRationalContextMetadata,
    {kind: 'temperature' | 'elevation' | 'balance'}>;

/** Complete increasing scale containing zero; distinct first/second values retain their nominal roles. */
export type RationalOrderRelationProblem = {
    kind: 'rational-order-relations';
    axis: SignedRationalAxis;
    first: SignedRationalLocation;
    second: SignedRationalLocation;
    relation: StrictRationalOrder;
};

/** One datum and unit, distinct observation IDs, and strictly unequal canonical signed values. */
export type RationalOrderContextProblem = {
    kind: 'rational-order-contexts';
    context: OrderedSignedContextMetadata;
    first: SignedContextObservation;
    second: SignedContextObservation;
    relation: StrictRationalOrder;
};

/** The zero-to-point segment has exact length point.magnitude, including the zero-length case. */
export type RationalMagnitudeRelationProblem = {
    kind: 'rational-magnitude-relations';
    axis: SignedRationalAxis;
    point: SignedRationalLocation;
    distance: {
        /** Exactly axis.zeroIndex. */
        fromTickIndex: number;
        /** Exactly point.tickIndex. */
        toTickIndex: number;
        /** Canonical nonnegative absolute value of point.value. */
        length: SignedRational;
    };
};

/** Signed inputs are unequal; distinct opposites can have equal magnitudes. */
export type RationalMagnitudeContextProblem = {
    kind: 'rational-magnitude-contexts';
    context: OrderedSignedContextMetadata;
    first: SignedContextObservation;
    second: SignedContextObservation;
    signedRelation: StrictRationalOrder;
    magnitudeRelation: RationalMagnitudeOrder;
};

export type CoordinateMetricContext = {
    kind: 'survey-map';
    reference: 'survey-origin';
    lengthUnit: 'meters';
    positiveX: 'east';
    positiveY: 'north';
    /** Exactly one semantic role per referenced point; no instructions or answer prose. */
    landmarks: readonly {pointId: string; role: 'entrance' | 'bench' | 'fountain' | 'tree' | 'corner'}[];
};

/** Axis names identify the VARYING coordinate. Endpoints may coincide only outside polygon edges. */
export type CoordinateAlignedSeparation = {
    fromId: string;
    toId: string;
    varyingAxis: 'x' | 'y';
    fixedCoordinate: SignedRational;
    fromCoordinate: SignedRational;
    toCoordinate: SignedRational;
    direction: 'increasing' | 'decreasing' | 'stationary';
    lower: SignedRational;
    upper: SignedRational;
    /** Always upper-lower, not an oriented negative travel amount. */
    orderedDifference: SignedRational;
    distance: SignedRational;
};

/**
 * Operands are the two varying endpoint values, in an explicitly supplied order.
 * difference=minuend-subtrahend; magnitude=abs(difference)=separation.distance.
 * Travel from/to roles remain separate. Nonnegative variants use upper-lower,
 * including when travel runs left/down, so no negative auxiliary value is emitted.
 * This exact relation needs no second axis or constructed magnitude-line model.
 */
export type CoordinateAbsoluteDifference = {
    minuend: SignedRational;
    subtrahend: SignedRational;
    difference: SignedRational;
    magnitude: SignedRational;
};

export type CoordinateAxisDistanceProblem = {
    kind: 'coordinate-axis-distance';
    axes: RationalCoordinateAxes;
    first: RationalCoordinatePoint;
    second: RationalCoordinatePoint;
    separation: CoordinateAlignedSeparation;
    absoluteDifference: CoordinateAbsoluteDifference;
    context: CoordinateMetricContext;
};

export type CoordinateRouteLeg = CoordinateAlignedSeparation;

export type CoordinateRouteProblem = {
    kind: 'coordinate-problems';
    axes: RationalCoordinateAxes;
    landmarks: readonly [RationalCoordinatePoint, RationalCoordinatePoint, ...RationalCoordinatePoint[]];
    /** A prescribed rectilinear route through known landmark IDs; repeated visits are permitted. */
    path: readonly [string, string, ...string[]];
    legs: readonly [CoordinateRouteLeg, ...CoordinateRouteLeg[]];
    /** Starts at0; entry k is the sum of the first k leg lengths; length=legs.length+1. */
    cumulativeLengths: readonly [SignedRational, ...SignedRational[]];
    totalLength: SignedRational;
    context: CoordinateMetricContext;
};

export type CoordinatePolygonEdge = {fromId: string; toId: string};
export type CoordinatePolygonSideRelation = {
    edgeIndex: number;
    separation: CoordinateAlignedSeparation;
};

/** An explicit upper-minus-lower calculation for one actual coordinate-aligned boundary edge. */
export type CoordinatePolygonSideDistanceEquation = {
    edgeIndex: number;
    minuend: SignedRational;
    subtrahend: SignedRational;
    difference: SignedRational;
};

/**
 * Vertices and cyclic edges supply complete exact geometry. Pure exact predicates
 * validate noncollinearity and a simple boundary, including segment touch/overlap;
 * no extra index-pair list, computed area/perimeter or signed cross-products are emitted.
 */
export type CoordinatePolygonProblem = {
    kind: 'coordinate-polygons';
    axes: RationalCoordinateAxes;
    /** Unique IDs AND positions, noncollinear simple boundary in this complete cyclic order. */
    vertices: readonly [RationalCoordinatePoint, RationalCoordinatePoint, RationalCoordinatePoint, ...RationalCoordinatePoint[]];
    /** Exactly consecutive vertex pairs, including final-to-first closure. */
    edges: readonly [CoordinatePolygonEdge, CoordinatePolygonEdge, CoordinatePolygonEdge, ...CoordinatePolygonEdge[]];
    /** Complete list of horizontal/vertical edge relations, in boundary order, never a diagonal. */
    alignedSides: readonly [CoordinatePolygonSideRelation, ...CoordinatePolygonSideRelation[]];
    /** Optional selected mathematical evidence as a required array: unique aligned edge indices in boundary order. */
    sideDistanceEquations: readonly CoordinatePolygonSideDistanceEquation[];
    context: CoordinateMetricContext;
};

/** Exact reduced rational with a positive denominator; ratio quantities are nonnegative. */
export type RatioRational = {numerator: number; denominator: number};

export type RatioQuantity = {name: string; unit: string; value: RatioRational};

/** Ordered quantities retain the antecedent/consequent meanings independently of a task. */
export type RatioRelationProblem = {
    kind: 'ratio-relation';
    antecedent: RatioQuantity;
    consequent: RatioQuantity;
};

/** Unit rate and a scaled equivalent pair are exact witnesses, never selected unknowns. */
export type UnitRateRelationProblem = {
    kind: 'unit-rate';
    context: 'price' | 'speed';
    antecedent: RatioQuantity;
    consequent: RatioQuantity;
    unitRate: RatioRational;
    scaleFactor: RatioRational;
    scaled: {antecedent: RatioRational; consequent: RatioRational};
};

/** Positive whole-number pairs share one ratio; all graph bounds include every row. */
export type RatioTableProblem = {
    kind: 'ratio-table';
    quantities: [{name: string; unit: string}, {name: string; unit: string}];
    base: [number, number];
    rows: {antecedent: number; consequent: number; scale: number}[];
    coordinateScale: {xStep: number; yStep: number; xMax: number; yMax: number};
};

/** The final rows share a consequent, so antecedents witness the ordered ratio comparison. */
export type RatioTableComparisonProblem = {
    kind: 'ratio-table-comparison';
    left: RatioTableProblem;
    right: RatioTableProblem;
    relation: 'less' | 'equal' | 'greater';
    normalized: {consequent: number; leftAntecedent: number; rightAntecedent: number};
};

/** Positive percentages give a unique inverse; part = whole times the exact per-hundred factor. */
export type PercentQuantityProblem = {
    kind: 'percent-quantity';
    percent: number;
    perHundred: {numerator: number; denominator: 100};
    scaleFactor: RatioRational;
    whole: RatioRational;
    part: RatioRational;
};

export type MeasurementRatioUnit = {
    id: string;
    name: string;
    symbol: string;
    system: 'metric' | 'customary' | 'time';
    dimension: 'length' | 'mass' | 'volume' | 'time';
};

/**
 * Both equalities denote the same physical quantity in the two named units.
 * quantityEquality = unitEquality times scaleFactor on each side;
 * forwardFactor = unitEquality.second / unitEquality.first, with reciprocal reverseFactor.
 * The ordered pair has no selected conversion direction or requested unknown.
 */
export type MeasurementRatioRelationProblem = {
    kind: 'measurement-ratio-relation';
    units: {first: MeasurementRatioUnit; second: MeasurementRatioUnit};
    unitEquality: {first: RatioRational; second: RatioRational};
    quantityEquality: {first: RatioRational; second: RatioRational};
    scaleFactor: RatioRational;
    forwardFactor: RatioRational;
    reverseFactor: RatioRational;
};

export type DimensionUnitSymbol = 'm' | 's' | 'kg';
export type DimensionUnitPowers = Record<DimensionUnitSymbol, number>;
export type PhysicalDimensionPowers = Record<'length' | 'time' | 'mass', number>;
export type DimensionedRational = {
    value: RatioRational;
    units: DimensionUnitPowers;
    dimensions: PhysicalDimensionPowers;
};

/**
 * Exact positive values and coherent SI base-unit exponents obey the stated operation.
 * Raw factor lists expand the product (or reciprocal of the right divisor); cancellation
 * pairs index equal symbols on opposite sides, each index at most once. Uncancelled
 * factors give the result's normalized unit and physical-dimension powers.
 */
export type UnitDimensionRelationProblem = {
    kind: 'unit-dimension-relation';
    operation: 'multiplication' | 'division';
    left: DimensionedRational;
    right: DimensionedRational;
    result: DimensionedRational;
    unitFactors: {numerator: DimensionUnitSymbol[]; denominator: DimensionUnitSymbol[]};
    cancellations: {numeratorIndex: number; denominatorIndex: number}[];
};

export type ExactNumericValue = Readonly<SignedRational>;
export type ExactNumericNotation = Readonly<SignedRationalNotation>;

/** Numeric-only immutable syntax; genuine grouping retains its own occurrence identity. */
export type ExactNumericalExpressionNode =
    | Readonly<{id: string; kind: 'number'; value: ExactNumericValue; notation: ExactNumericNotation}>
    | Readonly<{id: string; kind: 'binary'; operation: ArithmeticOperation;
        left: ExactNumericalExpressionNode; right: ExactNumericalExpressionNode}>
    | Readonly<{id: string; kind: 'group'; expression: ExactNumericalExpressionNode}>
    | Readonly<{id: string; kind: 'negation'; operand: ExactNumericalExpressionNode}>
    | Readonly<{id: string; kind: 'power'; base: ExactNumericalExpressionNode; exponent: number}>;

/** One exact value per original occurrence, including literals and explicit groups. */
export type ExactNumericNodeValue = Readonly<{nodeId: string; value: ExactNumericValue}>;

export type ExactPowerFact = Readonly<{
    nodeId: string;
    baseValue: ExactNumericValue;
    exponent: number;
    result: ExactNumericValue;
}> & (
    | Readonly<{kind: 'zero-exponent'; nonzeroBase: true}>
    | Readonly<{kind: 'positive-exponent';
        factors: readonly [ExactNumericValue, ...ExactNumericValue[]];
        /** Exponent n supplies n factors and n-1 successive multiplication results. */
        cumulativeProducts: readonly ExactNumericValue[]}>
);

export type ExactNumericPath = readonly ('left' | 'right' | 'expression' | 'operand' | 'base')[];
export type ExactNumericReductionEvidence =
    | Readonly<{kind: 'binary'; operation: ArithmeticOperation;
        operands: readonly [ExactNumericValue, ExactNumericValue]; result: ExactNumericValue}>
    | Readonly<{kind: 'power'; baseValue: ExactNumericValue; exponent: number; result: ExactNumericValue}>
    | Readonly<{kind: 'negation'; operand: ExactNumericValue; result: ExactNumericValue}>
    | Readonly<{kind: 'group'; enclosedValue: ExactNumericValue; result: ExactNumericValue}>;

/**
 * The path resolves in the preceding snapshot (original syntax for step zero). Only the
 * next conventional written redex is replaced by a same-ID exact number. Other syntax
 * and retained notation stay unchanged; the final snapshot is the original root's literal.
 */
export type ExactNumericReduction = Readonly<{
    targetNodeId: string;
    path: ExactNumericPath;
    evidence: ExactNumericReductionEvidence;
    after: ExactNumericalExpressionNode;
}>;

/** Real competing/binding operations and their exact conventional reduction indices. */
export type ExactNumericPrecedenceWitness = Readonly<{
    higherPriorityNodeId: string;
    lowerPriorityNodeId: string;
    higherPriorityStep: number;
    lowerPriorityStep: number;
    reason: 'inner-group-before-outer-operation' | 'power-before-product-or-sum'
        | 'product-before-sum' | 'equal-priority-left-to-right';
}>;

/**
 * A finite acyclic, uniquely identified numeric tree with at least one power. Safe reduced
 * exact values, complete power facts and every original nonliteral's immutable reduction
 * prove the result. Exponents are nonnegative integers; 0^0 and zero divisors are invalid.
 * Syntax must preserve written binding: compound power bases, binary operands of unary negation
 * and binary children whose association needs parentheses have explicit groups. Negating a
 * power directly is valid because powers bind first. Atomic negative or
 * fractional power-base parentheses are formatting and add no artificial group step.
 */
export type NumericalPowerExpressionProblem = Readonly<{
    kind: 'numerical-power-expression';
    expression: ExactNumericalExpressionNode;
    nodeValues: readonly [ExactNumericNodeValue, ...ExactNumericNodeValue[]];
    powerFacts: readonly [ExactPowerFact, ...ExactPowerFact[]];
    reductions: readonly [ExactNumericReduction, ...ExactNumericReduction[]];
    finalValue: ExactNumericValue;
    precedenceWitness: ExactNumericPrecedenceWitness | null;
}>;

/**
 * Builder policy constrains all exact numeric values, exponents and intermediates. The
 * absolute-value bound is not a separate numerator/denominator or decimal-storage cap.
 */
export type ExactNumericExpressionConstraints = Readonly<{
    domain: 'rational' | 'nonnegative-rational' | 'integer' | 'nonnegative-integer';
    maximumAbsoluteValue: ExactNumericValue;
    maximumNodes: number;
    maximumDepth: number;
    maximumExponent: number;
}>;

/** General numeric calculation component; literal-only and unpowered instances are valid. */
export type ExactNumericCalculation = Readonly<{
    expression: ExactNumericalExpressionNode;
    nodeValues: readonly [ExactNumericNodeValue, ...ExactNumericNodeValue[]];
    powerFacts: readonly ExactPowerFact[];
    reductions: readonly ExactNumericReduction[];
    finalValue: ExactNumericValue;
    precedenceWitness: ExactNumericPrecedenceWitness | null;
}>;

export type AlgebraicScalar = ExactNumericValue;
export type AlgebraicNotation = ExactNumericNotation;

/**
 * Separate recursive symbolic superset; every numeric calculation tree is structurally
 * assignable, while the numeric-only recursive union remains unchanged.
 * Unique nonempty ids within each tree; no cycles, sparse children or -0.
 * A variable refers to a declaration, not an arbitrary string expression.
 */
export type ExactSymbolicExpressionNode =
    | Extract<ExactNumericalExpressionNode, {kind: 'number'}>
    | Readonly<{id: string; kind: 'variable'; symbolId: string}>
    | Readonly<{id: string; kind: 'binary'; operation: ArithmeticOperation;
        left: ExactSymbolicExpressionNode; right: ExactSymbolicExpressionNode}>
    | Readonly<{id: string; kind: 'group'; expression: ExactSymbolicExpressionNode}>
    | Readonly<{id: string; kind: 'negation'; operand: ExactSymbolicExpressionNode}>
    | Readonly<{id: string; kind: 'power'; base: ExactSymbolicExpressionNode; exponent: number}>;

export type AlgebraicDomainBound = Readonly<{value: AlgebraicScalar; inclusive: boolean}>;
/** The domain means ALL its admitted values, not merely the supplied assignment. */
export type AlgebraicVariableDomain = Readonly<{
    kind: 'rational' | 'integer';
    lower: AlgebraicDomainBound | null;
    upper: AlgebraicDomainBound | null;
    excludedValues: readonly AlgebraicScalar[];
}>;
export type AlgebraicSymbolDeclaration = Readonly<{
    symbolId: string;
    /** Unambiguous identifier: a Unicode letter followed by letters, digits or underscores. */
    symbol: string;
    domain: AlgebraicVariableDomain;
}>;
/** Original expression node references retain division / exponent-zero domains. */
export type AlgebraicDomainRestriction = Readonly<{
    kind: 'nonzero-expression';
    expressionNodeId: string;
    reason: 'division-denominator' | 'zero-exponent-base';
}>;
export type AlgebraicBinding = Readonly<{
    symbolId: string;
    value: AlgebraicScalar;
    notation: AlgebraicNotation;
    /** EXACT complete set of original variable occurrences replaced by this binding. */
    occurrenceNodeIds: readonly [string, ...string[]];
}>;

/**
 * Every declared symbol is used, has exactly one admissible binding, and every
 * occurrence is replaced consistently. Number/operator/group ids and original
 * literal spelling are unchanged; variable nodes become same-id number leaves
 * with the binding's supplied notation. No symbolic nonliteral has a value field.
 * Empty powerFacts are valid here, unlike the power-required problem.
 * nodeValues covers EVERY substituted original node. Reduction snapshots follow
 * the numeric engine's true written-precedence procedure and exact same-id replacement.
 */
export type AlgebraicSubstitution = Readonly<{
    bindings: readonly [AlgebraicBinding, ...AlgebraicBinding[]];
    substitutedExpression: ExactNumericalExpressionNode;
    nodeValues: readonly [ExactNumericNodeValue, ...ExactNumericNodeValue[]];
    powerFacts: readonly ExactPowerFact[];
    reductions: readonly ExactNumericReduction[];
    finalValue: AlgebraicScalar;
    finalNotation: AlgebraicNotation;
    precedenceWitness: ExactNumericPrecedenceWitness | null;
}>;

/**
 * This names a MATHEMATICAL instance of the same parameterization relation:
 * either original symbolic syntax or its fully substituted numeric syntax.
 * Numeric structural targets therefore show a genuine ArithmeticExpression;
 * symbolic structural targets show a genuine AlgebraicExpression.
 */
export type AlgebraicStructuralExpression =
    | Readonly<{kind: 'symbolic'; expression: ExactSymbolicExpressionNode}>
    | Readonly<{kind: 'numeric'; expression: ExactNumericalExpressionNode}>;

/** All refs in structural/group facts are scoped to structuralExpression. */
export type AlgebraicComponentRef = Readonly<{nodeId: string}>;
/**
 * sourceNodeId is the unsigned source subtree; polarity includes every enclosing
 * subtraction/negation at the stated additive level. signedExpression supplies
 * the COMPLETE component, not positive 3y mislabeled as the term -3y.
 * A derived enclosing negation has a fresh id; surviving subtree ids are retained.
 */
export type SignedAlgebraicTerm = Readonly<{
    sourceNodeId: string;
    polarity: 1 | -1;
    signedExpression: ExactSymbolicExpressionNode;
}>;

export type AlgebraicStructuralRelation =
    | Readonly<{kind: 'additive-components'; levelNodeId: string;
        terms: readonly [SignedAlgebraicTerm, SignedAlgebraicTerm, ...SignedAlgebraicTerm[]]}>
    | Readonly<{kind: 'multiplicative-components'; productNodeId: string;
        factors: readonly [AlgebraicComponentRef, AlgebraicComponentRef, ...AlgebraicComponentRef[]]}>
    | Readonly<{kind: 'coefficient'; additiveLevelNodeId: string; term: SignedAlgebraicTerm;
        coefficient: AlgebraicScalar; coefficientNotation: AlgebraicNotation;
        /** The designated nonconstant variable part, including its grouping. */
        variablePart: ExactSymbolicExpressionNode;
        /** Variable-free factor values; coefficient = term.polarity * their product (empty product 1). */
        constantFactors: readonly AlgebraicScalar[];
        variableSymbolIds: readonly [string, ...string[]]}>
    | Readonly<{kind: 'sum'; operationNodeId: string;
        addends: readonly [AlgebraicComponentRef, AlgebraicComponentRef]}>
    | Readonly<{kind: 'product'; operationNodeId: string;
        factors: readonly [AlgebraicComponentRef, AlgebraicComponentRef]}>
    | Readonly<{kind: 'quotient'; operationNodeId: string;
        numerator: AlgebraicComponentRef; denominator: AlgebraicComponentRef}>;

/**
 * The actual group node is a complete operand in the referenced enclosing node.
 * Group selection is mathematical incidence, not a requested highlight/unknown.
 * A source group id, inner id and operand position are all supplied; the view
 * need only format/highlight them and choose its fixed interpretation response.
 */
export type AlgebraicGroupedOperand = Readonly<{
    groupNodeId: string;
    innerNodeId: string;
    parentNodeId: string;
    enclosingOperation: ArithmeticOperation | 'negation' | 'power';
    position: 'left' | 'right' | 'operand' | 'base';
}>;

export type AlgebraicUnit = Readonly<{
    /** Subject distinguishes, for example, tickets from containers. */
    subject: 'number' | 'money' | 'time' | 'item' | 'length' | 'area' | 'volume';
    /** Coherent atomic unit identity, optionally square/cubic or '<unit> per <unit>'; no implicit conversions. */
    name: string;
    dimensions: Readonly<{currency: number; time: number; count: number; length: number}>;
}>;
export type AlgebraicQuantity = Readonly<{
    quantityId: string;
    meaning: 'fixed-charge' | 'rate' | 'duration' | 'group-count' | 'amount-per-group'
        | 'initial-amount' | 'added-amount' | 'removed-amount' | 'remaining-amount'
        | 'total-amount' | 'share-count' | 'amount-per-share' | 'length' | 'width'
        | 'edge' | 'area' | 'volume' | 'input-number' | 'output-number';
    unit: AlgebraicUnit;
    /** Exact mathematical quantity definition, never a ready-written story/prompt. */
    expression: ExactSymbolicExpressionNode;
}>;

/** Semantic quantitative relationships; no operation words or prose instructions. */
export type AlgebraicQuantityRelation =
    | Readonly<{kind: 'fixed-and-proportional'; resultId: string; fixedId: string; rateId: string; inputId: string}>
    | Readonly<{kind: 'equal-groups'; resultId: string; groupCountId: string; amountPerGroupId: string}>
    | Readonly<{kind: 'combined-amounts'; resultId: string; firstId: string; secondId: string}>
    | Readonly<{kind: 'remaining-amount'; resultId: string; initialId: string; removedId: string}>
    | Readonly<{kind: 'equal-sharing'; resultId: string; totalId: string; shareCountId: string}>
    | Readonly<{kind: 'rectangular-measure'; resultId: string; lengthId: string; widthId: string}>
    | Readonly<{kind: 'cubical-measure'; resultId: string; edgeId: string; measure: 'volume' | 'surface-area'}>;

/**
 * parameter-description supports ordinary operation-phrase/formula members with
 * mathematical input numbers; it is NOT automatically an AlgebraicModeling claim.
 * quantitative-system supplies the object/quantity relationships needed by true
 * modeling members. Its graph is connected to the SAME main expression, has no
 * cycles, uses every quantity, and respects exact dimensions/count domains.
 * Admitted quantitative graphs use constant/symbol atoms as primitive inputs and exact
 * typed operation definitions for derived quantities. Whole-domain interval/sign
 * propagation proves physical quantities nonnegative, counts integral and share-counts
 * positive. Remaining amounts require lower(initial) >= upper(removed); correlated
 * cases requiring a different positivity proof are outside this constructive family.
 * Count-valued sharing requires integrality by construction, not one sampled quotient.
 * outputQuantityId's expression equals the main symbolic syntax. Output units
 * and symbol-to-quantity meanings are canonical context, never a requested answer.
 */
export type AlgebraicExpressionContext =
    | Readonly<{kind: 'parameter-description';
        parameters: readonly [Readonly<{symbolId: string; meaning: 'number'}>, ...Readonly<{symbolId: string; meaning: 'number'}>[]];
        resultMeaning: 'number'}>
    | Readonly<{kind: 'quantitative-system'; setting: 'purchase' | 'production' | 'sharing' | 'measurement';
        quantities: readonly [AlgebraicQuantity, ...AlgebraicQuantity[]];
        relations: readonly [AlgebraicQuantityRelation, ...AlgebraicQuantityRelation[]];
        outputQuantityId: string;
        variableQuantities: readonly [Readonly<{symbolId: string; quantityId: string}>, ...Readonly<{symbolId: string; quantityId: string}>[]]}>
;

/**
 * COMPLETE UNIFORM PAYLOAD: all six leaves accept every coherent member.
 * One symbolic expression + one assignment + its exact numeric instance, not
 * six independent task objects. Unclaimed linked facts may be hidden; every
 * EMITTED mathematical claim must remain evidenced in either mode.
 *
 * Original syntax contains a genuine numeric literal or literal power exponent, so
 * numeral projections retain evidence even when assignments are hidden. Modeling
 * contexts expose meaningful numeric quantities, relations or domain bounds.
 * At least one complete structural relation and grouped-operand incidence are
 * supplied in every member so no fixed sibling rejects a permitted member.
 * For the genuine grouped profile, the group must contain a real inner operation.
 * A plain expression may group a single operand (5-(y)); syntax formatting must
 * preserve explicit groups. Standalone AST helpers may also accept ungrouped 5-y;
 * that is not by itself a complete six-consumer problem without a group witness.
 */
export type AlgebraicExpressionProblem = Readonly<{
    kind: 'algebra-expressions';
    expression: ExactSymbolicExpressionNode;
    symbols: readonly [AlgebraicSymbolDeclaration, ...AlgebraicSymbolDeclaration[]];
    restrictions: readonly AlgebraicDomainRestriction[];
    substitution: AlgebraicSubstitution;
    structuralExpression: AlgebraicStructuralExpression;
    structuralRelations: readonly [AlgebraicStructuralRelation, ...AlgebraicStructuralRelation[]];
    groupedOperands: readonly [AlgebraicGroupedOperand, ...AlgebraicGroupedOperand[]];
    context: AlgebraicExpressionContext;
}>;

export type AffineExpressionId = string;
export type AffineNodeId = string;
export type AffineSymbolId = string;

/**
 * Same actual14 syntax, not a duplicated recursive union. Accepted affine arithmetic
 * grammar is number/variable/group/negation/binary arithmetic; no powers are needed.
 * EVERY subtree must normalize to an affine map. Multiplication has a proved constant
 * child; division has a proved nonzero constant denominator. Syntactic variable use
 * does not disprove constancy: (x-x+1) is constant1. x/x is outside this all-Q family.
 * Unique nonempty occurrence IDs within each tree, exact coherent literal spelling,
 * genuine written grouping, no cycles/sparse data or evaluated symbolic value fields.
 */
export type AffineExpression = Readonly<{
    expressionId: AffineExpressionId;
    domainId: string;
    root: ExactSymbolicExpressionNode;
}>;

/** All declarations are independent unrestricted rational domains; not finite tests. */
export type CommonAffineDomain = Readonly<{
    domainId: string;
    kind: 'independent-rational-variables';
    symbols: readonly [AlgebraicSymbolDeclaration, ...AlgebraicSymbolDeclaration[]];
}>;

/** Sorted unique declared symbols, nonzero coefficients only; omission means exact0. */
export type ExactAffineNormalForm = Readonly<{
    constant: AlgebraicScalar;
    coefficients: readonly Readonly<{symbolId: AffineSymbolId; coefficient: AlgebraicScalar}>[];
}>;
export type ExactCoefficientArithmetic = Extract<ExactNumericReductionEvidence, {kind: 'binary'}>;
export type AffineComponentArithmetic = Readonly<{
    /** null is the constant; include the full child-symbol union even when it cancels. */
    symbolId: AffineSymbolId | null;
    arithmetic: ExactCoefficientArithmetic;
}>;

/** One inductive step per ORIGINAL occurrence; every dependency precedes its parent. */
export type AffineNormalizationStep = Readonly<{
    nodeId: AffineNodeId;
    result: ExactAffineNormalForm;
}> & (
    | Readonly<{kind: 'literal'; value: AlgebraicScalar}>
    | Readonly<{kind: 'variable'; symbolId: AffineSymbolId;
        /** Always1, independent of any assignment, including when the variable later cancels. */
        unitCoefficient: Readonly<{numerator: 1; denominator: 1}>}>
    | Readonly<{kind: 'group'; innerNodeId: AffineNodeId}>
    | Readonly<{kind: 'negation'; operandNodeId: AffineNodeId;
        /** Multiply every constant/coefficient by -1, with exact supplied arithmetic. */
        components: readonly AffineComponentArithmetic[]}>
    | Readonly<{kind: 'add' | 'subtract'; leftNodeId: AffineNodeId; rightNodeId: AffineNodeId;
        components: readonly AffineComponentArithmetic[]}>
    | Readonly<{kind: 'multiply'; constantNodeId: AffineNodeId; affineNodeId: AffineNodeId;
        constantFactor: AlgebraicScalar; components: readonly AffineComponentArithmetic[]}>
    | Readonly<{kind: 'divide'; numeratorNodeId: AffineNodeId; constantDenominatorNodeId: AffineNodeId;
        nonzeroDenominator: AlgebraicScalar; components: readonly AffineComponentArithmetic[]}>
);
export type AffineNormalizationProof = Readonly<{
    expressionId: AffineExpressionId;
    steps: readonly [AffineNormalizationStep, ...AffineNormalizationStep[]];
    rootNormalForm: ExactAffineNormalForm;
}>;
/** Equal complete maps prove identity for EVERY assignment in the same named all-Q domain. */
export type UniversalAffineIdentityProof = Readonly<{
    domainId: string;
    leftExpressionId: AffineExpressionId;
    rightExpressionId: AffineExpressionId;
    leftNormalization: AffineNormalizationProof;
    rightNormalization: AffineNormalizationProof;
    commonNormalForm: ExactAffineNormalForm;
}>;

export type AffineRewriteReference = Readonly<{
    beforeExpressionId: AffineExpressionId;
    afterExpressionId: AffineExpressionId;
    beforeSubtreeId: AffineNodeId;
    afterSubtreeId: AffineNodeId;
}>;
/** Every step changes only its referenced subtree; untouched syntax and IDs persist. */
export type AffineRewriteStep = AffineRewriteReference & (
    | Readonly<{kind: 'distribution'; direction: 'factored-to-expanded' | 'expanded-to-factored';
        scalar: AlgebraicScalar;
        addendNodeIds: readonly [AffineNodeId, AffineNodeId, ...AffineNodeId[]];
        productNodeIds: readonly [AffineNodeId, AffineNodeId, ...AffineNodeId[]];
        coefficientProducts: readonly ExactCoefficientArithmetic[]}>
    | Readonly<{kind: 'collection'; symbolId: AffineSymbolId;
        /** Complete signed same-symbol terms at one additive level, including implicit±1. */
        terms: readonly [
            Readonly<{termNodeId: AffineNodeId; variableOccurrenceId: AffineNodeId; signedCoefficient: AlgebraicScalar}>,
            Readonly<{termNodeId: AffineNodeId; variableOccurrenceId: AffineNodeId; signedCoefficient: AlgebraicScalar}>,
            ...Readonly<{termNodeId: AffineNodeId; variableOccurrenceId: AffineNodeId; signedCoefficient: AlgebraicScalar}>[]];
        coefficientSums: readonly ExactCoefficientArithmetic[];
        collectedCoefficient: AlgebraicScalar}>
    | Readonly<{kind: 'association'; operation: 'addition' | 'multiplication';
        orderedOperandNodeIds: readonly [AffineNodeId, AffineNodeId, AffineNodeId];
        beforeGrouping: 'left' | 'right'; afterGrouping: 'left' | 'right'}>
    | Readonly<{kind: 'commutation'; operation: 'addition' | 'multiplication';
        /** Actual nonidentical operands swap; the witness is not an unchanged-expression badge. */
        operandNodeIds: readonly [AffineNodeId, AffineNodeId]}>
    | Readonly<{kind: 'constant-arithmetic'; arithmetic: ExactCoefficientArithmetic}>
    | Readonly<{kind: 'coefficient-normalization'; proof: UniversalAffineIdentityProof}>
);

export type ExactAffineBinding = Readonly<{
    symbolId: AffineSymbolId;
    value: AlgebraicScalar;
    notation: AlgebraicNotation;
}>;
export type AffineOccurrenceReplacement = Readonly<{
    occurrenceNodeId: AffineNodeId;
    symbolId: AffineSymbolId;
    value: AlgebraicScalar;
    notation: AlgebraicNotation;
}>;
/** A side may be constant-only after cancellation: empty replacements/work are genuine. */
export type ExactAffineEvaluation = Readonly<{
    sourceExpressionId: AffineExpressionId;
    /** Every and only original variable occurrence; same-ID exact replacement in calculation.expression. */
    replacements: readonly AffineOccurrenceReplacement[];
    calculation: ExactNumericCalculation;
}>;
/** An assignment disproves one proposed identity; it is never substituted for the common domain. */
export type AffineCounterexample = Readonly<{
    domainId: string;
    bindings: readonly [ExactAffineBinding, ...ExactAffineBinding[]];
    left: ExactAffineEvaluation;
    right: ExactAffineEvaluation;
    unequalValues: Readonly<{left: AlgebraicScalar; right: AlgebraicScalar}>;
}>;

export type AlgebraExpressionEquivalenceProblem = Readonly<{
    kind: 'algebra-expression-equivalence';
    domain: CommonAffineDomain;
    /** Unique expression IDs, including every full rewrite snapshot; occurrences scoped per tree. */
    expressions: readonly [AffineExpression, AffineExpression, ...AffineExpression[]];
    validIdentity: Readonly<{
        /** Original source contains a variable: invariant AlgebraicExpression is real. */
        sourceExpressionId: AffineExpressionId;
        equivalentExpressionId: AffineExpressionId;
        steps: readonly [AffineRewriteStep, ...AffineRewriteStep[]];
        universalProof: UniversalAffineIdentityProof;
    }>;
    comparison: Readonly<{
        /** Exactly the validIdentity source, including on a false-candidate member. */
        sourceExpressionId: AffineExpressionId;
        candidateExpressionId: AffineExpressionId;
    }> & (
        | Readonly<{kind: 'equivalent'; universalProof: UniversalAffineIdentityProof}>
        | Readonly<{kind: 'not-equivalent'; sourceNormalization: AffineNormalizationProof;
            candidateNormalization: AffineNormalizationProof;
            differingComponent: Readonly<{symbolId: AffineSymbolId | null;
                sourceCoefficient: AlgebraicScalar; candidateCoefficient: AlgebraicScalar}>;
            counterexample: AffineCounterexample}>
    );
}>;

type StatementVariable = Readonly<Pick<AlgebraicSymbolDeclaration, 'symbolId' | 'symbol'>>;
type StatementRationalDomain = Readonly<Omit<AlgebraicVariableDomain, 'kind'> & {kind: 'rational'}>;

/** Nonempty ambient mathematical universe; a candidate list does not redefine it. */
export type StatementAmbientDomain =
    | Readonly<{kind: 'numeric'; values: StatementRationalDomain}>
    | Readonly<{kind: 'finite'; values: readonly [AlgebraicScalar, ...AlgebraicScalar[]]}>;

export type ExactEquation = Readonly<{
    operator: 'equal'; left: ExactSymbolicExpressionNode; right: ExactSymbolicExpressionNode
}>;
export type ExactStrictInequality = Readonly<{
    operator: 'less' | 'greater'; left: ExactSymbolicExpressionNode; right: ExactSymbolicExpressionNode
}>;
export type ExactAlgebraicStatement = ExactEquation | ExactStrictInequality;

/**
 * One mathematical assignment, with no candidate identity or original occurrence list.
 * A verification/ambient truth row can use any member of the AMBIENT domain even if
 * that value was not supplied in candidateUniverse. Side rows prove all replacements.
 */
export type StatementBinding = Readonly<{symbolId: string; value: AlgebraicScalar; notation: AlgebraicNotation}>;
export type StatementOccurrenceReplacement = Readonly<{
    occurrenceNodeId: string; symbolId: string; value: AlgebraicScalar; notation: AlgebraicNotation
}>;
export type StatementSideEvaluation = Readonly<{
    /** EXACT complete original variable occurrences on this side, each once. */
    replacements: readonly StatementOccurrenceReplacement[];
    /** Original same-ID syntax after replacement; literal sides may have no work. */
    calculation: ExactNumericCalculation;
}>;
export type StatementAssignmentCheck = Readonly<{
    binding: StatementBinding;
    left: StatementSideEvaluation;
    right: StatementSideEvaluation;
    /** Operator matches the original statement; final exact side values prove truth. */
    comparison: Readonly<{
        operator: 'equal' | 'less' | 'greater'; leftValue: AlgebraicScalar; rightValue: AlgebraicScalar; truth: boolean
    }>;
}>;
export type StatementCandidate = Readonly<{id: string; value: AlgebraicScalar; notation: AlgebraicNotation}>;
/** A candidate ID annotates this row only; it never constrains a core binding type. */
export type StatementCandidateCheck = StatementAssignmentCheck & Readonly<{candidateId: string}>;
export type RestrictedCandidateSolutions = Readonly<{
    /** Precisely the true candidate rows, preserving their input order; empty is valid. */
    candidateIds: readonly string[];
    values: readonly AlgebraicScalar[];
}>;

/** Only unrestricted Q yields this complete open half-line tag. */
export type StrictRaySolution = Readonly<{
    kind: 'ray'; boundary: AlgebraicScalar; direction: 'less' | 'greater'; boundaryIncluded: false;
    /** Positive step; all positive integer n give distinct admitted satisfying values. */
    infiniteFamily: Readonly<{
        kind: 'boundary-plus-positive-integer-step'; base: AlgebraicScalar;
        direction: 'subtract' | 'add'; step: AlgebraicScalar
    }>;
}>;
/** Exact rational-domain intersection, preserving endpoints and holes. */
export type RestrictedIntervalSolution = Readonly<{
    kind: 'interval'; lower: AlgebraicDomainBound | null; upper: AlgebraicDomainBound | null;
    excludedValues: readonly AlgebraicScalar[];
    /** Strictly ordered safe rational subinterval, inside the result and avoiding holes. */
    infiniteSubinterval: Readonly<{lower: AlgebraicScalar; upper: AlgebraicScalar; interior: AlgebraicScalar}>;
}>;
export type AmbientStatementSolution =
    | Readonly<{kind: 'empty'; reason: 'constant-contradiction' | 'outside-domain' | 'domain-excluded-by-bound'}>
    | Readonly<{kind: 'all-domain'; reason: 'constant-identity' | 'domain-entirely-satisfies-bound'}>
    | Readonly<{kind: 'singleton'; value: AlgebraicScalar; notation: AlgebraicNotation}>
    | Readonly<{kind: 'finite'; values: readonly [AlgebraicScalar, ...AlgebraicScalar[]]}>
    | StrictRaySolution
    | RestrictedIntervalSolution;

/** Full solution cardinality, proved from the actual solution/domain rather than candidate rows. */
export type StatementSolutionCardinality =
    | Readonly<{kind: 'finite'; count: number}>
    | Readonly<{kind: 'infinite'}>;

/** Exactly x+p=q / p*x=q; p/q are literal scalars and x occurs once. */
export type ElementaryEquationForm =
    | Readonly<{kind: 'additive'; variableNodeId: string; addend: AlgebraicScalar; total: AlgebraicScalar}>
    | Readonly<{kind: 'multiplicative'; variableNodeId: string; coefficient: AlgebraicScalar; total: AlgebraicScalar}>;
export type EquationTransformation =
    | Readonly<{
        kind: 'subtract-same-addend'; before: ExactEquation; operand: AlgebraicScalar;
        after: ExactEquation; rightDifference: AlgebraicScalar
    }>
    | Readonly<{
        kind: 'divide-by-nonzero-coefficient'; before: ExactEquation; divisor: AlgebraicScalar;
        after: ExactEquation; rightQuotient: AlgebraicScalar
    }>
    | Readonly<{kind: 'constant-comparison'; leftConstant: AlgebraicScalar; rightConstant: AlgebraicScalar; equal: boolean}>;
export type ElementaryEquationSolutionWitness =
    | Readonly<{
        kind: 'isolated-variable'; transformations: readonly [EquationTransformation, ...EquationTransformation[]];
        algebraicValue: AlgebraicScalar; admissible: boolean;
        /** Present/true iff admissible; independent of finite candidate membership. */
        verification: StatementAssignmentCheck | null
    }>
    | Readonly<{
        kind: 'zero-coefficient'; coefficient: AlgebraicScalar; constant: AlgebraicScalar;
        constantTruth: boolean; classification: 'all-domain' | 'empty'
    }>
    | Readonly<{
        kind: 'nonnegative-addend-exceeds-total'; addend: AlgebraicScalar; total: AlgebraicScalar;
        /** x>=0 and p>q give x+p>=p>q without storing a negative q-p auxiliary value. */
        addendGreaterThanTotal: true
    }>;

type StatementNamedQuantity<Meaning extends string> = Readonly<{
    quantityId: string; meaning: Meaning; unit: AlgebraicUnit
}>;
type StatementConstantQuantity<Meaning extends string> = StatementNamedQuantity<Meaning> & Readonly<{
    value: AlgebraicScalar; notation: AlgebraicNotation
}>;
/** Small semantic grammar, not arbitrary expression/context graphs or generated prose. */
export type ElementaryEquationContext =
    | Readonly<{
        /** Abstract mathematical relation admits signed/unrestricted rational inputs. */
        kind: 'number-relation'; relationship: 'sum' | 'scaled-value';
        variableQuantity: StatementNamedQuantity<'input-number'>;
        constantQuantity: StatementConstantQuantity<'added-number' | 'scale-factor'>;
        resultQuantity: StatementConstantQuantity<'resulting-number'>
    }>
    | Readonly<{
        kind: 'combined-amounts';
        variableQuantity: StatementNamedQuantity<'initial-amount'>;
        addedQuantity: StatementConstantQuantity<'added-amount'>;
        totalQuantity: StatementConstantQuantity<'total-amount'>
    }>
    | Readonly<{
        kind: 'equal-groups';
        variableQuantity: StatementNamedQuantity<'group-count' | 'amount-per-group' | 'duration'>;
        multiplierQuantity: StatementConstantQuantity<'amount-per-group' | 'group-count' | 'rate'>;
        totalQuantity: StatementConstantQuantity<'total-amount'>
    }>;
/**
 * Actual signed context metadata supplies degrees Celsius / meters / dollars and datum.
 * No invented temperature dimensions and no changes to earlier AlgebraicUnit.
 * A mathematical threshold model uses the declared ambient domain; no hidden restriction.
 */
export type StrictThresholdContext = Readonly<{
    kind: 'strict-threshold'; context: OrderedSignedContextMetadata;
    quantityId: string;
    threshold: Readonly<{quantityId: string; value: AlgebraicScalar; notation: AlgebraicNotation}>;
    relationship: 'strictly-below-threshold' | 'strictly-above-threshold'
}>;

type StatementBackbone = Readonly<{
    variable: StatementVariable;
    ambientDomain: StatementAmbientDomain;
    /** Dense nonempty finite collection of unique admitted exact values and unique IDs. */
    candidateUniverse: readonly [StatementCandidate, ...StatementCandidate[]];
    /** Exactly one candidate row's binding in symbolId, canonical value AND exact notation. */
    assignment: StatementBinding;
    /** Complete one-to-one rows in candidate order, sharing values/notation with their candidates. */
    candidateChecks: readonly [StatementCandidateCheck, ...StatementCandidateCheck[]];
    restrictedSolutions: RestrictedCandidateSolutions;
    /**
     * Numeric ambient domain: empty array. Finite ambient domain: COMPLETE one row for every
     * ambient value, even for empty/all/singleton results and values absent from candidates.
     */
    ambientChecks: readonly StatementAssignmentCheck[];
    /** Validated from complete original relation/domain, never inferred from candidate subset. */
    ambientSolution: AmbientStatementSolution;
    /** Finite count is a nonnegative safe integer; never a numeric Infinity sentinel. */
    solutionCardinality: StatementSolutionCardinality
}>;
export type AlgebraicEquationProblem = StatementBackbone & Readonly<{
    kind: 'algebra-equations'; statement: ExactEquation; form: ElementaryEquationForm;
    solutionWitness: ElementaryEquationSolutionWitness; context: ElementaryEquationContext
}>;

/** Every relevant supplied location agrees exactly with axis tick/index/sign/magnitude. */
export type InequalitySolutionLine = Readonly<{
    axis: SignedRationalAxis;
    boundary: SignedRationalLocation;
    /** Complete finite members/domain endpoints/exclusions required by actual ambient solution. */
    auxiliaryLocations: readonly SignedRationalLocation[]
}>;
export type AlgebraicInequalityProblem = StatementBackbone & Readonly<{
    kind: 'algebra-inequalities'; statement: ExactStrictInequality;
    /** Left standalone declared variable; right exact literal; no compound expression sides. */
    bound: Readonly<{variableNodeId: string; value: AlgebraicScalar; notation: AlgebraicNotation; direction: 'less' | 'greater'}>;
    solutionLine: InequalitySolutionLine; context: StrictThresholdContext
}>;

/** Both candidate-checking and solution-meaning leaves accept every complete member. */
export type AlgebraicStatementProblem = AlgebraicEquationProblem | AlgebraicInequalityProblem;

/** Exactly one of these four infinite named sets, not a finite table of examples. */
export type VariableMeaningDomain = Readonly<{
    domainId: string;
    name: 'rational-numbers' | 'integers' | 'nonnegative-rational-numbers' | 'nonnegative-integers';
    /** Exact14 domain: unrestricted Q/Z, or inclusive lower0; no upper bound/exclusions. */
    set: AlgebraicVariableDomain
}>;
export type VariableMeaningSymbol = Readonly<{symbolId: string; symbol: string}>;
export type VariableMeaningQuantity =
    | Readonly<{kind: 'number'; referent: 'mathematical-number'; unit: 'none'}>
    | Readonly<{kind: 'count'; referent: 'tokens-in-a-bag'; unit: 'tokens'}>
    | Readonly<{kind: 'length'; referent: 'segment-length'; unit: 'meters'}>;

export type ParticularUnknownMeaning = Readonly<{
    kind: 'particular-unknown'; situation: 'one-fixed-situation';
    uniqueValueWitness: Readonly<{
        leftNormalization: AffineNormalizationProof;
        rightNormalization: AffineNormalizationProof;
        /** Exact left-minus-right coefficient a and constant b; a is nonzero. */
        coefficientDifference: ExactCoefficientArithmetic;
        constantDifference: ExactCoefficientArithmetic;
        /** Exact division (-b)/a; result is in the NAMED domain. */
        inverseArithmetic: ExactCoefficientArithmetic;
        uniqueValue: AlgebraicScalar;
        /**
         * Reuses16 outer binding/per-side exact calculations, including zero replacements
         * on a literal side. Its binding value is uniqueValue and its comparison is true.
         * No candidate ID/list or learner-selected assignment is needed in this package.
         */
        verification: StatementAssignmentCheck
    }>
}>;
export type GeneralizedNumberMeaning = Readonly<{
    kind: 'arbitrary-generalized-number'; quantifier: 'for-every-domain-member';
    /** Actual15 universal coefficient-map induction, not finite substitution agreement. */
    universalProof: UniversalAffineIdentityProof;
    /** All four named sets are subsets of Q; proofDomain is explicitly the all-Q superset. */
    domainInclusion: 'named-domain-subset-of-rationals'
}>;

export type AlgebraVariableMeaningProblem = Readonly<{
    kind: 'algebra-variable-models';
    domain: VariableMeaningDomain;
    symbol: VariableMeaningSymbol;
    quantity: VariableMeaningQuantity;
    /**
     * Actual15 all-Q normalization domain containing EXACTLY the primary symbol.
     * Separate from named Q/Z/N domain; do not relabel an integer set as all Q.
     */
    proofDomain: CommonAffineDomain;
    /** Exactly the two relation sides, sharing proofDomain.domainId and declared symbol. */
    expressions: readonly [AffineExpression, AffineExpression];
    relation: Readonly<{leftExpressionId: string; rightExpressionId: string}>;
    role: ParticularUnknownMeaning | GeneralizedNumberMeaning
}>;

/** Maps each visual view identifier to its complete accepted mathematical payload. */
export interface ViewTypeMap {
    'algebra-variable-interpretation': AlgebraVariableMeaningProblem;
    'algebra-substitution-check': AlgebraicStatementProblem;
    'algebra-solution-meaning': AlgebraicStatementProblem;
    'algebra-equation-model-solve': AlgebraicEquationProblem;
    'algebra-inequality-numberline': AlgebraicInequalityProblem;
    'algebra-inequality-infinite-solutions': AlgebraicInequalityProblem;
    'algebra-inequality-model': AlgebraicInequalityProblem;
    'algebra-equivalent-expression-generate': AlgebraExpressionEquivalenceProblem;
    'algebra-expression-equivalence-judge': AlgebraExpressionEquivalenceProblem;
    'numerical-power-expression-evaluate': NumericalPowerExpressionProblem;
    'numerical-power-expression-write': NumericalPowerExpressionProblem;
    'algebra-expression-write': AlgebraicExpressionProblem;
    'algebra-expression-parts': AlgebraicExpressionProblem;
    'algebra-subexpression-interpretation': AlgebraicExpressionProblem;
    'algebra-expression-evaluate': AlgebraicExpressionProblem;
    'algebra-formula-evaluate': AlgebraicExpressionProblem;
    'algebra-expression-model': AlgebraicExpressionProblem;
    'measure-ratio-conversion': MeasurementRatioRelationProblem;
    'measure-unit-composition': UnitDimensionRelationProblem;
    'percent-of-quantity': PercentQuantityProblem;
    'percent-whole-inversion': PercentQuantityProblem;
    'ratio-language': RatioRelationProblem;
    'unit-rate-language': UnitRateRelationProblem;
    'unit-rate-problem': UnitRateRelationProblem;
    'ratio-coordinate-plotting': RatioTableProblem;
    'ratio-table-construction': RatioTableProblem;
    'ratio-table-missing-values': RatioTableProblem;
    'ratio-table-comparison': RatioTableComparisonProblem;
    'operations-vertical': ArithmeticProblem;
    'operations-vertical-inversion': ArithmeticProblem;
    'operations-grouping-write': NumericalExpressionProblem;
    'operations-grouping-evaluate': NumericalExpressionProblem;
    'operations-numerical-expression-write': NumericalExpressionProblem;
    'operations-numerical-expression-interpretation': NumericalExpressionProblem;
    'operations-standard-algorithm': StandardAlgorithmProblem;
    'operations-known-fact-derivation': KnownFactDerivationProblem;
    'operations-known-fact-inversion': KnownFactDerivationProblem;
    'operations-add-subtract-strategy-understanding': IntegerAddSubtractStrategyProblem;
    'operations-counting-on-operation-derivation': AdditionCountingOnProblem;
    'operations-counting-back-operation-derivation': SubtractionCountingBackProblem;
    'operations-multiplicative-comparison': MultiplicativeComparisonProblem;
    'operations-multiplicative-comparison-word-problem': MultiplicativeComparisonProblem;
    'operations-multiplication-area-model': MultiDigitMultiplicationProblem;
    'operations-multiplication-standard-algorithm': StandardMultiplicationProblem;
    'operations-division-area-model': MultiDigitDivisionProblem;
    'operations-division-standard-algorithm': StandardDivisionProblem;
    'operations-decimal-standard-add-subtract': DecimalStandardAddSubtractProblem;
    'operations-decimal-standard-multiplication': DecimalStandardMultiplicationProblem;
    'operations-decimal-standard-division': DecimalStandardDivisionProblem;
    'operations-full-common-factor': FullCommonFactorDistributionProblem;
    'numbers-greatest-common-factor': CommonFactorMultipleProblem;
    'numbers-least-common-multiple': CommonFactorMultipleProblem;
    'numbers-contextual-zero': SignedRationalContextProblem;
    'numbers-signed-context-interpretation': SignedRationalContextProblem;
    'numbers-signed-context-formalization': SignedRationalContextProblem;
    'numbers-double-opposite': RationalOppositeRelationProblem;
    'numbers-opposite-locations': RationalOppositeRelationProblem;
    'numbers-zero-opposite': RationalOppositeRelationProblem;
    'coordinate-quadrant-interpretation': CoordinatePointsProblem;
    'coordinate-sign-reflection': CoordinateReflectionRelationProblem;
    'coordinate-point-plotting': CoordinatePointsProblem;
    'coordinate-point-reading': CoordinatePointsProblem;
    'numbers-rational-line-positioning': RationalNumberlineValuesProblem;
    'numbers-rational-line-reading': RationalNumberlineValuesProblem;
    'numbers-inequality-line-interpretation': RationalOrderRelationProblem;
    'numbers-contextual-order-explanation': RationalOrderContextProblem;
    'numbers-contextual-order-writing': RationalOrderContextProblem;
    'numbers-absolute-value-distance': RationalMagnitudeRelationProblem;
    'numbers-contextual-absolute-value': RationalMagnitudeContextProblem;
    'numbers-order-versus-magnitude': RationalMagnitudeContextProblem;
    'coordinate-axis-distance': CoordinateAxisDistanceProblem;
    'coordinate-axis-distance-story': CoordinateAxisDistanceProblem;
    'coordinate-problem-plotting': CoordinateRouteProblem;
    'coordinate-problem-story': CoordinateRouteProblem;
    'coordinate-polygon-construction': CoordinatePolygonProblem;
    'coordinate-polygon-construction-story': CoordinatePolygonProblem;
    'coordinate-polygon-side-length': CoordinatePolygonProblem;
    'coordinate-polygon-side-length-story': CoordinatePolygonProblem;
    'numbers-factors-multiples': FactorPairsOrMultipleTestProblem;
    'numbers-prime-classification': PrimeClassificationProblem;
    'numbers-composite-classification': CompositeClassificationProblem;
    'operations-boxes': ArithmeticProblem;
    'operations-boxes-inversion': ArithmeticProblem;
    'operations-representation': ArithmeticPairProblem;
    'operations-word-problem': ArithmeticProblem;
    'operations-word-problem-inversion': ArithmeticProblem;
    'operations-word-problem-within-100': ArithmeticWordProblemWithin100;
    'operations-word-problem-within-100-inversion': ArithmeticPairProblem;
    'operations-word-problem-remainder-interpretation': ArithmeticWordProblemInterpretedRemainder;
    'operations-word-problem-equation-formalization': ArithmeticWordProblemLetterEquation;
    'operations-word-problem-reasoning': ArithmeticWordProblemRounding;
    'operations-properties': ArithmeticPropertyProblem;
    'operations-properties-explanation': ArithmeticPropertyProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'operations-equation-judgment': EquationJudgmentProblem;
    'operations-answer-reasonableness': ArithmeticEstimationProblem;
    'operations-pattern-table': ArithmeticOperationTablePatternProblem;
    'operations-pattern-explanation': ArithmeticRecurrencePatternProblem;
    'operations-pattern-feature-explanation': ArithmeticRecurrencePatternProblem;
    'operations-pattern-feature-table': ArithmeticRecurrencePatternProblem;
    'operations-pattern-generation-practice': ArithmeticRecurrencePatternProblem;
    'operations-pattern-generation-table': ArithmeticRecurrencePatternProblem;
    'operations-pattern-correspondence': ArithmeticPairedPatternProblem;
    'operations-pattern-correspondence-explanation': ArithmeticPairedPatternProblem;
    'operations-paired-pattern-generation': ArithmeticPairedPatternProblem;
    'coordinate-plot-pattern-pairs': CoordinatePatternPairsProblem;
    'coordinate-form-pattern-pairs': CoordinatePatternPairsProblem;
    'coordinate-system-specification': CoordinateSystemProblem;
    'coordinate-components-interpretation': CoordinateSystemProblem;
    'coordinate-context-plotting': ContextualCoordinateProblem;
    'coordinate-context-interpretation': ContextualCoordinateProblem;
    'numbers-rounding-line': IntegerRoundingProblem;
    'numbers-decimal-rounding-line': DecimalRoundingProblem;
    'numbers-fraction-line': FractionNumberLineProblem;
    'numbers-fraction-line-classification': ProperFractionUnitScalingProblem;
    'numbers-fraction-line-formalization': FractionEquivalenceProblem;
    'numbers-fraction-line-explanation': FractionEquivalenceProblem;
    'operations-number-array-total': NumberArrayProblem;
    'operations-number-array-equation-formalization': NumberArrayProblem;
    'operations-number-array-interpretation': NumberArrayProblem;
    'operations-equal-groups': EqualGroupsCollectionProblem;
    'operations-number-line-representation': WritingProblem;
    'operations-number-line-arithmetic': ArithmeticPairProblem;
    'place-value-compose-teen': PlaceValueTeenProblem;
    'place-value-decompose-teen': PlaceValueTeenProblem;
    'place-value-make-ten': PlaceValueMakeTenProblem;
    'place-value-tens-bundles': PlaceValueTensBundlesProblem;
    'place-value-hundreds-bundles': PlaceValueHundredsBundlesProblem;
    'place-value-hundreds-bundles-explanation': PlaceValueHundredsBundlesProblem;
    'place-value-expanded-form': PlaceValueExpandedProblem;
    'place-value-arithmetic-model': PlaceValueArithmeticProblem;
    'place-value-arithmetic-written-method': PlaceValueArithmeticProblem;
    'place-value-arithmetic-explanation': PlaceValueArithmeticProblem;
    'place-value-scaling': PlaceValueScalingProblem;
    'numbers-decimal-place-value-scaling': DecimalAdjacentPlaceScalingProblem;
    'numbers-power-ten-zero-pattern-explanation': WholeNumberPowerTenScalingProblem;
    'numbers-power-ten-decimal-pattern-explanation': DecimalPowerTenScalingProblem;
    'numbers-power-ten-exponent-notation': PowerTenNotationProblem;
    'numbers-decimal-numeral-reading': DecimalWritingProblem;
    'numbers-decimal-numeral-writing': DecimalWritingProblem;
    'numbers-decimal-name-writing': DecimalWritingProblem;
    'numbers-decimal-expanded-form': DecimalPlaceValueExpandedProblem;
    'numbers-decimal-place-comparison': DecimalPlaceComparisonProblem;
    'operations-decimal-addition-subtraction-method': DecimalAddSubtractProblem;
    'operations-decimal-multiplication-method': DecimalMultiplicationProblem;
    'operations-decimal-division-method': DecimalDivisionProblem;

    'counting-objects-simple': CountingProblem;
    'counting-objects-one-to-one': CountingProblem;
    'counting-objects-cardinality': CountingProblem;
    'counting-objects-count-out': CountingSelectionProblem;
    'counting-objects-parity': CountingProblem;
    'counting-inc-dec': CountingSmallOffsetProblem;
    'counting-ten-more-less': CountingTenOffsetProblem;
    'counting-hundred-more-less': CountingHundredOffsetProblem;
    'counting-number-sequence': CountingSequenceProblem;
    'counting-conservation': CountingProblem;
    'sorting-classify-count': CountingClassifyCountProblem;
    'sorting-classify-sort': CountingClassifySortProblem;
    'sorting-classify-order': CountingClassifySortProblem;

    'measure-length-integer': MeasurementStandardProblem;
    'measure-length-integer-drawing': MeasurementStandardProblem;
    'measure-length-decimal': MeasurementStandardProblem;
    'measure-length-decimal-drawing': MeasurementStandardProblem;
    'measure-select-tool': MeasurementToolSelectionProblem;
    'measure-unit-scale-relation': GenericUnitScaleRelationProblem;
    'measure-conversion-derivation': MeasurementConversionProblem;
    'measure-conversion-execution': StandardUnitEquivalencesProblem;
    'measure-conversion-table': StandardUnitEquivalencesProblem;
    'measure-conversion-problems': MeasurementConversionStoryProblem;
    'measure-length-estimate': MeasurementEstimateProblem;
    'measure-length-difference': MeasurementLengthDifferenceProblem;
    'measure-attributes': MeasurementAttributeProblem;
    'measure-compare': MeasurementCompareProblem;
    'measure-mediated-comparison': MediatedLengthComparisonProblem;
    'measure-order': MeasurementOrderProblem;

    'numbers-compare': ComparisonProblem;
    'numbers-compare-matching': ComparisonProblem;
    'numbers-compare-counting': ComparisonProblem;
    'numbers-place-value-comparison': ComparisonProblem;

    'numbers-order': OrderingProblem;
    'numbers-write-stroke': WritingProblem;
    'numbers-write-standard': WritingProblem;
    'numbers-write-count': WritingProblem;
    'numbers-read-standard': WritingProblem;
    'numbers-write-name': WritingProblem;
    'time-analog': TimeProblem;
    'time-analog-construction': TimeProblem;
    'time-digital': TimeProblem;
    'time-digital-construction': TimeProblem;
    'time-elapsed': ElapsedTimeProblem;
    'time-interval-word-problem': TimeIntervalWordProblem;
    'measure-liquid-volume': LiquidVolumeMeasurementProblem;
    'measure-mass': MassMeasurementProblem;
    'measure-liquid-volume-estimate': LiquidVolumeEstimateProblem;
    'measure-mass-estimate': MassEstimateProblem;
    'measurement-word-problem': ArithmeticPairProblem;
    'currency-word-problem': CurrencyArithmeticProblem;
    'measurement-data-table': MeasurementDataProblem;
    'measurement-line-plot': MeasurementDataProblem;
    'measurement-line-plot-arithmetic': MeasurementExtremaProblem;
    'measurement-line-plot-problems': MeasurementLinePlotFractionProblem;
    'volume-unit-cube-specification': UnitCubeVolumeProblem;
    'volume-packing-interpretation': UnitCubeVolumeProblem;
    'volume-unit-cube-count': UnitCubeVolumeProblem;
    'volume-packing-product-explanation': RectangularPrismVolumeProblem;
    'volume-product-model': RectangularPrismVolumeProblem;
    'volume-formula-execution': RectangularPrismVolumeProblem;
    'volume-formula-story': RectangularPrismVolumeProblem;
    'volume-additivity-explanation': CompositePrismVolumeProblem;
    'volume-composite-execution': CompositePrismVolumeProblem;
    'volume-composite-story': CompositePrismVolumeProblem;
    'measurement-word-problem-grade4': MeasurementWordProblemGrade4;
    'measurement-number-line': MeasurementNumberLineProblem;
    'data-picture-graph': StatisticalGraphProblem;
    'data-bar-graph': StatisticalGraphProblem;
    'data-bar-graph-arithmetic': StatisticalGraphProblem;
    'data-bar-graph-classification': StatisticalGraphProblem;
    'data-bar-graph-interpretation': StatisticalGraphProblem;
    'data-picture-graph-arithmetic': StatisticalGraphProblem;
    'data-picture-graph-classification': StatisticalGraphProblem;
    'data-picture-graph-interpretation': StatisticalGraphProblem;

    'shape-naming': ShapeNamingProblem;
    'shape-position': ShapePositionProblem;
    'shape-env-shapes': ShapeEnvShapesProblem;
    'shape-classify-dim': ShapeClassifyDimProblem;
    'shape-compare-attributes': ShapeCompareAttributesProblem;
    'shape-classify-attributes': ShapeAttributeClassificationProblem;
    'shape-inherited-attributes': ShapeCategoryHierarchyProblem;
    'shape-hierarchy-classification': ShapeCategoryHierarchyProblem;
    'shape-line-symmetry-drawing': ShapeLineSymmetryProblem;
    'shape-line-symmetry-identification': ShapeLineSymmetryProblem;
    'shape-same-attribute': ShapeSameAttributeProblem;
    'shape-build-shape': ShapePolygonDefinitionProblem;
    'shape-build-from-count': ShapeAttributeCountSpecificationProblem;
    'shape-build-from-parts': ShapeEdgeCompositionProblem;
    'shape-compose-shapes': ShapeComposeShapesProblem;
    'shape-compose-shapes-construction': ShapeAssemblyProblem;
    'shape-partition-equal': ShapePartitionProblem;
    'shape-partition-fraction-interpretation': ShapeFractionRegionProblem;
    'shape-partition-share-comparison': ShapeUnitShareComparisonProblem;
    'shape-partition-share-name': ShapePartitionProblem;
    'shape-partition-unit-fraction': ShapePartitionProblem;
    'shape-partition-whole-composition': ShapePartitionProblem;
    'shape-patterns': ShapePatternProblem;
    'shape-patterns-explanation': ShapePatternProblem;
    'shape-patterns-identification': ShapePatternProblem;
    'shape-equal-square-count': EqualSquarePartitionProblem;
    'shape-equal-square-count-story': EqualSquarePartitionProblem;
    'shape-square-array-partition': EqualSquarePartitionProblem;
    'shape-square-array': UnitSquareGridProblem;
    'shape-square-array-interpretation': UnitSquareGridProblem;
    'shape-square-array-inversion': UnitSquareGridProblem;
    'shape-square-array-story': UnitSquareGridProblem;
    'shape-square-array-understanding': UnitSquareGridProblem;
    'shape-rectangle-area': RectangleAreaProblem;
    'shape-rectangle-area-story': RectangleAreaProblem;
    'shape-rectangle-area-inversion': RectangleAreaProblem;
    'area-distributive-model': AreaDecompositionProblem;
    'area-rectilinear-decomposition': AreaDecompositionProblem;
    'geometry-perimeter': GeometryPerimeterProblem;
    'geometry-perimeter-inversion': GeometryPerimeterProblem;
    'area-perimeter-comparison': AreaPerimeterRelationProblem;
    'area-perimeter-construction': AreaPerimeterRelationProblem;
    'shape-partition-equivalence': ShapePartitionEquivalenceProblem;
    'geometry-angle-concepts': AngleArcFractionProblem;
    'geometry-angle-one-degree-derivation': AngleUnitPartitionProblem;
    'geometry-angle-degree-iteration': AngleUnitIterationProblem;
    'geometry-protractor': AngleMeasurementProblem;
    'geometry-angle-drawing': AngleMeasurementProblem;
    'geometry-angle-arithmetic': AngleArithmeticProblem;
    'geometry-angle-arithmetic-execution': AngleArithmeticProblem;
    'geometry-angle-arithmetic-inversion': AngleArithmeticProblem;
    'geometry-primitives-drawing': GeometryPrimitivesProblem;
    'geometry-primitives-identification': GeometryPrimitivesProblem;
    'fractions-equivalence-model': ProperFractionUnitScalingProblem;
    'fractions-equivalence-unit-scaling': ProperFractionUnitScalingProblem;
    'fractions-equivalence-completion-model': FractionScalingProblem;
    'fractions-equivalence-explanation-model': FractionScalingProblem;
    'fractions-whole-equivalence': WholeNumberFractionEquivalenceProblem;
    'fractions-compare-benchmark-models': FractionComparisonProblem;
    'fractions-compare-models': FractionComparisonProblem;
    'fractions-benchmark-estimate': FractionBenchmarkArithmeticProblem;
    'fractions-benchmark-reasonableness': FractionBenchmarkArithmeticProblem;
    'fractions-quotient-interpretation': FractionQuotientProblem;
    'fractions-division-interpretation': FractionDivisionProblem;
    'fractions-division-execution': FractionDivisionProblem;
    'fractions-division-story-creation': FractionDivisionProblem;
    'fractions-division-inverse-explanation': FractionDivisionProblem;
    'fractions-division-word-problem': FractionDivisionProblem;
    'fractions-division-model-construction': FractionDivisionRelationProblem;
    'fractions-product-partition-interpretation': FractionProductProblem;
    'fractions-product-story-creation': FractionProductProblem;
    'fractions-product-word-problem': FractionProductProblem;
    'fractions-area-tiling-understanding': FractionRectangleAreaProblem;
    'fractions-rectangle-area': FractionRectangleAreaProblem;
    'fractions-area-product-construction': FractionRectangleAreaProblem;
    'fractions-scaling-comparison': FractionScaleComparisonProblem;
    'fractions-scaling-explanation': FractionScaleComparisonProblem;
    'fractions-interpretation-model': FractionArithmeticProblem;
    'fractions-operation-model': FractionArithmeticProblem;
    'fractions-understanding-model': FractionArithmeticProblem;
    'fractions-word-problem': FractionArithmeticProblem;
    'numbers-fraction-to-decimal': DecimalNotationProblem;
    'numbers-decimal-to-fraction': DecimalNotationProblem;
    'numbers-decimal-line': DecimalNotationProblem;
    'numbers-decimal-measurement': DecimalNotationProblem;
    'numbers-decimal-comparison': DecimalComparisonProblem;
    'shape-draw-circular-shape': ShapeCircleDefinitionProblem;
    'shape-draw-circular-rotation': ShapeCircleDefinitionProblem;
    'shape-draw-linear-shape': ShapePolygonDefinitionProblem;
    'shape-draw-linear-rotation': ShapePolygonDefinitionProblem;
    'shape-draw-excluded-quadrilateral': ShapeExcludedQuadrilateralProblem;
}

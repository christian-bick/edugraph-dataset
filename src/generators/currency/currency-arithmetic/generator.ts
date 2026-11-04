import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CurrencyAmount, CurrencyArithmeticProblem} from '../../../types/problems.ts';
import {CurrencyArithmeticGeneratorConfig, CurrencyArithmeticGeneratorSchema} from './spec.ts';
import {banknoteRowsForRange, pennyRowsForRange, centOnlyRowsForRange, buildCurrencyCoinProblem,
    pendingCurrencyTicketsForRange, selectCurrencyTicket} from './numeric-domain.ts';

const denominationCents: Record<string, number> = {
    [Scope.QuarterDenomination]: 25,
    [Scope.TenthDenomination]: 10,
    [Scope.TwentiethDenomination]: 5,
    [Scope.HundredthDenomination]: 1
};

export class CurrencyArithmeticGenerator implements ProblemGenerator<CurrencyArithmeticProblem, CurrencyArithmeticGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CurrencyArithmeticGeneratorSchema;

    generate(config: CurrencyArithmeticGeneratorConfig): ProblemStub<CurrencyArithmeticProblem> | null {
        validateConfigFields('currency-arithmetic', config, [
            'operation',
            'useCoins',
            'useBanknotes',
            'coinDenomination'
        ]);

        if (!config.useCoins && !config.useBanknotes) {
            throw new GeneratorValidationError('currency-arithmetic', 'At least one currency representation is required.');
        }

        const coinValueCents = config.coinDenomination === 'none'
            ? null
            : denominationCents[config.coinDenomination!];
        if (config.useCoins && (typeof coinValueCents !== 'number' || ![1, 5, 10, 25].includes(coinValueCents))) {
            throw new GeneratorValidationError('currency-arithmetic', 'A coin denomination is required when coins are used.');
        }
        if (!config.useCoins && config.coinDenomination !== 'none') {
            throw new GeneratorValidationError('currency-arithmetic', 'A coin denomination cannot be used without coins.');
        }

        const operation = config.operation === Area.Addition
            ? 'addition'
            : config.operation === Area.Subtraction ? 'subtraction' : null;
        if (!operation) return null;
        if (!config.useCoins) {
            validateConfigFields('currency-arithmetic', config, ['range']);
            const rows = banknoteRowsForRange(operation, config.range!);
            if (rows.length === 0) throw new GeneratorValidationError('currency-arithmetic', 'Unsupported canonical banknote range.');
            const row = rows[Math.floor(random() * rows.length)]!;
            const amount = (count: number): CurrencyAmount => ({
                items: [{kind: 'banknote', denominationCents: 100, count}], totalCents: count * 100
            });
            return {data: {operation, amounts: [amount(row.first), amount(row.second)], answerCents: row.answer * 100}};
        }
        if (!config.useBanknotes && coinValueCents === 1) {
            validateConfigFields('currency-arithmetic', config, ['range']);
            const rows = pennyRowsForRange(operation, config.range!);
            if (rows.length === 0) throw new GeneratorValidationError('currency-arithmetic', 'Unsupported canonical penny range.');
            const row = rows[Math.floor(random() * rows.length)]!;
            const amount = (count: number): CurrencyAmount => ({
                items: [{kind: 'coin', denominationCents: 1, count}], totalCents: count
            });
            return {data: {operation, amounts: [amount(row.first), amount(row.second)], answerCents: row.answer}};
        }
        if (!config.useBanknotes && (coinValueCents === 5 || coinValueCents === 10 && operation === 'subtraction')) {
            validateConfigFields('currency-arithmetic', config, ['range']);
            const rows = centOnlyRowsForRange(operation, coinValueCents, config.range!);
            if (rows.length === 0) throw new GeneratorValidationError('currency-arithmetic', 'Unsupported canonical cents-only range.');
            const row = rows[Math.floor(random() * rows.length)]!;
            const amount = (count: number): CurrencyAmount => ({
                items: [{kind: 'coin', denominationCents: coinValueCents, count}], totalCents: count * coinValueCents
            });
            return {data: {operation, amounts: [amount(row.first), amount(row.second)], answerCents: row.answer * coinValueCents}};
        }
        validateConfigFields('currency-arithmetic', config, ['range']);
        const tickets = pendingCurrencyTicketsForRange(operation, config.useBanknotes!, coinValueCents!, config.range!);
        return {data: buildCurrencyCoinProblem(operation, config.useBanknotes!, coinValueCents!, selectCurrencyTicket(tickets, random))};
    }
}

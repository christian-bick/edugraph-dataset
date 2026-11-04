import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {ArithmeticLawExercise} from './arithmetic-law-view.tsx';
import {
    getWordProblemQuantities,
    getUnknownPart,
    getWordProblemText,
    UnknownPart
} from './arithmetic-word-problem-helpers.ts';
import {WordProblemQuantityCard} from './word-problem-quantity.tsx';

interface ArithmeticWordProblemViewProps {
    invertProcedure: boolean;
    payload: ViewRenderPayload<'operations-word-problem' | 'operations-word-problem-inversion'>;
}

const operatorSymbols: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

function distributiveStory(
    data: ArithmeticTripleProblem,
    unknownPart: UnknownPart
): string {
    const visible = (part: UnknownPart, value: number): number | string =>
        part === unknownPart ? (part === 'answer' ? 'an unknown number of' : 'some') : value;
    return `A tiled display has ${visible('num1', data.num1)} rows. Each row is split into ${visible('num2', data.num2)} blue squares and ${visible('num3', data.num3)} yellow squares, for ${data.combinedFactor} squares per row. There are ${visible('answer', data.answer)} squares altogether. Find the unknown amount using the distributive property.`;
}

export const ArithmeticWordProblemView = ({invertProcedure, payload}: ArithmeticWordProblemViewProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('operations-word-problem', data, ['num1', 'num2', 'operation', 'answer']);

    const operation = data.operation;
    const symbol = operatorSymbols[operation];
    if (!symbol) {
        throw new ViewValidationError('operations-word-problem', `Unsupported operation: ${operation}`);
    }

    const hasThirdOperand = data.num3 !== undefined;
    if (hasThirdOperand) {
        validateProblemData('operations-word-problem', data, ['num3']);
    }

    const num1 = data.num1;
    const num2 = data.num2;
    const num3 = data.num3;
    const answer = data.answer;
    const quantities = getWordProblemQuantities(data);
    if (quantities.some(quantity =>
        !Number.isSafeInteger(quantity.value) || quantity.value < 0 || quantity.part !== 'answer' && quantity.value > 20
    )) {
        throw new ViewValidationError(
            'operations-word-problem',
            'Story operands require whole-number quantities from 0 through 20, with a nonnegative whole-number result.'
        );
    }
    const unknownPart = getUnknownPart(data, payload.seed, invertProcedure);
    const textScenario = data.propertyLaw === 'distributive'
        ? distributiveStory(data as ArithmeticTripleProblem, unknownPart)
        : getWordProblemText(data, unknownPart);

    const getInputClass = (part: UnknownPart, isFinal = false) => {
        let cls = "w-[60px] h-[60px] border-2 border-slate-500 rounded-lg flex justify-center items-center text-[2rem] font-mono bg-white ";
        if (isSolutionView && part === unknownPart) {
            cls += "text-green-600 border-green-600 bg-green-50 font-bold ";
        } else {
            cls += "text-slate-800 ";
        }
        if (isFinal) {
            cls += "border-[3px]";
        }
        return cls;
    };

    const boxContent = (part: UnknownPart, value: number) => {
        return !isSolutionView && part === unknownPart ? '' : value;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="flex h-[128px] w-full items-center justify-center box-border">
                    <div className="flex h-full w-full items-center justify-center rounded-lg border-l-4 border-sky-500 bg-slate-50 p-[15px] text-center text-xl font-bold leading-relaxed text-slate-700">
                        {textScenario}
                    </div>
                </div>

                {!data.propertyLaw && <div className={`mt-4 grid items-center gap-3 ${hasThirdOperand ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {quantities.map(quantity => (
                        <WordProblemQuantityCard
                            key={quantity.part}
                            quantity={quantity}
                            hidden={!isSolutionView && quantity.part === unknownPart}
                            highlighted={isSolutionView && quantity.part === unknownPart}
                        />
                    ))}
                </div>}

                {data.propertyLaw ? (
                    <div className="mt-4 w-full">
                        <ArithmeticLawExercise
                            data={data as ArithmeticTripleProblem}
                            unknown={unknownPart}
                            isSolutionView={isSolutionView}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 mt-4">
                        <div className={getInputClass('num1')}>{boxContent('num1', num1)}</div>
                        <div className="text-[2rem] font-extrabold text-slate-500">{symbol}</div>
                        <div className={getInputClass('num2')}>{boxContent('num2', num2)}</div>
                        {num3 !== undefined && (
                            <>
                                <div className="text-[2rem] font-extrabold text-slate-500">{symbol}</div>
                                <div className={getInputClass('num3')}>{boxContent('num3', num3)}</div>
                            </>
                        )}
                        <div className="text-[2rem] font-extrabold text-slate-500">=</div>
                        <div className={getInputClass('answer', true)}>{boxContent('answer', answer)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

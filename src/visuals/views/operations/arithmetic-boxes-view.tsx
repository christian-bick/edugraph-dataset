import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

const operatorSymbols: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

interface ArithmeticBoxesViewProps {
    invertProcedure: boolean;
    payload: ViewRenderPayload<'operations-boxes' | 'operations-boxes-inversion'>;
}

export const ArithmeticBoxesView = ({invertProcedure, payload}: ArithmeticBoxesViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-boxes', data, ['num1', 'num2', 'operation', 'answer']);

    const isFour = 'num4' in data && data.num4 !== undefined;
    const isTriple = !isFour && data.num3 !== undefined;
    if (isFour) {
        validateProblemData('operations-boxes', data, ['num3', 'num4']);
    } else if (isTriple) {
        validateProblemData('operations-boxes', data, ['num3']);
    }

    const symbol = operatorSymbols[data.operation];
    if (!symbol) {
        throw new ViewValidationError('operations-boxes', `Unsupported operation: ${data.operation}`);
    }

    const blankPart = invertProcedure ? 'num2' : 'solution';
    const operands = isFour
        ? ([['num1', data.num1], ['num2', data.num2], ['num3', data.num3], ['num4', data.num4]] as const)
        : isTriple
        ? ([['num1', data.num1], ['num2', data.num2], ['num3', data.num3]] as const)
        : ([['num1', data.num1], ['num2', data.num2]] as const);

    const isBlanked = (part: string) => !isSolutionView && blankPart === part;
    const isSolutionHighlight = (part: string) => isSolutionView && blankPart === part;

    const boxClass = (part: string) => {
        let classes = 'border-2 border-neutral-800 rounded-md py-[6px] px-3 mx-[5px] min-w-[100px] min-h-[50px] text-center font-mono flex items-center justify-center';
        if (isSolutionHighlight(part)) classes += ' text-emerald-700 font-bold';
        return classes;
    };

    const equation = (
        <div className="flex items-center text-[1.5rem]">
                {operands.map(([part, value], index) => (
                    <div key={part} className="contents">
                        {index > 0 && (
                            <div className="text-[1.8rem] font-bold w-[50px] text-center">{symbol}</div>
                        )}
                        <div className={boxClass(part)}>{isBlanked(part) ? '' : value}</div>
                    </div>
                ))}
                <div className="text-[1.8rem] font-bold w-[50px] text-center">=</div>
                <div className={`${boxClass('solution')} font-mono tracking-wider`}>
                    {isBlanked('solution') ? '' : data.answer}
                </div>
        </div>
    );

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            {equation}
        </div>
    );
};

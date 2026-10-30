import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberLineView} from '../operations-number-line-view.tsx';
import {
    OperationsNumberLineArithmeticViewConfig,
    OperationsNumberLineArithmeticViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-number-line-arithmetic';

interface CoreProps {
    config: OperationsNumberLineArithmeticViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const OperationsNumberLineArithmeticCore = ({payload}: CoreProps) => {
    validateProblemData(VIEW_ID, payload.problem.data, ['num1', 'num2', 'answer', 'operation']);
    const {num1, num2, answer} = payload.problem.data;
    return <OperationsNumberLineView mode="arithmetic" payload={payload} viewId={VIEW_ID}
        showZeroReference={[num1, num2, answer].includes(0)} />;
};

export const OperationsNumberLineArithmetic = withConfig(
    OperationsNumberLineArithmeticViewSchema,
    OperationsNumberLineArithmeticCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsNumberLineArithmetic payload={payload} />);
};

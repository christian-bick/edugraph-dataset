import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticPropertiesExplanation} from '../arithmetic-properties-view.tsx';
import {OperationsPropertiesExplanationViewConfig, OperationsPropertiesExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsPropertiesExplanationViewConfig;
    payload: ViewRenderPayload<'operations-properties-explanation'>;
}

const OperationsPropertiesExplanationCore = ({payload}: CoreProps) => (
    <ArithmeticPropertiesExplanation data={payload.problem.data} isSolutionView={payload.isSolutionView} />
);

export const OperationsPropertiesExplanation = withConfig(
    OperationsPropertiesExplanationViewSchema,
    OperationsPropertiesExplanationCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-properties-explanation'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsPropertiesExplanation payload={payload} />);
};

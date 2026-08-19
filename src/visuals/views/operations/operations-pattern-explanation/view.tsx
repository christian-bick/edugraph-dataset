import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PatternExplanationView} from '../pattern-explanation-view.tsx';
import {
    OperationsPatternExplanationViewConfig,
    OperationsPatternExplanationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-explanation';

interface CoreProps {
    config: OperationsPatternExplanationViewConfig;
    payload: ViewRenderPayload<'operations-pattern-explanation'>;
}

const OperationsPatternExplanationCore = ({payload}: CoreProps) => (
    <PatternExplanationView mode="legacy-explanation" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternExplanation = withConfig(
    OperationsPatternExplanationViewSchema,
    OperationsPatternExplanationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-pattern-explanation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsPatternExplanation payload={payload} />);
    }
};

import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PatternExplanationView} from '../pattern-explanation-view.tsx';
import {
    OperationsPatternFeatureExplanationViewConfig,
    OperationsPatternFeatureExplanationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-feature-explanation';

interface CoreProps {
    config: OperationsPatternFeatureExplanationViewConfig;
    payload: ViewRenderPayload<'operations-pattern-feature-explanation'>;
}

const OperationsPatternFeatureExplanationCore = ({payload}: CoreProps) => (
    <PatternExplanationView mode="feature-explanation" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternFeatureExplanation = withConfig(
    OperationsPatternFeatureExplanationViewSchema,
    OperationsPatternFeatureExplanationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-pattern-feature-explanation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsPatternFeatureExplanation payload={payload} />);
    }
};

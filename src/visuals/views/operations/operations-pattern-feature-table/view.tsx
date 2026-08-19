import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PatternTableView} from '../pattern-table-view.tsx';
import {
    OperationsPatternFeatureTableViewConfig,
    OperationsPatternFeatureTableViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-feature-table';

interface CoreProps {
    config: OperationsPatternFeatureTableViewConfig;
    payload: ViewRenderPayload<'operations-pattern-feature-table'>;
}

const OperationsPatternFeatureTableCore = ({payload}: CoreProps) => (
    <PatternTableView mode="feature-classification" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternFeatureTable = withConfig(
    OperationsPatternFeatureTableViewSchema,
    OperationsPatternFeatureTableCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-pattern-feature-table'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsPatternFeatureTable payload={payload} />);
    }
};

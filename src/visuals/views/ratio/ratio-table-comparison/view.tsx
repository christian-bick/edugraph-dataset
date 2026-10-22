import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {RatioTableComparisonView} from '../ratio-table-view.tsx';
import {RatioTableComparisonViewSchema, type RatioTableComparisonViewConfig} from './spec.ts';
import '../../../../tailwind.css';

export const RatioTableComparisonCore = ({payload}: {
    config: RatioTableComparisonViewConfig;
    payload: ViewRenderPayload<'ratio-table-comparison'>;
}) => <RatioTableComparisonView payload={payload} />;

export const RatioTableComparison = withConfig(RatioTableComparisonViewSchema, RatioTableComparisonCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'ratio-table-comparison'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<RatioTableComparison payload={payload} />);
};

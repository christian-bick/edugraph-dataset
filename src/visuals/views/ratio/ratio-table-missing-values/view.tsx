import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {RatioTableView} from '../ratio-table-view.tsx';
import {RatioTableMissingValuesViewSchema, type RatioTableMissingValuesViewConfig} from './spec.ts';
import '../../../../tailwind.css';

export const RatioTableMissingValuesCore = ({payload}: {
    config: RatioTableMissingValuesViewConfig;
    payload: ViewRenderPayload<'ratio-table-missing-values'>;
}) => <RatioTableView task="missing-values" viewId="ratio-table-missing-values" payload={payload} />;

export const RatioTableMissingValues = withConfig(RatioTableMissingValuesViewSchema, RatioTableMissingValuesCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'ratio-table-missing-values'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<RatioTableMissingValues payload={payload} />);
};

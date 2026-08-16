// vite.config.js
import { createReadStream, existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname } from 'path';
import { spawn } from 'node:child_process';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localAssetRequestKey } from './src/lib/local-assets.ts';
import { readLatestLocalExplorerSnapshot } from './src/lib/local-explorer-snapshot.ts';

const VIEW_HEAD_PATH = resolve(import.meta.dirname, 'src/partials/head.html');
const VIEW_HEAD_INVOCATION = /\{\{>\s*head\s+script=(['"])([^'"]+)\1\s*\}\}/g;
const COVERAGE_SITE = 'https://coverage.edugraph.io';
const LOCAL_SNAPSHOT_ROUTES = new Map([
    ['/coverage/preview/ccss-tree.json', 'coverage/ccss-tree.json'],
    ['/coverage/preview/ccss-coverage.json', 'coverage/ccss-coverage.json'],
    ['/coverage/preview/coverage-manifest.json', 'coverage/coverage-manifest.json'],
    ['/dataset/local-asset-index.json', 'dataset/local-asset-index.json'],
]);
const LOCAL_DATASET_ROUTE = '/dataset/local/';
const LOCAL_SNAPSHOT_STATUS_ROUTE = '/__edugraph/local-snapshot/status';
const LOCAL_SNAPSHOT_REFRESH_ROUTE = '/__edugraph/local-snapshot/refresh';
const LOCAL_SNAPSHOT_ROOT = resolve(import.meta.dirname, 'temp', 'standards-explorer-preview');
const VITE_NODE_WORKER = resolve(import.meta.dirname, 'node_modules', 'vite-node', 'dist', 'cli.mjs');
const LOCAL_SNAPSHOT_SCRIPT = resolve(import.meta.dirname, 'src', 'scripts', 'refresh-local-explorer.ts');

function coverageProxy() {
    return {
        target: COVERAGE_SITE,
        changeOrigin: true,
        secure: true,
    };
}

const isLocalRequest = request => {
    const hostname = (request.headers.host || '').split(':')[0];
    return hostname === 'localhost' || hostname === '127.0.0.1';
};

function localExplorerSnapshotPlugin() {
    let refreshRunning = false;

    const jsonResponse = (response, statusCode, payload) => {
        response.statusCode = statusCode;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        return response.end(JSON.stringify(payload));
    };

    const streamRefresh = response => {
        if (refreshRunning) {
            return jsonResponse(response, 409, {error: 'A local snapshot refresh is already running.'});
        }

        refreshRunning = true;
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Accel-Buffering', 'no');
        response.flushHeaders?.();

        const writeEvent = event => {
            if (!response.destroyed && !response.writableEnded) {
                response.write(`${JSON.stringify(event)}\n`);
            }
        };

        const worker = spawn(
            process.execPath,
            [VITE_NODE_WORKER, LOCAL_SNAPSHOT_SCRIPT],
            {cwd: import.meta.dirname, stdio: ['ignore', 'pipe', 'pipe']},
        );
        let stdoutBuffer = '';
        let stderr = '';
        let receivedResult = false;
        let finished = false;

        const forwardLine = line => {
            if (!line.trim()) return;
            try {
                const event = JSON.parse(line);
                if (event?.type !== 'progress' && event?.type !== 'result') {
                    throw new Error('Unknown refresh event.');
                }
                receivedResult ||= event.type === 'result';
                writeEvent(event);
            } catch (error) {
                stderr += `${error instanceof Error ? error.message : String(error)}: ${line}\n`;
            }
        };
        const finish = error => {
            if (finished) return;
            finished = true;
            refreshRunning = false;
            if (error) writeEvent({type: 'error', message: error});
            if (!response.destroyed && !response.writableEnded) response.end();
        };

        worker.stdout.setEncoding('utf8');
        worker.stdout.on('data', chunk => {
            stdoutBuffer += chunk;
            const lines = stdoutBuffer.split(/\r?\n/);
            stdoutBuffer = lines.pop() ?? '';
            lines.forEach(forwardLine);
        });
        worker.stderr.setEncoding('utf8');
        worker.stderr.on('data', chunk => {
            stderr += chunk;
        });
        worker.on('error', error => finish(error.message));
        worker.on('close', code => {
            forwardLine(stdoutBuffer);
            if (code !== 0) {
                finish(stderr.trim() || `Local snapshot worker exited with code ${code}.`);
            } else if (!receivedResult) {
                finish(stderr.trim() || 'Local snapshot worker completed without a result.');
            } else {
                finish();
            }
        });
    };

    const serve = async (request, response, next) => {
        const rawPathname = (request.url || '/').split(/[?#]/, 1)[0];
        const isStatus = rawPathname === LOCAL_SNAPSHOT_STATUS_ROUTE;
        const isRefresh = rawPathname === LOCAL_SNAPSHOT_REFRESH_ROUTE;
        const staticPath = LOCAL_SNAPSHOT_ROUTES.get(rawPathname);
        const assetKey = rawPathname.startsWith(LOCAL_DATASET_ROUTE)
            ? localAssetRequestKey(rawPathname.slice(LOCAL_DATASET_ROUTE.length))
            : null;
        if (!isStatus && !isRefresh && !staticPath && !assetKey) return next();
        if (!isLocalRequest(request)) return jsonResponse(response, 404, {error: 'Not found.'});

        if (isRefresh) {
            if (request.method !== 'POST') {
                response.setHeader('Allow', 'POST');
                return jsonResponse(response, 405, {error: 'Method not allowed.'});
            }
            return streamRefresh(response);
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.setHeader('Allow', 'GET, HEAD');
            return jsonResponse(response, 405, {error: 'Method not allowed.'});
        }

        const snapshot = readLatestLocalExplorerSnapshot(LOCAL_SNAPSHOT_ROOT);
        if (isStatus) {
            const payload = snapshot
                ? {
                    available: true,
                    generated_at: snapshot.generated_at,
                    asset_count: snapshot.asset_count,
                }
                : {available: false};
            if (request.method === 'HEAD') return response.end();
            return jsonResponse(response, 200, payload);
        }
        if (!snapshot) {
            return jsonResponse(response, 409, {
                error: 'Local explorer data is unavailable. Use Refresh local data.',
            });
        }

        const snapshotPath = staticPath
            ? resolve(snapshot.directory, ...staticPath.split('/'))
            : resolve(snapshot.directory, 'dataset', 'local', ...assetKey.split('/'));
        if (!existsSync(snapshotPath)) return jsonResponse(response, 404, {error: 'Not found.'});
        const file = statSync(snapshotPath);
        if (!file.isFile()) return jsonResponse(response, 404, {error: 'Not found.'});

        response.statusCode = 200;
        response.setHeader('Content-Type', assetKey ? 'image/png' : 'application/json; charset=utf-8');
        response.setHeader('Content-Length', file.size);
        response.setHeader('Cache-Control', 'no-store');
        if (request.method === 'HEAD') return response.end();
        return createReadStream(snapshotPath).pipe(response);
    };

    return {
        name: 'edugraph-local-explorer-snapshot',
        configureServer(server) {
            server.middlewares.use(serve);
        },
        configurePreviewServer(server) {
            server.middlewares.use(serve);
        },
    };
}

function viewHeadPlugin() {
    return {
        name: 'edugraph-view-head',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                if (!html.includes('{{>')) return html;

                const invocations = [...html.matchAll(VIEW_HEAD_INVOCATION)];
                if (invocations.length !== 1) {
                    throw new Error('Expected exactly one {{> head script=... }} invocation.');
                }

                const [, , script] = invocations[0];
                const head = readFileSync(VIEW_HEAD_PATH, 'utf8').replace('{{ script }}', script);
                return html.replace(invocations[0][0], head);
            }
        }
    };
}

export default defineConfig({
    // ✨ Set the project's root to the 'src' directory
    root: 'src',
    publicDir: '../public',
    server: {
        proxy: {
            '/coverage/latest': coverageProxy(),
            '/coverage/preview': coverageProxy(),
            '/dataset/asset-index.json': {
                target: COVERAGE_SITE,
                changeOrigin: true,
                secure: true,
            },
        },
    },
    build: {
        // ✨ Output files to a 'dist' directory at the project level (../)
        outDir: '../dist',
        emptyOutDir: true, // This is a good practice
        rollupOptions: {
            input: Object.fromEntries(
                // ✨ Find all HTML files within the new root ('src')
                globSync('./src/**/*.html', {exclude: ['./src/partials/**']}).map(file => [
                    // ✨ The key is now naturally relative to 'src'
                    // e.g., 'pages/about.html' -> 'pages/about'
                    // e.g., 'index.html' -> 'index'
                    relative(
                        'src',
                        file.slice(0, file.length - extname(file).length)
                    ),
                    // The value is the absolute path to the file
                    fileURLToPath(new URL(file, import.meta.url))
                ])
            ),
        },
    },
    plugins: [
        react(),
        tailwindcss(),
        viewHeadPlugin(),
        localExplorerSnapshotPlugin(),
    ],
    test: {
        coverage: {
            provider: 'v8',
            include: ['generators/**/generator.ts'],
            reporter: ['text', 'json-summary'],
            reportsDirectory: '../coverage'
        }
    }
});

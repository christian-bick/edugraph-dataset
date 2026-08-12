// vite.config.js
import { createReadStream, existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname } from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolveLocalDatasetAsset } from './src/lib/local-assets.ts';

const VIEW_HEAD_PATH = resolve(import.meta.dirname, 'src/partials/head.html');
const VIEW_HEAD_INVOCATION = /\{\{>\s*head\s+script=(['"])([^'"]+)\1\s*\}\}/g;
const COVERAGE_SITE = 'https://coverage.edugraph.io';
const COVERAGE_FILES = [
    'ccss-tree.json',
    'ccss-coverage.json',
    'coverage-manifest.json',
];
const LOCAL_ASSET_INDEX = resolve(import.meta.dirname, 'public', 'dataset', 'asset-index.json');
const LOCAL_DATASET_ROOT = resolve(import.meta.dirname, 'out', 'dataset');
const LOCAL_DATASET_ROUTE = '/dataset/local/';

function hasLocalCoverageSnapshot(requestUrl) {
    const pathname = new URL(requestUrl || '/', 'http://localhost').pathname;
    const match = pathname.match(/^\/coverage\/(latest|preview)\//);
    if (!match) return false;

    const snapshotDir = resolve(import.meta.dirname, 'public', 'coverage', match[1]);
    return COVERAGE_FILES.every(file => existsSync(resolve(snapshotDir, file)));
}

function coverageProxy() {
    return {
        target: COVERAGE_SITE,
        changeOrigin: true,
        secure: true,
        bypass(request) {
            return hasLocalCoverageSnapshot(request.url) ? request.url : undefined;
        },
    };
}

function assetIndexProxy() {
    return {
        target: COVERAGE_SITE,
        changeOrigin: true,
        secure: true,
        bypass(request) {
            return existsSync(LOCAL_ASSET_INDEX) ? request.url : undefined;
        },
    };
}

function serveLocalDataset(request, response, next) {
    const rawPathname = (request.url || '/').split(/[?#]/, 1)[0];
    if (!rawPathname.startsWith(LOCAL_DATASET_ROUTE)) return next();

    const hostname = (request.headers.host || '').split(':')[0];
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        response.statusCode = 404;
        return response.end();
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.statusCode = 405;
        response.setHeader('Allow', 'GET, HEAD');
        return response.end();
    }

    const assetPath = resolveLocalDatasetAsset(
        LOCAL_DATASET_ROOT,
        rawPathname.slice(LOCAL_DATASET_ROUTE.length),
    );
    if (!assetPath || !existsSync(assetPath)) {
        response.statusCode = 404;
        return response.end();
    }

    const asset = statSync(assetPath);
    if (!asset.isFile()) {
        response.statusCode = 404;
        return response.end();
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Content-Length', asset.size);
    response.setHeader('Cache-Control', 'no-store');
    if (request.method === 'HEAD') return response.end();
    return createReadStream(assetPath).pipe(response);
}

function localDatasetPlugin() {
    return {
        name: 'edugraph-local-dataset',
        configureServer(server) {
            server.middlewares.use(serveLocalDataset);
        },
        configurePreviewServer(server) {
            server.middlewares.use(serveLocalDataset);
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
            '/dataset/asset-index.json': assetIndexProxy(),
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
        localDatasetPlugin(),
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

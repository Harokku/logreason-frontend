/// <reference types="vitest" />
/// <reference types="vite/client" />

import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        solidPlugin(),
        tailwindcss(),
    ],
    server: {
        port: 4000,
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['node_modules/@testing-library/jest-dom/vitest'],
        // if you have few tests, try commenting this
        // out to improve performance:
        isolate: false,
    },
    build: {
        target: 'esnext',
    },
    resolve: {
        conditions: ['development', 'browser'],
    },
});

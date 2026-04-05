declare module 'vite-plugin-pwa' {
    export const VitePWA: any;
}

// Only shim things that are truly missing or causing persistent issues despite having types
declare module 'react-to-print';

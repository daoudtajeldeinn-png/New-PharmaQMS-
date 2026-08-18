declare module 'vite-plugin-pwa' {
    export const VitePWA: any;
}

// Only shim things that are truly missing or causing persistent issues despite having types
declare module 'react-to-print';

declare module 'virtual:pwa-register/react' {
    import type { Dispatch, SetStateAction } from 'react';

    export function useRegisterSW(options?: {
        immediate?: boolean;
        onNeedReload?: () => void;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegisterError?: (error: unknown) => void;
    }): {
        needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
        offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    };
}

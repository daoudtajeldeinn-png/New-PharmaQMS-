// Electron build stub — PWA registration is a no-op in desktop mode
export const useRegisterSW = () => ({
  needRefresh: [false, () => {}],
  offlineReady: [false, () => {}],
  updateServiceWorker: async () => {},
});

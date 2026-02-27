declare module 'html5-qrcode' {
  export class Html5QrcodeScanner {
    constructor(elementId: string, config: any, verbose?: boolean);
    render(successCallback: (decodedText: string, result: any) => void, errorCallback?: (error: any) => void): void;
    clear(): Promise<void>;
  }
  export class Html5Qrcode {
    constructor(elementId: string);
    start(deviceId: any, config: any, successCallback: (decodedText: string, result: any) => void, errorCallback?: (error: any) => void): Promise<void>;
    stop(): Promise<void>;
    clear(): void;
  }
}

declare module 'qrcode' {
  interface QRCodeOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<void>;
  export function toString(text: string, options?: QRCodeOptions): Promise<string>;
  export function toFile(path: string, text: string, options?: QRCodeOptions): Promise<void>;
  export function toBuffer(text: string, options?: QRCodeOptions): Promise<Buffer>;
}
/// <reference types="vite/client" />

interface EyeDropperOpenResult {
  sRGBHex: string;
}

interface EyeDropper {
  open(): Promise<EyeDropperOpenResult>;
}

declare var EyeDropper: {
  prototype: EyeDropper;
  new (): EyeDropper;
};

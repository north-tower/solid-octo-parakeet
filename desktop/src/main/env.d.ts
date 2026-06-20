/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_XMRIG_PATH?: string;
  readonly VITE_XMRIG_POOL_URL?: string;
  readonly VITE_XMRIG_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

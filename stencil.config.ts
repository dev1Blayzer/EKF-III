import { Config } from "@stencil/core";
import typescript from 'rollup-plugin-typescript';

// https://stenciljs.com/docs/config

export const config: Config = {
  outputTargets: [
    {
      type: "www",
      serviceWorker: null
    }
  ],
  rollupPlugins: {
    before: [
      typescript()
    ]
  },
  globalScript: "src/global/app.ts",
  globalStyle: "src/global/app.css"
};

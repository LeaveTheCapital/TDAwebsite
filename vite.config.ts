import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: "index.html",
        midicc: "midicc.html",
        tda: "tda.html",
      },
    },
  },
});

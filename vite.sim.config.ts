import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Lightweight Vite config for running the water sim standalone with HMR
// - No Alchemy / TanStack Start plugins
// - Serves project root so /public assets resolve
// - Entry is sim.html

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), react()],
  root: ".",
  server: {
    open: "/sim.html?debug",
    host: true,
  },
});

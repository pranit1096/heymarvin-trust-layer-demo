import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // If deploying to GitHub Pages at https://<user>.github.io/<repo>/,
  // uncomment and set base to "/<repo>/":
  // base: "/heymarvin-trust-layer-demo/",
});

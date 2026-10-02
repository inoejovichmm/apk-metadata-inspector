import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `canopy dev` picks this config up and adds its own /_api proxy on top.
export default defineConfig({
  plugins: [react()],
});

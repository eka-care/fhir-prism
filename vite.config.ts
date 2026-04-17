import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import os from "os";
import path from "path";

export default defineConfig({
  base: "/fhir-prism/",
  plugins: [react(), basicSsl()],
  cacheDir: path.join(os.tmpdir(), "vite-prism-cache"),
  server: { port: 5174 },
});

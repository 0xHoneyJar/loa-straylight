import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [
      "node_modules/**",
      "dist/**",
      "dist-types/**",
      "coverage/**",
      ".vitest/**",
      ".loa/**",
      ".claude/**",
      "grimoires/**",
      "docs/**",
      "fixtures/**"
    ],
    environment: "node",
    // Run a single build before any test file. Eliminates the
    // cross-file race between the Phase 24H type-only consumption
    // suite and the Phase 26B runtime-subpath suite, which both need
    // dist-types/ + dist/ present and would otherwise race on
    // `clean:dist`.
    globalSetup: "tests/_global-setup.ts"
  }
});

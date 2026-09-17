import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:3000/shop-api",
  documents: ["src/**/*.{ts,tsx,astro}"],
  generates: {
    "./src/lib/vendure/generated/": {
      preset: "client",
      config: {
        useTypeImports: true,
      },
    },
  },
};

export default config;
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "out/**", ".wrangler/**", "next-env.d.ts", "scripts/render/vendor/**"] },
];

export default config;

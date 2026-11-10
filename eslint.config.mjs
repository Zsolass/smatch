import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  // dentsites/ is a separate project with its own lint setup.
  { ignores: [".next/**", "out/**", ".wrangler/**", "next-env.d.ts", "scripts/render/vendor/**", "dentsites/**"] },
];

export default config;

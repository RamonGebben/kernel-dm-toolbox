const config = {
  '*': 'prettier --write --ignore-unknown',
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': 'eslint --fix',
  // Functions, so lint-staged doesn't append the staged file names -
  // these check the whole project.
  '**': () => ['pnpm run typecheck', 'pnpm run test'],
};

export default config;

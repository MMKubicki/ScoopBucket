export { tryParse as tryParseSemVer } from "std/semver/try_parse.ts";
export { compare as compareSemVer } from "std/semver/compare.ts";
export { format as formatSemVer } from "std/semver/format.ts";
export type { SemVer } from "std/semver/types.ts";
export { difference as timeDifference } from "std/datetime/difference.ts";

export { Octokit } from "https://esm.sh/octokit@3.2.0?dts";
export { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

import { Octokit } from "https://esm.sh/octokit@3.2.0?dts";
export function getOctokit() {
  return new Octokit({
    userAgent: "MMKubicki-ScoopBucket/1.0.0",
  });
}

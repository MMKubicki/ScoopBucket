import { Command, formatSemVer, Octokit } from "./deps.ts";
import type { FetchParams } from "./github.ts";
import { getLastest, getLastestMajor } from "./github.ts";

await new Command()
  .name("filter-gh-releases")
  .description(
    "Pulls all github releases and returns latest (or specified major)",
  )
  .version("v1.0.0")
  .option(
    "-m, --major <major:number>",
    "The major version number to filter for",
    {
      default: undefined,
    },
  )
  .option(
    "-c --tag-cut <count:number>",
    "Count of characters to cut from the beginning of release tags.",
    {
      default: undefined,
    },
  )
  .arguments("<owner:string> <repo:string>")
  .example(
    "Get latest version of https://github.com/llvm/llvm-project",
    "filter-gh-releases llvm llvm-project",
  )
  .action(async ({ major, tagCut }, owner, repo) => {
    const params: FetchParams = {
      owner,
      repo,
      tag_edit: {
        prefix_cut: tagCut,
      },
      octokit: new Octokit({
        userAgent: "MMKubicki-ScoopBucket/1.0.0",
      }),
    };

    let latest = undefined;
    if (typeof major === "undefined") {
      latest = await getLastest(params);
    } else {
      latest = await getLastestMajor(params, major);
    }

    if (typeof latest === "undefined") {
      console.log("not found");
    } else {
      console.log(formatSemVer(latest));
    }

    Deno.exit(0); // See https://github.com/octokit/octokit.js/issues/2079
  })
  .parse();

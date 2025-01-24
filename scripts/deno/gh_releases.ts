import { Command } from "@cliffy/command";
import { Octokit } from "octokit";

import type { FetchParams } from "./github.ts";

import { getLastest, getLastestMajor } from "./github.ts";

import context from "./deno.json" with { type: "json" };

function getUserAgent() {
  return `MMKubicki-ScoopBucket/${context.version} octokit.js`;
}

await new Command()
  .name("gh-releases")
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
    "gh-releases llvm llvm-project --tag-cut 8",
  )
  .action(async ({ major, tagCut }, owner, repo) => {
    const params: FetchParams = {
      owner,
      repo,
      tag_edit: {
        prefix_cut: tagCut,
      },
      octokit: new Octokit({
        userAgent: getUserAgent(),
        auth: Deno.env.get("GH_TOKEN"),
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
      console.log(latest[1]);
    }

    Deno.exit(0); // See https://github.com/octokit/octokit.js/issues/2079
  })
  .parse();

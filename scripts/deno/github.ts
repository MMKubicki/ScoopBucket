import {
  compare as compareSemVer,
  isSemVer,
  tryParse as tryParseSemVer,
} from "@std/semver";
import type { SemVer } from "@std/semver";
import type { Octokit } from "octokit";

export type TagEditParams = {
  prefix_cut?: number;
};

function edit_tag(tag: string, edit?: TagEditParams): string {
  if (typeof edit !== "object") {
    return tag;
  }

  return Object
    .entries(edit)
    .reduce(
      (acc, [op, config]) => {
        switch (op) {
          case "prefix_cut":
            return acc.slice(config);
          default:
            return acc;
        }
      },
      tag,
    );
}

function short_tag_parse(tag: string): [SemVer, string] | undefined {
  // remove possible prerelease & build info and simple check if split by dot = 2 parts and numbers
  const [version, ...rest] = tag.split(/[-]/);

  let construct = version + ".0";

  if (rest.length > 0) {
    construct = [construct, "-", ...rest].join("");
  }
  // attach .0 assumed
  const parsed = tryParseSemVer(construct);
  if (typeof parsed === "undefined") {
    return undefined;
  }

  return [parsed, tag];
}

function tag_parse(tag: string): [SemVer, string] | undefined {
  const parsedTag = tryParseSemVer(tag);

  if (isSemVer(parsedTag)) {
    return [parsedTag, tag];
  }

  // normal semver fails if patch is missing..., e.g. "1.2"
  return short_tag_parse(tag);
}

export type FetchParams = {
  owner: string;
  repo: string;
  octokit: Octokit;
  tag_edit?: TagEditParams;
};

async function listReleases(
  params: FetchParams,
): Promise<Array<[SemVer, string]>> {
  const {
    octokit,
    owner,
    repo,
    tag_edit,
  } = params;

  return await octokit.paginate(
    octokit.rest.repos.listReleases,
    {
      owner,
      repo,
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    (resp) =>
      resp.data
        .map((d) => d.tag_name)
        .map((t) => tag_parse(edit_tag(t, tag_edit)))
        .filter((t) => typeof t !== "undefined") as Array<[SemVer, string]>,
  );
}

function findLatest(
  acc: [SemVer, string],
  current: [SemVer, string],
): [SemVer, string] {
  return compareSemVer(current[0], acc[0]) > 0 ? current : acc;
}

const MIN_SEMVER: SemVer = {
  major: 0,
  minor: 0,
  patch: 0,
  prerelease: [],
  build: [],
};

export async function getLastest(
  params: FetchParams,
): Promise<[SemVer, string] | undefined> {
  const allVer = await listReleases(params);

  if (allVer.length === 0) {
    return undefined;
  }
  return allVer.reduce(findLatest, [MIN_SEMVER, ""]);
}

export async function getLastestMajor(
  params: FetchParams,
  major: number,
): Promise<[SemVer, string] | undefined> {
  const allVer = await listReleases(params);
  const onlyMajor = allVer.filter(([ver, _tag]) => ver.major === major);

  if (onlyMajor.length === 0) {
    return undefined;
  }

  return onlyMajor.reduce(findLatest, [MIN_SEMVER, ""]);
}

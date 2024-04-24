import { compareSemVer, SemVer, tryParseSemVer } from "./deps.ts";
import type { Octokit } from "./deps.ts";

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

function tag_parse(tag: string): SemVer | undefined {
  return tryParseSemVer(tag);
}

export type FetchParams = {
  owner: string;
  repo: string;
  octokit: Octokit;
  tag_edit?: TagEditParams;
};

async function listReleases(
  params: FetchParams,
): Promise<Array<SemVer>> {
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
        .filter((t) => typeof t !== "undefined") as Array<SemVer>,
  );
}

function findLatest(acc: SemVer, current: SemVer): SemVer {
  return compareSemVer(current, acc) > 0 ? current : acc;
}

const MIN_SEMVER: SemVer = {
  major: 0,
  minor: 0,
  patch: 0,
  prerelease: undefined,
  build: undefined,
};

export async function getLastest(
  params: FetchParams,
): Promise<SemVer | undefined> {
  const allVer = await listReleases(params);

  if (allVer.length === 0) {
    return undefined;
  }
  return allVer.reduce(findLatest, MIN_SEMVER);
}

export async function getLastestMajor(
  params: FetchParams,
  major: number,
): Promise<SemVer | undefined> {
  const allVer = await listReleases(params);
  const onlyMajor = allVer.filter((ver) => ver.major === major);

  if (onlyMajor.length === 0) {
    return undefined;
  }

  return onlyMajor.reduce(findLatest, MIN_SEMVER);
}

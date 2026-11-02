import pool from "../config/db.js";

import { getRepositoryDetails } from "../utility/repoDetails.js";
import { summarizeFiles } from "./summarizeFile.js";
import { uploadDocuments } from "./uploadDocuments.js";
import { syncKnowledgeBase } from "./syncKnowledgeBase.js";

export async function ingestion(repoUrl: string) {
  const client = await pool.connect();

  try {
    // 1. Get GitHub repository details and current commit SHA.
    const repoDetails = await getRepositoryDetails(repoUrl);

    const {
  githubRepoId,
  defaultBranch,
  commitSha,
} = repoDetails;

const owner = repoDetails.owner.toLowerCase();
const repo = repoDetails.repo.toLowerCase();

    if (!githubRepoId || !commitSha) {
      throw new Error(
        "Could not retrieve the GitHub repository ID or commit SHA.",
      );
    }

    console.log(`Repository: ${owner}/${repo}`);
    console.log(`GitHub Repository ID: ${githubRepoId}`);
    console.log(`Commit SHA: ${commitSha}`);

    // 2. Check whether this exact repository version exists.
    const existingVersion = await client.query(
      `
      SELECT r.id AS repository_id, rv.commit_sha
FROM repositories r
JOIN repository_versions rv
  ON rv.repository_id = r.id
WHERE r.github_owner = $1
  AND r.github_repo = $2
  AND rv.commit_sha = $3
LIMIT 1;
      `,
      [owner, repo, commitSha],
    );

    // 3. Stop if this version has already been ingested.
    if ((existingVersion.rowCount ?? 0) > 0) {
  return {
    success: true,
    alreadyExists: true,
    message: "This repository version has already been ingested.",
    repositoryId: existingVersion.rows[0].repository_id,
    commitSha: existingVersion.rows[0].commit_sha,
    owner,
    repo,
  };
}

    // 4. Summarize repository files.
    const summaries = await summarizeFiles({
      repoUrl,
      commitSha,
      owner,
      repo,
    });

    if (!summaries || summaries.length === 0) {
      throw new Error("No file summaries were generated.");
    }

    const repositoryResult = await client.query(
      `
      INSERT INTO repositories (
        github_owner,
        github_repo,
        canonical_url,
        default_branch
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (github_owner, github_repo)
      DO UPDATE SET
        canonical_url = EXCLUDED.canonical_url,
        default_branch = EXCLUDED.default_branch,
        updated_at = NOW()
      RETURNING id
      `,
      [owner, repo, `https://github.com/${owner}/${repo}`, defaultBranch],
    );

    const repositoryId = repositoryResult.rows[0].id;

    // 5. Upload the summarized documents to your storage/data source.
    const uploadResult = await uploadDocuments({
  owner,
  repo,
  repositoryId,
  commitSha,
  documents: summaries,
});

    // After uploading all summary documents:
    const syncResult = await syncKnowledgeBase({
      waitForCompletion: true,
    });

    console.log("Knowledge Base is synchronized:", syncResult.status);

    // 6. Record the successfully processed version in PostgreSQL.
    // Use a transaction so the repository and version records
    // are committed together.
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO repository_versions (
        repository_id,
        commit_sha
      )
      VALUES ($1, $2)
      ON CONFLICT (repository_id, commit_sha)
      DO NOTHING
      `,
      [repositoryId, commitSha],
    );

    await client.query("COMMIT");

    return {
      success: true,
      alreadyExists: false,
      message: "Repository ingestion completed successfully.",
      repositoryId,
      githubRepoId,
      commitSha,
      summarizedFiles: summaries.length,
      uploadResult,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("Repository ingestion failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

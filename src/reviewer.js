const Groq = require('groq-sdk');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function loadRules(ruleName = 'angular') {
  const rulesPath = path.join(__dirname, 'rules', `${ruleName}.md`);
  return fs.readFileSync(rulesPath, 'utf-8');
}

const REVIEW_PROMPT = loadRules(process.env.REVIEW_RULES || 'angular');

async function getChangedFiles(owner, repo, pullNumber) {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return files;
}

async function reviewWithAI(diff) {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: REVIEW_PROMPT },
      { role: 'user', content: diff }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content || 'No review generated';
}

async function postReview(owner, repo, pullNumber, body, event = "COMMENT") {
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event,
  });
}

async function run() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const pullNumber = parseInt(process.env.PR_NUMBER, 10);

  console.log(`Reviewing PR #${pullNumber} in ${owner}/${repo}`);

  const files = await getChangedFiles(owner, repo, pullNumber);

  const angularExtensions = ['.ts', '.html', '.scss', '.css', '.spec.ts'];
  
  const relevantFiles = files.filter((f) => {
    const isAngularFile = angularExtensions.some(ext => f.filename.endsWith(ext));
    const isNotGenerated = 
      !f.filename.includes('package-lock.json') &&
      !f.filename.includes('yarn.lock') &&
      !f.filename.includes('node_modules') &&
      !f.filename.includes('.angular') &&
      !f.filename.endsWith('.min.js') &&
      !f.filename.endsWith('.min.css') &&
      !f.filename.includes('polyfills');
    
    return isAngularFile && isNotGenerated;
  });

  if (relevantFiles.length === 0) {
    console.log("No relevant files to review");
    return;
  }

  const diff = relevantFiles
    .map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch || ""}\n\`\`\``)
    .join("\n\n");

  const truncatedDiff = diff.slice(0, 30000);

  console.log("Sending to AI for review...");
  const review = await reviewWithAI(truncatedDiff);

  console.log("Posting review...");

  let event = "COMMENT";
  if (review.includes("✅ Approve")) {
    event = "APPROVE";
  } else if (review.includes("⚠️ Request Changes")) {
    event = "REQUEST_CHANGES";
  }

  await postReview(
    owner,
    repo,
    pullNumber,
    `## 🤖 AI Code Review\n\n${review}`,
  );

  console.log("Review posted successfully!");
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

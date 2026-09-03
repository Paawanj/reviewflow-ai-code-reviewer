const prisma = require("../lib/prisma");

const REVIEW_MODEL = "gemini-3.6-flash";
const VALID_SEVERITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
const VALID_CATEGORIES = new Set(["SECURITY", "BUG", "PERFORMANCE", "QUALITY"]);

function toEnumValue(value, allowedValues, label) {
  const normalizedValue = String(value || "").toUpperCase();

  if (!allowedValues.has(normalizedValue)) {
    const error = new Error(`Gemini returned an invalid ${label}: ${value}`);
    error.status = 502;
    throw error;
  }

  return normalizedValue;
}

function serializeFinding(finding) {
  return {
    id: finding.id,
    severity: finding.severity.toLowerCase(),
    category: finding.category.toLowerCase(),
    file: finding.filePath,
    line: finding.line,
    description: finding.description,
    suggestion: finding.suggestion,
  };
}

function serializeReview(review) {
  return {
    id: review.id,
    score: review.score,
    summary: review.summary,
    model: review.model,
    createdAt: review.createdAt,
    contextUsed: review.contextUsed || [],
    findings: review.findings.map(serializeFinding),
  };
}

async function saveReview({ userId, repository, pullRequest, generatedReview, contextUsed }) {
  const fullName = `${repository.owner}/${repository.repo}`;

  const review = await prisma.$transaction(async (database) => {
    const savedRepository = await database.repository.upsert({
      where: {
        userId_fullName: {
          userId,
          fullName,
        },
      },
      update: {
        githubId: String(repository.githubId),
        defaultBranch: repository.defaultBranch,
        isArchived: false,
      },
      create: {
        githubId: String(repository.githubId),
        owner: repository.owner,
        name: repository.repo,
        fullName,
        defaultBranch: repository.defaultBranch,
        userId,
      },
    });

    const savedPullRequest = await database.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: savedRepository.id,
          number: pullRequest.number,
        },
      },
      update: {
        title: pullRequest.title,
        state: pullRequest.state,
        author: pullRequest.author,
      },
      create: {
        number: pullRequest.number,
        title: pullRequest.title,
        state: pullRequest.state,
        author: pullRequest.author,
        repositoryId: savedRepository.id,
      },
    });

    return database.review.create({
      data: {
        score: generatedReview.score,
        summary: generatedReview.summary,
        model: REVIEW_MODEL,
        contextUsed: contextUsed || [],
        pullRequestId: savedPullRequest.id,
        findings: {
          create: generatedReview.findings.map((finding) => ({
            severity: toEnumValue(finding.severity, VALID_SEVERITIES, "severity"),
            category: toEnumValue(finding.category, VALID_CATEGORIES, "category"),
            filePath: finding.file,
            line: Number.isInteger(finding.line) && finding.line > 0 ? finding.line : null,
            description: finding.description,
            suggestion: finding.suggestion,
          })),
        },
      },
      include: { findings: true },
    });
  });

  return serializeReview(review);
}

async function getPullRequestReviews(userId, owner, repo, pullNumber) {
  const repository = await prisma.repository.findUnique({
    where: { userId_fullName: { userId, fullName: `${owner}/${repo}` } },
  });

  if (!repository) {
    return [];
  }

  const pullRequest = await prisma.pullRequest.findUnique({
    where: {
      repositoryId_number: {
        repositoryId: repository.id,
        number: pullNumber,
      },
    },
  });

  if (!pullRequest) {
    return [];
  }

  const reviews = await prisma.review.findMany({
    where: { pullRequestId: pullRequest.id },
    include: { findings: true },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map(serializeReview);
}

async function getReviewById(userId, reviewId) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      pullRequest: { repository: { userId } },
    },
    include: { findings: true },
  });

  return review ? serializeReview(review) : null;
}

async function getRecentSavedReviews(userId) {
  const reviews = await prisma.review.findMany({
    where: { pullRequest: { repository: { userId } } },
    include: {
      findings: true,
      pullRequest: {
        include: {
          repository: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return reviews.map((review) => ({
    ...serializeReview(review),
    repository: review.pullRequest.repository.fullName,
    pullRequestNumber: review.pullRequest.number,
    pullRequestTitle: review.pullRequest.title,
  }));
}

function createLastSixMonths() {
  const months = [];
  const today = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en", { month: "short" }).format(date);
    months.push({ key, label, reviewCount: 0, scoreTotal: 0 });
  }

  return months;
}

async function getReviewAnalytics(userId) {
  const months = createLastSixMonths();
  const firstMonth = new Date(`${months[0].key}-01T00:00:00.000Z`);
  const reviews = await prisma.review.findMany({
    where: {
      createdAt: { gte: firstMonth },
      pullRequest: { repository: { userId } },
    },
    include: { findings: true },
    orderBy: { createdAt: "asc" },
  });

  const monthByKey = new Map(months.map((month) => [month.key, month]));
  const categoryCounts = { security: 0, bug: 0, performance: 0, quality: 0 };

  for (const review of reviews) {
    const date = new Date(review.createdAt);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = monthByKey.get(key);

    if (month) {
      month.reviewCount += 1;
      month.scoreTotal += review.score;
    }

    for (const finding of review.findings) {
      const category = finding.category.toLowerCase();
      categoryCounts[category] += 1;
    }
  }

  return {
    scoreByMonth: months.map((month) => ({
      month: month.label,
      averageScore: month.reviewCount
        ? Number((month.scoreTotal / month.reviewCount).toFixed(1))
        : null,
      reviewCount: month.reviewCount,
    })),
    findingsByCategory: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    })),
    totalReviews: reviews.length,
  };
}

module.exports = {
  getPullRequestReviews,
  getReviewAnalytics,
  getRecentSavedReviews,
  getReviewById,
  saveReview,
};

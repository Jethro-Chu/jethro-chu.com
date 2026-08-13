import { buildPublicIQData } from "../lib/iqtest/public-data.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const attempts = Array.from({ length: 30 }, (_, index) => ({
  iqScore: 90 + index,
  correctCount: 5 + (index % 21),
  completedAt: new Date(Date.UTC(2026, 7, index + 1)).toISOString(),
  completionTimeSeconds: index < 2 ? null : 600 + index * 60,
}));

const firstPage = buildPublicIQData(attempts, {
  page: 1,
  pageSize: 20,
  sort: "recent",
});
assert(firstPage.overview.testsCompleted === 30, "All attempts must count.");
assert(firstPage.timing.timedTests === 28, "Untimed history must be excluded from timing.");
assert(firstPage.attempts.length === 20, "The first page must contain 20 rows.");
assert(firstPage.pagination.totalPages === 2, "Pagination count is incorrect.");
assert(
  firstPage.scoreDistribution.reduce((sum, bin) => sum + bin.count, 0) === 30,
  "Raw-score distribution must contain every valid attempt.",
);
assert(
  firstPage.iqDistribution.reduce((sum, bin) => sum + bin.count, 0) === 30,
  "IQ distribution must contain every valid attempt.",
);
assert(
  firstPage.timing.distribution.reduce((sum, bin) => sum + bin.count, 0) === 28,
  "Time distribution must contain only timed attempts.",
);

const secondPage = buildPublicIQData(attempts, {
  page: 2,
  pageSize: 20,
  sort: "recent",
});
assert(secondPage.attempts.length === 10, "The second page must contain 10 rows.");

const highest = buildPublicIQData(attempts, {
  page: 1,
  pageSize: 20,
  sort: "highest",
});
assert(highest.attempts[0].iqScore === 119, "Highest-IQ sorting is incorrect.");

const fastest = buildPublicIQData(attempts, {
  page: 1,
  pageSize: 20,
  sort: "fastest",
});
assert(
  fastest.attempts[0].completionTimeSeconds === 720,
  "Fastest sorting must exclude missing times from the lead position.",
);

const publicPayload = JSON.stringify(firstPage);
for (const forbiddenField of [
  "attemptId",
  "answers",
  "startedAt",
  "email",
  "ipAddress",
  "sessionToken",
]) {
  assert(
    !publicPayload.includes(forbiddenField),
    `Public payload must not expose ${forbiddenField}.`,
  );
}

console.log(
  "Verified public IQ summaries, distributions, timed-only statistics, sorting, pagination, and privacy fields.",
);

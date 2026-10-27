---
title: 'Optimera: from slow queries to pull requests'
description: How we built Optimera at HackEurope, connecting OpenTelemetry traces to source code so a coding agent could propose fixes for slow database queries.
footerColor: bg-blue-800
postTitle: 'Optimera: from slow queries to pull requests'
author: Didrik Munther
authorImg: /static/didrik-closeup.jpg
coverImg: /static/blog/hackeurope/optimera-dashboard.jpg
coverImgAlt: Optimera's hackathon dashboard showing slow leaderboard queries, proposed fixes, and a summary chart populated with demo data.
coverImgPosition: center
sitemapImages:
  - /static/blog/hackeurope/optimera-query-fix.jpg
date: 23 February 2026
datePublished: '2026-02-23'
dateModified: '2026-10-27'
template: ../templates/post.html
block: post
---

In February, I took part in [HackEurope](https://www.hackeurope.com/), where we built **Optimera**: a prototype that uses application traces to find slow database calls and asks a coding agent to propose a fix.

The idea came from a familiar problem. You know an application is slow, but finding the query responsible still means moving between telemetry, logs, and source code. We wanted to connect those steps so that a performance problem could arrive with a proposed code change to review.

*Above: the hackathon dashboard. The summary chart and improvement percentage are demo data, not measured performance results. Screenshots from [Axel Dovskog's project page](https://axeldovskog.com/).*

### From a trace to a proposed fix

Our demo application used Express, Prisma, and PostgreSQL. OpenTelemetry recorded its execution, and Jaeger collected the traces. A Django backend scanned them for slow operations, while a React dashboard showed the incidents and suggested changes.

The workflow was:

1. Find a slow trace and identify the slowest instrumented Prisma call within it.
2. Read the source location attached to that call.
3. Give Claude Code the repository and a focused task: improve performance around that location while preserving the output.
4. Commit the proposed change on a separate branch and open a pull request for review.

The dashboard let us inspect the proposal and choose whether to merge or reject it. The agent's output was a candidate fix that still needed review.

### Keeping the source location through async calls

I worked on the tracing and instrumentation that connected database operations back to the application code. A duration tells you where time went, but the agent also needs to know where to start editing.

One awkward detail was Prisma's lazy execution. Calling a Prisma method creates a promise-like object; the query starts when that object is awaited. Capturing context around the initial method call wasn't enough, because that context could be gone by the time the query actually ran.

The prototype wrapped Prisma calls to capture the application stack and the active OpenTelemetry context. It then restored that context when Prisma's promise executed. This let us attach the originating source frame to the query's span, alongside the model, operation, and arguments.

That connection was the useful part: a slow operation could point to a specific place in the repository, instead of leaving the coding agent to search the entire application.

### A concrete example: the leaderboard

The demo included a leaderboard endpoint that first loaded all models, then fetched matches separately for each model. That's an N+1-query pattern: one initial query followed by another for every item.

The generated change below fetched the relevant match fields once and calculated each model's wins and totals in memory. It removed the repeated per-model queries. Loading those matches into memory has its own scaling limit, so this was a concrete optimization to inspect and benchmark, rather than a universal solution.

<figure class="my-8">
  <a href="/static/blog/hackeurope/optimera-query-fix.jpg" aria-label="Open Optimera's generated leaderboard change at full size">
    <img
      src="/static/blog/hackeurope/optimera-query-fix.jpg"
      alt="GitHub diff showing a generated leaderboard fix that replaces a separate match query for each model with one query and aggregation in memory."
      width="609" height="573"
      loading="lazy" decoding="async"
      class="w-full h-auto rounded-lg border border-gray-200">
  </a>
  <figcaption class="mt-3 text-sm text-gray-600">The proposed leaderboard change: fewer database round trips, with the implementation available for review. <a href="/static/blog/hackeurope/optimera-query-fix.jpg">Open the full-size image.</a></figcaption>
</figure>

### Giving the agent a useful starting point

Optimera brought together two pieces: telemetry showing where an application spent time, and a coding agent that could act on that evidence. Getting useful source locations through the instrumentation was what connected them.

For this prototype, we focused on Prisma queries and N+1 patterns. Extending it would mean supporting more libraries and checking proposed changes against both expected behaviour and representative workloads. A pull request makes the suggestion inspectable; tests and measurements are what would give us confidence to ship it.

The [source code is on GitHub](https://github.com/03axdov/HackEurope), and our [original hackathon submission includes the demo](https://devpost.com/software/optimera).

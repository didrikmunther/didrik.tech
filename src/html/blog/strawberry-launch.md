---
title: Building memory and evaluations at Strawberry
description: How I work on AI agent memory and browser-use evaluations at Strawberry to help teams build companions and deploy changes with confidence.
footerColor: bg-blue-800
postTitle: Building memory and evaluations at Strawberry
author: Didrik Munther
authorImg: /static/didrik-closeup.jpg
coverImg: /static/blog/strawberry/strawberry-team.webp
date: 26 October 2026
template: ../templates/post.html
block: post
companions:
  - /static/blog/strawberry/companion-green-seated.webp
  - /static/blog/strawberry/companion-blue-seated.webp
---

At Strawberry, we're building AI companions that are delightful and easy to use for non-technical people. I work on agent behaviour, particularly the memory system and the evaluations we use to test browser use and agent behaviour.

<figure class="my-8">
  <a href="/static/blog/strawberry/strawberry-home.webp" aria-label="View Strawberry's home screen at full size">
    <img
      src="/static/blog/strawberry/strawberry-home.webp"
      alt="Strawberry's home screen, with companions surrounding a chat box and shortcuts to skills, meetings, and apps."
      width="1920" height="1352"
      loading="lazy" decoding="async"
      class="w-full h-auto rounded-lg border border-gray-200">
  </a>
  <figcaption class="mt-3 text-sm text-gray-600">Strawberry's home screen. Open the image for a closer look.</figcaption>
</figure>

### Memory, dreaming, and forgetting

Memory is a big part of making a companion feel easy to work with. Our companions remember your preferences, your workflows, people you work with, and things you do. This lets you be a little more vague when asking for something, without having to explain your entire workflow again.

<figure class="memory-diagram" id="memory-diagram">
  <p class="memory-diagram-heading">How a companion remembers</p>
  <a href="/static/blog/strawberry/strawberry-memory-1.svg" aria-label="Open the full memory diagram">
    <picture>
      <source media="(max-width: 1023px)" srcset="/static/blog/strawberry/strawberry-memory-2.svg" width="261" height="611">
      <img
        src="/static/blog/strawberry/strawberry-memory-1.svg"
        alt="Chats are forked into observations before cache expiry or compaction. Nightly dreaming uses chats and observations, respecting forgotten state, to create a cover for the system prompt. New conversations can also recall chats and observations by text or meaning."
        width="551" height="544" loading="lazy" decoding="async">
    </picture>
  </a>
  <figcaption>The cover provides context at the start of a conversation; recall brings back details when needed. Forgotten observations are marked, and that state carries into dreaming. <a href="/static/blog/strawberry/strawberry-memory-1.svg">Open the full-size diagram.</a></figcaption>
</figure>

Our memory system starts with a database of observations. We create these by forking the user's chat before its cache goes stale or the conversation needs to be compacted. This gives us a separate continuation of the conversation in which to capture observations.

At night, an agent "dreams" over the day's chats and observations, producing a summary we call a cover. We inject this into the system prompt, giving the companion background knowledge it brings into new conversations. This is part of what gives a companion its continuity and "soul."

The observations and original chat transcripts also remain searchable, both by wording and by meaning. The companion can recall details beyond what's included in its cover. Research on [LongMemEval](https://xiaowu0162.github.io/long-mem-eval/) found that compressing conversations into individual facts hurt overall performance through information loss, although it helped multi-session reasoning.

One thing we learned is that giving an agent freedom to organize its own memory files can backfire. In our experiments, the files and memories became bloated, and performance degraded. The models tended to add more text rather than remove it, which made forgetting an essential part of the design. In our system, forgetting means marking an observation as forgotten. That state also carries through into subsequent dreams.

It's tempting to let agents manage all of this themselves. Perhaps they'll become better at it, but today we've found that they need more guidance and constraints to keep their memories useful.

### Evaluating agent behaviour

Another interesting challenge is capability awareness: the agent needs to know about its own settings and features, including how they work together. As we build more functionality, that prompting can become stale or get lost among other instructions.

This is where evaluations, or evals, come in. We build tests around features and combinations of features to check that the agent understands and uses them correctly. That includes everything from spreadsheet tasks and navigating broken websites to using memory across multiple webpages.

The evals have also become useful beyond the agent team. Our go-to-market team builds custom companions for different use cases. Previously, they would build a companion and manually test it, which takes a lot of time. Now they can build several in parallel and benchmark them against expected outcomes using deterministic test data.

### An eval in practice

Here's an example of an eval for Sofia, a support companion. I set up the context she starts with, the world she can interact with, and the task she needs to solve. These excerpts show a few of the pieces; the full configuration is below.

<div class="eval-example">
  <div class="eval-example-heading"><span>Support inbox eval</span><span>TypeScript</span></div>
  <div class="eval-example-tabs" role="tablist" aria-label="Parts of the eval" hidden>
    <button type="button" role="tab" id="eval-context-tab" aria-controls="eval-context" aria-selected="true">Context</button>
    <button type="button" role="tab" id="eval-world-tab" aria-controls="eval-world" aria-selected="false" tabindex="-1">World</button>
    <button type="button" role="tab" id="eval-task-tab" aria-controls="eval-task" aria-selected="false" tabindex="-1">Task</button>
  </div>
  <div id="eval-context" class="eval-example-panel">
    <p class="eval-example-description">Give Sofia a familiar starting point: working files, memories, and previous conversations.</p>

```typescript
browser: {
  profile: {
    name: 'Amira at Pling'
  },
  syncedFs: {
    zipFile: 'workspace.zip'
  },
  memory: seededMemory,
  previousChats
}
```

  </div>
  <div id="eval-world" class="eval-example-panel">
    <p class="eval-example-description">Let Sofia use Slack through the browser or a connector, backed by the same state. Keep search and navigation deterministic.</p>

```typescript
world: EvalWorld.create({
  websites: {
    'pling.slack.com':
      slack.createWebsite('work')
  },
  apps: {
    [GMAIL_APP_ID]:
      gmail.createApp(),
    [SLACK_APP_ID]:
      slack.createApp()
  },
  webSearch: {
    mode: 'deterministic', corpus
  },
  webNavigation: {
    mode: 'deterministic'
  }
})
```

  </div>
  <div id="eval-task" class="eval-example-panel">
    <p class="eval-example-description">Ask Sofia to draft support replies and update the team. A separate model plays Amira, sharing her preferences only when asked.</p>

```typescript
interaction: {
  model: 'gpt-6-luna',
  maxTurns: 4,
  userPersonaAndInformation:
    'You are Amira, ' +
    'a busy co-founder. ' +
    'Reply briefly, only when asked. ' +
    'You want drafts, ' +
    'never sent replies. ' +
    'You approve refunds yourself. ' +
    'You want the team update ' +
    'in #support. ' +
    'Do not volunteer these choices. ' +
    'Facts in the inbox, help center, ' +
    'and team files are for ' +
    'Sofia to discover.'
}
```

  </div>
  <details class="eval-example-full">
    <summary>View full configuration</summary>
    <div class="eval-example-copy" hidden>
      <span role="status" aria-live="polite"></span>
      <button type="button">Copy code</button>
    </div>

```typescript
const gmail = GmailMock.forEval(gmailData)
const slack = SlackMock.forEval(slackData)
const corpus = WebSearchCorpus.fromDirectory(new URL('./web-search', import.meta.url))

export default Eval.create({
  model: 'gpt-6.1-sol',
  reasoningEffort: 'high',
  browser: {
    account: { email: 'amira@strawberry.test', name: 'Amira Haddad' },
    profile: { name: 'Amira at Pling' },
    featureFlags: {
      memorySystem: 'optmem-v1',
      injectPreviousActivity: 'enabled',
      optmemObserver: 'enabled'
    },
    syncedFs: {
      zipFile: 'workspace.zip', // Seed documents, spreadsheets, and other working files.
      mainCompanion: {
        // Installs the current companion's instructions, assigned skills, and files.
        ...(await hireOfficialCompanion('support-sofia')),
        modelScope: 'companion', // Apply model/effort across supported companion modes.
        subagentModel: 'gpt-6-luna' // Independently select delegated children's model.
      }
    },
    teams: [{ name: 'Pling', directory: 'team-pling', zipFile: 'team.zip' }],
    // Timestamped observations, provenance, summary ranges, and shared contributors.
    memory: seededMemory,
    // Prior conversations, relative timestamps, and previous-activity summaries.
    previousChats
  },
  world: EvalWorld.create({
    // Browser and connector access share the same stateful Slack recreation.
    websites: { 'pling.slack.com': slack.createWebsite('work') },
    apps: { [GMAIL_APP_ID]: gmail.createApp(), [SLACK_APP_ID]: slack.createApp() },
    // Public mock pages + local Markdown sources, served at their declared URLs.
    webSearch: { mode: 'deterministic', corpus },
    webNavigation: { mode: 'deterministic' }
    // Search alternatives: 'inject' (seeded + live), 'real' (live only).
    // Navigation alternatives: 'mixed', or 'real' without mounted websites.
  }),
  task: Task.create({
    prompt: 'Get on top of the support inbox, draft replies, and update the team.',
    startUrls: ['https://pling.slack.com/'],
    timeoutMs: 900_000,
    interaction: {
      model: 'gpt-6-luna', // A separate model plays the user.
      maxTurns: 4, // Bounds simulated dialogue, not the companion's tool/model steps.
      userPersonaAndInformation:
        'You are Amira, a busy co-founder. Reply briefly, only when asked. ' +
        'You want drafts, never sent replies. You approve refunds yourself. ' +
        'You want the team update in #support. Do not volunteer these choices. ' +
        'Facts in the inbox, help center, and team files are for Sofia to discover.',
      completionPolicy:
        'Stop once drafts and the team update are saved, or a blocker needs someone else.'
    },
    awaitPreviousActivitySummary: true // Also capture the settled background summary.
  })
})
```

  </details>
</div>

The Slack website and connector share the same state, so the companion can work across both interfaces. A separate model plays the user and is instructed to supply preferences only when asked. That lets the eval include follow-up questions while leaving the companion responsible for finding the facts it needs.

For me, a big benefit is the reduction in cognitive overhead. We can test many things in parallel and catch regressions before deploying changes. That makes it much easier to move quickly and feel confident about what we ship.

What makes this work exciting is seeing people actually use these companions and become more effective. There's so much left to build and figure out. It feels like a new area of software is opening up, and I'm excited to help shape it.

With Strawberry 1.0 now launched, [Retail Technology Innovation Hub has written about what we're building](https://www.retailtechinnovationhub.com/home/2026/10/26/swedish-startup-strawberry-launches-ai-agent-platform-and-preps-series-a-funding-round).

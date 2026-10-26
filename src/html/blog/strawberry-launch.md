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

Memory is a big part of making a companion feel easy to work with. Our companions remember your preferences, your workflows, people you work with, and things you do. They bring that context into new chats and "dream" every night to organize their memories.

This lets you be a little more vague when asking for something. The companion has context to help it figure out what you mean, without you having to explain your entire workflow again.

Another interesting challenge is capability awareness: the agent needs to know about its own settings and features, including how they work together. As we build more functionality, that prompting can become stale or get lost among other instructions.

This is where evaluations, or evals, come in. We build tests around features and combinations of features to check that the agent understands and uses them correctly. That includes everything from spreadsheet tasks and navigating broken websites to using memory across multiple webpages.

The evals have also become useful beyond the agent team. Our go-to-market team builds custom companions for different use cases. Previously, they would build a companion and manually test it, which takes a lot of time. Now they can build several in parallel and benchmark them against expected outcomes using deterministic test data.

For me, a big benefit is the reduction in cognitive overhead. We can test many things in parallel and catch regressions before deploying changes. That makes it much easier to move quickly and feel confident about what we ship.

What makes this work exciting is seeing people actually use these companions and become more effective. There's so much left to build and figure out. It feels like a new area of software is opening up, and I'm excited to help shape it.

With Strawberry 1.0 now launched, [Retail Technology Innovation Hub has written about what we're building](https://www.retailtechinnovationhub.com/home/2026/10/26/swedish-startup-strawberry-launches-ai-agent-platform-and-preps-series-a-funding-round).

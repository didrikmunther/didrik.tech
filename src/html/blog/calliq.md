---
title: 'CalliQ: runner-up at the SSE Business Lab Hackathon'
description: Didrik Munther and Simon Wanna finished runner-up at the SSE Business Lab × Microsoft × KTH AI Society Hackathon with CalliQ, an AI tool that warns people about phone scams during the call.
footerColor: bg-blue-800
postTitle: 'CalliQ: runner-up at the SSE Business Lab Hackathon'
author: Didrik Munther
authorImg: /static/didrik-closeup.jpg
coverImg: /static/blog/calliq/calliq-scam-call-warning.jpg
coverImgAlt: Two CalliQ phone screens, an incoming call from Lotta and an in-call warning not to share bank account details over the phone.
coverImgPosition: center
sitemapImages:
  - /static/blog/calliq/calliq-incoming-call.webp
  - /static/blog/calliq/calliq-scam-warning.webp
date: 13 May 2025
datePublished: '2025-05-13'
dateModified: '2026-10-27'
template: ../templates/post.html
block: post
---

Two weeks of building and countless insights as [Simon Wanna](https://simonwanna.github.io/) and I joined the SSE Business Lab × Microsoft × KTH AI Society Hackathon. We built **CalliQ**: an AI tool that stops fraud attempts in real time.

With more than 250 applications and 14 finalists, we were happy to finish as runner-up and earn a spot in [SSE Business Lab](https://www.hhs.se/community/sse-business-lab/)'s Activate program to keep on building. Activate was designed to help early-stage teams validate and build their business ideas.

### How CalliQ works

CalliQ listens to phone calls in real time. When a caller seems to be attempting a scam, CalliQ warns the person receiving the call while they're still on the line.

We built three views: the caller in a browser, the receiver on a phone, and a dashboard that shows the transcript as it comes in. On stage at Microsoft in Stockholm, we demoed it with a live call between two devices. During a call:

1. The caller's browser records the microphone, downsamples the audio to 16 kHz, and streams it over a WebSocket to our Python backend.
2. The backend connects the caller to an available receiver and transcribes the audio with Azure AI Speech, building up a transcript as the conversation goes on.
3. After each new sentence, an agent built with LangGraph and GPT-4o mini reads the conversation so far and decides whether the receiver is about to be scammed.
4. If so, the agent calls a warning tool with a short explanation, and the backend sends that warning straight to the receiver's phone.

We asked the model to keep its warnings friendly and easy to understand. Instead of a generic alarm, the warning explains what looks risky:

> It's not safe to share your bank account details with anyone over the phone, especially if they are asking for it unexpectedly. This could be a scam.

<figure class="my-8">
  <div class="grid grid-cols-2 gap-4 max-w-lg mx-auto">
    <a href="/static/blog/calliq/calliq-incoming-call.webp" aria-label="Open the incoming call screenshot at full size">
      <img
        src="/static/blog/calliq/calliq-incoming-call.webp"
        alt="CalliQ's receiver view on a phone, showing an incoming call from Lotta with Decline and Accept buttons."
        width="640" height="1025"
        loading="lazy" decoding="async"
        class="w-full h-auto rounded-lg border border-gray-200">
    </a>
    <a href="/static/blog/calliq/calliq-scam-warning.webp" aria-label="Open the scam warning screenshot at full size">
      <img
        src="/static/blog/calliq/calliq-scam-warning.webp"
        alt="CalliQ's in-call view 16 seconds into the call, warning: It's not safe to share your bank account details with anyone over the phone, especially if they are asking for it unexpectedly. This could be a scam."
        width="640" height="1025"
        loading="lazy" decoding="async"
        class="w-full h-auto rounded-lg border border-gray-200">
    </a>
  </div>
  <figcaption class="mt-3 text-sm text-gray-600">The receiver's phone in our prototype: an incoming call, then the warning 16 seconds in. Open a screenshot for a closer look.</figcaption>
</figure>

Big thanks to everyone from SSE Business Lab, Microsoft, and [KTH AI Society](https://kthais.com/) who made this happen. If you're organizing a hackathon, Hugo Mårdh is the one who knows how to make it a success. You can read more about the event and the other finalists in [SSE Business Lab's recap](https://www.linkedin.com/feed/update/urn:li:activity:7328041781772632065/).

Looking forward to the next one. Cheers!

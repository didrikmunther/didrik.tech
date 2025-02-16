---
title: Generact - Generative React Component
footerColor: bg-blue-800
postTitle: Generact - Generative React Component
author: Didrik Munther
authorImg: /static/didrik-closeup.jpg
coverImg: /static/blog/generact/generact.webp
date: 16 February 2025
---
{% extends '../../templates/post.html' %}
{% block title %}
Generact - A generative React component approach
{% endblock %}
{% block post %}
For the February European Builders' League hackathon in Stockholm, I had the opportunity to work on a project of my choice for 48 hours. During the 48 hours, David Stålmarck, Leonid Meledin, Ivan Wely and I built a proof of concept preprocessor for React, exposing the `<Generate>` tag:

```jsx
<Generate>
  a product view of my {products}
  when pressing the "Add to cart", run {onAdd}
</Generate>
```

With static analysis, we can infer the type of `product` and `onAdd` to provide more intelligent code generation. A VSCode extension provides the "Generate" and "Patch" code lenses for each Generate element, allowing for quick prototyping.

<div class="mb-6">
  <video autoplay loop muted playsinline controls class="w-full rounded-lg shadow-lg">
    <source src="/static/blog/generact/generact-demo.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

*Using generated React components to create a shopping page. A Visual Studio Code extension provides code lenses for quick prototyping.* 

### Future work

For a future extension of this proof of concept, I'd like to see it be possible to add arbitrary SQL statements to be executed, e.g.:

```jsx
<Generate>
  when pressing the "Add to cart", execute {sql`INSERT INTO ...`}
</Generate>
```

Thanks to Entrepreneur First, EQT Ventures, Velocity Fellows, Lovable, ElevenLabs, Leya, KTH AI Society, and Wave Ventures for hosting the first stop of the European Builders League.
{% endblock %}
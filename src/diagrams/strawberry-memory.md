# Strawberry memory diagram

The blog uses pre-rendered SVGs so the diagram also works without JavaScript.
The first diagram shows the full data flow. The second is a narrow layout for
small screens, with the same inputs described inside the dreaming and recall nodes.

Regenerate both SVGs with Mermaid CLI 11.12.0:

```sh
mmdc -i src/diagrams/strawberry-memory.md -o .context/strawberry-memory.md -a static/blog/strawberry -b transparent
```

For an existing Chrome installation, pass `-p` with a Puppeteer configuration
containing its `executablePath` (and `args: ["--no-sandbox"]` in this sandbox).

## Wide layout: strawberry-memory-1.svg

```mermaid
---
config:
  theme: base
  look: classic
  layout: dagre
  htmlLabels: false
  themeCSS: 'text { font-family: Arial, sans-serif; } .edgeLabel text { paint-order: stroke; stroke: #ffffff; stroke-width: 6px; stroke-linejoin: round; }'
  themeVariables:
    fontFamily: 'Arial, sans-serif'
    fontSize: 18px
    primaryColor: '#eff6ff'
    primaryTextColor: '#1e293b'
    primaryBorderColor: '#93b4da'
    lineColor: '#64748b'
    edgeLabelBackground: '#ffffff'
  flowchart:
    htmlLabels: false
    curve: linear
    nodeSpacing: 28
    rankSpacing: 40
    padding: 16
    wrappingWidth: 240
---
flowchart TB
  accTitle: How a companion builds memory
  accDescr: User chats are forked into observations before cache expiry or compaction. Nightly dreaming uses chats and observations, respecting forgotten state, to create a cover for the next conversation's system prompt. Chats and observations can also be recalled by text or meaning when needed.

  chats("User chats")
  observations("Observations<br/>Can be marked forgotten")
  dreaming("Nightly dreaming<br/>Respects forgotten state")
  cover("Cover")
  recall("Recall<br/>Text + semantic search")
  nextChat("New conversation")

  chats -->|"Fork before cache expiry<br/>or compaction"| observations
  chats -->|Daily chats| dreaming
  observations --> dreaming
  dreaming --> cover
  cover -->|In the system prompt| nextChat
  chats -.-> recall
  observations -.-> recall
  recall -.->|Details on demand| nextChat

  classDef dreaming fill:#f0fdf4,stroke:#8dbba4,color:#1e4332
  classDef recall fill:#f8fafc,stroke:#94a3b8,color:#334155
  classDef conversation fill:#2c5282,stroke:#2c5282,color:#ffffff
  class dreaming,cover dreaming
  class recall recall
  class nextChat conversation
```

## Narrow layout: strawberry-memory-2.svg

```mermaid
---
config:
  theme: base
  look: classic
  layout: dagre
  htmlLabels: false
  themeCSS: 'text { font-family: Arial, sans-serif; } .edgeLabel text { paint-order: stroke; stroke: #ffffff; stroke-width: 6px; stroke-linejoin: round; }'
  themeVariables:
    fontFamily: 'Arial, sans-serif'
    fontSize: 18px
    primaryColor: '#eff6ff'
    primaryTextColor: '#1e293b'
    primaryBorderColor: '#93b4da'
    lineColor: '#64748b'
    edgeLabelBackground: '#ffffff'
  flowchart:
    htmlLabels: false
    curve: linear
    rankSpacing: 32
    padding: 12
    wrappingWidth: 240
---
flowchart TB
  accTitle: How a companion builds memory
  accDescr: A compact view of the same process: chats produce observations, nightly dreaming uses chats and observations with forgotten state to create a cover in the system prompt, and new conversations can recall chats and observations by text or meaning.

  chats("User chats")
  observations("Observations<br/>Can be marked forgotten")
  dreaming("Nightly dreaming<br/>Daily chats + observations<br/>Respects forgotten state")
  cover("Cover")
  nextChat("New conversation")
  recall("Recall chats + observations<br/>Text + semantic search")

  chats -->|"Fork before cache expiry<br/>or compaction"| observations
  observations --> dreaming
  dreaming --> cover
  cover -->|In the system prompt| nextChat
  nextChat <-.->|On demand| recall

  classDef dreaming fill:#f0fdf4,stroke:#8dbba4,color:#1e4332
  classDef recall fill:#f8fafc,stroke:#94a3b8,color:#334155
  classDef conversation fill:#2c5282,stroke:#2c5282,color:#ffffff
  class dreaming,cover dreaming
  class recall recall
  class nextChat conversation
```

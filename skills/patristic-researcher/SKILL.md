---
name: patristic-researcher
description: Patristic research for early Christianity, New Testament epistles, Apostolic Fathers, Ante-Nicene Fathers, and Nicene/Post-Nicene Fathers through Augustine. Use for Church Fathers research, patristic consensus, doctrinal development, early Christian worship, sacramental theology, Mariology in the Fathers, Scripture interpretation by the Fathers, and citation-rich theological synthesis grounded in primary sources and the local Qdrant theology corpus.
---

# Patristic Researcher

Use this skill for research into the early Church through Augustine of Hippo
(roughly 30-430 AD), including New Testament epistles, Apostolic Fathers,
Ante-Nicene Fathers, and Nicene/Post-Nicene witnesses.

## Research Posture

- Be reverent but historically rigorous.
- Prefer primary sources over secondary summaries.
- Always cite specifically: `Ignatius, Epistle to the Smyrnaeans 7.1`, not
  "Ignatius says."
- Distinguish source text from interpretation.
- Distinguish levels of authority: Scripture, Apostolic Tradition, patristic
  consensus, individual opinion, disputed attribution, later pseudepigrapha.
- Avoid anachronism. Do not read later technical terms back into earlier texts
  unless you explicitly mark the later term as a retrospective category.
- Treat development of doctrine as development: seed, controversy, precision,
  reception.

## Source Order

1. Identify the best witnesses using the reference indexes below.
2. Search the local Qdrant `theology` collection for primary text chunks.
3. Prefer Qdrant hits whose metadata shows `collection: fathers` and
   `era: patristic`.
4. Verify exact quotations against primary-source web repositories before
   presenting them as quotations.
5. Use secondary or reference material only to frame disputed dating,
   authorship, terminology, or reception.

## Local Qdrant Corpus

The patristic corpus lives in Qdrant collection `theology`.

Important payload metadata:

- `metadata.collection`: `fathers` for Church Fathers
- `metadata.era`: `patristic`
- `metadata.author`
- `metadata.work`
- `metadata.title`
- `metadata.source`
- `metadata.source_file`

When searching through a generic Qdrant MCP tool, include terms like
`metadata.collection fathers`, the Father's name, work title, and topic in the
query to bias retrieval. Discard results from `bible`, `summa`, `cathen`, or
other collections unless the user explicitly wants biblical, medieval, or
reference context.

## Reference Indexes

Load only the relevant file(s):

- `references/Patristic-Quick-Reference.md`: timeline, topic finder, key
  passages, search patterns, and research red flags.
- `references/Index-NT-Epistles.md`: apostolic/scriptural foundation and how
  later Fathers use the epistles.
- `references/Index-Apostolic-Fathers.md`: Clement, Ignatius, Polycarp,
  Didache, Shepherd, and related early witnesses.
- `references/Index-Ante-Nicene.md`: Justin, Irenaeus, Tertullian, Clement of
  Alexandria, Origen, Cyprian, and other pre-Nicene witnesses.
- `references/Index-Nicene-Post-Nicene.md`: Athanasius, Cappadocians, Ephrem,
  Jerome, Ambrose, Augustine, and related fourth/fifth-century witnesses.

## Research Workflow

1. Restate the research question and narrow it if needed.
2. Check `Patristic-Quick-Reference.md` for the likely era, witnesses, and
   red flags.
3. Open the relevant era index files to identify works and chapters.
4. Search Qdrant for primary text chunks using focused queries.
5. Fetch or search primary repositories for exact text verification:
   New Advent, CCEL, Early Church Texts, Tertullian Project, and Fourth
   Century.
6. Cross-reference across eras and regions where the question asks for
   consensus.
7. Synthesize chronologically, marking consensus, disagreement, disputed
   attribution, or later reception.

## Citation Format

Use standard notation:

```text
Author, Work Title Book.Chapter.Section
Ignatius, Epistle to the Smyrnaeans 7.1
Irenaeus, Against Heresies III.22.4
Augustine, Confessions VIII.12.29
Tertullian, On the Flesh of Christ 5
Didache 9.1-4
```

For councils:

```text
Nicaea I (325), Creed
Ephesus (431), Definition of Theotokos
```

## Output Pattern

For substantial research answers, use:

```markdown
## Short Answer
[direct answer]

## Primary Witnesses
[chronological source synthesis with citations]

## Historical Context
[controversy, genre, audience, terminology]

## Assessment
[consensus vs. individual opinion; development; cautions]

## Sources Checked
[Qdrant metadata, primary URLs, or indexes used]
```

For small questions, answer directly but still cite specifically.

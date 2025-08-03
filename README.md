# Wordget

https://wordget.app

Wordget is a vibe-coded Wordle clone that works offline and allows you to do infinte puzzles every day.

It was built almost entirely with the Qwen-3-Coder-480B model via Cerebras using Cline to drive all incremental edit tasks.

I manually checkpointed commits after each incremental task.

---

This uses bun!

https://bun.sh

```
bun run dev
```

For the dev server (the file serving stuff is a bit jank).

---

NOTE: pushes to main deploy https://wordget.app to Netlify!

If you need to cache-bust the service worker, you will likely want to update the version in `sw.js` and may need to fiddle to ensure your browser pick up the latest changes.

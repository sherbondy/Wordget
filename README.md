![Wordget Icon Vibe-Coded SVG also created by Qwen](https://raw.githubusercontent.com/sherbondy/Wordget/refs/heads/main/icon.svg "Wordget (Icon Vibe-Coded SVG also created by Qwen)")

# Wordget

https://wordget.app

Wordget is a vibe-coded Wordle clone that works offline and allows you to do infinte puzzles every day.

It was built almost entirely with the Qwen-3-Coder-480B model via Cerebras using Cline to drive all incremental edit tasks.

I manually checkpointed commits after each incremental task.

---

Demo Video:

https://youtu.be/cQOdyUETQc4

---

This uses bun!

https://bun.sh

Run locally on dev server:
```
bun run dev
```

(the file serving stuff is a bit jank, and Qwen still needs to fix cache-busting behavior for the service worker after updates).


Run the test suite:
```
bun run test
```

Build all the necessary files for static distribution into `dist`:

```
bun run build
```


---

NOTE: pushes to main deploy https://wordget.app to Netlify!

If you need to cache-bust the service worker, you will likely want to update the version in `sw.js` and may need to fiddle to ensure your browser pick up the latest changes.

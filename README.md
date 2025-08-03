This uses bun!

https://bun.sh

```
bun run dev
```

For dev server (a bit jank).


NOTE: pushes to main deploy https://wordget.app to netlify!

If you need to cache-bust the service worker, you will likely want to update the version in `sw.js` and may need to fiddle to ensure your browser pick up the latest changes.

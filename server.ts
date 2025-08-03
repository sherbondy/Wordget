import { serve } from "bun";
const gitSha = (await Bun.$`git rev-parse HEAD`.text()).trim();

const server = serve({
  port: 3000,
  fetch: async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Serve the service worker file directly
    if (pathname === "/sw.js") {
      return new Response(Bun.file("./sw.js"));
    }
    
    // Serve other static files from the src directory
    if (pathname === "/" || pathname === "/index.html") {
      let html = await Bun.file("./src/index.html").text();
      html = html.replace(/REPLACE_WITH_GIT_SHA/g, gitSha);
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    if (pathname === "/style.css") {
      return new Response(Bun.file("./src/style.css"));
    }
    
    if (pathname === "/manifest.json") {
      return new Response(Bun.file("./src/manifest.json"));
    }
    
    if (pathname === "/icon.svg") {
      return new Response(Bun.file("./icon.svg"));
    }
    
    if (pathname === "/index.ts" || pathname === "/index.js") {
      // Serve the compiled JavaScript file
      return new Response(Bun.file("./dist/index.js"), {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    
    // For any other path, serve index.html (for client-side routing)
    return new Response(Bun.file("./src/index.html"));
  },
});

console.log(`Server running at http://localhost:${server.port}/`);

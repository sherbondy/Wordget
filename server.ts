import { serve } from "bun";

const server = serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Serve the service worker file directly
    if (pathname === "/sw.js") {
      return new Response(Bun.file("./sw.js"));
    }
    
    // Serve other static files from the src directory
    if (pathname === "/" || pathname === "/index.html") {
      return new Response(Bun.file("./src/index.html"));
    }
    
    if (pathname === "/style.css") {
      return new Response(Bun.file("./src/style.css"));
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

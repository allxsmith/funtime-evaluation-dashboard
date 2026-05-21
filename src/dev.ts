import index from "../index.html";

const server = Bun.serve({
  port: Number(process.env.PORT ?? 5173),
  development: true,
  routes: {
    "/*": index,
  },
});

console.log(`Dev server: ${server.url}`);

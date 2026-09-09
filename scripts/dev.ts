// Cross-platform dev runner with unified root cwd (eliminates out-of-boundary watcher warnings)
Bun.spawnSync(['bun', 'run', 'build'], { stdout: 'inherit', stderr: 'inherit' });

const web = Bun.spawn(
  ['bun', 'build', './apps/web/src/index.tsx', '--outdir', './apps/web/dist', '--target', 'browser', '--watch'],
  { stdout: 'inherit', stderr: 'inherit' }
);

const server = Bun.spawn(
  ['bun', '--watch', 'apps/server/src/index.ts'],
  { stdout: 'inherit', stderr: 'inherit' }
);

function cleanup() {
  web.kill();
  server.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

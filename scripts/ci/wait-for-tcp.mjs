#!/usr/bin/env node
/**
 * Wait until a TCP host:port accepts connections (CI safety net alongside
 * GitHub Actions service health checks).
 *
 * Usage: node scripts/ci/wait-for-tcp.mjs [host] [port] [timeoutSeconds]
 */
import net from "node:net";

const host = process.argv[2] ?? "127.0.0.1";
const port = Number(process.argv[3] ?? "5432");
const timeoutSec = Number(process.argv[4] ?? "60");
const deadline = Date.now() + timeoutSec * 1000;

function tryConnect() {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host, () => {
      socket.end();
      resolve(undefined);
    });
    socket.setTimeout(2000, () => {
      socket.destroy();
      reject(new Error("connect timeout"));
    });
    socket.on("error", reject);
  });
}

async function main() {
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    try {
      await tryConnect();
      console.log(`wait-for-tcp: ${host}:${port} ready (attempt ${attempt})`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.error(`wait-for-tcp: timeout after ${timeoutSec}s waiting for ${host}:${port}`);
  process.exit(1);
}

main();

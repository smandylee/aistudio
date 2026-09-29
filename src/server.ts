import "dotenv/config";
import http from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { TEAM, findMember } from "./members.js";
import { postAsMember } from "./post.js";

// The team server. Whoever leads the team (Shiro) hands work over HTTP:
//
//   GET  /members             who is on the team and what they do
//   POST /tasks               { member, task, threadId? } -> 202 { id }
//   GET  /tasks/:id?wait=25   the result, waiting up to `wait` seconds for it
//
// A task runs in the background and posts its result into the Discord thread
// itself, so a slow writer never has to hold one HTTP request open for minutes.

const TOKEN = process.env.TEAM_SERVER_TOKEN;
// Fail closed: without a token anyone who can reach the port could spend on Vertex.
if (!TOKEN) throw new Error("TEAM_SERVER_TOKEN is not set");
const HOST = process.env.TEAM_SERVER_HOST ?? "127.0.0.1";
const PORT = Number(process.env.TEAM_SERVER_PORT ?? 18791);

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_TASK_CHARS = 50_000;
const MAX_WAIT_SECONDS = 60;
const KEEP_FINISHED_MS = 60 * 60 * 1000;

type Job = {
  id: string;
  member: string;
  status: "running" | "done" | "failed";
  text?: string;
  images?: number;
  error?: string;
  finished: Promise<void>;
};

const jobs = new Map<string, Job>();

function startJob(memberId: string, task: string, threadId: string | undefined): Job {
  const member = findMember(memberId)!;
  const job = { id: randomUUID(), member: member.id, status: "running" } as Job;
  const started = Date.now();
  console.log(`[task ${job.id.slice(0, 8)}] ${member.id} <- ${task.slice(0, 120).replace(/\n/g, " ")}`);

  job.finished = (async () => {
    try {
      const result = await member.run(task);
      job.status = "done";
      job.text = result.text;
      job.images = result.images.length;
      if (threadId) {
        await postAsMember(threadId, member, result.text, result.images).catch((err) => {
          console.error(`[task ${job.id.slice(0, 8)}] failed to post:`, err);
        });
      }
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : String(err);
      console.error(`[task ${job.id.slice(0, 8)}] ${member.id} failed:`, err);
      if (threadId) await postAsMember(threadId, member, "⚠️ 작업하다 오류가 나서 못 끝냈어.").catch(() => {});
    }
    console.log(`[task ${job.id.slice(0, 8)}] ${member.id} ${job.status} in ${Math.round((Date.now() - started) / 1000)}s`);
    setTimeout(() => jobs.delete(job.id), KEEP_FINISHED_MS).unref();
  })();

  jobs.set(job.id, job);
  return job;
}

function authorized(req: http.IncomingMessage): boolean {
  const given = Buffer.from(req.headers.authorization ?? "");
  const expected = Buffer.from(`Bearer ${TOKEN}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function send(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("body too large");
    chunks.push(chunk);
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  if (typeof parsed !== "object" || parsed === null) throw new Error("body must be a JSON object");
  return parsed;
}

function view(job: Job) {
  const { finished: _, ...rest } = job;
  return rest;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
  if (!authorized(req)) return send(res, 401, { error: "unauthorized" });

  if (req.method === "GET" && url.pathname === "/members") {
    return send(res, 200, TEAM.map(({ id, name, role }) => ({ id, name, role })));
  }

  if (req.method === "POST" && url.pathname === "/tasks") {
    let body;
    try {
      body = await readJson(req);
    } catch (err) {
      return send(res, 400, { error: err instanceof Error ? err.message : "bad body" });
    }
    const member = typeof body.member === "string" ? body.member : "";
    const task = typeof body.task === "string" ? body.task.trim() : "";
    const threadId = typeof body.threadId === "string" && /^\d+$/.test(body.threadId) ? body.threadId : undefined;
    if (!findMember(member)) return send(res, 400, { error: `unknown member: ${member}`, members: TEAM.map((m) => m.id) });
    if (!task) return send(res, 400, { error: "task is empty" });
    if (task.length > MAX_TASK_CHARS) return send(res, 400, { error: `task is over ${MAX_TASK_CHARS} characters` });
    return send(res, 202, view(startJob(member, task, threadId)));
  }

  const match = url.pathname.match(/^\/tasks\/([0-9a-f-]{36})$/);
  if (req.method === "GET" && match) {
    const job = jobs.get(match[1]);
    if (!job) return send(res, 404, { error: "no such task (finished tasks are kept for an hour)" });
    const wait = Math.min(Math.max(Number(url.searchParams.get("wait") ?? 0), 0), MAX_WAIT_SECONDS);
    if (job.status === "running" && wait > 0) {
      await Promise.race([job.finished, new Promise((r) => setTimeout(r, wait * 1000))]);
    }
    return send(res, 200, view(job));
  }

  return send(res, 404, { error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`team server on http://${HOST}:${PORT} · members: ${TEAM.map((m) => m.id).join(", ")}`);
});

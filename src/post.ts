import { AttachmentBuilder, WebhookClient } from "discord.js";
import type { TeamImage, TeamMember } from "./members.js";

// Teammates speak in the team channel's threads through one webhook, each
// under their own name and picture. The webhook URL is all it takes: the team
// server has no bot account of its own.

const url = process.env.TEAM_WEBHOOK_URL;
const webhook = url ? new WebhookClient({ url }) : null;
if (!webhook) console.warn("[post] TEAM_WEBHOOK_URL is not set: results are returned but not posted");

// Discord caps a message at 2000 characters; cut on line breaks where possible.
function chunk(text: string, size = 1900): string[] {
  const parts: string[] = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf("\n", size);
    if (cut < size / 2) cut = size;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  if (rest) parts.push(rest);
  return parts;
}

function extension(mimeType: string): string {
  const sub = mimeType.split("/")[1] ?? "png";
  return sub === "jpeg" ? "jpg" : sub;
}

/** Posts a teammate's result into a thread under their name; images go with the last message. */
export async function postAsMember(threadId: string, member: TeamMember, text: string, images: TeamImage[] = []): Promise<void> {
  if (!webhook) return;
  const identity = { username: member.name, avatarURL: member.avatar, threadId };
  const files = images.map((img, n) => new AttachmentBuilder(img.data, { name: `${member.id}-${n + 1}.${extension(img.mimeType)}` }));
  const parts = chunk(text);
  if (parts.length === 0) parts.push("");

  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1;
    await webhook.send({ ...identity, content: parts[i] || undefined, files: last ? files : [] });
  }
}

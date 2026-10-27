import { openDB } from "idb";
import { z } from "zod";
import { CLASSES, EQUIPMENT, TRAITS } from "../data/catalog";
import type { Guild } from "../domain/types";
const integer = (min: number, max: number) =>
  z.number().int().min(min).max(max);
const known = (catalog: object) =>
  z.string().refine((s) => Object.hasOwn(catalog, s), "알 수 없는 데이터 ID");
const mercSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(20),
  gender: z.enum(["male", "female"]),
  race: z.enum(["human", "elf", "dwarf"]),
  classId: z.enum([
    "warrior",
    "archer",
    "mage",
    "priest",
    "rogue",
    "lancer",
    "guardian",
    "bard",
  ]),
  level: integer(1, 50),
  xp: integer(0, 1999),
  talent: integer(1, 5),
  potential: integer(1, 5),
  traitId: known(TRAITS),
  appearanceSeed: z.string().max(120),
  appearance: z.object({
    hairStyle: integer(0, 3),
    hairColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    skinColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    bodyType: integer(0, 2),
  }),
  equipment: z.object({ weapon: known(EQUIPMENT), armor: known(EQUIPMENT) }),
  story: z.enum(["hero", "ria"]).optional(),
});
const guildSchema = z.object({
  name: z.string().min(1).max(30),
  gold: integer(0, 1_000_000_000),
  roster: z.array(mercSchema).min(1).max(24),
  candidates: z.array(mercSchema).max(6),
  party: z.array(z.string()).min(1).max(4),
  recruitBatch: integer(0, 1_000_000),
  victories: integer(0, 1_000_000),
});
const saveSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().datetime(),
  state: guildSchema,
});
export function encodeSave(guild: Guild) {
  return JSON.stringify(
    { version: 1, savedAt: new Date().toISOString(), state: guild },
    null,
    2,
  );
}
export function decodeSave(raw: unknown): Guild {
  const input = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (input?.version !== 1)
    throw Error("지원하지 않는 세이브 버전입니다. 원본 파일을 보관해 주세요.");
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success)
    throw Error("세이브 데이터가 손상되었거나 형식이 올바르지 않습니다.");
  const g = parsed.data.state;
  const ids = [...g.roster, ...g.candidates].map((m) => m.id);
  if (
    new Set(ids).size !== ids.length ||
    new Set(g.party).size !== g.party.length ||
    g.party.some((id) => !g.roster.some((m) => m.id === id))
  )
    throw Error("세이브의 용병 또는 파티 참조가 올바르지 않습니다.");
  if (
    [...g.roster, ...g.candidates].some(
      (m) =>
        !CLASSES[m.classId] ||
        (m.level < 50 && m.xp >= m.level * 40) ||
        (m.level === 50 && m.xp !== 0),
    )
  )
    throw Error("세이브의 성장 정보가 올바르지 않습니다.");
  return g;
}
const database = () =>
  openDB("outcast-guild", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("saves")) db.createObjectStore("saves");
    },
  });
let queue: Promise<void> = Promise.resolve();
export function writeSave(guild: Guild) {
  const raw = encodeSave(guild);
  decodeSave(raw);
  const write = async () => {
    const db = await database();
    try {
      await db.put("saves", raw, "main");
    } finally {
      db.close();
    }
  };
  const next = queue.catch(() => {}).then(write);
  queue = next;
  return next;
}
export async function readSave(): Promise<Guild | null> {
  await queue.catch(() => {});
  const db = await database();
  try {
    const raw = await db.get("saves", "main");
    return raw === undefined ? null : decodeSave(raw);
  } finally {
    db.close();
  }
}

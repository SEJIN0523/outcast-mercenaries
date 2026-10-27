import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { CLASSES, EQUIPMENT, RACES, TRAITS } from "../data/catalog";
import { recruitCost, statsOf, xpNeeded } from "../domain/characters";
import type { Mercenary } from "../domain/types";
import { encodeSave } from "../persistence/save";
import { portrait } from "../render/sprite";
import { store } from "../state/store";
import { GameCanvas } from "./GameCanvas";

type Tab = "headquarters" | "roster" | "recruit" | "quest";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const tabs: { id: Tab; label: string; icon: string; en: string }[] = [
  { id: "headquarters", label: "용병단 본부", icon: "⌂", en: "HEADQUARTERS" },
  { id: "roster", label: "용병 명부", icon: "♜", en: "MERCENARIES" },
  { id: "recruit", label: "모집소", icon: "⚑", en: "RECRUITMENT" },
  { id: "quest", label: "의뢰 게시판", icon: "⚔", en: "QUEST BOARD" },
];
function Sprite({ m, large = false }: { m: Mercenary; large?: boolean }) {
  return (
    <img
      className={`sprite ${large ? "large" : ""}`}
      src={portrait(m)}
      alt={`${m.name}의 ${CLASSES[m.classId].name} 임시 픽셀 외형`}
    />
  );
}
function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} / 5`}>
      {"★".repeat(n)}
      <span>{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function App() {
  const s = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { guild, battle } = s;
  const [tab, setTab] = useState<Tab>("headquarters");
  const [selected, setSelected] = useState<string>("hero");
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(
    window.matchMedia("(display-mode: standalone)").matches,
  );
  const [backupOpen, setBackupOpen] = useState(false);
  const [confirmLoad, setConfirmLoad] = useState(false);
  const [importRaw, setImportRaw] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    void store.init();
    const timer = setInterval(store.tick, 700);
    const listen = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const installed = () => {
      setInstall(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", listen);
    window.addEventListener("appinstalled", installed);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeinstallprompt", listen);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  const m =
    guild.roster.find((m) => m.id === selected) ??
    guild.candidates.find((m) => m.id === selected) ??
    guild.roster[0];
  const busy = !!battle || !s.loaded;
  const party = guild.party.map((id) => guild.roster.find((m) => m.id === id)!);
  const details = (merc: Mercenary) => setSelected(merc.id);
  const openTab = (id: Tab) => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setTab(id);
    setSelected(
      id === "recruit" ? (guild.candidates[0]?.id ?? "hero") : "hero",
    );
  };
  async function installApp() {
    if (install) {
      await install.prompt();
      if ((await install.userChoice).outcome === "accepted") setInstall(null);
    } else
      store.notify(
        standalone
          ? "이미 앱으로 실행 중입니다."
          : "Android Chrome에서 HTTPS 주소로 접속한 후 브라우저 메뉴의 「앱 설치 / 홈 화면에 추가」를 이용하세요.",
      );
  }
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([encodeSave(guild)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `outcast-guild-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    store.notify("용병단 백업 파일을 내보냈습니다.");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#main" className="skip">
          본문으로 이동
        </a>
        <div className="brand">
          <div className="crest">✦</div>
          <span>
            OUTCAST
            <br />
            <b>MERCENARIES</b>
          </span>
        </div>
        <div className="side-caption">THE FIRST CHAPTER</div>
        <h1>
          이세계 낙오자의
          <br />
          <em>용병단</em>
        </h1>
        <div className="side-rule" />
        <nav aria-label="게임 메뉴">
          {tabs.map((t) => (
            <button
              aria-label={t.label}
              key={t.id}
              className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => openTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span>
                {t.label}
                <small>{t.en}</small>
              </span>
              {t.id === "recruit" && <i>{guild.candidates.length}</i>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="chapter-label">PROLOGUE · 추방된 자의 새벽</div>
          <p>
            세상이 알아보지 못한 가능성,
            <br />
            당신의 눈에는 보인다.
          </p>
          <div className="local-dot">
            로컬 싱글플레이 <span>v0.1 MVP</span>
          </div>
        </div>
      </aside>
      <main id="main">
        <header className="topbar">
          <div className="breadcrumb">
            여명의 변경 <span>/</span> {tabs.find((t) => t.id === tab)?.label}
          </div>
          <div className="resources">
            <span className="gold">
              ◈ <b>{guild.gold.toLocaleString()}</b> <small>G</small>
            </span>
            <span>
              ♜ <b>{guild.roster.length}</b>
              <small>/ 24</small>
            </span>
            <button
              className="icon-btn"
              onClick={() => setBackupOpen(!backupOpen)}
              aria-label="저장 및 백업 메뉴"
            >
              ⚙
            </button>
          </div>
        </header>
        <div className="content">
          <p className="orientation-hint">
            ↻ 휴대폰을 가로로 돌리면 본부와 용병 정보를 함께 볼 수 있어요.
          </p>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {tab === "headquarters"
                  ? "A NEW BEGINNING"
                  : tabs.find((t) => t.id === tab)?.en}
              </span>
              <h2>
                {tab === "headquarters"
                  ? "돌아오셨군요, 단장님."
                  : tabs.find((t) => t.id === tab)?.label}
                <span className="diamond"> ✧</span>
              </h2>
              <p>
                {tab === "headquarters"
                  ? "작은 발걸음이 모여, 우리만의 전설이 됩니다."
                  : tab === "recruit"
                    ? "아직 발견되지 않은 재능이 당신을 기다립니다."
                    : tab === "roster"
                      ? "서로 다른 가능성, 하나의 깃발 아래."
                      : "깃발을 올리세요. 숲 너머에 첫 모험이 기다립니다."}
              </p>
            </div>
            <div className="day-tag">
              <span>용병단 기록</span>
              <b>
                {String(guild.victories).padStart(2, "0")}{" "}
                <small>의뢰 완료</small>
              </b>
            </div>
          </div>
          {backupOpen && (
            <section className="save-panel panel">
              <div>
                <b>용병단 기록 보관함</b>
                <p>기기·브라우저별 저장입니다. 백업 파일을 따로 보관하세요.</p>
              </div>
              <button onClick={() => void store.save()} disabled={!s.loaded}>
                지금 저장
              </button>
              <button onClick={() => setConfirmLoad(true)} disabled={busy}>
                불러오기
              </button>
              <button onClick={exportBackup} disabled={!s.loaded}>
                백업 내보내기
              </button>
              <button onClick={() => fileRef.current?.click()} disabled={busy}>
                백업 복원
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 1_000_000)
                      store.notify("1MB 이하의 세이브 파일을 선택해 주세요.");
                    else setImportRaw(await f.text());
                  }
                  e.target.value = "";
                }}
              />
            </section>
          )}
          <section className={`scene-panel ${battle ? "in-battle" : ""}`}>
            <GameCanvas />
            <div className="scene-top">
              <span className="location">
                <i />{" "}
                {battle
                  ? "속삭임의 숲 · 고블린 토벌"
                  : "새벽의 여명 · 용병단 본부"}
              </span>
              <span className="weather">☽ 맑은 저녁</span>
            </div>
            {!battle && (
              <div className="scene-caption">
                <span>OUR LITTLE SANCTUARY</span>
                <h3>이곳에서 다시 시작해요.</h3>
                <p>왕국 밖 낡은 여관, 그리고 새로운 동료들.</p>
              </div>
            )}
            <span className="scene-label">
              {battle
                ? `TURN ${String(battle.tick).padStart(2, "0")}`
                : "BORDERLANDS · 01"}
            </span>
          </section>
          {battle ? (
            <section className="battle-panel panel">
              <div className="section-title">
                <div>
                  <span className="eyebrow">GOBLIN HUNT</span>
                  <h3>
                    {battle.status === "active"
                      ? "고블린 토벌 진행 중"
                      : battle.status === "victory"
                        ? "의뢰를 완수했습니다!"
                        : "안전하게 철수했습니다"}
                  </h3>
                </div>
                {battle.status === "active" ? (
                  <button
                    className="primary"
                    onClick={store.focus}
                    disabled={battle.cooldown > 0}
                  >
                    ✦ 집중 공격{" "}
                    {battle.cooldown > 0 ? `(${battle.cooldown}턴)` : "발동"}
                  </button>
                ) : (
                  <button className="primary" onClick={store.returnHome}>
                    본부로 복귀 →
                  </button>
                )}
              </div>
              <div className="battle-health">
                {battle.units.map((u) => (
                  <div key={u.id} className={u.side}>
                    <span>{u.name}</span>
                    <b>
                      {u.hp} / {u.maxHp}
                    </b>
                    <progress max={u.maxHp} value={u.hp} />
                  </div>
                ))}
              </div>
              <div className="battle-summary">
                {battle.status === "active"
                  ? "자동전투 · 집중 공격은 첫 생존 아군의 공격력 180%로 적 하나를 공격합니다."
                  : battle.status === "victory"
                    ? "보상 지급 완료 · 120 G · 출전자 각각 경험치 +55 · 체력은 다음 출전 시 회복됩니다."
                    : "획득 보상 없음 · 용병을 모집하거나 파티를 보강해 다시 도전하세요."}
              </div>
              <div className="battle-log" aria-label="전투 기록">
                {battle.logs.slice(-5).map((line, i) => (
                  <p key={`${battle.tick}-${i}`}>{line}</p>
                ))}
              </div>
            </section>
          ) : (
            <div className="workspace">
              <div className="primary-column">
                {tab === "headquarters" && (
                  <>
                    <section className="panel party-panel">
                      <div className="section-title">
                        <div>
                          <span className="eyebrow">YOUR COMPANIONS</span>
                          <h3>
                            출전 파티 <span>{guild.party.length} / 4</span>
                          </h3>
                        </div>
                        <button
                          className="text-btn"
                          onClick={() => openTab("roster")}
                        >
                          편성 관리 ↗
                        </button>
                      </div>
                      <div className="party-grid">
                        {Array.from({ length: 4 }, (_, i) =>
                          party[i] ? (
                            <button
                              className={`party-card ${m.id === party[i].id ? "selected" : ""}`}
                              key={party[i].id}
                              onClick={() => details(party[i])}
                            >
                              <span className="slot-number">0{i + 1}</span>
                              <div className="portrait-stage">
                                <Sprite m={party[i]} />
                              </div>
                              <b>{party[i].name}</b>
                              <small>
                                {CLASSES[party[i].classId].name}{" "}
                                <span>Lv.{party[i].level}</span>
                              </small>
                              <div className="xp-track">
                                <i
                                  style={{
                                    width: `${(party[i].xp / xpNeeded(party[i].level)) * 100}%`,
                                  }}
                                />
                              </div>
                            </button>
                          ) : (
                            <button
                              className="party-card empty"
                              key={i}
                              onClick={() => openTab("roster")}
                            >
                              <span>＋</span>
                              <b>빈 자리</b>
                              <small>동료를 편성하세요</small>
                            </button>
                          ),
                        )}
                      </div>
                      <div className="panel-foot">
                        <span className="green-dot" /> 출전 준비 완료{" "}
                        <small>
                          전투는 자동으로, 결정적인 순간은 당신의 손으로.
                        </small>
                      </div>
                    </section>
                    <QuestCard onStart={store.start} disabled={busy} />
                  </>
                )}
                {tab === "quest" && (
                  <>
                    <QuestCard onStart={store.start} disabled={busy} />
                    <section className="panel story-note">
                      <span className="eyebrow">THE ROAD AHEAD</span>
                      <h3>아직, 이야기는 시작에 불과합니다.</h3>
                      <p>
                        지금은 숲의 고블린 토벌 의뢰에 도전할 수 있습니다.
                        <br />
                        새로운 지역과 귀환의 단서는 다음 장에서 이어집니다.
                      </p>
                      <span className="muted">
                        탐험 · 스토리 의뢰 · 전직은 추후 추가 예정
                      </span>
                    </section>
                  </>
                )}
                {(tab === "roster" || tab === "recruit") && (
                  <section className="panel list-panel">
                    <div className="section-title">
                      <div>
                        <span className="eyebrow">
                          {tab === "recruit"
                            ? "NEW POSSIBILITIES"
                            : "UNDER ONE BANNER"}
                        </span>
                        <h3>
                          {tab === "recruit"
                            ? "오늘의 지원자"
                            : "우리의 동료들"}{" "}
                          <span>
                            {tab === "recruit"
                              ? guild.candidates.length
                              : guild.roster.length}
                            명
                          </span>
                        </h3>
                      </div>
                      {tab === "recruit" && (
                        <button
                          className="text-btn"
                          disabled={busy}
                          onClick={store.refresh}
                        >
                          ↻ 새 지원자 · 무료
                        </button>
                      )}
                    </div>
                    <div className="merc-list">
                      {(tab === "recruit"
                        ? guild.candidates
                        : guild.roster
                      ).map((c) => (
                        <article
                          className={`merc-row ${m.id === c.id ? "selected" : ""}`}
                          key={c.id}
                        >
                          <button
                            className="merc-select"
                            onClick={() => details(c)}
                            aria-label={`${c.name} 정보 확인`}
                          >
                            <div className="mini-stage">
                              <Sprite m={c} />
                            </div>
                            <div>
                              <b>
                                {c.name}{" "}
                                {c.story && (
                                  <span className="fixed-tag">
                                    {c.story === "hero" ? "단장" : "동료"}
                                  </span>
                                )}
                              </b>
                              <small>
                                {RACES[c.race]} ·{" "}
                                {c.gender === "female" ? "여" : "남"} ·{" "}
                                {CLASSES[c.classId].name} · Lv.{c.level}
                              </small>
                              <Stars n={c.talent} />
                            </div>
                          </button>
                          {tab === "recruit" ? (
                            <button
                              className="recruit-btn"
                              disabled={
                                busy ||
                                guild.gold < recruitCost(c) ||
                                guild.roster.length >= 24
                              }
                              onClick={() => store.recruit(c.id)}
                            >
                              모집 <span>◈ {recruitCost(c)}</span>
                            </button>
                          ) : (
                            <button
                              className={`recruit-btn ${guild.party.includes(c.id) ? "enlisted" : ""}`}
                              disabled={busy}
                              onClick={() => store.toggleParty(c.id)}
                            >
                              {guild.party.includes(c.id)
                                ? "✓ 편성 중"
                                : "＋ 편성"}
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                    {tab === "recruit" && guild.candidates.length === 0 && (
                      <p className="empty-message">
                        모든 지원자가 동료가 되었습니다. 새 지원자를 만나보세요.
                      </p>
                    )}
                    <div className="panel-foot">
                      {tab === "recruit"
                        ? "재능은 성장 속도에, 잠재력은 미래의 가능성에 영향을 줍니다."
                        : "용병을 선택하면 능력치와 가능성을 확인할 수 있습니다."}
                    </div>
                  </section>
                )}
              </div>
              <aside className="detail-column">
                <CharacterDetails
                  m={m}
                  party={guild.party.includes(m.id)}
                  owned={guild.roster.some((c) => c.id === m.id)}
                  busy={busy}
                />
                <section className="whisper">
                  <span>✦ 가능성의 눈</span>
                  <p>
                    “평범해 보이는 사람에게도
                    <br />
                    빛나는 가능성은 있어요.”
                  </p>
                  <small>숨겨진 재능을 발견해 보세요.</small>
                </section>
              </aside>
            </div>
          )}
          <div className="notice" role="status">
            <span>✧</span> {s.notice}
          </div>
          <footer>
            <span>
              <i className={s.saveBlocked ? "error-dot" : "green-dot"} />
              {s.saveStatus} <span className="footer-divider">·</span>{" "}
              {offlineReady ? "오프라인 준비 완료" : "로컬 저장 · IndexedDB"}
            </span>
            <button onClick={() => void installApp()}>
              {standalone ? "✓ 앱으로 실행 중" : "↧ 앱 설치 안내"}
            </button>
            {needRefresh && (
              <button
                onClick={() =>
                  void store.save().then((ok) => {
                    if (ok) return updateServiceWorker(true);
                  })
                }
                disabled={!!battle || s.saveBlocked}
              >
                새 버전 적용
              </button>
            )}
          </footer>
        </div>
      </main>
      {(confirmLoad || importRaw !== null) && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
            className="modal panel"
          >
            <h3 id="restore-title">
              {importRaw !== null
                ? "백업을 복원할까요?"
                : "저장 기록을 불러올까요?"}
            </h3>
            <p>
              현재 용병단 상태가 선택한 저장 기록으로 교체됩니다. 필요하면 먼저
              백업을 내보내세요.
            </p>
            <div>
              <button
                autoFocus
                onClick={() => {
                  setConfirmLoad(false);
                  setImportRaw(null);
                }}
              >
                취소
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (importRaw !== null) void store.import(importRaw);
                  else void store.load();
                  setConfirmLoad(false);
                  setImportRaw(null);
                }}
              >
                불러오기
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function QuestCard({
  onStart,
  disabled,
}: {
  onStart: () => void;
  disabled: boolean;
}) {
  return (
    <section className="panel quest-card">
      <div className="quest-symbol">⚔</div>
      <div className="quest-copy">
        <span className="eyebrow">
          RECOMMENDED QUEST <i>F 등급</i>
        </span>
        <h3>숲의 불청객</h3>
        <p>변경의 숲길에 나타난 고블린을 토벌해 주세요.</p>
        <div className="quest-meta">
          <span>◈ 120 G</span>
          <span>✦ 경험치 55 / 인</span>
          <span>권장 Lv.1 · 2인 이상</span>
        </div>
      </div>
      <button className="primary" onClick={onStart} disabled={disabled}>
        출전하기 <span>→</span>
      </button>
    </section>
  );
}
function CharacterDetails({
  m,
  party,
  owned,
  busy,
}: {
  m: Mercenary;
  party: boolean;
  owned: boolean;
  busy: boolean;
}) {
  const stats = statsOf(m);
  const c = CLASSES[m.classId];
  return (
    <section className="panel character-details">
      <div className="section-title">
        <span className="eyebrow">MERCENARY PROFILE</span>
        <span className="status-tag">
          {party ? "출전 중" : owned ? "소속 용병" : "지원자"}
        </span>
      </div>
      <div className="profile-top">
        <div className="profile-art">
          <Sprite m={m} large />
        </div>
        <div>
          <span className="class-label" style={{ color: c.color }}>
            {c.name} · Lv.{m.level}
          </span>
          <h3>
            {m.name}
            <small>{m.gender === "female" ? "♀" : "♂"}</small>
          </h3>
          <p>
            {RACES[m.race]} ·{" "}
            {m.story === "hero"
              ? "이세계의 낙오자"
              : m.story === "ria"
                ? "숲의 길잡이"
                : c.role}
          </p>
        </div>
      </div>
      <div className="stats-grid">
        {(
          [
            ["체력", stats.hp],
            ["공격", stats.attack],
            ["방어", stats.defense],
            ["속도", stats.speed],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <div className="xp-line">
        <span>성장 경험치</span>
        <b>
          {m.xp} / {m.level === 50 ? "MAX" : xpNeeded(m.level)}
        </b>
      </div>
      <progress className="xp-progress" max={xpNeeded(m.level)} value={m.xp} />
      <div className="potential">
        <div>
          <span>재능</span>
          <Stars n={m.talent} />
        </div>
        <div>
          <span>
            잠재력 <small>✧</small>
          </span>
          <Stars n={m.potential} />
        </div>
      </div>
      <div className="trait">
        <b>✦ {TRAITS[m.traitId].name}</b>
        <span>{TRAITS[m.traitId].description}</span>
      </div>
      <div className="gear">
        <span>장착 장비</span>
        <b>
          {EQUIPMENT[m.equipment.weapon].name} ·{" "}
          {EQUIPMENT[m.equipment.armor].name}
        </b>
      </div>
      <details className="class-tree">
        <summary>가능성의 눈 · 전직 경로</summary>
        {c.branches.map((branch, i) => (
          <p key={branch}>
            {c.name} → {branch}
            <small>→ {c.advanced[i]}</small>
          </p>
        ))}
        <small>Lv.5 / Lv.15 · 전직 실행은 추후 구현</small>
      </details>
      <button
        className={owned ? "full-btn" : "primary full-btn"}
        disabled={
          busy || (!owned && store.getSnapshot().guild.gold < recruitCost(m))
        }
        onClick={() => (owned ? store.toggleParty(m.id) : store.recruit(m.id))}
      >
        {owned
          ? party
            ? "파티에서 제외"
            : "출전 파티에 편성"
          : `동료로 모집 · ${recruitCost(m)} G`}
      </button>
    </section>
  );
}

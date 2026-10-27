import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { CLASSES, EQUIPMENT, RACES, TRAITS } from "../data/catalog";
import { recruitCost, statsOf, xpNeeded } from "../domain/characters";
import type { Mercenary } from "../domain/types";
import { encodeSave } from "../persistence/save";
import { store } from "../state/store";
import { Avatar, Icon, Modal, Stars } from "./components";
import {
  HomeScreen,
  MercenariesScreen,
  PartyScreen,
  QuestsScreen,
} from "./Screens";
import type { Screen } from "./Screens";
import { BattleScreen } from "./BattleScreen";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const navigation: { id: Screen; label: string; icon: string }[] = [
  { id: "home", label: "본부", icon: "home" },
  { id: "mercenaries", label: "용병", icon: "people" },
  { id: "party", label: "편성", icon: "party" },
  { id: "quests", label: "의뢰", icon: "sword" },
];

export function App() {
  const s = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { guild, battle } = s;
  const [screen, setScreen] = useState<Screen>("home");
  const [recruiting, setRecruiting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [confirm, setConfirm] = useState<"load" | "import" | null>(null);
  const [importRaw, setImportRaw] = useState("");
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(
    window.matchMedia("(display-mode: standalone)").matches,
  );
  const contentRef = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [screen, recruiting]);
  const navigate = (next: Screen) => {
    setSelected(null);
    setScreen(next);
  };
  const selectedMercenary = selected
    ? [...guild.roster, ...guild.candidates].find((m) => m.id === selected)
    : undefined;
  const disabled = !s.loaded || !!battle;
  async function installApp() {
    if (install) {
      await install.prompt();
      if ((await install.userChoice).outcome === "accepted") setInstall(null);
    } else
      store.notify(
        standalone
          ? "이미 앱으로 실행 중입니다."
          : "Chrome 메뉴에서 앱 설치 / 홈 화면에 추가를 선택하세요.",
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
  function beginBattle() {
    setSettings(false);
    setSelected(null);
    store.start();
  }
  return (
    <div className={`app-shell ${battle ? "is-battle" : ""}`}>
      {battle ? (
        <BattleScreen
          battle={battle}
          paused={s.paused}
          onReturn={() => {
            store.returnHome();
            navigate("home");
          }}
        />
      ) : (
        <>
          <header className="app-header">
            <div className="guild-brand">
              <span className="crest">✦</span>
              <div>
                <small>OUTCAST MERCENARIES</small>
                <b>새벽의 여명</b>
              </div>
            </div>
            <span className="gold">
              ◈ <b>{guild.gold.toLocaleString()}</b>
              <small> G</small>
            </span>
            <button
              className="icon-button"
              aria-label="저장 및 설정"
              onClick={() => setSettings(true)}
            >
              <Icon name="settings" />
            </button>
          </header>
          {needRefresh && (
            <div className="update-banner">
              <span>새 버전이 준비되었습니다.</span>
              <button
                disabled={s.saveBlocked}
                onClick={() =>
                  void store.save().then((ok) => {
                    if (ok) return updateServiceWorker(true);
                  })
                }
              >
                저장 후 업데이트
              </button>
            </div>
          )}
          <main
            ref={contentRef}
            className="screen-content"
            data-screen={screen}
            id="main"
          >
            {screen === "home" && (
              <HomeScreen guild={guild} navigate={navigate} />
            )}
            {screen === "mercenaries" && (
              <MercenariesScreen
                guild={guild}
                disabled={disabled}
                inspect={setSelected}
                recruiting={recruiting}
                setRecruiting={setRecruiting}
              />
            )}
            {screen === "party" && (
              <PartyScreen
                guild={guild}
                disabled={disabled}
                inspect={setSelected}
                navigate={navigate}
              />
            )}
            {screen === "quests" && (
              <QuestsScreen
                guild={guild}
                disabled={disabled}
                onStart={beginBattle}
              />
            )}
          </main>
          <div className="notice" role="status">
            <span>✧</span>
            <p>{s.notice}</p>
          </div>
          <div
            className={`storage-status ${s.saveBlocked ? "save-error" : ""}`}
          >
            <span>● {s.saveStatus}</span>
            <span>
              {offlineReady ? "오프라인 준비 완료" : "로컬 기록 보관 중"}
            </span>
          </div>
          <nav className="bottom-nav" aria-label="주 메뉴">
            {navigation.map((item) => (
              <button
                key={item.id}
                aria-label={item.label}
                aria-current={screen === item.id ? "page" : undefined}
                className={screen === item.id ? "active" : ""}
                onClick={() => navigate(item.id)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
      {selectedMercenary && (
        <Modal title="용병 상세 정보" onClose={() => setSelected(null)}>
          <CharacterDetails
            m={selectedMercenary}
            owned={guild.roster.some((m) => m.id === selected)}
            inParty={guild.party.includes(selectedMercenary.id)}
            disabled={disabled}
          />
        </Modal>
      )}
      {settings && (
        <Modal title="기록과 설정" onClose={() => setSettings(false)}>
          <section className="settings-content">
            <p>
              같은 기기·브라우저에 용병단을 보관합니다.
              <br />
              기록을 오래 보관하려면 백업 파일을 내려받으세요.
            </p>
            <div className="settings-status">
              <b>{s.saveStatus}</b>
              <span>
                {offlineReady
                  ? "오프라인 준비 완료"
                  : "첫 접속은 네트워크가 필요합니다."}
              </span>
            </div>
            <div className="settings-actions">
              <button onClick={() => void store.save()} disabled={!s.loaded}>
                지금 저장
              </button>
              <button onClick={() => setConfirm("load")} disabled={disabled}>
                불러오기
              </button>
              <button onClick={exportBackup} disabled={!s.loaded}>
                백업 내보내기
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={disabled}
              >
                백업 복원
              </button>
            </div>
            <button
              className="primary full-width"
              onClick={() => void installApp()}
            >
              {standalone ? "✓ 앱으로 실행 중" : "홈 화면에 앱 설치"}
            </button>
            <p className="hint">
              세로 화면에 맞춰 설계했습니다. 설치형 앱은
              <br />
              브라우저 주소창 없이 더 넓게 이용할 수 있습니다.
            </p>
          </section>
        </Modal>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.size > 1_000_000)
              store.notify("1MB 이하의 세이브 파일을 선택해 주세요.");
            else {
              setImportRaw(await file.text());
              setConfirm("import");
            }
          }
          e.target.value = "";
        }}
      />
      {confirm && (
        <Modal
          title={
            confirm === "import" ? "백업을 복원할까요?" : "기록을 불러올까요?"
          }
          onClose={() => setConfirm(null)}
        >
          <p className="confirm-copy">
            현재 용병단 상태가 선택한 저장 기록으로 교체됩니다. 필요하면 먼저
            백업을 내보내세요.
          </p>
          <div className="confirm-actions">
            <button onClick={() => setConfirm(null)}>취소</button>
            <button
              className="primary"
              onClick={() => {
                if (confirm === "import") void store.import(importRaw);
                else void store.load();
                setConfirm(null);
              }}
            >
              불러오기
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function CharacterDetails({
  m,
  owned,
  inParty,
  disabled,
}: {
  m: Mercenary;
  owned: boolean;
  inParty: boolean;
  disabled: boolean;
}) {
  const [tab, setTab] = useState<"info" | "gear">("info");
  const stats = statsOf(m);
  const c = CLASSES[m.classId];
  return (
    <div className="character-detail">
      <div className="profile-top">
        <div className="profile-stage">
          <Avatar m={m} large />
        </div>
        <div>
          <span className="class-label" style={{ color: c.color }}>
            {c.name} · Lv.{m.level}
          </span>
          <h3>
            {m.name} <small>{m.gender === "female" ? "♀" : "♂"}</small>
          </h3>
          <p>
            {RACES[m.race]} ·{" "}
            {m.story === "hero"
              ? "이세계의 낙오자"
              : m.story === "ria"
                ? "숲의 길잡이"
                : c.role}
          </p>
          <span className="roster-tag enlisted">
            {owned ? (inParty ? "출전 파티" : "소속 용병") : "모집 지원자"}
          </span>
        </div>
      </div>
      <div className="segmented" role="group" aria-label="용병 상세 종류">
        <button aria-pressed={tab === "info"} onClick={() => setTab("info")}>
          능력 정보
        </button>
        <button aria-pressed={tab === "gear"} onClick={() => setTab("gear")}>
          장비
        </button>
      </div>
      {tab === "info" ? (
        <>
          <div className="stats-grid">
            {Object.entries({
              체력: stats.hp,
              공격: stats.attack,
              방어: stats.defense,
              속도: stats.speed,
            }).map(([label, value]) => (
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
          <progress
            className="xp-progress"
            max={xpNeeded(m.level)}
            value={m.xp}
            aria-label="성장 경험치"
          />
          <div className="potential">
            <div>
              <span>재능</span>
              <Stars n={m.talent} />
            </div>
            <div>
              <span>잠재력 ✧</span>
              <Stars n={m.potential} />
            </div>
          </div>
          <div className="trait">
            <b>✦ {TRAITS[m.traitId].name}</b>
            <span>{TRAITS[m.traitId].description}</span>
          </div>
          <details className="class-tree">
            <summary>가능성의 눈 · 전직 경로</summary>
            {c.branches.map((branch, i) => (
              <p key={branch}>
                {c.name} → {branch}
                <small>→ {c.advanced[i]}</small>
              </p>
            ))}
            <p className="hint">Lv.5 / Lv.15 · 전직 실행은 추후 구현</p>
          </details>
        </>
      ) : (
        <div className="equipment-list">
          {(["weapon", "armor"] as const).map((slot) => (
            <article key={slot}>
              <span>{slot === "weapon" ? "⚔" : "♜"}</span>
              <div>
                <small>{slot === "weapon" ? "무기" : "방어구"}</small>
                <b>{EQUIPMENT[m.equipment[slot]].name}</b>
              </div>
              <small>장착 중</small>
            </article>
          ))}
          <p className="hint">
            현재 장착 장비를 확인할 수 있습니다.
            <br />
            장비 획득과 교체 기능은 다음 단계에 추가됩니다.
          </p>
        </div>
      )}
      <button
        className={`${owned ? "secondary" : "primary"} full-width detail-action`}
        disabled={
          disabled ||
          (!owned && store.getSnapshot().guild.gold < recruitCost(m))
        }
        onClick={() => (owned ? store.toggleParty(m.id) : store.recruit(m.id))}
      >
        {owned
          ? inParty
            ? "파티에서 제외"
            : "출전 파티에 편성"
          : `동료로 모집 · ${recruitCost(m)} G`}
      </button>
    </div>
  );
}

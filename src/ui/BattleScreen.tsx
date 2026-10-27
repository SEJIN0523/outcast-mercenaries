import type { CombatBattle, CombatUnit } from "../domain/combat/types";
import { TACTICS, ATTACK_PRIORITIES } from "../data/tactics";
import type { TacticId } from "../domain/combat/types";
import { store } from "../state/store";
import { Icon } from "./components";
import { GameCanvas } from "./GameCanvas";
import { NORMAL_PARTY_LIMIT } from "../data/party";
function Health({ unit }: { unit: CombatUnit }) {
  return (
    <article
      className={`rt-health ${unit.side} ${unit.hp === 0 || unit.escaped ? "fallen" : ""}`}
      data-testid={`unit-${unit.id}`}
    >
      <span>
        {unit.side === "enemy"
          ? unit.boss
            ? "대장"
            : unit.role === "ranged"
              ? "궁수"
              : unit.name.replace("고블린 ", "")
          : unit.name}
      </span>
      <b>
        {unit.hp}
        <small>/{unit.maxHp}</small>
      </b>
      <progress
        aria-label={`${unit.name} HP`}
        value={unit.hp}
        max={unit.maxHp}
      />
    </article>
  );
}
const ids = Object.keys(TACTICS) as TacticId[];
export function BattleScreen({
  battle,
  paused,
  onReturn,
}: {
  battle: CombatBattle;
  paused: boolean;
  onReturn: () => void;
}) {
  const active = battle.status === "active";
  const minute = Math.floor(battle.elapsed / 60),
    second = Math.floor(battle.elapsed % 60);
  return (
    <main
      className="battle-screen realtime-screen"
      aria-label="전투 화면"
      data-testid="battle-screen"
    >
      <header className="battle-header">
        <span className="battle-crest">
          <Icon name="sword" />
        </span>
        <div>
          <small>속삭임의 숲 · 주인공도 AI로 전투</small>
          <h1>고블린 토벌</h1>
        </div>
        <button
          className="pause-button"
          onClick={store.togglePause}
          disabled={!active}
          aria-label={paused ? "전투 계속" : "일시정지"}
        >
          {paused ? "▶ 계속" : "Ⅱ 일시정지"}
        </button>
      </header>
      <div className="battle-meta">
        <span>
          WAVE <b>1 / 1</b>
        </span>
        <span data-testid="battle-time">
          {String(minute).padStart(2, "0")}:{String(second).padStart(2, "0")}
        </span>
        <span className={paused ? "paused-state" : "auto-state"}>
          {!active
            ? "전투 종료"
            : battle.escaping
              ? "도주 진행 중"
              : paused
                ? "일시정지 중"
                : "● 실시간 자율전투"}
        </span>
      </div>
      <section className="rt-enemies" aria-label="적군 체력">
        <div className="rt-side-label">
          <span>ENEMY</span>
          <span>
            {battle.units.filter((u) => u.side === "enemy" && u.hp > 0).length}{" "}
            / 5
          </span>
        </div>
        <div className="rt-enemy-health">
          {battle.units
            .filter((u) => u.side === "enemy")
            .map((u) => (
              <Health key={u.id} unit={u} />
            ))}
        </div>
      </section>
      <div
        className="battlefield rt-field"
        data-testid="battlefield"
        data-hero-position={battle.units
          .filter((u) => u.mercenary?.story === "hero" || u.id === "hero")
          .map((u) => `${Math.round(u.x)},${Math.round(u.y)}`)
          .join(";")}
        data-positions={battle.units
          .filter((u) => u.side === "party")
          .map((u) => `${Math.round(u.x)},${Math.round(u.y)}`)
          .join(";")}
      >
        <GameCanvas battle />
        <span className="field-location">
          AUTONOMOUS BATTLE · 이동과 스킬 자동
        </span>
        {paused && (
          <span className="pause-label">PAUSED · 전술을 선택하세요</span>
        )}
      </div>
      <section className="rt-allies" aria-label="아군 체력">
        <div className="rt-side-label">
          <span>YOUR MERCENARIES</span>
          <span>
            {battle.participants.length} / {NORMAL_PARTY_LIMIT}명 · 주인공 포함
          </span>
        </div>
        <div
          className="rt-ally-health"
          style={{
            gridTemplateColumns: `repeat(${NORMAL_PARTY_LIMIT},minmax(0,1fr))`,
          }}
        >
          {battle.units
            .filter((u) => u.side === "party")
            .map((u) => (
              <Health key={u.id} unit={u} />
            ))}
        </div>
      </section>
      <div className="battle-event" role="log" aria-label="최근 전투 기록">
        {battle.logs.at(-1)}
      </div>
      {active ? (
        <section className="tactical-console" aria-label="전술 지휘">
          <div className="tactic-info">
            <span>
              현재 전술 · <b>{TACTICS[battle.tactic].name}</b>
            </span>
            <span>스킬 자동</span>
          </div>
          <div className="tactic-grid" role="group" aria-label="전술 명령">
            {ids.map((id) => (
              <button
                key={id}
                aria-pressed={battle.tactic === id}
                disabled={battle.escaping}
                title={TACTICS[id].description}
                onClick={() => store.tactic(id)}
              >
                {TACTICS[id].name}
              </button>
            ))}
          </div>
          <p className="tactic-description">
            {battle.escaping
              ? "모든 생존 용병이 하단 탈출 지점으로 이동합니다."
              : TACTICS[battle.tactic].description}
          </p>
          <div className="battle-utility">
            <button
              className="priority-button"
              aria-label={`공격 우선순위 ${ATTACK_PRIORITIES[battle.priority]}`}
              onClick={store.priority}
              disabled={battle.escaping}
            >
              우선: {ATTACK_PRIORITIES[battle.priority]}
            </button>
            <button
              className="escape-button"
              onClick={store.escape}
              disabled={battle.escaping}
            >
              {battle.escaping ? "도주 중…" : "도주"}
            </button>
            <button
              className="speed-button"
              aria-label={`전투 속도 ${battle.speed}배속`}
              onClick={store.speed}
            >
              {battle.speed}× <span>전투 속도</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="battle-result" aria-label="전투 결과">
          <div>
            <h2>
              {battle.status === "victory"
                ? "의뢰를 완수했습니다!"
                : battle.status === "escaped"
                  ? "전장에서 도주했습니다"
                  : "안전하게 철수했습니다"}
            </h2>
            <p>
              {battle.status === "victory"
                ? "◈ 120 G · 전투원 경험치 +55"
                : battle.status === "escaped"
                  ? "획득 보상 없음 · 생존 동료와 복귀합니다"
                  : "획득 보상 없음 · 파티를 보강해 보세요"}
            </p>
          </div>
          <button className="primary" onClick={onReturn}>
            본부로 복귀 →
          </button>
        </section>
      )}
    </main>
  );
}

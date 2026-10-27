import type { Battle, Unit } from "../domain/types";
import { store } from "../state/store";
import { Avatar, Icon } from "./components";
import { GameCanvas } from "./GameCanvas";

function HealthCard({ unit }: { unit: Unit }) {
  return (
    <article
      className={`unit-card ${unit.side} ${unit.hp === 0 ? "fallen" : ""}`}
      data-testid={`unit-${unit.id}`}
    >
      {unit.mercenary && <Avatar m={unit.mercenary} />}
      <div>
        <span>
          {unit.name}
          {unit.hp === 0 && <small> · 전투 불능</small>}
        </span>
        <b>
          {unit.hp}
          <small> / {unit.maxHp}</small>
        </b>
        <progress
          aria-label={`${unit.name} HP`}
          max={unit.maxHp}
          value={unit.hp}
        />
      </div>
    </article>
  );
}
export function BattleScreen({
  battle,
  paused,
  onReturn,
}: {
  battle: Battle;
  paused: boolean;
  onReturn: () => void;
}) {
  const active = battle.status === "active";
  return (
    <main
      className="battle-screen"
      aria-label="전투 화면"
      data-testid="battle-screen"
    >
      <header className="battle-header">
        <span className="battle-crest">
          <Icon name="sword" />
        </span>
        <div>
          <small>속삭임의 숲 · F 등급</small>
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
        <span data-testid="battle-turn">
          TURN {String(battle.tick).padStart(2, "0")}
        </span>
        <span className={paused ? "paused-state" : "auto-state"}>
          {!active ? "전투 종료" : paused ? "일시정지 중" : "● 자동전투"}
        </span>
      </div>
      <section className="enemy-panel" aria-label="적군 체력">
        <div className="battle-section-label">
          <span>ENEMY</span>
          <small>고블린 무리</small>
        </div>
        <div className="enemy-health">
          {battle.units
            .filter((u) => u.side === "enemy")
            .map((u) => (
              <HealthCard key={u.id} unit={u} />
            ))}
        </div>
      </section>
      <div className="battlefield">
        <GameCanvas battle />
        <span className="field-location">WHISPERING WOODS</span>
        {paused && <span className="pause-label">PAUSED · 지휘 대기 중</span>}
      </div>
      <section className="ally-panel" aria-label="아군 체력">
        <div className="battle-section-label">
          <span>YOUR PARTY</span>
          <small>{battle.participants.length}명의 동료</small>
        </div>
        <div className="ally-health">
          {battle.units
            .filter((u) => u.side === "party")
            .map((u) => (
              <HealthCard key={u.id} unit={u} />
            ))}
        </div>
      </section>
      <div className="battle-event" role="log" aria-label="최근 전투 기록">
        {battle.logs.at(-1)}
      </div>
      {active ? (
        <section className="skill-panel" aria-label="전투 스킬">
          <div className="skill-description">
            <span>COMMAND SKILL</span>
            <b>집중 공격</b>
            <small>공격력 180% · 재사용 5턴</small>
          </div>
          <button
            className="primary skill-button"
            onClick={store.focus}
            disabled={paused || battle.cooldown > 0}
            aria-label={
              battle.cooldown > 0
                ? `집중 공격 ${battle.cooldown}턴 대기`
                : "집중 공격 발동"
            }
          >
            <span>✦</span>
            {paused
              ? "일시정지 중"
              : battle.cooldown > 0
                ? `${battle.cooldown}턴 대기`
                : "스킬 발동"}
          </button>
        </section>
      ) : (
        <section className="battle-result" aria-label="전투 결과">
          <div>
            <h2>
              {battle.status === "victory"
                ? "의뢰를 완수했습니다!"
                : "안전하게 철수했습니다"}
            </h2>
            <p>
              {battle.status === "victory"
                ? "◈ 120 G · 출전자 경험치 +55"
                : "획득 보상 없음 · 파티를 보강해 보세요"}
            </p>
          </div>
          <button className="primary" onClick={onReturn}>
            본부로 복귀 →
          </button>
        </section>
      )}
      <div className="battle-bottom-note">
        {active
          ? "화면을 벗어나면 자동전투가 잠시 멈춥니다."
          : "다음 출전 시 모든 동료의 체력이 회복됩니다."}
      </div>
    </main>
  );
}

import { CLASSES, RACES } from "../data/catalog";
import { recruitCost, isHero } from "../domain/characters";
import { NORMAL_PARTY_LIMIT } from "../data/party";
import { combatParty } from "../domain/guild";
import type { Guild } from "../domain/types";
import { store } from "../state/store";
import { Avatar, Icon, Stars } from "./components";
import { GameCanvas } from "./GameCanvas";

export type Screen = "home" | "mercenaries" | "party" | "quests";
type Props = { guild: Guild; disabled: boolean; inspect: (id: string) => void };
export function HomeScreen({
  guild,
  navigate,
}: {
  guild: Guild;
  navigate: (screen: Screen) => void;
}) {
  return (
    <section className="home-screen screen" aria-label="본부 화면">
      <div className="screen-heading">
        <span className="eyebrow">A NEW BEGINNING</span>
        <h1>돌아오셨군요, 단장님.</h1>
        <p>왕국 밖 작은 여관, 우리의 새로운 시작.</p>
      </div>
      <div className="headquarters-art">
        <GameCanvas />
        <span className="location">☽ 여명의 변경</span>
        <div className="art-caption">
          <span>OUR LITTLE SANCTUARY</span>
          <h2>새벽의 여명</h2>
        </div>
      </div>
      <div className="guild-summary">
        <div>
          <span>소속 용병</span>
          <b>
            {guild.roster.length}
            <small> / 24</small>
          </b>
        </div>
        <div>
          <span>출전 파티</span>
          <b>
            {combatParty(guild).length}
            <small> / {NORMAL_PARTY_LIMIT}</small>
          </b>
        </div>
        <div>
          <span>완수한 의뢰</span>
          <b data-testid="victories">{guild.victories}</b>
        </div>
      </div>
      <button className="featured-quest" onClick={() => navigate("quests")}>
        <span className="quest-emblem">
          <Icon name="sword" />
        </span>
        <span>
          <small>첫 번째 의뢰 · F 등급</small>
          <b>숲의 불청객</b>
          <em>고블린을 토벌하고 동료들과 성장하세요.</em>
        </span>
        <span>→</span>
      </button>
      <div className="home-shortcuts">
        <button onClick={() => navigate("mercenaries")}>
          <Icon name="people" />
          <span>
            새 동료 만나기<small>숨겨진 재능을 찾아보세요</small>
          </span>
          <b>↗</b>
        </button>
        <button onClick={() => navigate("party")}>
          <Icon name="party" />
          <span>
            파티 준비하기<small>주인공과 최대 4명의 동료</small>
          </span>
          <b>↗</b>
        </button>
      </div>
      <div className="home-whisper">
        <Icon name="eye" />
        <p>
          세상이 알아보지 못한 가능성,
          <br />
          <em>당신의 눈에는 보인다.</em>
        </p>
      </div>
    </section>
  );
}
export function MercenariesScreen({
  guild,
  disabled,
  inspect,
  recruiting,
  setRecruiting,
}: Props & { recruiting: boolean; setRecruiting: (value: boolean) => void }) {
  const people = recruiting ? guild.candidates : guild.roster;
  return (
    <section className="screen list-screen" aria-label="용병 화면">
      <div className="screen-heading">
        <span className="eyebrow">UNDER ONE BANNER</span>
        <h1>우리의 동료들</h1>
        <p>인물을 눌러 능력치와 장비를 확인하세요.</p>
      </div>
      <div className="segmented" role="group" aria-label="용병 목록 종류">
        <button aria-pressed={!recruiting} onClick={() => setRecruiting(false)}>
          소속 용병 <span>{guild.roster.length}</span>
        </button>
        <button aria-pressed={recruiting} onClick={() => setRecruiting(true)}>
          모집소 <span>{guild.candidates.length}</span>
        </button>
      </div>
      {recruiting && (
        <div className="list-caption">
          <span>오늘의 지원자</span>
          <button
            className="text-button"
            disabled={disabled}
            onClick={store.refresh}
          >
            ↻ 새 지원자 · 무료
          </button>
        </div>
      )}
      <div className="merc-list">
        {people.map((m) => (
          <article className="merc-row" key={m.id}>
            <button
              className="merc-inspect"
              onClick={() => inspect(m.id)}
              aria-label={`${m.name} 상세 정보`}
            >
              <div className="avatar-stage">
                <Avatar m={m} />
              </div>
              <span>
                <b>
                  {m.name} {m.story && <i>{isHero(m) ? "단장" : "동료"}</i>}
                </b>
                <small>
                  {RACES[m.race]} · {m.gender === "female" ? "여" : "남"} ·{" "}
                  {CLASSES[m.classId].name}
                </small>
                <span className="row-level">
                  Lv.{m.level} <Stars n={m.talent} />
                </span>
              </span>
            </button>
            {recruiting ? (
              <button
                className="recruit-button"
                disabled={
                  disabled ||
                  guild.gold < recruitCost(m) ||
                  guild.roster.length >= 24
                }
                onClick={() => store.recruit(m.id)}
              >
                모집<small>◈ {recruitCost(m)} G</small>
              </button>
            ) : (
              <span
                className={`roster-tag ${combatParty(guild).some((person) => person.id === m.id) ? "enlisted" : ""}`}
              >
                {combatParty(guild).some((person) => person.id === m.id)
                  ? "편성 중"
                  : "대기"}
              </span>
            )}
          </article>
        ))}
      </div>
      {people.length === 0 && (
        <div className="empty-state">
          지원자가 모두 합류했습니다.
          <br />새 지원자를 만나보세요.
        </div>
      )}
    </section>
  );
}
export function PartyScreen({
  guild,
  disabled,
  inspect,
  navigate,
}: Props & { navigate: (screen: Screen) => void }) {
  const party = combatParty(guild);
  return (
    <section className="screen party-screen" aria-label="편성 화면">
      <div className="screen-heading">
        <span className="eyebrow">YOUR COMPANIONS</span>
        <h1>
          출전 파티{" "}
          <small>
            {combatParty(guild).length} / {NORMAL_PARTY_LIMIT}
          </small>
        </h1>
        <p>동료를 선택해 함께할 파티를 준비하세요.</p>
      </div>
      <div
        className="party-grid"
        style={{
          gridTemplateColumns: `repeat(${NORMAL_PARTY_LIMIT},minmax(0,1fr))`,
        }}
      >
        {Array.from({ length: NORMAL_PARTY_LIMIT }, (_, i) =>
          party[i] ? (
            <button
              key={party[i].id}
              className="party-slot filled"
              onClick={() => inspect(party[i].id)}
            >
              <small>0{i + 1}</small>
              <Avatar m={party[i]} />
              <b>{party[i].name}</b>
              <span>
                {CLASSES[party[i].classId].name} · Lv.{party[i].level}
              </span>
            </button>
          ) : (
            <div key={i} className="party-slot empty">
              <small>0{i + 1}</small>
              <b>＋</b>
              <span>동료를 편성하세요</span>
            </div>
          ),
        )}
      </div>
      <div className="section-heading">
        <h2>편성할 동료</h2>
        <span>주인공 포함 최대 {NORMAL_PARTY_LIMIT}명</span>
      </div>
      <div className="party-roster">
        {guild.roster.map((m) => (
          <article className="party-row" key={m.id}>
            <button
              onClick={() => inspect(m.id)}
              className="party-person"
              aria-label={`${m.name} 상세 정보`}
            >
              <Avatar m={m} />
              <span>
                <b>{m.name}</b>
                <small>
                  {CLASSES[m.classId].name} · Lv.{m.level}
                </small>
              </span>
            </button>
            <button
              className={`party-toggle ${combatParty(guild).some((person) => person.id === m.id) ? "enlisted" : ""}`}
              disabled={disabled || isHero(m)}
              onClick={() => store.toggleParty(m.id)}
              aria-label={`${m.name} ${combatParty(guild).some((person) => person.id === m.id) ? "편성 해제" : "편성"}`}
            >
              {isHero(m)
                ? "고정 출전"
                : combatParty(guild).some((person) => person.id === m.id)
                  ? "✓ 편성 중"
                  : "＋ 편성"}
            </button>
          </article>
        ))}
      </div>
      <button
        className="primary full-width"
        disabled={disabled}
        onClick={() => navigate("quests")}
      >
        의뢰 선택하기 →
      </button>
    </section>
  );
}
export function QuestsScreen({
  guild,
  disabled,
  onStart,
}: {
  guild: Guild;
  disabled: boolean;
  onStart: () => void;
}) {
  return (
    <section className="screen quest-screen" aria-label="의뢰 화면">
      <div className="screen-heading">
        <span className="eyebrow">QUEST BOARD</span>
        <h1>의뢰 게시판</h1>
        <p>숲 너머에 첫 모험이 기다립니다.</p>
      </div>
      <article className="quest-detail">
        <div className="quest-illustration">
          <Icon name="sword" />
          <span>WHISPERING WOODS</span>
          <b>속삭임의 숲</b>
        </div>
        <div className="quest-body">
          <div className="quest-tags">
            <span>F 등급</span>
            <span>고블린 5마리 · 웨이브 1</span>
          </div>
          <h2>숲의 불청객</h2>
          <p>
            변경의 숲길을 점령한 고블린 무리를
            <br />
            토벌하고 주민들의 길을 되찾아 주세요.
          </p>
          <div className="quest-rewards">
            <div>
              <small>완수 보상</small>
              <b>◈ 120 G</b>
            </div>
            <div>
              <small>출전자 경험치</small>
              <b>✦ 55 / 인</b>
            </div>
          </div>
          <div className="quest-preparation">
            <span>
              현재 파티{" "}
              <b>
                {combatParty(guild).length} / {NORMAL_PARTY_LIMIT}명
              </b>
            </span>
            <small>권장 Lv.1 · 2인 이상</small>
          </div>
          <p className="hint">
            주인공을 포함해 전원이 AI로 이동·공격합니다.
            <br />
            패배해도 골드 손실이나 영구 사망은 없습니다.
          </p>
          <button
            className="primary full-width"
            onClick={onStart}
            disabled={disabled || combatParty(guild).length === 0}
          >
            출전하기 →
          </button>
        </div>
      </article>
    </section>
  );
}

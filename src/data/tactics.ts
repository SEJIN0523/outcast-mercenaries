import type { TacticId } from "../domain/combat/types";
export const ATTACK_PRIORITIES = {
  threat: "고위협",
  nearest: "가까운 적",
  weakest: "낮은 HP",
} as const;
export const TACTICS: Record<
  TacticId,
  { name: string; description: string; pursuit: number }
> = {
  charge: {
    name: "전체 돌격",
    description: "진형보다 접근을 우선하고 전장 끝까지 추격합니다.",
    pursuit: 500,
  },
  balanced: {
    name: "균형 전술",
    description: "역할별 사거리와 진형을 고려해 제한적으로 추격합니다.",
    pursuit: 190,
  },
  protect: {
    name: "후위 보호",
    description: "전위가 지원자를 위협하는 적을 우선 차단합니다.",
    pursuit: 140,
  },
  hold: {
    name: "진형 유지",
    description: "홈 진형을 중심으로 짧게 추격하고 복귀합니다.",
    pursuit: 65,
  },
  focus: {
    name: "집중 공격",
    description: "공격 우선순위에 맞춰 고른 적 하나를 함께 공격합니다.",
    pursuit: 260,
  },
  retreat: {
    name: "전술적 후퇴",
    description: "후방 진형으로 이동하며 사거리 안의 적만 공격합니다.",
    pursuit: 45,
  },
};

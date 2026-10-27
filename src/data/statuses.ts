/** Temporary battle state, never written into persistent character growth. */
export const STATUS_EFFECTS={
 guard:{name:'호위 태세',duration:4,defense:2,attackMultiplier:1},
 weaken:{name:'약화',duration:4,defense:0,attackMultiplier:.85},
} as const;

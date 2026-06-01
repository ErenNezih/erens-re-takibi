export const WORKOUT_GROUPS = {
  PUSH: "PUSH",
  PULL: "PULL",
  LEGS: "LEGS",
  OTHER: "OTHER",
} as const;

export type WorkoutGroup = (typeof WORKOUT_GROUPS)[keyof typeof WORKOUT_GROUPS];

export const WORKOUT_GROUP_LABELS: Record<WorkoutGroup, string> = {
  PUSH: "Push",
  PULL: "Pull",
  LEGS: "Legs",
  OTHER: "Diğer",
};

export function inferGroupFromName(name: string): WorkoutGroup {
  const upper = name.toUpperCase();
  if (upper.includes("PUSH")) return WORKOUT_GROUPS.PUSH;
  if (upper.includes("PULL")) return WORKOUT_GROUPS.PULL;
  if (upper.includes("LEG")) return WORKOUT_GROUPS.LEGS;
  return WORKOUT_GROUPS.OTHER;
}

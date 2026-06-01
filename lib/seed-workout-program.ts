import type { PrismaClient } from "@prisma/client";
import { WORKOUT_GROUPS } from "./workout-groups";

export const TRAINING_2026_PROGRAM = "TRAINING 2026 HYPERTROPHY VOL.1";

type ExerciseDef = {
  name: string;
  sets: number;
  targetReps: string;
  note: string;
};

const PUSH_EXERCISES: ExerciseDef[] = [
  { name: "Plate Loaded / Incline Press", sets: 3, targetReps: "6-8", note: "RIR 1-2" },
  { name: "Smith Machine Low Incline", sets: 2, targetReps: "6-8", note: "RIR 1" },
  { name: "Chest Fly Machine", sets: 3, targetReps: "8-10", note: "Failure" },
  { name: "Shoulder Press Machine", sets: 2, targetReps: "6-8", note: "RIR 1" },
  { name: "Lateral Raise", sets: 3, targetReps: "8-12", note: "Failure" },
  { name: "Triceps Pushdown", sets: 3, targetReps: "8-10", note: "Failure" },
  { name: "Overhead Rope Extension", sets: 2, targetReps: "8-10", note: "Failure" },
];

const PULL_EXERCISES: ExerciseDef[] = [
  { name: "Lat Pulldown", sets: 3, targetReps: "6-8", note: "RIR 1-2" },
  { name: "Wide Grip Row", sets: 3, targetReps: "6-8", note: "RIR 1" },
  { name: "Seated Cable Row", sets: 2, targetReps: "8-10", note: "Failure" },
  { name: "Rear Delt Fly", sets: 3, targetReps: "8-12", note: "Failure" },
  { name: "Cable / Dumbbell Curl", sets: 3, targetReps: "8-10", note: "Failure" },
  { name: "Hammer Curl", sets: 2, targetReps: "8-10", note: "Failure" },
];

const LEGS_EXERCISES: ExerciseDef[] = [
  { name: "Leg Press / Smith Squat", sets: 3, targetReps: "6-8", note: "RIR 1-2" },
  { name: "Romanian Deadlift [RDL]", sets: 3, targetReps: "6-8", note: "RIR 1-2" },
  { name: "Leg Extension", sets: 3, targetReps: "8-12", note: "Failure" },
  { name: "Seated Leg Curl", sets: 3, targetReps: "8-10", note: "Failure" },
  { name: "Hip Adduction", sets: 2, targetReps: "10-12", note: "Failure" },
  { name: "Standing Calf Raise", sets: 4, targetReps: "12-15", note: "Failure" },
];

const TEMPLATE_DEFS: {
  weekday: number;
  name: string;
  workoutGroup: string;
  exercises: ExerciseDef[];
}[] = [
  { weekday: 1, name: "PUSH", workoutGroup: WORKOUT_GROUPS.PUSH, exercises: PUSH_EXERCISES },
  { weekday: 4, name: "PUSH", workoutGroup: WORKOUT_GROUPS.PUSH, exercises: PUSH_EXERCISES },
  { weekday: 2, name: "PULL", workoutGroup: WORKOUT_GROUPS.PULL, exercises: PULL_EXERCISES },
  { weekday: 5, name: "PULL", workoutGroup: WORKOUT_GROUPS.PULL, exercises: PULL_EXERCISES },
  { weekday: 3, name: "LEGS", workoutGroup: WORKOUT_GROUPS.LEGS, exercises: LEGS_EXERCISES },
  { weekday: 6, name: "LEGS", workoutGroup: WORKOUT_GROUPS.LEGS, exercises: LEGS_EXERCISES },
];

export async function seedTraining2026Program(prisma: PrismaClient) {
  for (const def of TEMPLATE_DEFS) {
    const exists = await prisma.workoutTemplate.findFirst({
      where: { weekday: def.weekday, name: def.name },
    });
    if (exists) continue;

    await prisma.workoutTemplate.create({
      data: {
        name: def.name,
        weekday: def.weekday,
        workoutGroup: def.workoutGroup,
        programName: TRAINING_2026_PROGRAM,
        active: true,
        exercises: {
          create: def.exercises.map((ex, order) => ({
            name: ex.name,
            sets: ex.sets,
            targetReps: ex.targetReps,
            note: ex.note,
            order,
          })),
        },
      },
    });
  }
}

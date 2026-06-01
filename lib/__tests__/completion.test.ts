import { describe, it, expect } from "vitest";
import {
  computeDayCompletion,
  getActiveTasksForDate,
  getDayPlanContext,
  PLAN_TYPES,
} from "../tasks";
import { startOfDay } from "../date";

const baseContext = {
  hasDietPlan: false,
  hasWorkoutPlan: false,
  suppCount: 2,
  cycleCount: 0,
  bloodCount: 0,
};

describe("computeDayCompletion", () => {
  it("A) supp plan var, task yok → incomplete", () => {
    const status = computeDayCompletion(null, [], baseContext, false);
    expect(status.supplementsDone).toBe(false);
    expect(status.supplement).toBe("incomplete");
    expect(status.allComplete).toBe(false);
  });

  it("B) pasif plan task'ı filtrelenir", () => {
    const date = startOfDay(new Date(2026, 5, 2));
    const plansById = new Map([
      [
        "p1",
        {
          id: "p1",
          active: false,
          startDate: new Date(2026, 0, 1),
          endDate: null,
          weekdays: "1,2,3,4,5,6,7",
          type: PLAN_TYPES.SUPPLEMENT,
        },
      ],
    ]);
    const tasks = [
      { planId: "p1", type: PLAN_TYPES.SUPPLEMENT, completed: true },
    ];
    const active = getActiveTasksForDate(date, tasks, plansById);
    expect(active).toHaveLength(0);

    const context = getDayPlanContext(date, [], false);
    const status = computeDayCompletion(null, active, context, false, date);
    expect(status.isNeutral).toBe(true);
  });

  it("C) pazar workout not_planned", () => {
    const sunday = startOfDay(new Date(2026, 5, 7));
    const context = getDayPlanContext(sunday, [], false);
    const status = computeDayCompletion(null, [], context, false, sunday);
    expect(status.workout).toBe("not_planned");
    expect(status.hasPlannedWorkout).toBe(false);
  });

  it("D) geçmiş eksik gün → incomplete", () => {
    const past = startOfDay(new Date(2020, 0, 1));
    const context = {
      hasDietPlan: true,
      hasWorkoutPlan: false,
      suppCount: 0,
      cycleCount: 0,
      bloodCount: 0,
    };
    const status = computeDayCompletion({ dietDone: false }, [], context, false, past);
    expect(status.isPast).toBe(true);
    expect(status.hasIncomplete).toBe(true);
    expect(status.diet).toBe("incomplete");
  });

  it("E) gelecek gün → hasIncomplete false", () => {
    const future = startOfDay(new Date(2099, 0, 1));
    const context = {
      hasDietPlan: true,
      hasWorkoutPlan: true,
      suppCount: 1,
      cycleCount: 0,
      bloodCount: 0,
    };
    const status = computeDayCompletion(
      { dietDone: false, workoutDone: false },
      [{ type: PLAN_TYPES.SUPPLEMENT, completed: false }],
      context,
      false,
      future
    );
    expect(status.isFuture).toBe(true);
    expect(status.hasIncomplete).toBe(false);
  });
});

describe("workout volume", () => {
  it("F) volume 200", async () => {
    const { calcSessionVolume } = await import("../workout");
    const vol = calcSessionVolume([
      { weight: 10, reps: 10 },
      { weight: 20, reps: 5 },
    ]);
    expect(vol).toBe(200);
  });

  it("G) same-type PUSH delta +300", async () => {
    const { getSameTypeVolumeDelta } = await import("../workout");
    const sessions = [
      {
        id: "1",
        date: new Date(2026, 5, 1),
        title: "PUSH A",
        workoutGroup: "PUSH",
        totalVolume: 1000,
        completed: true,
      },
      {
        id: "2",
        date: new Date(2026, 5, 3),
        title: "PULL",
        workoutGroup: "PULL",
        totalVolume: 900,
        completed: true,
      },
      {
        id: "3",
        date: new Date(2026, 5, 5),
        title: "PUSH B",
        workoutGroup: "PUSH",
        totalVolume: 1300,
        completed: true,
      },
    ];
    const delta = getSameTypeVolumeDelta(sessions, sessions[2]);
    expect(delta.prevVolume).toBe(1000);
    expect(delta.delta).toBe(300);
  });
});

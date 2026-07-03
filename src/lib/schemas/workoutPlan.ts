import { z } from 'zod';

export const workoutPlanZodSchema = z.object({
  workout_days: z.array(
    z.object({
      day_name: z.string(),
      focus: z.string(),
      exercises: z.array(
        z.object({
          exercise_name: z.string(),
          sets: z.number(),
          reps_or_duration: z.string(),
          rest_seconds: z.number(),
          notes: z.string().optional(),
        })
      ),
    })
  ),
  nutrition_plan: z.object({
    daily_meal_template: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snacks: z.string().optional(),
    }),
    target_calories_kcal: z.number(),
    target_protein_g: z.number(),
    target_carbs_g: z.number(),
    target_fat_g: z.number(),
    general_tips: z.array(z.string()),
  }),
});

export type GeneratedPlanType = z.infer<typeof workoutPlanZodSchema>;

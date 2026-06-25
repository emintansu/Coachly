'use server';

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const workoutPlanZodSchema = z.object({
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

export async function generateWorkoutPlan(locale: string) {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed or user session not found');
    }

    // 2. Fetch user profile onboarding details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found. Complete onboarding first.');
    }

    const {
      goal,
      weight,
      height,
      age,
      activity_level,
      training_days,
      equipment,
      diet_preference,
    } = profile;

    // 3. Initialize Gemini Client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    // 4. Construct prompt in the target language
    let prompt = '';
    if (locale === 'tr') {
      prompt = `
        Sen profesyonel bir kişisel antrenör ve beslenme uzmanısın.
        Aşağıdaki bilgilere sahip bir kullanıcı için haftalık, uygulanabilir ve gerçekçi bir antrenman programı ile destekleyici örnek beslenme rehberi oluştur:
        
        - HEDEF: ${goal === 'lose_weight' ? 'Kilo Vermek / Yağ Yakmak' : goal === 'gain_muscle' ? 'Kas Kütlesi Kazanmak / Hacim Almak' : 'Formu Korumak'}
        - YAŞ: ${age}
        - BOY: ${height} cm
        - KİLO: ${weight} kg
        - AKTİVİTE SEVİYESİ: ${activity_level}
        - HAFTALIK ANTRENMAN GÜNÜ: ${training_days} gün
        - EKİPMAN DURUMU: ${equipment === 'none' ? 'Ekipman Yok (Sadece Vücut Ağırlığı)' : equipment === 'dumbbells' ? 'Sadece Dumbbell var' : 'Tam donanımlı spor salonu'}
        - DİYET TERCİHİ: ${diet_preference}
        
        KURALLAR:
        1. Antrenman hareketlerini kesinlikle kullanıcının ekipman durumuna göre seç. Örneğin "Ekipman Yok" ise bench press, lat pulldown gibi hareketler önerme; şınav, squat, lunge gibi vücut ağırlığı hareketleri ver.
        2. Plan ${training_days} adet antrenman gününü içersin. Dinlenme günlerini de dahil edebilirsin ama workout_days dizisinde tam olarak ${training_days} adet aktif çalışma günü olsun.
        3. Egzersiz isimleri, öğün isimleri, açıklamalar ve ipuçları tamamen TÜRKÇE olsun.
        4. Kalori ve makro besin değerlerini (protein, karbonhidrat, yağ) kullanıcının hedeflerine uygun gerçekçi sayılar olarak hesapla.
      `;
    } else {
      prompt = `
        You are a professional personal trainer and nutritionist.
        Create a weekly, actionable, and realistic workout program and supporting nutrition guide for a user with the following details:
        
        - GOAL: ${goal === 'lose_weight' ? 'Lose Weight / Burn Fat' : goal === 'gain_muscle' ? 'Build Muscle / Gain Mass' : 'Maintain Fitness'}
        - AGE: ${age}
        - HEIGHT: ${height} cm
        - WEIGHT: ${weight} kg
        - ACTIVITY LEVEL: ${activity_level}
        - WEEKLY TRAINING DAYS: ${training_days} days
        - AVAILABLE EQUIPMENT: ${equipment === 'none' ? 'No Equipment (Bodyweight only)' : equipment === 'dumbbells' ? 'Dumbbells only' : 'Fully equipped gym'}
        - DIET PREFERENCE: ${diet_preference}
        
        RULES:
        1. Select exercises strictly based on the user's equipment. E.g. if "No Equipment", do not suggest bench press or lat pulldowns; suggest pushups, bodyweight squats, lunges, etc.
        2. The plan must contain exactly ${training_days} active workout days in the workout_days array.
        3. All exercise names, meal descriptions, and tips must be in ENGLISH.
        4. Calculate realistic calories and macros (protein, carbs, fat) matching their goal.
      `;
    }

    // 5. Query Gemini API with structured JSON Schema output
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            workout_days: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  day_name: { type: 'STRING' },
                  focus: { type: 'STRING' },
                  exercises: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        exercise_name: { type: 'STRING' },
                        sets: { type: 'INTEGER' },
                        reps_or_duration: { type: 'STRING' },
                        rest_seconds: { type: 'INTEGER' },
                        notes: { type: 'STRING' },
                      },
                      required: ['exercise_name', 'sets', 'reps_or_duration', 'rest_seconds'],
                    },
                  },
                },
                required: ['day_name', 'focus', 'exercises'],
              },
            },
            nutrition_plan: {
              type: 'OBJECT',
              properties: {
                daily_meal_template: {
                  type: 'OBJECT',
                  properties: {
                    breakfast: { type: 'STRING' },
                    lunch: { type: 'STRING' },
                    dinner: { type: 'STRING' },
                    snacks: { type: 'STRING' },
                  },
                  required: ['breakfast', 'lunch', 'dinner'],
                },
                target_calories_kcal: { type: 'INTEGER' },
                target_protein_g: { type: 'INTEGER' },
                target_carbs_g: { type: 'INTEGER' },
                target_fat_g: { type: 'INTEGER' },
                general_tips: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
              },
              required: [
                'daily_meal_template',
                'target_calories_kcal',
                'target_protein_g',
                'target_carbs_g',
                'target_fat_g',
                'general_tips',
              ],
            },
          },
          required: ['workout_days', 'nutrition_plan'],
        } as any,
      },
    });

    const responseText = geminiResponse.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response');
    }

    // 6. Parse and validate the response against Zod schema
    const parsedData = JSON.parse(responseText);
    const validatedData = workoutPlanZodSchema.parse(parsedData);

    // 7. Save the generated plan to workout_plans table in Supabase
    const planName = locale === 'tr' 
      ? `${training_days} Günlük ${goal === 'lose_weight' ? 'Kilo Verme' : goal === 'gain_muscle' ? 'Kas Yapma' : 'Form Koruma'} Planı`
      : `${training_days}-Day ${goal === 'lose_weight' ? 'Fat Loss' : goal === 'gain_muscle' ? 'Muscle Gain' : 'Fitness'} Plan`;

    const { data: savedPlan, error: saveError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: planName,
        language: locale,
        plan_data: validatedData,
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    return {
      success: true,
      plan: savedPlan,
    };

  } catch (err: any) {
    console.error('Error generating workout plan:', err);
    return {
      success: false,
      error: err.message || 'An error occurred during plan generation',
    };
  }
}

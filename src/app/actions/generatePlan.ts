'use server';

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { workoutPlanZodSchema } from '@/lib/schemas/workoutPlan';

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
      const activityLevelMapTr: Record<string, string> = {
        sedentary: 'Hareketsiz (Masa başı iş, spor yapmıyor)',
        lightly_active: 'Hafif Aktif (Haftada 1-3 gün hafif spor/hareket)',
        moderately_active: 'Orta Derece Aktif (Haftada 3-5 gün orta yoğunlukta spor)',
        very_active: 'Çok Aktif (Haftada 6-7 gün ağır spor/fiziksel iş)',
      };

      const dietPreferenceMapTr: Record<string, string> = {
        standard: 'Standart Beslenme (Her şeyi yer, kısıtlama yok)',
        vegetarian: 'Vejetaryen (Et yemez, bitkisel & süt ürünleri ağırlıklı)',
        vegan: 'Vegan (Hiçbir hayvansal gıda tüketmez)',
        keto: 'Ketojenik / Düşük Karbonhidrat',
        high_protein: 'Yüksek Proteinli Beslenme',
      };

      prompt = `
        Sen profesyonel bir kişisel antrenör ve beslenme uzmanısın.
        Aşağıdaki bilgilere sahip bir kullanıcı için haftalık, uygulanabilir ve gerçekçi bir antrenman programı ile destekleyici örnek beslenme rehberi oluştur:
        
        - HEDEF: ${goal === 'lose_weight' ? 'Kilo Vermek / Yağ Yakmak' : goal === 'gain_muscle' ? 'Kas Kütlesi Kazanmak / Hacim Almak' : 'Formu Korumak'}
        - YAŞ: ${age}
        - BOY: ${height} cm
        - KİLO: ${weight} kg
        - AKTİVİTE SEVİYESİ: ${activityLevelMapTr[activity_level] || activity_level}
        - HAFTALIK ANTRENMAN GÜNÜ: ${training_days} gün
        - EKİPMAN DURUMU: ${equipment === 'none' ? 'Ekipman Yok (Sadece Vücut Ağırlığı)' : equipment === 'dumbbells' ? 'Sadece Dumbbell var' : 'Tam donanımlı spor salonu'}
        - DİYET TERCİHİ: ${dietPreferenceMapTr[diet_preference] || diet_preference}
        
        KURALLAR:
        1. Egzersiz ve beslenme tavsiyelerini kullanıcının hedeflerine ve fiziksel durumuna göre kişiselleştir.
        2. Antrenman hareketlerini kesinlikle kullanıcının ekipman durumuna göre seç. Örneğin "Ekipman Yok" ise bench press, lat pulldown gibi hareketler önerme; şınav, squat, lunge gibi vücut ağırlığı hareketleri ver.
        3. Plan ${training_days} adet antrenman gününü içersin. Dinlenme günlerini de dahil edebilirsin ama workout_days dizisinde tam olarak ${training_days} adet aktif çalışma günü olsun.
        4. Egzersiz isimleri, öğün isimleri, açıklamalar ve ipuçları tamamen TÜRKÇE olsun.
        5. Kalori ve makro besin değerlerini (protein, karbonhidrat, yağ) kullanıcının hedeflerine uygun gerçekçi sayılar olarak hesapla.
      `;
    } else {
      const activityLevelMapEn: Record<string, string> = {
        sedentary: 'Sedentary (Little to no exercise, desk job)',
        lightly_active: 'Lightly Active (Light exercise 1-3 days/week)',
        moderately_active: 'Moderately Active (Moderate exercise 3-5 days/week)',
        very_active: 'Very Active (Heavy exercise 6-7 days/week or physical job)',
      };

      const dietPreferenceMapEn: Record<string, string> = {
        standard: 'Standard (Eats everything, no restrictions)',
        vegetarian: 'Vegetarian (No meat, eats dairy and plants)',
        vegan: 'Vegan (No animal products of any kind)',
        keto: 'Ketogenic / Low Carb',
        high_protein: 'High Protein',
      };

      prompt = `
        You are a professional personal trainer and nutritionist.
        Create a weekly, actionable, and realistic workout program and supporting nutrition guide for a user with the following details:
        
        - GOAL: ${goal === 'lose_weight' ? 'Lose Weight / Burn Fat' : goal === 'gain_muscle' ? 'Build Muscle / Gain Mass' : 'Maintain Fitness'}
        - AGE: ${age}
        - HEIGHT: ${height} cm
        - WEIGHT: ${weight} kg
        - ACTIVITY LEVEL: ${activityLevelMapEn[activity_level] || activity_level}
        - WEEKLY TRAINING DAYS: ${training_days} days
        - AVAILABLE EQUIPMENT: ${equipment === 'none' ? 'No Equipment (Bodyweight only)' : equipment === 'dumbbells' ? 'Dumbbells only' : 'Fully equipped gym'}
        - DIET PREFERENCE: ${dietPreferenceMapEn[diet_preference] || diet_preference}
        
        RULES:
        1. Tailor exercises and diet guidelines specifically for the user's details and goal.
        2. Select exercises strictly based on the user's equipment. E.g. if "No Equipment", do not suggest bench press or lat pulldowns; suggest pushups, bodyweight squats, lunges, etc.
        3. The plan must contain exactly ${training_days} active workout days in the workout_days array.
        4. All exercise names, meal descriptions, and tips must be in ENGLISH.
        5. Calculate realistic calories and macros (protein, carbs, fat) matching their goal.
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
      error: 'Failed to generate workout plan',
    };
  }
}

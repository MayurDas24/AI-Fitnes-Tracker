// FITNESS CALCULATIONS UTILITY FUNCTIONS
// All formulas based on scientifically validated equations

// ========== BMI CALCULATIONS ==========

/**
 * Calculate Body Mass Index
 * @param {number} weight - Weight in kilograms
 * @param {number} height - Height in centimeters
 * @returns {string} BMI value rounded to 1 decimal
 */
export function calculateBMI(weight, height) {
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  return bmi.toFixed(1)
}

/**
 * Get BMI category and color coding
 * @param {number} bmi - BMI value
 * @returns {object} Category name and color class
 */
export function getBMICategory(bmi) {
  if (bmi < 18.5) {
    return { category: 'UNDERWEIGHT', color: 'text-blue-500' }
  } else if (bmi >= 18.5 && bmi < 25) {
    return { category: 'NORMAL', color: 'text-green-500' }
  } else if (bmi >= 25 && bmi < 30) {
    return { category: 'OVERWEIGHT', color: 'text-yellow-500' }
  } else {
    return { category: 'OBESE', color: 'text-red-500' }
  }
}

// ========== BMR CALCULATIONS ==========

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 * Most accurate formula for modern populations
 * @param {number} weight - Weight in kilograms
 * @param {number} height - Height in centimeters
 * @param {number} age - Age in years
 * @param {string} gender - 'male' or 'female'
 * @returns {number} BMR in calories per day
 */
export function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161
  }
}

// ========== TDEE CALCULATIONS ==========

/**
 * Calculate Total Daily Energy Expenditure
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level key
 * @returns {number} TDEE in calories per day
 */
export function calculateTDEE(bmr, activityLevel) {
  const activityMultipliers = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Exercise 1-3 days/week
    moderate: 1.55,      // Exercise 3-5 days/week
    active: 1.725,       // Exercise 6-7 days/week
    veryActive: 1.9      // Hard exercise 6-7 days/week + physical job
  }
  
  return Math.round(bmr * activityMultipliers[activityLevel])
}

// ========== CALORIE GOALS ==========

/**
 * Calculate calorie goals based on fitness objective
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {string} goal - 'lose', 'maintain', or 'gain'
 * @returns {object} Calorie target and description
 */
export function calculateCalorieGoals(tdee, goal) {
  switch(goal) {
    case 'lose':
      return {
        calories: Math.round(tdee - 500), // Safe deficit for ~1 lb/week loss
        description: 'CALORIE DEFICIT FOR FAT LOSS'
      }
    case 'gain':
      return {
        calories: Math.round(tdee + 300), // Moderate surplus for lean gains
        description: 'CALORIE SURPLUS FOR MUSCLE GAIN'
      }
    case 'maintain':
    default:
      return {
        calories: Math.round(tdee),
        description: 'MAINTENANCE CALORIES'
      }
  }
}

// ========== MACRO CALCULATIONS ==========

/**
 * Calculate optimal macronutrient distribution
 * Based on goal-specific recommendations
 * @param {number} calories - Daily calorie target
 * @param {string} goal - 'lose', 'maintain', or 'gain'
 * @returns {object} Protein, carbs, fats in grams
 */
export function calculateMacros(calories, goal) {
  let proteinPercent, carbsPercent, fatsPercent
  
  switch(goal) {
    case 'lose':
      // Higher protein to preserve muscle during deficit
      proteinPercent = 0.35  // 35% protein
      carbsPercent = 0.35    // 35% carbs
      fatsPercent = 0.30     // 30% fats
      break
    case 'gain':
      // Higher carbs for energy and growth
      proteinPercent = 0.30  // 30% protein
      carbsPercent = 0.45    // 45% carbs
      fatsPercent = 0.25     // 25% fats
      break
    case 'maintain':
    default:
      // Balanced approach
      proteinPercent = 0.30  // 30% protein
      carbsPercent = 0.40    // 40% carbs
      fatsPercent = 0.30     // 30% fats
  }
  
  return {
    protein: Math.round((calories * proteinPercent) / 4),  // 4 calories per gram
    carbs: Math.round((calories * carbsPercent) / 4),      // 4 calories per gram
    fats: Math.round((calories * fatsPercent) / 9)         // 9 calories per gram
  }
}

// ========== BODY FAT PERCENTAGE ESTIMATION ==========

/**
 * Estimate body fat percentage using US Navy Method
 * @param {string} gender - 'male' or 'female'
 * @param {number} waist - Waist circumference in cm
 * @param {number} neck - Neck circumference in cm
 * @param {number} height - Height in cm
 * @param {number} hip - Hip circumference in cm (for females)
 * @returns {number} Estimated body fat percentage
 */
export function calculateBodyFat(gender, waist, neck, height, hip = null) {
  if (gender === 'male') {
    // Male formula
    const bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450
    return Math.max(3, Math.min(50, Math.round(bodyFat * 10) / 10)) // Clamp between 3-50%
  } else {
    // Female formula (requires hip measurement)
    if (!hip) return null
    const bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450
    return Math.max(10, Math.min(60, Math.round(bodyFat * 10) / 10)) // Clamp between 10-60%
  }
}

// ========== IDEAL WEIGHT RANGE ==========

/**
 * Calculate healthy weight range based on height
 * Uses BMI 18.5-24.9 range
 * @param {number} height - Height in centimeters
 * @returns {object} Min and max healthy weight in kg
 */
export function calculateIdealWeightRange(height) {
  const heightInMeters = height / 100
  const minWeight = 18.5 * (heightInMeters ** 2)
  const maxWeight = 24.9 * (heightInMeters ** 2)
  
  return {
    min: Math.round(minWeight * 10) / 10,
    max: Math.round(maxWeight * 10) / 10
  }
}

// ========== ONE REP MAX (1RM) ==========

/**
 * Calculate estimated one-rep max using Epley formula
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Reps completed (works best for 1-10 reps)
 * @returns {number} Estimated 1RM in kg
 */
export function calculate1RM(weight, reps) {
  if (reps === 1) return weight
  // Epley formula: 1RM = weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30))
}

// ========== WATER INTAKE ==========

/**
 * Calculate recommended daily water intake
 * @param {number} weight - Body weight in kg
 * @param {string} activityLevel - 'sedentary', 'moderate', 'active'
 * @returns {number} Water intake in liters
 */
export function calculateWaterIntake(weight, activityLevel = 'moderate') {
  // Base: 35ml per kg of body weight
  let baseWater = (weight * 35) / 1000 // Convert to liters
  
  // Adjust for activity
  const multipliers = {
    sedentary: 1.0,
    moderate: 1.15,
    active: 1.3
  }
  
  return Math.round(baseWater * multipliers[activityLevel] * 10) / 10
}

// ========== LEAN BODY MASS ==========

/**
 * Calculate lean body mass
 * @param {number} weight - Total body weight in kg
 * @param {number} bodyFatPercentage - Body fat percentage
 * @returns {number} Lean body mass in kg
 */
export function calculateLeanBodyMass(weight, bodyFatPercentage) {
  const fatMass = (weight * bodyFatPercentage) / 100
  return Math.round((weight - fatMass) * 10) / 10
}

// ========== CALORIE BURN ESTIMATION ==========

/**
 * Estimate calories burned during exercise
 * @param {string} activity - Type of activity
 * @param {number} duration - Duration in minutes
 * @param {number} weight - Body weight in kg
 * @returns {number} Estimated calories burned
 */
export function estimateCaloriesBurned(activity, duration, weight) {
  // MET (Metabolic Equivalent of Task) values
  const metValues = {
    walking: 3.5,
    running: 9.8,
    cycling: 7.5,
    swimming: 8.0,
    weightlifting: 6.0,
    yoga: 2.5,
    hiit: 12.0
  }
  
  const met = metValues[activity] || 5.0
  // Calories = (MET × weight in kg × duration in hours)
  return Math.round(met * weight * (duration / 60))
}

// ========== EXPORT ALL ==========
export default {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateCalorieGoals,
  calculateMacros,
  calculateBodyFat,
  calculateIdealWeightRange,
  calculate1RM,
  calculateWaterIntake,
  calculateLeanBodyMass,
  estimateCaloriesBurned
}

import { UserProfile, DiseaseInfo, PredictionRecord, SystemStats } from "../types";
import { supabase } from "./supabaseClient";

export const PRE_SEEDED_DISEASES: DiseaseInfo[] = [
  {
    id: "acne_vulgaris",
    name: "Acne Vulgaris",
    description: "A common skin condition that occurs when hair follicles become plugged with oil and dead skin cells, causing whiteheads, blackheads, or pimples.",
    symptoms: ["Whiteheads (closed plugged pores)", "Blackheads (open plugged pores)", "Small red, tender bumps (papules)", "Pimples (pustules) with pus at the tips", "Large, solid, painful lumps under the skin (nodules)"],
    causes: ["Excess oil (sebum) production", "Hair follicles clogged by oil and dead skin cells", "Bacteria (Cutibacterium acnes)", "Inflammation", "Hormonal changes (androgens)"],
    severity: "Low",
    treatment: ["Over-the-counter topical treatments (benzoyl peroxide, salicylic acid)", "Prescription topical retinoids", "Oral antibiotics (for moderate to severe acne)", "Gentle skin cleansing"],
    precautions: ["Avoid popping or squeezing pimples", "Wash face twice daily with a gentle, non-abrasive cleanser", "Use non-comedogenic makeup and skincare products", "Keep hair clean and off the face"],
    medicines: ["Benzoyl Peroxide", "Salicylic Acid", "Adapalene Gel", "Clindamycin Topical", "Doxycycline Oral"],
    specialist: "Dermatologist",
    emergencySigns: ["Severe painful swelling that may indicate a deep cyst or cellulitis", "Sudden high fever accompanied by widespread cystic lesions"],
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "eczema",
    name: "Eczema (Atopic Dermatitis)",
    description: "A chronic, inflammatory skin condition characterized by dry, itchy, and red patches on the skin, often beginning in early childhood.",
    symptoms: ["Intense itching, which may be severe especially at night", "Red to brownish-gray patches", "Small, raised bumps which may leak fluid and crust over when scratched", "Thickened, cracked, or scaly skin", "Raw, sensitive, swollen skin from scratching"],
    causes: ["Genetic variations affecting the skin's barrier function", "Immune system dysfunction", "Environmental triggers (soaps, detergents, allergens)", "Dry weather or low humidity"],
    severity: "Medium",
    treatment: ["Regular moisturization with thick creams or ointments", "Topical corticosteroid creams or ointments", "Oral antihistamines to reduce itching", "Avoiding known triggers and sudden temperature shifts"],
    precautions: ["Moisturize skin at least twice a day", "Take shorter, lukewarm baths or showers", "Use mild, soap-free cleansers", "Pat dry gently after bathing; do not rub"],
    medicines: ["Hydrocortisone Cream", "Tacrolimus Ointment", "Cetirizine (Antihistamine)", "Dupilumab (for severe cases)"],
    specialist: "Dermatologist / Allergist",
    emergencySigns: ["Skin looks infected (pus, red streaks, yellow crusts)", "Eczema flare-up is accompanied by a fever or feels hot to touch"],
    image: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "psoriasis",
    name: "Psoriasis",
    description: "An autoimmune disease that causes skin cells to build up rapidly, leading to thick, red, scaly patches (plaques) that are often itchy and painful.",
    symptoms: ["Red patches of skin covered with thick, silvery scales", "Small scaling spots (commonly seen in children)", "Dry, cracked skin that may bleed or itch", "Itching, burning, or soreness", "Thickened, pitted, or ridged nails"],
    causes: ["An overactive immune system accelerating skin cell turnover", "Genetic predisposition", "Triggers such as stress, skin injuries, infections, or cold weather"],
    severity: "Medium",
    treatment: ["Topical corticosteroids", "Vitamin D analogues", "Phototherapy (light therapy)", "Systemic oral medications or biologics (for moderate to severe cases)"],
    precautions: ["Keep skin well-moisturized", "Avoid harsh skin irritants and scratching", "Limit exposure to dry, cold weather", "Manage stress through relaxation techniques"],
    medicines: ["Clobetasol Propionate", "Calcipotriene Ointment", "Methotrexate", "Adalimumab (Biologic)"],
    specialist: "Dermatologist",
    emergencySigns: ["Widespread redness of the skin with painful pustules (pustular psoriasis)", "Fever, chills, and elevated heart rate with peeling skin (erythrodermic psoriasis)"],
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "melanoma",
    name: "Melanoma",
    description: "The most serious type of skin cancer, developing in the melanocytes (pigment-producing cells). Often characterized by changes in existing moles or new, unusual growths.",
    symptoms: ["ABCDE criteria: Asymmetry, Border irregularity, Color changes, Diameter >6mm, Evolving shape/size", "A sore that doesn't heal", "Pigment spreading from the border of a spot into surrounding skin", "Redness or new swelling beyond the border of a mole"],
    causes: ["DNA damage in skin cells primarily caused by ultraviolet (UV) radiation from sunlight or tanning beds", "Genetic factors / family history", "High mole count or fair skin"],
    severity: "Critical",
    treatment: ["Surgical excision of the lesion", "Sentinel lymph node biopsy (for staging)", "Immunotherapy", "Targeted therapy", "Radiation or chemotherapy if metastasized"],
    precautions: ["Wear broad-spectrum sunscreen (SPF 30+) daily", "Avoid direct sun exposure during peak hours (10 AM - 4 PM)", "Perform monthly self-skin exams using the ABCDE guide", "Avoid artificial tanning beds completely"],
    medicines: ["Pembrolizumab", "Nivolumab", "Dabrafenib", "Trametinib"],
    specialist: "Dermatologist / Surgical Oncologist",
    emergencySigns: ["Rapidly growing black or dark spot on the skin", "A mole that is actively bleeding, oozing, or painful", "New dark streak beneath a fingernail or toenail"],
    image: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "tinea",
    name: "Tinea (Fungal Skin Infection)",
    description: "A group of contagious fungal infections of the skin or scalp, commonly known as ringworm, athlete's foot (tinea pedis), or jock itch (tinea cruris).",
    symptoms: ["Ring-shaped rash with slightly raised, scaly edges", "Intense itching or burning sensation", "Red, peeling, or cracking skin between toes (athlete's foot)", "Bald, scaly patches on the scalp", "Slightly discolored, scaly patches on the trunk or limbs"],
    causes: ["Infection by dermatophytes (fungi) thriving in warm, moist areas", "Direct skin-to-skin contact with infected humans or animals", "Sharing towels, clothing, or personal hygiene items"],
    severity: "Low",
    treatment: ["Over-the-counter topical antifungal creams (clotrimazole, terbinafine)", "Prescription topical or oral antifungals for stubborn infections", "Keeping the infected area clean and completely dry"],
    precautions: ["Dry skin thoroughly after showering, especially between toes and skin folds", "Wear loose-fitting, breathable cotton clothing", "Do not share personal items (towels, hairbrushes, socks)", "Wear slippers in public locker rooms and showers"],
    medicines: ["Clotrimazole Cream", "Terbinafine Cream", "Ketoconazole Topical", "Fluconazole Oral"],
    specialist: "Primary Care Physician / Dermatologist",
    emergencySigns: ["Rash begins spreading rapidly with worsening pain, redness, and swelling", "Blisters or pus starting to develop inside the scaly patches, indicating secondary bacterial infection"],
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "rosacea",
    name: "Rosacea",
    description: "A chronic inflammatory skin condition that primarily affects the face, causing redness, visible blood vessels, and sometimes small, red, pus-filled bumps.",
    symptoms: ["Persistent facial redness", "Visible blood vessels (telangiectasia)", "Swollen red bumps or pustules", "Eye irritation or dryness (ocular rosacea)", "Enlarged nose skin (rhinophyma)"],
    causes: ["Genetics and family history", "Overactive immune system", "Environmental factors (spicy foods, alcohol, heat, UV light)", "Microscopic skin mites (Demodex)"],
    severity: "Medium",
    treatment: ["Topical gel or cream (metronidazole, azelaic acid)", "Oral antibiotics (doxycycline)", "Laser therapy to reduce visible blood vessels", "Trigger avoidance"],
    precautions: ["Apply sunscreen (SPF 30+) daily", "Avoid spicy foods, hot drinks, and alcohol", "Use gentle, fragrance-free facial cleansers", "Protect skin from wind and extreme cold"],
    medicines: ["Metronidazole Topical", "Azelaic Acid Cream", "Doxycycline Oral", "Ivermectin Cream"],
    specialist: "Dermatologist",
    emergencySigns: ["Severe eye pain, vision changes, or intense ocular redness", "Rapid swelling or severe tenderness on the facial skin"],
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "vitiligo",
    name: "Vitiligo",
    description: "An autoimmune condition in which the skin loses its pigment-producing cells (melanocytes), resulting in irregular white patches of skin.",
    symptoms: ["Patchy loss of skin color, usually first appearing on hands, face, and body openings", "Premature whitening or graying of hair on scalp, eyelashes, eyebrows, or beard", "Loss of color in tissues inside the mouth and nose (mucous membranes)"],
    causes: ["Autoimmune destruction of melanocytes", "Genetic inheritance", "Trigger events like severe sunburn, skin trauma, or chemical exposure"],
    severity: "Low",
    treatment: ["Corticosteroid creams", "Calcineurin inhibitors (tacrolimus)", "Phototherapy (Narrowband UVB)", "Depigmentation of remaining skin (for widespread vitiligo)"],
    precautions: ["Use broad-spectrum sunscreen to protect depigmented skin from sunburn", "Avoid getting tattoos or skin injuries which can trigger new patches", "Wear protective clothing in direct sun"],
    medicines: ["Fluticasone Propionate Cream", "Tacrolimus Ointment", "Pimecrolimus Cream", "Monobenzone (Depigmentation)"],
    specialist: "Dermatologist",
    emergencySigns: ["Sunburned patches of vitiligo skin that blister, bleed, or show signs of severe infection"],
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "urticaria",
    name: "Urticaria (Hives)",
    description: "Red, itchy, raised welts (wheals) on the skin that result from an allergic reaction or trigger, causing histamine release.",
    symptoms: ["Batches of red or skin-colored welts (wheals) appearing anywhere on the body", "Intense itching (pruritus)", "Welts vary in size, change shape, and fade/reappear repeatedly", "Swelling of the lips, eyelids, or throat (angioedema)"],
    causes: ["Allergic reaction to food, medicine, or pollen", "Infection or virus", "Physical triggers (heat, cold, friction, pressure)", "Stress or autoimmune factors"],
    severity: "Medium",
    treatment: ["Non-drowsy oral antihistamines", "H2 blockers (famotidine)", "Corticosteroids (for short-term severe hives)", "Injectable biologics (omalizumab)"],
    precautions: ["Avoid known allergic triggers", "Wear loose, light clothing", "Apply cool compresses to soothe itching", "Avoid hot baths and vigorous scratching"],
    medicines: ["Fexofenadine", "Cetirizine", "Diphenhydramine", "Prednisone Oral"],
    specialist: "Allergist / Dermatologist",
    emergencySigns: ["Difficulty breathing, swallowing, or catching your breath (anaphylaxis)", "Swelling of the tongue or throat", "Feeling dizzy, lightheaded, or fainting"],
    image: "https://images.unsplash.com/photo-1579684389782-64d84b5e9053?auto=format&fit=crop&w=600&q=80"
  }
];

function mapPredictionRecord(row: any): PredictionRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: row.user_name || undefined,
    disease_name: row.disease_name,
    confidence: row.confidence,
    image_data: row.image_data,
    prediction_time: row.prediction_time,
    details: {
      id: row.disease_name.toLowerCase().replace(/\s+/g, "_"),
      name: row.disease_name,
      description: row.description || "",
      symptoms: row.symptoms || [],
      causes: row.causes || [],
      severity: row.severity || "Low",
      treatment: row.treatment || [],
      precautions: row.precautions || [],
      medicines: row.medicines || [],
      specialist: row.specialist || "N/A",
      emergencySigns: row.emergencysigns || row.emergencySigns || []
    }
  };
}

export async function seedKnowledgeBaseIfNeeded(isAdmin: boolean = false): Promise<void> {
  try {
    const { data: existing, error } = await supabase
      .from("diseases")
      .select("id");
    
    if (error) {
      console.error("Error checking diseases count:", error);
      return;
    }
    
    const existingIds = new Set((existing || []).map(r => r.id));
    const toInsert = PRE_SEEDED_DISEASES.filter(d => !existingIds.has(d.id));

    if (toInsert.length > 0) {
      const dbDiseases = toInsert.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        symptoms: d.symptoms,
        causes: d.causes,
        severity: d.severity,
        treatment: d.treatment,
        precautions: d.precautions,
        medicines: d.medicines,
        specialist: d.specialist,
        emergencysigns: d.emergencySigns || []
      }));

      const { error: insertError } = await supabase
        .from("diseases")
        .insert(dbDiseases);
      
      if (insertError) {
        console.error("Error seeding diseases:", insertError);
      }
    }
  } catch (err) {
    console.error("Seeding database check failed:", err);
  }
}

export async function getDiseases(isAdmin: boolean = false): Promise<DiseaseInfo[]> {
  await seedKnowledgeBaseIfNeeded(isAdmin);
  try {
    const { data, error } = await supabase
      .from("diseases")
      .select("*");
    
    if (error) {
      console.error("Error fetching diseases from Supabase:", error);
      return PRE_SEEDED_DISEASES;
    }

    return (data || []).map((row: any) => {
      const preSeeded = PRE_SEEDED_DISEASES.find(d => d.id === row.id);
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        symptoms: row.symptoms || [],
        causes: row.causes || [],
        severity: row.severity || "Low",
        treatment: row.treatment || [],
        precautions: row.precautions || [],
        medicines: row.medicines || [],
        specialist: row.specialist || "N/A",
        emergencySigns: row.emergencysigns || row.emergencySigns || [],
        image: row.image || preSeeded?.image
      };
    });
  } catch (err) {
    console.error("Failed to get diseases:", err);
    return PRE_SEEDED_DISEASES;
  }
}

export async function saveDisease(disease: DiseaseInfo): Promise<void> {
  const dbDisease = {
    id: disease.id,
    name: disease.name,
    description: disease.description,
    symptoms: disease.symptoms,
    causes: disease.causes,
    severity: disease.severity,
    treatment: disease.treatment,
    precautions: disease.precautions,
    medicines: disease.medicines,
    specialist: disease.specialist,
    emergencysigns: disease.emergencySigns || []
  };

  const { error } = await supabase
    .from("diseases")
    .upsert(dbDisease);
  
  if (error) {
    console.error("Error saving disease:", error);
    throw error;
  }
}

export async function deleteDisease(diseaseId: string): Promise<void> {
  const { error } = await supabase
    .from("diseases")
    .delete()
    .eq("id", diseaseId);
  
  if (error) {
    console.error("Error deleting disease:", error);
    throw error;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const { error } = await supabase
    .from("users")
    .upsert({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      gender: profile.gender || null,
      age: profile.age || null,
      created_at: profile.created_at || new Date().toISOString()
    });
  
  if (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception fetching user profile:", err);
    return null;
  }
}

export async function savePrediction(record: PredictionRecord): Promise<void> {
  try {
    const userId = record.user_id;
    // Check if user exists to prevent foreign key constraint failures
    const { data: userExists, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (userCheckError) {
      console.error("Error checking user existence:", userCheckError);
    }

    if (!userExists) {
      const isDoctor = userId.includes("doctor") || userId.includes("admin");
      await supabase.from("users").upsert({
        id: userId,
        name: isDoctor ? "Dr. Alex (Sandbox Dermatologist)" : "Sandbox Patient",
        email: isDoctor ? "alex@admin.com" : "patient@sandbox.com",
        role: isDoctor ? "admin" : "user",
        created_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from("predictions")
      .upsert({
        id: record.id,
        user_id: record.user_id,
        disease_name: record.disease_name,
        confidence: record.confidence,
        description: record.details?.description || "",
        symptoms: record.details?.symptoms || [],
        causes: record.details?.causes || [],
        severity: record.details?.severity || "Low",
        treatment: record.details?.treatment || [],
        precautions: record.details?.precautions || [],
        medicines: record.details?.medicines || [],
        specialist: record.details?.specialist || "N/A",
        emergencysigns: record.details?.emergencySigns || [],
        image_data: record.image_data,
        prediction_time: record.prediction_time || new Date().toISOString()
      });
    
    if (error) {
      console.error("Error saving prediction:", error);
      throw error;
    }
  } catch (err) {
    console.error("Failed to save prediction record:", err);
    throw err;
  }
}

export async function deletePrediction(recordId: string): Promise<void> {
  const { error } = await supabase
    .from("predictions")
    .delete()
    .eq("id", recordId);
  
  if (error) {
    console.error("Error deleting prediction:", error);
    throw error;
  }
}

export async function getUserPredictions(userId: string): Promise<PredictionRecord[]> {
  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId)
      .order("prediction_time", { ascending: false });
    
    if (error) {
      console.error("Error fetching user predictions:", error);
      return [];
    }
    return (data || []).map(mapPredictionRecord);
  } catch (err) {
    console.error("Exception fetching user predictions:", err);
    return [];
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*");
    
    if (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching all users:", err);
    return [];
  }
}

export async function getAllPredictions(): Promise<PredictionRecord[]> {
  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .order("prediction_time", { ascending: false });
    
    if (error) {
      console.error("Error fetching all predictions:", error);
      return [];
    }
    return (data || []).map(mapPredictionRecord);
  } catch (err) {
    console.error("Exception fetching all predictions:", err);
    return [];
  }
}

export async function getSystemStats(): Promise<SystemStats> {
  try {
    const users = await getAllUsers();
    const predictions = await getAllPredictions();

    const diseaseCounts: Record<string, number> = {};
    let totalConfidence = 0;

    predictions.forEach((pred) => {
      const name = pred.disease_name;
      diseaseCounts[name] = (diseaseCounts[name] || 0) + 1;
      totalConfidence += pred.confidence;
    });

    const averageConfidence = predictions.length > 0 ? (totalConfidence / predictions.length) : 0;

    return {
      totalUsers: users.length || 1,
      totalPredictions: predictions.length,
      diseaseCounts,
      averageConfidence
    };
  } catch (err) {
    console.error("Failed to compute system stats:", err);
    return {
      totalUsers: 1,
      totalPredictions: 0,
      diseaseCounts: {},
      averageConfidence: 0
    };
  }
}

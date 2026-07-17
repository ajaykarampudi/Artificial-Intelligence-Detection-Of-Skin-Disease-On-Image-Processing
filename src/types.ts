export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface DiseaseInfo {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  causes: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  treatment: string[];
  precautions: string[];
  medicines: string[]; // Information Only
  specialist: string;
  emergencySigns?: string[];
  image?: string; // Optional image URL
}

export interface PredictionRecord {
  id: string;
  user_id: string;
  user_name?: string;
  disease_name: string;
  confidence: number;
  image_data: string; // base64 string
  prediction_time: string;
  // Included in prediction record to show detailed static state at prediction time
  details: DiseaseInfo;
}

export interface SystemStats {
  totalUsers: number;
  totalPredictions: number;
  diseaseCounts: Record<string, number>;
  averageConfidence: number;
}

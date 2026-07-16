import React, { useState, useEffect } from "react";
import { UserProfile, DiseaseInfo, PredictionRecord, SystemStats } from "./types";
import { getDiseases, getUserPredictions, getSystemStats, savePrediction, deletePrediction, saveUserProfile, getUserProfile } from "./lib/db";
import KnowledgeBase from "./components/KnowledgeBase";
import DashboardStats from "./components/DashboardStats";
import AdminPanel from "./components/AdminPanel";
import CameraCapture from "./components/CameraCapture";
import MedicalChatbot from "./components/MedicalChatbot";
import HospitalLocator from "./components/HospitalLocator";
import { generateDiagnosticPDF } from "./utils/pdfGenerator";
import { analyzeSkinImage } from "./lib/gemini";

const LOGO_IMAGE = "https://ik.imagekit.io/lz4kwvpha/Logo.jpeg";

import { 
  ShieldAlert, 
  Activity, 
  UploadCloud, 
  BookOpen, 
  History, 
  User, 
  Camera, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  Check, 
  Sparkles,
  RefreshCw,
  Stethoscope,
  Info,
  MessageSquare,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  MapPin,
  X
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'knowledge' | 'history' | 'admin' | 'profile' | 'hospitals'>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [loginName, setLoginName] = useState<string>("");
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginAge, setLoginAge] = useState<string>("");
  const [loginGender, setLoginGender] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [onboardingAge, setOnboardingAge] = useState<string>("");
  const [onboardingGender, setOnboardingGender] = useState<string>("");
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);

    const email = loginEmail.trim().toLowerCase();
    const name = loginName.trim();
    const password = loginPassword.trim();

    if (!email || !password || (isRegistering && (!name || !loginAge || !loginGender))) {
      setLoginError(isRegistering ? "Please enter your name, email address, password, age, and gender." : "Please enter your email address and password.");
      return;
    }

    let role: 'user' | 'admin' = 'user';
    if (email.endsWith("@gmail.com")) {
      role = 'user';
    } else if (email.endsWith("@doctor.com") || email.endsWith("@admin.com")) {
      role = 'admin';
    } else {
      setLoginError("Access Denied: Please use a valid email extension (@gmail.com, @doctor.com, or @admin.com) to access the system.");
      return;
    }

    const ageVal = loginAge ? parseInt(loginAge, 10) : undefined;
    const userId = email;

    try {
      if (isRegistering) {
        // Check if user already exists
        const existingProfile = await getUserProfile(userId);
        if (existingProfile) {
          setLoginError("An account with this email address already exists. Please Sign In.");
          return;
        }

        // Save the profile record in Supabase with password packed into the name column
        const dbProfile: UserProfile = {
          id: userId,
          name: `${name}|||${password}`,
          email: email,
          role: role,
          age: ageVal,
          gender: loginGender || undefined,
          created_at: new Date().toISOString()
        };
        await saveUserProfile(dbProfile);
        setCurrentUser({ ...dbProfile, name: name });
      } else {
        // Login mode
        const existingProfile = await getUserProfile(userId);
        if (existingProfile) {
          // Parse password and actual name
          if (existingProfile.name.includes("|||")) {
            const parts = existingProfile.name.split("|||");
            const actualName = parts[0];
            const storedPassword = parts[1];

            if (storedPassword === password) {
              setCurrentUser({ ...existingProfile, name: actualName });
            } else {
              setLoginError("Incorrect password. Please verify your credentials and try again.");
              return;
            }
          } else {
            // Legacy user without password stored - log in and upgrade them to store this password!
            const updatedProfile: UserProfile = {
              ...existingProfile,
              name: `${existingProfile.name}|||${password}`
            };
            await saveUserProfile(updatedProfile);
            setCurrentUser(existingProfile);
          }
        } else {
          setLoginError("Account not found. Please switch to the registration tab to create a new account.");
          return;
        }
      }

      setLoginName("");
      setLoginEmail("");
      setLoginPassword("");
      setLoginAge("");
      setLoginGender("");
      setIsRegistering(false);
    } catch (err: any) {
      console.error("Authentication error:", err);
      setLoginError("An error occurred during authentication. Please try again.");
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setOnboardingError(null);

    const ageVal = parseInt(onboardingAge, 10);
    if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) {
      setOnboardingError("Please enter a valid age between 1 and 120.");
      return;
    }

    if (!onboardingGender) {
      setOnboardingError("Please select your gender.");
      return;
    }

    try {
      const dbProfile = await getUserProfile(currentUser.id);
      const originalName = dbProfile ? dbProfile.name : currentUser.name;

      const updatedProfile: UserProfile = {
        ...currentUser,
        name: originalName,
        age: ageVal,
        gender: onboardingGender
      };

      await saveUserProfile(updatedProfile);

      setCurrentUser({
        ...updatedProfile,
        name: currentUser.name
      });
      
      setOnboardingAge("");
      setOnboardingGender("");
    } catch (err: any) {
      console.error("Error updating onboarding profile:", err);
      setOnboardingError("An error occurred while saving your profile. Please try again.");
    }
  }

  function toggleRole() {
    if (!currentUser) return;
    const nextRole = currentUser.role === "admin" ? "user" : "admin";
    const nextProfile: UserProfile = nextRole === "admin"
      ? {
          id: "sandbox-doctor-123",
          name: "Dr. Alex (Sandbox Dermatologist)",
          email: "alex@admin.com",
          role: "admin",
          created_at: currentUser.created_at
        }
      : {
          id: "sandbox-patient-456",
          name: "Sandbox Patient",
          email: "patient@sandbox.com",
          role: "user",
          created_at: currentUser.created_at
        };
    setCurrentUser(nextProfile);
    if (nextRole === "user" && activeTab === "admin") {
      setActiveTab("dashboard");
    }
  }

  // Core app data states
  const [diseases, setDiseases] = useState<DiseaseInfo[]>([]);
  const [userPredictions, setUserPredictions] = useState<PredictionRecord[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 1,
    totalPredictions: 0,
    diseaseCounts: {},
    averageConfidence: 0
  });

  // UI state managers
  const [loading, setLoading] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<PredictionRecord | null>(null);
  const [viewHistoryItem, setViewHistoryItem] = useState<PredictionRecord | null>(null);
  const [selectedScanIds, setSelectedScanIds] = useState<Record<string, boolean>>({});
  const [scanStatus, setScanStatus] = useState<string>("");
  const [imageQualityError, setImageQualityError] = useState<string | null>(null);

  // Zoom & Dermatological Lens states
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [polarizeMode, setPolarizeMode] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Authentication managed by `AuthScreen` in-app (local/sandbox profiles).

  useEffect(() => {
    if (currentUser) {
      loadApplicationData();
    }
  }, [currentUser]);

  // Handle click outside and Escape key press to close profile dropdown
  useEffect(() => {
    if (!showProfileDropdown) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowProfileDropdown(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const dropdownEl = document.getElementById("profile-dropdown");
      const buttonEl = document.getElementById("profile-button");
      
      if (dropdownEl && !dropdownEl.contains(target) && buttonEl && !buttonEl.contains(target)) {
        setShowProfileDropdown(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  async function loadApplicationData() {
    try {
      const dbDiseases = await getDiseases(currentUser?.role === "admin");
      setDiseases(dbDiseases);

      if (currentUser) {
        const history = await getUserPredictions(currentUser.id);
        setUserPredictions(history);

        if (currentUser.role === "admin") {
          const stats = await getSystemStats();
          setSystemStats(stats);
        } else {
          // Compute user-specific stats locally to avoid unauthorized reads on other user data
          const diseaseCounts: Record<string, number> = {};
          let totalConfidence = 0;
          history.forEach((pred) => {
            const name = pred.disease_name;
            diseaseCounts[name] = (diseaseCounts[name] || 0) + 1;
            totalConfidence += pred.confidence;
          });
          const averageConfidence = history.length > 0 ? (totalConfidence / history.length) : 0;
          setSystemStats({
            totalUsers: 1,
            totalPredictions: history.length,
            diseaseCounts,
            averageConfidence
          });
        }
      }
    } catch (err) {
      console.error("Error loading clinical data:", err);
    }
  }



  const toggleSelectScan = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedScanIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isAllSelected = userPredictions.length > 0 && userPredictions.every(p => selectedScanIds[p.id]);
  
  const toggleSelectAllScans = () => {
    if (isAllSelected) {
      setSelectedScanIds({});
    } else {
      const newSelections: Record<string, boolean> = {};
      userPredictions.forEach(p => {
        newSelections[p.id] = true;
      });
      setSelectedScanIds(newSelections);
    }
  };

  const deleteSelectedScans = async () => {
    const selectedIds = Object.keys(selectedScanIds).filter(id => selectedScanIds[id]);
    if (selectedIds.length === 0) {
      alert("Please select at least one scan record to delete.");
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the ${selectedIds.length} selected scan record(s)?`)) {
      try {
        setLoading(true);
        for (const id of selectedIds) {
          await deletePrediction(id);
        }
        setSelectedScanIds({});
        await loadApplicationData();
        alert("Successfully deleted the selected scan records.");
      } catch (err) {
        console.error("Error deleting scan history items:", err);
        alert("An error occurred while deleting some records. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteSingleScan = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this scan record?")) {
      try {
        setLoading(true);
        await deletePrediction(id);
        if (viewHistoryItem?.id === id) {
          setViewHistoryItem(null);
        }
        setSelectedScanIds(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        await loadApplicationData();
        alert("Record successfully deleted.");
      } catch (err) {
        console.error("Error deleting scan:", err);
        alert("Failed to delete the record. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const exportSelectedScans = () => {
    const selectedIds = Object.keys(selectedScanIds).filter(id => selectedScanIds[id]);
    const logsToExport = selectedIds.length > 0 
      ? userPredictions.filter(p => selectedScanIds[p.id])
      : userPredictions;

    if (logsToExport.length === 0) {
      alert("There are no scan records to export.");
      return;
    }

    alert(`Generating and downloading ${logsToExport.length} clinical PDF report(s)...`);
    logsToExport.forEach((item, index) => {
      setTimeout(() => {
        generateDiagnosticPDF(item);
      }, index * 400);
    });
  };

  // Handle Drag & Drop
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  }

  function resetLensInspector() {
    setZoomLevel(1);
    setBrightness(100);
    setContrast(100);
    setPolarizeMode(false);
    setPanOffset({ x: 0, y: 0 });
  }

  function processSelectedFile(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Invalid file type. Please upload a clinical JPEG, PNG, or WEBP image.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setDiagnosticResult(null);
      setImageQualityError(null);
      resetLensInspector();
    };
    reader.readAsDataURL(file);
  }

  function handleCameraCapture(base64Data: string) {
    setImagePreview(base64Data);
    setDiagnosticResult(null);
    setImageQualityError(null);
    setShowCamera(false);
    resetLensInspector();
  }

  async function triggerAIAssessment() {
    if (!imagePreview) return;
    setLoading(true);
    setScanStatus("Analyzing epidermal features...");

    try {
      const predictedDetails = await analyzeSkinImage(imagePreview, "image/jpeg", diseases);

      if (predictedDetails.is_valid_image === false) {
        setImageQualityError(predictedDetails.rejection_reason || "The uploaded image is not clear or does not appear to be a skin condition. Please upload a neat and quality image.");
        setDiagnosticResult(null);
        return;
      }

      setImageQualityError(null);

      // Create a prediction record and store in database
      const newPrediction: PredictionRecord = {
        id: "pred_" + Date.now(),
        user_id: currentUser!.id,
        user_name: currentUser!.name,
        disease_name: predictedDetails.disease_name,
        confidence: predictedDetails.confidence,
        image_data: imagePreview,
        prediction_time: new Date().toISOString(),
        details: {
          id: predictedDetails.disease_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_"),
          name: predictedDetails.disease_name,
          description: predictedDetails.description,
          symptoms: predictedDetails.symptoms,
          causes: predictedDetails.causes,
          severity: predictedDetails.severity,
          treatment: predictedDetails.treatment,
          precautions: predictedDetails.precautions,
          medicines: predictedDetails.medicines,
          specialist: predictedDetails.specialist,
          emergencySigns: predictedDetails.emergencySigns || []
        }
      };

      await savePrediction(newPrediction);
      setDiagnosticResult(newPrediction);

      // Re-fetch history & stats
      loadApplicationData();

    } catch (err: any) {
      console.error("Assessment Error:", err);
      alert("Diagnostic Assessment Failed: " + err.message);
    } finally {
      setLoading(false);
      setScanStatus("");
    }
  }

  function clearScanForm() {
    setImageFile(null);
    setImagePreview(null);
    setDiagnosticResult(null);
    setImageQualityError(null);
    resetLensInspector();
  }

  // Loading Splash Screen
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-medium text-xs tracking-wider uppercase">Initializing Core Telemetry...</p>
        </div>
      </div>
    );
  }



  const getSeverityColorClass = (severity: string) => {
    switch (severity) {
      case "Low":
        return "bg-teal-500/10 text-teal-600 border border-teal-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      case "High":
        return "bg-orange-500/10 text-orange-600 border border-orange-500/20";
      case "Critical":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border border-slate-500/20";
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        {/* Decorative background shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-8 space-y-6 relative z-10 animate-fade-in">
          <div className="text-center space-y-2">
            <img 
              src="https://ik.imagekit.io/lz4kwvpha/Logo.jpeg" 
              alt="Logo" 
              className="w-16 h-16 object-cover rounded-xl shadow-md border border-slate-200 mx-auto mb-2"
            />
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {isRegistering ? "Create DermAI Account" : "DermAI Clinical Portal"}
            </h2>
            <p className="text-slate-500 text-xs">
              {isRegistering ? "Join the artificial intelligence diagnostic suite" : "Access the artificial intelligence diagnostic suite"}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl text-xs transition-all outline-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. user@gmail.com, doctor@doctor.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl text-xs transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl text-xs transition-all outline-none"
              />
            </div>

            {isRegistering && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Age</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={loginAge}
                    onChange={(e) => setLoginAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl text-xs transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Gender</label>
                  <select
                    required
                    value={loginGender}
                    onChange={(e) => setLoginGender(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl text-xs transition-all outline-none cursor-pointer"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-xs tracking-wide uppercase rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 cursor-pointer"
            >
              {isRegistering ? "Register" : "Login"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setLoginError(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-500 font-bold transition-all hover:underline cursor-pointer"
              >
                {isRegistering ? "Already have an account? Sign In" : "Need an account? Register new account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentUser && (!currentUser.age || !currentUser.gender)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        {/* Decorative background shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-8 space-y-6 relative z-10 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm mb-2 text-blue-600">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Complete Your Profile</h2>
            <p className="text-slate-500 text-xs">Please provide your clinical demographic details to proceed</p>
          </div>

          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Age (Years)</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={onboardingAge}
                onChange={(e) => setOnboardingAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl text-xs transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Gender</label>
              <select
                required
                value={onboardingGender}
                onChange={(e) => setOnboardingGender(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-800 rounded-xl text-xs transition-all outline-none cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {onboardingError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{onboardingError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-xs tracking-wide uppercase rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
            >
              Save Profile & Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* GLOBAL HIGH-CONTRAST MEDICAL DISCLAIMER BANNER */}
      <div className="bg-rose-600 text-rose-100 py-2.5 px-4 text-[11px] md:text-xs text-center font-medium border-b border-rose-700 shadow-sm flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-200 animate-pulse shrink-0" />
        <span>
          <strong>CLINICAL WARNING:</strong> This system provides informational support powered by AI and does not replace professional medical diagnosis, physical consultation, or official prescriptions.
        </span>
      </div>

      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src={LOGO_IMAGE} 
            alt="Epidermal Analysis System Logo" 
            className="w-9 h-9 object-cover rounded-lg shadow-sm border border-slate-200" 
          />
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-sm md:text-base">Epidermal Analysis System</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Clinical Support Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && (
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Welcome to, <span className="text-slate-800 font-extrabold">{currentUser.name}</span>
            </span>
          )}
          <div className="relative">
            {currentUser && (
              <button
                id="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  showProfileDropdown
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm'
                }`}
                title="My Profile"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {showProfileDropdown && currentUser && (
              <div 
                id="profile-dropdown"
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-scale-in text-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-slate-900 text-sm">Account Profile</span>
                  <button 
                    onClick={() => setShowProfileDropdown(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-full">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-800 truncate">{currentUser.name}</h4>
                    <p className="text-slate-400 text-[10px] truncate font-mono">{currentUser.email}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-b border-slate-100 py-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gender:</span>
                    <span className="font-bold text-slate-700">{currentUser.gender || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Age:</span>
                    <span className="font-bold text-slate-700">{currentUser.age ? `${currentUser.age} Years` : "Not specified"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered:</span>
                    <span className="font-bold text-slate-700 font-mono">
                      {new Date(currentUser.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setShowProfileDropdown(false);
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold transition-all text-[11px] cursor-pointer mt-2 text-center"
                >
                  Sign Out
                </button>

              </div>
            )}
          </div>
        </div>
      </header>

      {/* DASHBOARD OUTER SHELL */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between gap-6">
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setViewHistoryItem(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <Activity className="w-4 h-4" /> Assessment Center
            </button>

            <button
              onClick={() => { setActiveTab('scan'); setViewHistoryItem(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'scan' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Scan & Analyse Skin
            </button>

            <button
              onClick={() => { setActiveTab('knowledge'); setViewHistoryItem(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'knowledge' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Pathology Library
            </button>



            <button
              onClick={() => { setActiveTab('history'); setViewHistoryItem(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <History className="w-4 h-4" /> Scan History Log
            </button>

            <button
              onClick={() => { setActiveTab('hospitals'); setViewHistoryItem(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'hospitals' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <MapPin className="w-4 h-4" /> Clinic Finder
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin'); setViewHistoryItem(null); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 border border-blue-200 transition-all cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-blue-600 bg-blue-50/50 hover:bg-blue-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" /> Admin Console
              </button>
            )}

          </nav>

        </aside>

        {/* PRIMARY VIEW STAGE */}
        <main className="flex-1 p-6 md:p-12 max-w-7xl w-full">
          {/* TAB 1: ASSESSMENT CENTER (DASHBOARD) */}
          {activeTab === 'dashboard' && !viewHistoryItem && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Overview Dashboard</h2>
                <p className="text-slate-500 text-sm mt-1">Real-time status overview and evaluation telemetry logs</p>
              </div>
              <DashboardStats predictions={userPredictions} stats={systemStats} isAdminView={currentUser.role === 'admin'} />
            </div>
          )}

          {/* TAB 2: SCAN & DIAGNOSE SKIN */}
          {activeTab === 'scan' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dermatological Image Assessment</h2>
                <p className="text-slate-500 text-sm mt-1">Upload high-resolution image files or trigger direct camera stream for scan</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: SCAN CONTAINER */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-600" /> Image Capture & Upload
                    </h3>
                    
                    {showCamera ? (
                      <CameraCapture 
                        onCapture={handleCameraCapture} 
                        onCancel={() => setShowCamera(false)} 
                      />
                    ) : (
                      <div className="space-y-4">
                        {imagePreview ? (
                          <div className="space-y-4 animate-fade-in">
                            {/* Clinical Image Preview */}
                            <div className="relative h-72 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner">
                              <img 
                                src={imagePreview} 
                                alt="Clinical Skin Target" 
                                className="max-h-full max-w-full object-contain pointer-events-none"
                              />
                            </div>
                          </div>
                        ) : (
                          /* Drag-and-drop file Zone */
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all flex flex-col items-center justify-center min-h-64 cursor-pointer relative overflow-hidden ${
                              isDragging 
                                ? 'border-blue-500 bg-blue-50/50' 
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                            }`}
                          >
                            <div className="space-y-4 py-4">
                              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl inline-block mx-auto">
                                <UploadCloud className="w-7 h-7" />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-800">Drag & Drop skin clinical image</p>
                                <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, WEBP files up to 15MB</p>
                              </div>
                              <div className="flex gap-2 justify-center">
                                <label className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] rounded-lg cursor-pointer transition-all">
                                  Browse Files
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileSelect} 
                                    className="hidden" 
                                  />
                                </label>
                                
                                <button
                                  onClick={() => setShowCamera(true)}
                                  className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Live Camera
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Assessment */}
                    {imagePreview && !showCamera && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={clearScanForm}
                          disabled={loading}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          onClick={triggerAIAssessment}
                          disabled={loading}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 mr-1" />
                              <span className="text-slate-700 font-medium">Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 mr-1" /> Run AI Assessment
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {loading && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center space-y-2 animate-pulse">
                      <p className="text-[11px] text-blue-700 font-bold uppercase tracking-wider">{scanStatus}</p>
                      <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full animate-[shimmer_1.5s_infinite] w-2/3" style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(to right, #2563eb 0%, #60a5fa 50%, #2563eb 100%)' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: RECOMMENDATIONS AND RESULTS */}
                <div className="lg:col-span-7 lg:max-h-[750px] lg:overflow-y-auto lg:pr-3 scroll-smooth">
                  {imageQualityError ? (
                    /* ERROR SCREEN (IMAGE NOT GOOD) */
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm space-y-4 animate-scale-in text-center">
                      <div className="bg-amber-100 text-amber-700 p-3.5 rounded-full inline-block mx-auto">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <div className="space-y-2 max-w-md mx-auto">
                        <h3 className="font-extrabold text-slate-900 text-base">Image Analysis Rejected</h3>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {imageQualityError}
                        </p>
                      </div>
                      <div className="pt-2">
                        <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                          💡 Tips for a Quality Scan:
                        </p>
                        <ul className="text-[11px] text-slate-500 mt-2 space-y-1 inline-block text-left">
                          <li>• Ensure direct, bright lighting (avoid shadows)</li>
                          <li>• Center the skin condition in the frame</li>
                          <li>• Keep the camera still to prevent blur</li>
                          <li>• Make sure the image captures clear skin details</li>
                        </ul>
                      </div>
                    </div>
                  ) : diagnosticResult ? (
                    /* DETAILED DIAGNOSTIC REPORT CARD */
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-scale-in space-y-0">
                      <div className="bg-slate-900 text-slate-100 p-5 relative">
                        <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded">
                          AI Diagnostic Report
                        </div>
                        
                        <div className="flex gap-3 items-center">
                          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-white">Diagnostic Report</h3>
                            <p className="text-slate-400 text-xs">Evaluated on {new Date(diagnosticResult.prediction_time).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        {/* Disease header and confidence level */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Most Likely Condition</h4>
                            <h3 className="text-lg font-bold text-slate-900 mt-1">{diagnosticResult.disease_name}</h3>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Certainty Match</span>
                              <span className="text-lg font-black text-blue-600 font-mono">{Math.round(diagnosticResult.confidence * 100)}%</span>
                            </div>
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${getSeverityColorClass(diagnosticResult.details.severity)}`}>
                              {diagnosticResult.details.severity} Severity
                            </span>
                          </div>
                        </div>

                        {/* Specialist recommendation */}
                        <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 flex items-center gap-3.5">
                          <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600 shrink-0">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold text-blue-950 uppercase tracking-wider">Recommended Clinical Specialist</h4>
                            <p className="text-sm font-semibold text-blue-900 mt-0.5">{diagnosticResult.details.specialist}</p>
                            <p className="text-slate-500 text-xs mt-1">Please schedule an evaluation with this medical branch.</p>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Condition Overview</h4>
                          <p className="text-slate-600 text-xs leading-relaxed">{diagnosticResult.details.description}</p>
                        </div>

                        {/* Grid lists: Symptoms, Causes, Treatment, Precautions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Common Symptoms
                              </h4>
                              <ul className="space-y-1.5">
                                {diagnosticResult.details.symptoms.map((s, i) => (
                                  <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                    <span className="text-slate-300">•</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Causes & Triggers
                              </h4>
                              <ul className="space-y-1.5">
                                {diagnosticResult.details.causes.map((c, i) => (
                                  <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                    <span className="text-slate-300">•</span> {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Supportive Treatment
                              </h4>
                              <ul className="space-y-1.5">
                                {diagnosticResult.details.treatment.map((t, i) => (
                                  <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                    <span className="text-slate-300">•</span> {t}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Critical Precautions
                              </h4>
                              <ul className="space-y-1.5">
                                {diagnosticResult.details.precautions.map((p, i) => (
                                  <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                    <span className="text-slate-300">•</span> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Medicines info block */}
                        {diagnosticResult.details.medicines && diagnosticResult.details.medicines.length > 0 && (
                          <div className="bg-slate-100/50 border border-slate-200 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                              Representative Drug Classes (Informational support only)
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {diagnosticResult.details.medicines.map((med, i) => (
                                <span key={i} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                                  {med}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                              DISCLAIMER: Always confirm any drug administration with an official prescription from your certified healthcare specialist.
                            </p>
                          </div>
                        )}

                        {/* Red flag warnings */}
                        {diagnosticResult.details.emergencySigns && diagnosticResult.details.emergencySigns.length > 0 && (
                          <div className="bg-rose-50 border border-rose-100 text-rose-950 p-5 rounded-lg">
                            <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5 mb-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" /> Warning Red Flags (Seek Immediate Emergency Care)
                            </h4>
                            <ul className="space-y-1.5 text-xs">
                              {diagnosticResult.details.emergencySigns.map((sign, i) => (
                                <li key={i} className="text-[11px] text-rose-700 font-medium flex items-start gap-1.5 leading-relaxed">
                                  <span className="w-1 h-1 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                                  {sign}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="border-t border-slate-200 pt-5 flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Report ID: {diagnosticResult.id}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => generateDiagnosticPDF(diagnosticResult)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Download Report as PDF"
                            >
                              <Download className="w-3.5 h-3.5" /> Download PDF Report
                            </button>
                            <button
                              onClick={clearScanForm}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              Reset Form
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PLACEHOLDER WHEN READY / IDLE */
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[350px] space-y-4">
                      <div className="bg-blue-50 text-blue-600 p-4 rounded-full">
                        <Stethoscope className="w-10 h-10 animate-pulse" />
                      </div>
                      <div className="max-w-sm space-y-2">
                        <h3 className="font-bold text-slate-900 text-base">Diagnostic Evaluation Report</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          Once you select or capture an image on the left and click <strong>"Run AI Assessment"</strong>, the detailed clinical evaluation report will generate in real time here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PATHOLOGY LIBRARY (KNOWLEDGE BASE) */}
          {activeTab === 'knowledge' && (
            <KnowledgeBase diseases={diseases} />
          )}

          {/* TAB 4: SCAN HISTORY LOG */}
          {activeTab === 'history' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Scan History Log</h2>
                <p className="text-slate-500 text-sm mt-1">Review, monitor, and print previously logged dermatological AI scan reports</p>
              </div>

              {viewHistoryItem ? (
                /* RENDER INDIVIDUAL SELECTED REPORT */
                <div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-5">
                    <button
                      onClick={() => setViewHistoryItem(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      ← Back to History List
                    </button>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => generateDiagnosticPDF(viewHistoryItem)}
                        className="px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Download Report as PDF"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF Report
                      </button>
                      <button
                        onClick={() => deleteSingleScan(viewHistoryItem.id)}
                        className="px-3 py-2 bg-rose-50 border border-rose-150 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Delete Report"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Report
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-2xl mx-auto">
                    <div className="bg-slate-900 text-slate-100 p-5 relative">
                      <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded">
                        Historical Record
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-white">Clinical Assessment</h3>
                          <p className="text-slate-400 text-xs">Logged on {new Date(viewHistoryItem.prediction_time).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detected Pathology</h4>
                          <h3 className="text-lg font-bold text-slate-900 mt-1">{viewHistoryItem.disease_name}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Certainty</span>
                            <span className="text-lg font-black text-blue-600 font-mono">{Math.round(viewHistoryItem.confidence * 100)}%</span>
                          </div>
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${getSeverityColorClass(viewHistoryItem.details.severity)}`}>
                            {viewHistoryItem.details.severity} Severity
                          </span>
                        </div>
                      </div>

                      {/* Display prediction image */}
                      {viewHistoryItem.image_data && (
                        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm max-w-xs mx-auto">
                          <img 
                            src={viewHistoryItem.image_data} 
                            alt="Scanned condition" 
                            className="w-full object-cover max-h-56"
                          />
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Description</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{viewHistoryItem.details.description}</p>
                      </div>

                      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3.5 flex items-center gap-3">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="text-[10px] font-bold text-blue-950 uppercase tracking-wider">Recommended care specialist</h4>
                          <p className="text-sm font-semibold text-blue-900 mt-0.5">{viewHistoryItem.details.specialist}</p>
                        </div>
                      </div>

                      {/* Grid lists: Symptoms, Causes, Treatment, Precautions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Core Symptoms
                            </h4>
                            <ul className="space-y-1.5">
                              {viewHistoryItem.details.symptoms.map((s, i) => (
                                <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-slate-300">•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Known Triggers
                            </h4>
                            <ul className="space-y-1.5">
                              {viewHistoryItem.details.causes.map((c, i) => (
                                <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-slate-300">•</span> {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Care Protocols
                            </h4>
                            <ul className="space-y-1.5">
                              {viewHistoryItem.details.treatment.map((t, i) => (
                                <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-slate-300">•</span> {t}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> General Precautions
                            </h4>
                            <ul className="space-y-1.5">
                              {viewHistoryItem.details.precautions.map((p, i) => (
                                <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-slate-300">•</span> {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {viewHistoryItem.details.medicines && viewHistoryItem.details.medicines.length > 0 && (
                        <div className="bg-slate-100/50 border border-slate-200 rounded-lg p-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Representative Drug Classes (Informational)
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {viewHistoryItem.details.medicines.map((med, i) => (
                              <span key={i} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Emergency warning signs */}
                      {viewHistoryItem.details.emergencySigns && viewHistoryItem.details.emergencySigns.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-950 p-5 rounded-lg">
                          <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" /> Warning Red Flags
                          </h4>
                          <ul className="space-y-1.5 text-xs">
                            {viewHistoryItem.details.emergencySigns.map((sign, i) => (
                              <li key={i} className="text-[11px] text-rose-700 font-medium flex items-start gap-1.5 leading-relaxed">
                                <span className="w-1 h-1 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                                {sign}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-4 text-center">
                        <button
                          onClick={() => setViewHistoryItem(null)}
                          className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Close Report View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* HISTORY LIST LOGS */
                <div className="space-y-4">
                  {userPredictions.length === 0 ? (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden text-center py-16">
                      <History className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                      <p className="text-slate-500 font-medium">Your scan history log is currently empty.</p>
                      <button 
                        onClick={() => setActiveTab('scan')} 
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
                      >
                        Perform First Scan
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* BULK ACTIONS HEADER PANEL */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAllScans}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            title="Select/Deselect All Scans"
                          />
                          <span className="text-xs font-bold text-slate-700">
                            {Object.values(selectedScanIds).filter(Boolean).length} of {userPredictions.length} Selected
                          </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={exportSelectedScans}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title="Export selected scans or all if none selected"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Export Logs</span>
                          </button>

                          <button
                            onClick={deleteSelectedScans}
                            disabled={Object.values(selectedScanIds).filter(Boolean).length === 0}
                            className={`flex-1 sm:flex-initial px-4 py-2 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                              Object.values(selectedScanIds).filter(Boolean).length === 0
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-rose-600 border-rose-700 hover:bg-rose-700 text-white"
                            }`}
                            title="Delete selected scans"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Selected</span>
                          </button>
                        </div>
                      </div>

                      {/* LIST CONTENT */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="divide-y divide-slate-150">
                          {userPredictions.map((pred) => {
                            const isSelected = !!selectedScanIds[pred.id];
                            return (
                              <div 
                                key={pred.id} 
                                onClick={() => setViewHistoryItem(pred)}
                                className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-250 cursor-pointer group hover:bg-slate-50/70 ${
                                  isSelected ? "bg-blue-50/20" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                                  {/* Selection checkbox */}
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleSelectScan(pred.id, e as any)}
                                    onClick={(e) => e.stopPropagation()} // stop parent row click to avoid navigation
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                                  />

                                  {pred.image_data ? (
                                    <img 
                                      src={pred.image_data} 
                                      alt="Skin Scan" 
                                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm group-hover:scale-105 transition-transform shrink-0"
                                    />
                                  ) : (
                                    <div className="bg-slate-100 p-2.5 rounded-lg text-slate-400 shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-extrabold text-slate-900 text-sm leading-none">{pred.disease_name}</h4>
                                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider shrink-0 ${getSeverityColorClass(pred.details?.severity || "Low")}`}>
                                        {pred.details?.severity || "Low"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Logged on {new Date(pred.prediction_time).toLocaleString()}</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5 font-medium truncate">Specialist Recommender: {pred.details?.specialist || "Dermatologist"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                  <div className="text-left sm:text-right">
                                    <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">Confidence Match</span>
                                    <span className="font-mono font-black text-blue-600 text-sm">{Math.round(pred.confidence * 100)}%</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => deleteSingleScan(pred.id, e)}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer bg-white"
                                      title="Delete this record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 p-1.5 rounded-lg transition-all">
                                      <FileText className="w-4 h-4" />
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SYSTEM ADMIN CONSOLE */}
          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <AdminPanel diseases={diseases} onRefreshDiseases={loadApplicationData} />
          )}

          {/* TAB 7: CLINIC & HOSPITAL FINDER */}
          {activeTab === 'hospitals' && (
            <HospitalLocator />
          )}


        </main>
      </div>

      {/* Persistent global floating DermAI Chat Bot */}
      <MedicalChatbot />
    </div>
  );
}

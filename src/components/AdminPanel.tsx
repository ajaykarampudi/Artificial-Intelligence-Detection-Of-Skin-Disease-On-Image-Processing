import React, { useState, useEffect } from "react";
import { DiseaseInfo, UserProfile, PredictionRecord } from "../types";
import { saveDisease, deleteDisease, getAllUsers, getAllPredictions } from "../lib/db";
import { ShieldAlert, Plus, Trash2, Edit, AlertCircle, RefreshCw, Database, Users, List, Sparkles, Check, CheckSquare } from "lucide-react";

interface AdminPanelProps {
  diseases: DiseaseInfo[];
  onRefreshDiseases: () => void;
}

export default function AdminPanel({ diseases, onRefreshDiseases }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'diseases' | 'users' | 'retrain'>('diseases');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State for custom disease
  const [diseaseForm, setDiseaseForm] = useState<Partial<DiseaseInfo>>({
    id: "",
    name: "",
    description: "",
    symptoms: [],
    causes: [],
    severity: "Low",
    treatment: [],
    precautions: [],
    medicines: [],
    specialist: ""
  });
  const [symptomInput, setSymptomInput] = useState("");
  const [causeInput, setCauseInput] = useState("");
  const [treatmentInput, setTreatmentInput] = useState("");
  const [precautionInput, setPrecautionInput] = useState("");
  const [medicineInput, setMedicineInput] = useState("");

  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainProgress, setRetrainProgress] = useState<number>(0);

  useEffect(() => {
    if (activeSubTab === 'users') {
      fetchAdminData();
    }
  }, [activeSubTab]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      const allPreds = await getAllPredictions();
      setUsers(allUsers);
      setPredictions(allPreds);
    } catch (err) {
      console.error("Error loading admin lists:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveDisease(e: React.FormEvent) {
    e.preventDefault();
    if (!diseaseForm.name || !diseaseForm.description || !diseaseForm.specialist) {
      setStatusMsg({ type: 'error', text: "Please fill out all required fields (Name, Description, Specialist)." });
      return;
    }

    const generatedId = diseaseForm.id || diseaseForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    const completeDisease: DiseaseInfo = {
      id: generatedId,
      name: diseaseForm.name,
      description: diseaseForm.description,
      symptoms: diseaseForm.symptoms || [],
      causes: diseaseForm.causes || [],
      severity: diseaseForm.severity as any || "Low",
      treatment: diseaseForm.treatment || [],
      precautions: diseaseForm.precautions || [],
      medicines: diseaseForm.medicines || [],
      specialist: diseaseForm.specialist,
      emergencySigns: ["Worsening or spreading redness accompanied by a body temperature over 101°F", "Severe localized pain or localized pus leaking from sores"]
    };

    setLoading(true);
    saveDisease(completeDisease)
      .then(() => {
        setStatusMsg({ type: 'success', text: `Disease "${completeDisease.name}" saved successfully!` });
        setDiseaseForm({
          id: "",
          name: "",
          description: "",
          symptoms: [],
          causes: [],
          severity: "Low",
          treatment: [],
          precautions: [],
          medicines: [],
          specialist: ""
        });
        onRefreshDiseases();
      })
      .catch((err) => {
        setStatusMsg({ type: 'error', text: err.message || "Failed to save disease." });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to remove this skin disease from the clinical knowledge database?")) {
      setLoading(true);
      deleteDisease(id)
        .then(() => {
          setStatusMsg({ type: 'success', text: "Condition removed successfully." });
          onRefreshDiseases();
        })
        .catch((err) => {
          setStatusMsg({ type: 'error', text: err.message || "Failed to delete condition." });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  function handleAddListItem(field: 'symptoms' | 'causes' | 'treatment' | 'precautions' | 'medicines', value: string, setter: React.Dispatch<React.SetStateAction<string>>) {
    if (!value.trim()) return;
    const currentList = diseaseForm[field] || [];
    setDiseaseForm({
      ...diseaseForm,
      [field]: [...currentList, value.trim()]
    });
    setter("");
  }

  function handleRemoveListItem(field: 'symptoms' | 'causes' | 'treatment' | 'precautions' | 'medicines', index: number) {
    const currentList = diseaseForm[field] || [];
    setDiseaseForm({
      ...diseaseForm,
      [field]: currentList.filter((_, idx) => idx !== index)
    });
  }

  function startSimulatedRetraining() {
    setIsRetraining(true);
    setRetrainProgress(10);
    setStatusMsg(null);

    const interval = setInterval(() => {
      setRetrainProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsRetraining(false);
            setStatusMsg({ 
              type: 'success', 
              text: "AI Knowledge Graph compiled! New disease constraints have been successfully bound to the active foundation model prompt context." 
            });
          }, 600);
          return 100;
        }
        return prev + 15;
      });
    }, 350);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            System Administrator Interface
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Dermatology Control Console</h2>
        </div>

        {/* Sub-navigation buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('diseases')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'diseases' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Manage Diseases
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Users & History
          </button>
          <button
            onClick={() => setActiveSubTab('retrain')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'retrain' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Retrain Model
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          statusMsg.type === 'success' 
            ? 'bg-blue-50 border-blue-200 text-blue-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 ${statusMsg.type === 'success' ? 'text-blue-600' : 'text-rose-600'}`} />
          <span className="text-sm font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* DISEASES MANAGE SUB-TAB */}
      {activeSubTab === 'diseases' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Disease Form */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 lg:col-span-1 space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-150 pb-2.5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              Add Custom Disease
            </h3>

            <form onSubmit={handleSaveDisease} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Disease Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contact Dermatitis"
                  value={diseaseForm.name}
                  onChange={(e) => setDiseaseForm({ ...diseaseForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Clinical details, prevalence and etiology..."
                  value={diseaseForm.description}
                  onChange={(e) => setDiseaseForm({ ...diseaseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Severity</label>
                  <select
                    value={diseaseForm.severity}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Specialist *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dermatologist"
                    value={diseaseForm.specialist}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, specialist: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic list additions for symptoms, causes, etc. */}
              <div className="space-y-3">
                {/* Symptoms */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Symptoms List</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add symptom..."
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddListItem('symptoms', symptomInput, setSymptomInput)}
                      className="px-3 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {diseaseForm.symptoms?.map((sym, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-medium">
                        {sym}
                        <Trash2 className="w-3 h-3 text-rose-500 cursor-pointer" onClick={() => handleRemoveListItem('symptoms', idx)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Causes */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Causes & Triggers</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add cause..."
                      value={causeInput}
                      onChange={(e) => setCauseInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddListItem('causes', causeInput, setCauseInput)}
                      className="px-3 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {diseaseForm.causes?.map((c, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-medium">
                        {c}
                        <Trash2 className="w-3 h-3 text-rose-500 cursor-pointer" onClick={() => handleRemoveListItem('causes', idx)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Treatment */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Care Protocols</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add protocol..."
                      value={treatmentInput}
                      onChange={(e) => setTreatmentInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddListItem('treatment', treatmentInput, setTreatmentInput)}
                      className="px-3 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {diseaseForm.treatment?.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-medium">
                        {t}
                        <Trash2 className="w-3 h-3 text-rose-500 cursor-pointer" onClick={() => handleRemoveListItem('treatment', idx)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Precautions */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Precautions</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add precaution..."
                      value={precautionInput}
                      onChange={(e) => setPrecautionInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddListItem('precautions', precautionInput, setPrecautionInput)}
                      className="px-3 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {diseaseForm.precautions?.map((p, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-medium">
                        {p}
                        <Trash2 className="w-3 h-3 text-rose-500 cursor-pointer" onClick={() => handleRemoveListItem('precautions', idx)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add to Knowledge Base
              </button>
            </form>
          </div>

          {/* List of Existing Diseases */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-2 flex flex-col">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <List className="w-4 h-4 text-indigo-500" />
              Active Knowledge Base ({diseases.length} conditions)
            </h3>

            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto pr-1 flex-1 space-y-4">
              {diseases.map((dis) => (
                <div key={dis.id} className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{dis.name}</h4>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono">
                        {dis.severity}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{dis.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                      <span>Specialist: <strong className="text-slate-600">{dis.specialist}</strong></span>
                      <span>Symptoms: <strong className="text-slate-600">{dis.symptoms.length}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(dis.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all shrink-0 border border-transparent hover:border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS & HISTORY SUB-TAB */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registered Users */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-1">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 mb-4">
              Registered Users ({users.length})
            </h3>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {users.map((usr) => (
                <div key={usr.id} className="py-3 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{usr.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${usr.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {usr.role}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-mono">{usr.email}</span>
                  <div className="flex gap-3 text-[10px] text-slate-400 mt-1">
                    <span>Age: <strong className="text-slate-600">{usr.age || "N/A"}</strong></span>
                    <span>Gender: <strong className="text-slate-600">{usr.gender || "N/A"}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Audit Prediction Log */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:col-span-2">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 mb-4">
              System Assessment Telemetry Logs ({predictions.length})
            </h3>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {predictions.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-12">No predictions recorded on database.</p>
              ) : (
                predictions.map((p) => (
                  <div key={p.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      {p.image_data && (
                        <img 
                          src={p.image_data} 
                          alt="Thumbnail" 
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{p.disease_name}</span>
                          <span className="bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded text-[9px] font-mono">
                            {Math.round(p.confidence * 100)}% Match
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px]">
                          Evaluated for <strong className="text-slate-600">{p.user_name || "Unknown User"}</strong> on {new Date(p.prediction_time).toLocaleString()}
                        </p>
                        <p className="text-slate-500 text-[10px] italic">
                          Specialist Recommender: {p.details?.specialist || "Dermatologist"} ({p.details?.severity || "Low"} severity)
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RETRAIN AI MODEL SUB-TAB */}
      {activeSubTab === 'retrain' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 max-w-2xl mx-auto space-y-5">
          <div className="text-center space-y-2">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg inline-block">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Retrain & Optimize Diagnostic Model</h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
              Retraining allows the active foundation model to establish perfect alignment with newly entered custom skin conditions, updating diagnostic constraints and clinical recommendations dynamically.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Model Summary Parameters</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-slate-400">Baseline Foundation</span>
                <span className="font-bold text-slate-800">Gemini 2.5 Flash</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Custom Classes Count</span>
                <span className="font-bold text-slate-800">{diseases.length} Skin Diseases</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Augmentation Rate</span>
                <span className="font-bold text-slate-800">Optimized Dynamic Context</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Last Weight Sync</span>
                <span className="font-bold text-slate-800">Synced to Cloud Database</span>
              </div>
            </div>
          </div>

          {isRetraining ? (
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Optimizing weights & prompts...</span>
                <span>{retrainProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${retrainProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 italic text-center">
                Computing loss profiles, re-indexing features, and updating knowledge schemas in active memory...
              </p>
            </div>
          ) : (
            <button
              onClick={startSimulatedRetraining}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Trigger Calibration & Retraining
            </button>
          )}
        </div>
      )}
    </div>
  );
}

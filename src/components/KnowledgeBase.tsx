import React, { useState } from "react";
import { DiseaseInfo } from "../types";
import { Search, Heart, Shield, HelpCircle, Activity, Stethoscope, AlertTriangle, ChevronRight, X } from "lucide-react";

interface KnowledgeBaseProps {
  diseases: DiseaseInfo[];
}

export default function KnowledgeBase({ diseases }: KnowledgeBaseProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);

  const filteredDiseases = diseases.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "Low":
        return "bg-emerald-50 text-emerald-700 border border-emerald-150";
      case "Medium":
        return "bg-amber-50 text-amber-700 border border-amber-150";
      case "High":
        return "bg-orange-50 text-orange-700 border border-orange-150";
      case "Critical":
        return "bg-rose-50 text-rose-700 border border-rose-150";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-150";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Disclaimer banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm leading-relaxed">
          <span className="font-semibold text-amber-800">Educational Resources & Medical Disclaimer:</span> All medical descriptions, treatment strategies, drug guidelines, and precautions listed in this knowledge base are provided solely for educational and informational support. They do not constitute diagnostic medical advice and are not a substitute for professional clinical consultation, assessment, or prescription.
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dermatological Knowledge Base</h2>
          <p className="text-slate-500 text-sm mt-1">Browse, search, and research clinical features of various skin diseases</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search skin conditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>
      </div>

      {filteredDiseases.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No skin conditions found matching "{searchTerm}"</p>
          <button 
            onClick={() => setSearchTerm("")}
            className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-xs underline cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiseases.map((disease) => (
            <div 
              key={disease.id}
              onClick={() => setSelectedDisease(disease)}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer flex flex-col group relative overflow-hidden"
            >
              {/* Top border accent based on severity */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                disease.severity === "Low" ? "bg-emerald-500" :
                disease.severity === "Medium" ? "bg-amber-500" :
                disease.severity === "High" ? "bg-orange-500" : "bg-rose-500"
              }`} />

              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${getSeverityBadgeColor(disease.severity)}`}>
                  {disease.severity}
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  {disease.specialist}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base flex items-center justify-between">
                {disease.name}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h3>

              <p className="text-slate-500 text-xs leading-relaxed mt-2 line-clamp-3 flex-1">
                {disease.description}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{disease.symptoms.length} core symptoms</span>
                <span>{disease.treatment.length} protocols</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disease Detail Dialog Overlay */}
      {selectedDisease && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-scale-in">
            {/* Header image/color zone */}
            <div className={`h-20 px-6 flex items-end relative ${
              selectedDisease.severity === "Low" ? "bg-gradient-to-r from-emerald-50 to-teal-50" :
              selectedDisease.severity === "Medium" ? "bg-gradient-to-r from-amber-50 to-orange-50" :
              selectedDisease.severity === "High" ? "bg-gradient-to-r from-orange-50 to-rose-50" : "bg-gradient-to-r from-rose-50 to-pink-50"
            }`}>
              <button
                onClick={() => setSelectedDisease(null)}
                className="absolute top-4 right-4 bg-white hover:bg-slate-150 text-slate-500 hover:text-slate-700 p-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-[-16px] bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                <Activity className={`w-3.5 h-3.5 ${
                  selectedDisease.severity === "Low" ? "text-emerald-500" :
                  selectedDisease.severity === "Medium" ? "text-amber-500" :
                  selectedDisease.severity === "High" ? "text-orange-500" : "text-rose-500"
                }`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${getSeverityBadgeColor(selectedDisease.severity)}`}>
                  {selectedDisease.severity} Severity
                </span>
              </div>
            </div>

            <div className="p-6 pt-8 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedDisease.name}</h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">{selectedDisease.description}</p>
              </div>

              {/* Recommended Specialist Box */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3.5 flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
                  <Stethoscope className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-blue-950 uppercase tracking-widest">Recommended Care Specialist</h4>
                  <p className="text-xs font-semibold text-blue-900 mt-0.5">{selectedDisease.specialist}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Symptoms & Causes */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 mb-2.5 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      Common Symptoms
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedDisease.symptoms.map((symptom, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 mb-2.5 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      Known Causes & Triggers
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedDisease.causes.map((cause, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Treatment, Precautions, Medicines */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 mb-2.5 flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                      Common Interventions
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedDisease.treatment.map((treat, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          {treat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 mb-2.5 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Precautions & Self-Care
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedDisease.precautions.map((prec, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          {prec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Informational medicines block */}
              {selectedDisease.medicines && selectedDisease.medicines.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    Representative Drug Classes (Informational Only)
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedDisease.medicines.map((med, i) => (
                      <span key={i} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                        {med}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">
                    Note: Names listed are representatives. NEVER take any systemic or topical medication without validation and proper clinical diagnosis/prescription from a licensed dermatologist.
                  </p>
                </div>
              )}

              {/* Red flag emergency warning */}
              {selectedDisease.emergencySigns && selectedDisease.emergencySigns.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 text-rose-950">
                  <h4 className="font-bold text-xs text-rose-800 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                    Critical Red Flag Symptoms
                  </h4>
                  <ul className="space-y-1">
                    {selectedDisease.emergencySigns.map((sign, i) => (
                      <li key={i} className="text-xs text-rose-700 font-medium flex items-start gap-1.5 leading-relaxed">
                        <span className="w-1 h-1 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedDisease(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Close Knowledge Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

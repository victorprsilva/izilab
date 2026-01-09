
export interface LabResultItem {
  abbreviation: string;
  value: string;
  referenceRange?: string; // New field for reference values
  abnormality: 'HIGH' | 'LOW' | 'NORMAL';
}

export interface NonLabData {
  examTitle: string;
  mainFindings: string[];
  impression: string;
}

export interface AnalyzedExam {
  id: string; // Added ID for list rendering
  patientInitials: string;
  patientAge: string;
  collectionDate?: string; // Format dd/mm
  category: 'LAB' | 'NON_LAB'; // Distinction
  results: LabResultItem[];
  nonLabData?: NonLabData; // Data for non-lab exams
  rawSummary: string; // Fallback string
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'success' | 'error';
  data: AnalyzedExam[] | null; // Changed from single object to Array
  error?: string;
}

export interface CustomAbbreviation {
  id: string;
  examName: string;
  abbreviation: string;
}

export interface AnalysisPreferences {
  showReferenceValues: boolean;
  groupDates: boolean;
}

export const COMMON_ABBREVIATIONS = {
  HEMOGLOBIN: 'Hb',
  HEMATOCRIT: 'Ht',
  LEUKOCYTES: 'Leuco',
  PLATELETS: 'Plq',
  GLUCOSE: 'Glic',
  UREA: 'Ur',
  CREATININE: 'Cr',
  SODIUM: 'Na',
  POTASSIUM: 'K',
  CHOLESTEROL_TOTAL: 'Col-T',
  HDL: 'HDL',
  LDL: 'LDL',
  TRIGLYCERIDES: 'TG',
  TSH: 'TSH',
  T4_FREE: 'T4L',
  PCR: 'PCR',
  VHS: 'VHS',
  TGO: 'TGO',
  TGP: 'TGP',
  GGT: 'GGT',
  FERRITIN: 'Ferr',
  VITAMIN_B12: 'Vit-B12',
  VITAMIN_D: 'Vit-D',
};

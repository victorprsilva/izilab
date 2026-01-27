
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalyzedExam, CustomAbbreviation, AnalysisPreferences } from "../types";

// Helper to convert File/Blob to Base64
const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Updated Schema to handle both LAB and NON_LAB types
const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      patientInitials: {
        type: Type.STRING,
        description: "The initials of the patient's name (e.g., MJR).",
      },
      patientAge: {
        type: Type.STRING,
        description: "The age of the patient (e.g., '45 anos', '3 meses').",
      },
      collectionDate: {
        type: Type.STRING,
        description: "The date(s) of the exam.",
      },
      category: {
        type: Type.STRING,
        enum: ["LAB", "NON_LAB"],
        description: "LAB for blood/urine tests with values. NON_LAB for Imaging (MRI, CT, USG), Pathology, or Medical Reports.",
      },
      // Fields for LAB
      labResults: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            abbreviation: {
              type: Type.STRING,
              description: "Standardized medical abbreviation.",
            },
            value: {
              type: Type.STRING,
              description: "The numeric value.",
            },
            referenceRange: {
              type: Type.STRING,
              description: "The reference range extracted from the document. Empty if not requested.",
            },
            abnormality: {
              type: Type.STRING,
              enum: ["HIGH", "LOW", "NORMAL"]
            }
          },
          required: ["abbreviation", "value", "abnormality"],
        },
      },
      // Fields for NON_LAB
      nonLabData: {
        type: Type.OBJECT,
        properties: {
            examTitle: {
                type: Type.STRING,
                description: "The title of the exam (e.g., 'Ressonância Magnética de Crânio', 'Ultrassom Abdominal').",
            },
            mainFindings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of the most important findings summarized.",
            },
            impression: {
                type: Type.STRING,
                description: "The final conclusion, impression, or diagnosis summary.",
            }
        },
        nullable: true
      }
    },
    required: ["patientInitials", "category"],
  }
};

export const analyzeLabExam = async (
  input: File[] | Blob | string, 
  customAbbreviations: CustomAbbreviation[] = [],
  preferences: AnalysisPreferences
): Promise<AnalyzedExam[]> => {
  if (!import.meta.env.GEMINI_API_KEY) {
    throw new Error("Chave de API não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
  
  // Prepare contents based on input type
  let parts: any[] = [];

  if (typeof input === 'string') {
    parts.push({
      text: `Analyze the following raw text from a medical document:\n\n${input}`
    });
  } else if (input instanceof Blob && !(input instanceof File)) {
    const base64 = await fileToBase64(input);
    parts.push({
      inlineData: {
        mimeType: input.type || 'audio/wav',
        data: base64,
      },
    });
    parts.push({
        text: "TRANSCRIPTION & ANALYSIS: The user has recorded an audio reading a medical exam. Transcribe precisely and analyze."
    });
  } else if (Array.isArray(input)) {
    const base64Promises = input.map(file => fileToBase64(file));
    const base64Results = await Promise.all(base64Promises);

    parts = base64Results.map((base64, index) => ({
      inlineData: {
        mimeType: input[index].type,
        data: base64,
      },
    }));
  }

  // Format custom abbreviations
  const customRulesText = customAbbreviations.length > 0 
    ? `\n    - **CUSTOM USER ABBREVIATIONS (PRIORITY)**:
       If it is a LAB EXAM, use these:
       ${customAbbreviations.map(ca => `- "${ca.examName}" MUST be abbreviated as "${ca.abbreviation}"`).join('\n       ')}
       ` 
    : '';

  const referenceValueRule = preferences.showReferenceValues
    ? "- **LAB REFS**: Include reference ranges in 'referenceRange'."
    : "- **LAB REFS**: Leave 'referenceRange' empty.";

  const systemInstruction = `
    You are an expert medical assistant designed to summarize medical documents for doctors.
    Your goal is to classify the document type (LAB vs NON_LAB) and extract relevant data strictly following the schema.

    *STRICT ANTI-DUPLICATION RULE*: 
    - *NEVER* repeat the same abbreviation for the SAME DATE in the output.
    - If a document contains multiple columns with different dates (historical evolution), extract ALL columns as separate objects, each with its specific 'date'.

    *STRICT NO-EVOLUTION RULE*:
    - *NEVER* combine values with arrows (->).
    - Always extract each result as a separate entry object with its specific date. 
    - Example: If Hemoglobin is 12 on 01/01 and 13 on 02/01, create TWO distinct objects in the array. Do not merge them into a string.

    *STEP 1: CLASSIFICATION*
    - *LAB*: Blood work, Urine tests, Biochemical profiles.
    - *NON_LAB*: Imaging (MRI, CT, X-Ray, USG), Pathology, Medical letters.

    *STEP 2: EXTRACTION RULES (LAB)*

    1. *ANONYMIZATION*: Patient Name -> Initials. Age -> Extract.
    2. *DATA*: Extract values, replacing dots with commas (decimal separator). Remove units.
    3. *ABNORMALITY*: Classify HIGH/LOW based on reference or medical knowledge.
    
    4. *STRICT HEMOGRAM RULES*:
       - INCLUDE ONLY: Hb, Ht, VCM, CHCM, RDW, Leuco, Neutro, Bast, Segmentados, Eosi, Baso, Linfo, Mono, Plaq.
       - *EXCLUDE*: VPM (MPV).

    5. *RENAL & ELECTROLYTES*:
       - *MANDATORY*: "Ureia" -> "Ur".
       - *MANDATORY*: "Creatinina" -> "Cr".
       - "Sodium" -> "Na", "Potassium" -> "K", "Phosphorus" -> "P", "Magnesium" -> "Mg", "Calcium" -> "Ca".

    6. *URINE (URINA)*:
       - *PROTEIN/CREATININE RATIO*: Extract ONLY as "P/CrU". Do not extract Urine Prot/Creat separately.
       - *SUFFIX RULE*: Use " U" for urine-specific blood markers (e.g., "Leuco U", "H U", "Glic U").
       - *EXCLUDE*: Eritr (count), Bili U, Urob U, Ascorbic Acid.

    7. *IMMUNOSUPPRESSANTS*: Tacrolimus (Fk), Sirolimus (Srl), Ciclosporina (Csa), Everolimus (Evr).

    8. *PCR*: "Proteína C Reativa" -> "PCR".

    ${referenceValueRule}
    ${customRulesText}

    * IF "NON_LAB" *:
    - Summarize findings in bullet points.
    - Provide a clear 'impression' (conclusion).

    *OUTPUT*: Return a JSON ARRAY of objects. Each object represents one patient's record.
  `;

  try {
    parts.push({
      text: "Analyze these medical documents. Identify patients. Classify as LAB or NON_LAB and extract data accordingly."
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: parts
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, 
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Falha ao gerar resposta.");

    const parsedData = JSON.parse(jsonText);
    const resultsArray = Array.isArray(parsedData) ? parsedData : [parsedData];

    return resultsArray.map((patientData: any) => {
        // Fallback summary logic
        let summaryString = "";
        if (patientData.category === 'NON_LAB' && patientData.nonLabData) {
            summaryString = `${patientData.nonLabData.examTitle}: ${patientData.nonLabData.impression}`;
        } else {
            summaryString = patientData.labResults
                ? patientData.labResults.map((r: any) => `${r.abbreviation} ${r.value}`).join(' / ')
                : "Sem dados";
        }

        return {
            id: crypto.randomUUID(),
            patientInitials: patientData.patientInitials || 'N/A',
            patientAge: patientData.patientAge || '',
            collectionDate: patientData.collectionDate || '',
            category: patientData.category || 'LAB',
            results: patientData.labResults || [],
            nonLabData: patientData.nonLabData || undefined,
            rawSummary: summaryString
        };
    });

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Não foi possível processar o documento. Tente novamente.");
  }
};
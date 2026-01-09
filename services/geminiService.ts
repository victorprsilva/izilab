
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
  if (!process.env.API_KEY) {
    throw new Error("Chave de API não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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

  const dateGroupingRule = preferences.groupDates
    ? `- **LAB HISTORY**: If multiple dates exist in a table, combine values with " -> ".`
    : `- **LAB HISTORY**: Treat each date as a separate entry or pick the most recent.`;

  const systemInstruction = `
    You are an expert medical assistant designed to summarize medical documents for doctors.
    Your goal is to classify the document type (LAB vs NON_LAB) and extract relevant data strictly following the schema.

    **STEP 1: CLASSIFICATION**
    - **LAB**: Blood work, Urine tests, Biochemical profiles with numeric tables.
    - **NON_LAB**: Imaging (MRI, CT, X-Ray, USG), Pathology reports, Biopsies, Discharge summaries, Medical letters.

    **STEP 2: EXTRACTION RULES**

    *** IF "LAB" ***:
    1. **ANONYMIZATION**: Patient Name -> Initials. Age -> Extract.
    2. **DATA**: Extract values, replacing dots with commas. Remove units.
    3. **ABNORMALITY**: Classify based on age (Pediatric vs Adult).
    4. **ABBREVIATIONS**: Use standard medical abbreviations (Hb, Leuco, Cr, TSH, etc.).
       - **CRITICAL**: "Proteína C Reativa" MUST be abbreviated as "PCR", NEVER "CRP".
    ${referenceValueRule}
    ${dateGroupingRule}
    ${customRulesText}

    *** IF "NON_LAB" ***:
    1. **ANONYMIZATION**: Patient Name -> Initials.
    2. **EXAM TITLE**: Identify the specific exam (e.g., "TC de Tórax", "Biópsia Gástrica").
    3. **MAIN FINDINGS**: Summarize the key findings in the body of the text. detailed but concise bullet points. Ignore boilerplate normal text if there are pathological findings.
    4. **IMPRESSION/CONCLUSION**: Extract the final conclusion or diagnostic impression verbatim or summarized.
    5. **LAB RESULTS**: Leave the 'labResults' array empty.

    **OUTPUT**:
    - Return a JSON ARRAY of objects.
    - Ensure 'category' is correctly set to "LAB" or "NON_LAB".
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
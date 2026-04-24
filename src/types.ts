export interface FieldMapping {
  placeholder: string;
  label: string;
  type: 'text' | 'date' | 'number';
}

export interface TemplateConfig {
  id: string; // Document ID of the Google Doc
  name: string;
  description?: string;
  fields: FieldMapping[];
}

export interface AutomationRecord {
  id: string;
  templateId: string;
  templateName: string;
  data: Record<string, string>;
  status: 'pending' | 'success' | 'failed';
  pdfId?: string;
  pdfLink?: string;
  errorMessage?: string;
  createdAt: number;
  userEmail: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  };
}

const API_BASE = '/api/email';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface DocumentSignatureEmailData {
  to: string;
  clientName: string;
  documentName: string;
  signerName: string;
  signatureUrl: string;
}

export interface DocumentSignedEmailData {
  to: string;
  clientName: string;
  documentName: string;
  signerName: string;
  signedAt: string;
}

export interface DeadlineReminderEmailData {
  to: string;
  processNumber: string;
  clientName: string;
  deadline: string;
  description: string;
  daysRemaining: number;
}

export interface PaymentReminderEmailData {
  to: string;
  clientName: string;
  amount: string;
  dueDate: string;
  description: string;
}

export interface UserInvitationEmailData {
  to: string;
  recipientName: string;
  inviterName: string;
  permissions: string;
  acceptUrl: string;
}

export interface TaskReminderEmailData {
  to: string;
  taskTitle: string;
  processNumber: string;
  clientName: string;
  dueDate: string;
  daysRemaining: number;
}

async function apiRequest<T>(endpoint: string, data: object): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to send email: ${response.statusText}`);
  }

  return response.json();
}

export async function sendEmail(options: SendEmailOptions) {
  return apiRequest('/send', options);
}

export async function sendDocumentSignatureRequest(data: DocumentSignatureEmailData) {
  return apiRequest('/document-signature', data);
}

export async function sendDocumentSignedNotification(data: DocumentSignedEmailData) {
  return apiRequest('/document-signed', data);
}

export async function sendDeadlineReminder(data: DeadlineReminderEmailData) {
  return apiRequest('/deadline-reminder', data);
}

export async function sendPaymentReminder(data: PaymentReminderEmailData) {
  return apiRequest('/payment-reminder', data);
}

export async function sendUserInvitation(data: UserInvitationEmailData) {
  return apiRequest('/user-invitation', data);
}

export async function sendTaskReminder(data: TaskReminderEmailData) {
  return apiRequest('/task-reminder', data);
}

// Batch notification functions (require authentication)
export interface BatchNotificationOptions {
  daysAhead?: number;
  notifyEmail: string;
}

async function authenticatedRequest<T>(endpoint: string, data: object, token: string): Promise<T> {
  const response = await fetch(`/api/notifications${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to send notifications: ${response.statusText}`);
  }

  return response.json();
}

export async function sendDeadlineReminders(options: BatchNotificationOptions, token: string) {
  return authenticatedRequest('/send-deadline-reminders', options, token);
}

export async function sendPaymentReminders(options: { daysAhead?: number }, token: string) {
  return authenticatedRequest('/send-payment-reminders', options, token);
}

export async function sendTaskReminders(options: BatchNotificationOptions, token: string) {
  return authenticatedRequest('/send-task-reminders', options, token);
}

export async function sendAllReminders(options: BatchNotificationOptions, token: string) {
  return authenticatedRequest('/send-all-reminders', options, token);
}

export const emailService = {
  send: sendEmail,
  documentSignatureRequest: sendDocumentSignatureRequest,
  documentSignedNotification: sendDocumentSignedNotification,
  deadlineReminder: sendDeadlineReminder,
  paymentReminder: sendPaymentReminder,
  userInvitation: sendUserInvitation,
  taskReminder: sendTaskReminder,
  batch: {
    deadlineReminders: sendDeadlineReminders,
    paymentReminders: sendPaymentReminders,
    taskReminders: sendTaskReminders,
    allReminders: sendAllReminders,
  },
};

export default emailService;

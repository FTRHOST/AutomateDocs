/**
 * Service to handle Google Docs and Drive operations
 */

export async function copyFile(fileId: string, accessToken: string): Promise<string> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Automated Copy - ${new Date().toISOString()}`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to copy template: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

export async function replacePlaceholders(fileId: string, data: Record<string, string>, accessToken: string): Promise<void> {
  const requests = Object.entries(data).map(([key, value]) => ({
    replaceAllText: {
      containsText: {
        text: `{{${key}}}`,
        matchCase: false,
      },
      replaceText: value,
    },
  }));

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to replace placeholders: ${error.error?.message || response.statusText}`);
  }
}

export async function convertToPdf(fileId: string, accessToken: string): Promise<Blob> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to convert document to PDF');
  }

  return await response.blob();
}

export async function uploadToDrive(blob: Blob, fileName: string, accessToken: string): Promise<{ id: string; webViewLink: string }> {
  // 1. Create file metadata
  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to upload PDF: ${error.error?.message || response.statusText}`);
  }

  return await response.json();
}

export async function deleteFile(fileId: string, accessToken: string): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function sendEmailWithLink(to: string, subject: string, link: string, accessToken: string): Promise<void> {
  const emailContent = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset="UTF-8"`,
    '',
    `<p>Halo,</p><p>Dokumen Anda telah berhasil dibuat. Anda dapat mengunduhnya melalui tautan berikut:</p>`,
    `<p><a href="${link}">${link}</a></p>`,
    `<p>Terima kasih telah menggunakan DocuFlow.</p>`
  ].join('\r\n');

  const base64Safe = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Safe,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send email: ${error.error?.message || response.statusText}`);
  }
}

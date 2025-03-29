// server/api/upload.post.ts
import { defineEventHandler, readMultipartFormData, setResponseStatus } from 'h3';
import fs from 'fs/promises'; // Use promises for async file operations
import path from 'path';

// Define the target directory for uploads relative to the project root
// Using 'public/uploads' makes files potentially accessible via URL later
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// server/api/upload.post.ts
import { defineEventHandler, readMultipartFormData, setResponseStatus } from 'h3';
import { put } from '@vercel/blob'; // <--- Importieren
import path from 'path';

// UPLOAD_DIR wird nicht mehr direkt zum Speichern benötigt, aber vielleicht für Dateinamen
// const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');


export default defineEventHandler(async (event) => {
  // Kein fs.mkdir mehr nötig für Blob Storage

  try {
    const formData = await readMultipartFormData(event);
    const fileData = formData?.find(item => item.name === 'imageFile'); // Muss 'imageFile' sein, wie im Frontend

    if (!fileData || !fileData.filename || !fileData.data) {
      setResponseStatus(event, 400);
      return { success: false, message: 'No file data received or file is empty.' };
    }

    // Validierungen (Dateityp, Größe) wie zuvor hier einfügen...
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
     if (!fileData.type || !allowedTypes.includes(fileData.type)) {
         setResponseStatus(event, 400);
         return { success: false, message: 'Invalid file type.' };
     }
     // Optional: Größenlimit prüfen...

    // --- HIER KOMMT VERCEL BLOB INS SPIEL ---

    // Sanitize filename (wichtig!)
    const originalFilename = fileData.filename;
    const sanitizedFilename = `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9._-]/g, '')}`; 
    const pathname = `uploads/${sanitizedFilename}`; 

    console.log(`Uploading to Vercel Blob at path: ${pathname}`);

    // Verwende 'put' zum Hochladen
    const { url } = await put(
        pathname,         // Der Pfad/Dateiname im Blob Store
        fileData.data,    // Der Inhalt der Datei (Buffer)
        {
          access: 'public', // Macht die Datei über die zurückgegebene URL öffentlich zugänglich
          // contentType: fileData.type // Optional: Setzt den Content-Type explizit
        }
    );

    console.log(`File uploaded successfully to Vercel Blob. URL: ${url}`);

    // --- Ende Vercel Blob ---

    // Rückgabe an das Frontend
    return {
      success: true,
      message: 'File uploaded successfully to Vercel Blob!',
      filePath: url // Die öffentliche URL der Datei zurückgeben
    };

  } catch (error: any) {
    console.error('Error handling file upload to Vercel Blob:', error);
     // Spezifische Fehler von Vercel Blob abfangen?
     // if (error instanceof BlobAccessError) { ... }

    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'An error occurred during file upload to Blob Storage.',
      error: error.message,
    };
  }
});
// server/api/upload.post.ts
import { defineEventHandler, readMultipartFormData, setResponseStatus } from 'h3';
import fs from 'fs/promises'; // Use promises for async file operations
import path from 'path';

// Define the target directory for uploads relative to the project root
// Using 'public/uploads' makes files potentially accessible via URL later
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export default defineEventHandler(async (event) => {
  // Ensure the upload directory exists
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true }); // Create directory if it doesn't exist
  } catch (error: any) {
    console.error(`Error creating upload directory ${UPLOAD_DIR}:`, error);
    setResponseStatus(event, 500); // Internal Server Error
    return {
      success: false,
      message: 'Server error: Could not create upload directory.',
      error: error.message,
    };
  }

  try {
    // Parse the multipart/form-data request
    const formData = await readMultipartFormData(event);

    // Find the file data in the parsed form data
    // The key 'imageFile' MUST match the key used in the frontend FormData.append()
    const fileData = formData?.find(item => item.name === 'imageFile');

    if (!fileData || !fileData.filename || !fileData.data) {
      setResponseStatus(event, 400); // Bad Request
      return { success: false, message: 'No file data received or file is empty.' };
    }

    // --- Basic Security: Validate file type on backend ---
    // Don't rely solely on frontend 'accept' attribute or Content-Type header sent by browser
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!fileData.type || !allowedTypes.includes(fileData.type)) {
        setResponseStatus(event, 400); // Bad Request
        return { success: false, message: 'Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.' };
    }

    // --- Security: Sanitize filename ---
    // Prevent directory traversal (e.g., ../../) and invalid characters
    const originalFilename = fileData.filename;
    const sanitizedFilename = `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const filePath = path.join(UPLOAD_DIR, sanitizedFilename);

    // --- Optional: File Size Limit (Example: 10MB) ---
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (fileData.data.length > maxSize) {
        setResponseStatus(event, 413); // Payload Too Large
        return { success: false, message: `File size exceeds the limit of ${maxSize / 1024 / 1024}MB.` };
    }


    // Write the file buffer to the specified path
    await fs.writeFile(filePath, fileData.data);

    console.log(`File uploaded successfully: ${filePath}`);

    // Construct the publicly accessible path (relative to the 'public' directory)
    const publicPath = `/uploads/${sanitizedFilename}`;

    // Return a success response
    return {
      success: true,
      message: 'File uploaded successfully!',
      filePath: publicPath // Send back the relative path for frontend use
    };

  } catch (error: any) {
    console.error('Error handling file upload:', error);
    setResponseStatus(event, 500); // Internal Server Error
    return {
      success: false,
      message: 'An error occurred during file upload.',
      error: error.message,
    };
  }
});
<template>
    <div>
      <h1>Upload an Image</h1>
  
      <input type="file" @change="handleFileChange" accept="image/*" />
  
      <div v-if="previewUrl" style="margin-top: 1rem;">
        <h3>Preview:</h3>
        <img :src="previewUrl" alt="Image preview" style="max-width: 300px; max-height: 300px;" />
      </div>
  
      <button @click="uploadImage" :disabled="!selectedFile || uploading" style="margin-top: 1rem;">
        {{ uploading ? 'Uploading...' : 'Upload Image' }}
      </button>
  
      <p v-if="uploadSuccess" style="color: green; margin-top: 1rem;">
        {{ uploadSuccess }}
      </p>
      <p v-if="uploadError" style="color: red; margin-top: 1rem;">
        Upload failed: {{ uploadError }}
      </p>
      <p v-if="uploadedFilePath" style="margin-top: 0.5rem;">
        File available at: <a :href="uploadedFilePath" target="_blank">{{ uploadedFilePath }}</a>
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  const selectedFile = ref<File | null>(null);
  const previewUrl = ref<string | null>(null);
  const uploading = ref(false);
  const uploadError = ref<string | null>(null);
  const uploadSuccess = ref<string | null>(null);
  const uploadedFilePath = ref<string | null>(null);
  
  // --- Handle File Selection ---
  const handleFileChange = (event: Event) => {
    // Reset states
    uploadError.value = null;
    uploadSuccess.value = null;
    uploadedFilePath.value = null;
    selectedFile.value = null;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value); // Clean up previous preview
      previewUrl.value = null;
    }
  
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
  
      // Basic validation (optional, backend should always validate too)
      if (!file.type.startsWith('image/')) {
          uploadError.value = 'Please select an image file.';
          return;
      }
      // Optional: Size validation (e.g., max 5MB)
      // const maxSize = 5 * 1024 * 1024; // 5MB
      // if (file.size > maxSize) {
      //     uploadError.value = `File is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`;
      //     return;
      // }
  
  
      selectedFile.value = file;
  
      // Create image preview
      previewUrl.value = URL.createObjectURL(file);
    }
  };
  
  // --- Handle Upload ---
  const uploadImage = async () => {
    if (!selectedFile.value) {
      uploadError.value = 'Please select a file first.';
      return;
    }
  
    uploading.value = true;
    uploadError.value = null;
    uploadSuccess.value = null;
    uploadedFilePath.value = null;
  
    // Create FormData to send the file
    const formData = new FormData();
    // The key 'imageFile' MUST match the key expected by the backend API
    formData.append('imageFile', selectedFile.value, selectedFile.value.name);
  
    try {
      // Use Nuxt's $fetch utility
      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // No need to set 'Content-Type': 'multipart/form-data',
        // $fetch (or the browser's fetch) handles it automatically with FormData
      });
  
      // Assuming the backend returns { success: true, message: '...', filePath: '...' }
      if (response.success) {
        uploadSuccess.value = response.message || 'File uploaded successfully!';
        uploadedFilePath.value = response.filePath; // Get the path from backend response
        // Optionally clear the file input and preview after successful upload
        // selectedFile.value = null;
        // if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
        // previewUrl.value = null;
        // const inputElement = document.querySelector('input[type="file"]') as HTMLInputElement | null;
        // if(inputElement) inputElement.value = '';
  
      } else {
         throw new Error(response.message || 'Backend reported an error.');
      }
  
    } catch (error: any) {
      console.error('Upload error:', error);
      // Handle specific error messages if the backend provides them
      if (error.data && error.data.message) {
           uploadError.value = error.data.message;
      } else if (error.message) {
          uploadError.value = error.message;
      }
       else {
          uploadError.value = 'An unexpected error occurred during upload.';
      }
    } finally {
      uploading.value = false;
    }
  };
  
  // --- Cleanup ---
  // Revoke the object URL when the component is unmounted to prevent memory leaks
  import { onUnmounted } from 'vue';
  onUnmounted(() => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
  });
  </script>
  
  <style scoped>
  /* Add some basic styling */
  input[type="file"] {
    margin-bottom: 1rem;
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  img {
      display: block;
      margin-top: 0.5rem;
  }
  </style>
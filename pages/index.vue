<template>
    <div class="upload-container">
      <h1>Bild hochladen! ✨</h1>
  
      <label for="file-upload" class="custom-file-upload">
        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
        {{ selectedFile ? selectedFile.name : 'Wähle ein Bild aus...' }}
      </label>
      <input id="file-upload" type="file" @change="handleFileChange" accept="image/*" />
  
      <div v-if="previewUrl" class="image-preview">
        <h3>Vorschau:</h3>
        <img :src="previewUrl" alt="Image preview" />
      </div>
  
      <button @click="uploadImage" :disabled="!selectedFile || uploading" class="upload-button">
        <span v-if="uploading">Lade hoch... ⏳</span>
        <span v-else>Jetzt hochladen! 🚀</span>
      </button>
  
      <div v-if="uploadSuccess || uploadError" :class="['status-message', uploadSuccess ? 'success' : 'error']">
        <span v-if="uploadSuccess">✅ {{ uploadSuccess }}</span>
        <span v-if="uploadError">❌ Hoppla! {{ uploadError }}</span>
      </div>
  
      <div v-if="uploadedFilePath" class="file-actions">
        <span>Super! Hier ist dein Bild:</span>
        <div class="button-group">
          <button @click="copyToClipboard" class="action-button copy-button" title="Link in Zwischenablage kopieren">
            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            Link kopieren
          </button>
          <a :href="uploadedFilePath" target="_blank" class="action-button open-button" title="Bild in neuem Tab öffnen">
            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            Bild öffnen
          </a>
        </div>
         <span v-if="linkCopiedMessage" class="copy-success-message">{{ linkCopiedMessage }}</span>
      </div>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onUnmounted } from 'vue';
  
  const selectedFile = ref<File | null>(null);
  const previewUrl = ref<string | null>(null);
  const uploading = ref(false);
  const uploadError = ref<string | null>(null);
  const uploadSuccess = ref<string | null>(null);
  const uploadedFilePath = ref<string | null>(null);
  // NEU: Ref für die "Kopiert"-Nachricht
  const linkCopiedMessage = ref<string | null>(null);
  
  // --- Handle File Selection ---
  const handleFileChange = (event: Event) => {
    uploadError.value = null;
    uploadSuccess.value = null;
    uploadedFilePath.value = null;
    linkCopiedMessage.value = null; // Nachricht zurücksetzen
    selectedFile.value = null;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      if (!file.type.startsWith('image/')) {
          uploadError.value = 'Bitte wähle eine Bilddatei aus.';
          return;
      }
      selectedFile.value = file;
      previewUrl.value = URL.createObjectURL(file);
    }
  };
  
  // --- Handle Upload ---
  const uploadImage = async () => {
    if (!selectedFile.value) {
      uploadError.value = 'Wähle zuerst eine Datei aus.';
      return;
    }
    uploading.value = true;
    uploadError.value = null;
    uploadSuccess.value = null;
    uploadedFilePath.value = null;
    linkCopiedMessage.value = null; // Nachricht zurücksetzen
    const formData = new FormData();
    formData.append('imageFile', selectedFile.value, selectedFile.value.name);
  
    try {
      const response = await $fetch('/api/upload', { method: 'POST', body: formData });
      if (response.success) {
        uploadSuccess.value = response.message || 'Datei erfolgreich hochgeladen!';
        uploadedFilePath.value = response.filePath; // Enthält jetzt die Vercel URL
      } else {
         throw new Error(response.message || 'Backend meldet einen Fehler.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.data && error.data.message) {
           uploadError.value = error.data.message;
      } else if (error.message) {
          uploadError.value = error.message;
      } else {
          uploadError.value = 'Ein unerwarteter Fehler ist aufgetreten.';
      }
    } finally {
      uploading.value = false;
    }
  };
  
  // NEU: Funktion zum Kopieren des Links
  const copyToClipboard = async () => {
    if (!uploadedFilePath.value) return;
  
    try {
      await navigator.clipboard.writeText(uploadedFilePath.value);
      linkCopiedMessage.value = 'Link kopiert!'; // Erfolgsmeldung setzen
      // Nachricht nach einiger Zeit ausblenden
      setTimeout(() => {
        linkCopiedMessage.value = null;
      }, 2000); // Nachricht nach 2 Sekunden ausblenden
    } catch (err) {
      console.error('Fehler beim Kopieren in die Zwischenablage:', err);
      linkCopiedMessage.value = 'Kopieren fehlgeschlagen!'; // Fehlermeldung setzen
       setTimeout(() => {
        linkCopiedMessage.value = null;
      }, 2000);
    }
  };
  
  
  // --- Cleanup ---
  onUnmounted(() => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
  });
  
  </script>
  
  <style scoped src="~/assets/css/uploader-styles.css"></style>
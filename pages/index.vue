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
  
      <p v-if="uploadedFilePath" class="file-link">
        Super! Hier ist dein Bild: <a :href="uploadedFilePath" target="_blank">{{ uploadedFilePath.split('/').pop() }}</a>
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  // Der <script setup> Teil bleibt exakt gleich wie im vorherigen Beispiel!
  // Stellen Sie sicher, dass alle 'ref's und Funktionen (handleFileChange, uploadImage)
  // sowie der 'onUnmounted' Hook vorhanden sind.
  
  import { ref, onUnmounted } from 'vue';
  
  const selectedFile = ref<File | null>(null);
  const previewUrl = ref<string | null>(null);
  const uploading = ref(false);
  const uploadError = ref<string | null>(null);
  const uploadSuccess = ref<string | null>(null);
  const uploadedFilePath = ref<string | null>(null);
  
  // --- Handle File Selection ---
  const handleFileChange = (event: Event) => {
    uploadError.value = null;
    uploadSuccess.value = null;
    uploadedFilePath.value = null;
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
    const formData = new FormData();
    formData.append('imageFile', selectedFile.value, selectedFile.value.name);
  
    try {
      const response = await $fetch('/api/upload', { method: 'POST', body: formData });
      if (response.success) {
        uploadSuccess.value = response.message || 'Datei erfolgreich hochgeladen!';
        uploadedFilePath.value = response.filePath;
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
  
  // --- Cleanup ---
  onUnmounted(() => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
  });
  
  </script>
  
  <style scoped>
  /* Import Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@400;600&display=swap');
  
  /* Grundlegende Container-Styles */
  .upload-container {
    max-width: 500px;
    margin: 40px auto;
    padding: 30px;
    background: linear-gradient(135deg, #e0f2f7, #d0f0e0); /* Heller, sanfter Farbverlauf */
    border-radius: 25px; /* Stark abgerundete Ecken */
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Weicher Schatten */
    text-align: center;
    font-family: 'Poppins', sans-serif; /* Standard Schriftart */
    color: #333;
  }
  
  /* Überschrift */
  h1 {
    font-family: 'Pacifico', cursive; /* Verspielte Schriftart */
    color: #00796b; /* Dunkleres Grün */
    font-size: 2.8em;
    margin-bottom: 30px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  }
  
  /* Verstecke den Standard-Datei-Input */
  input[type="file"] {
    display: none;
  }
  
  /* Style das Label wie einen Button */
  .custom-file-upload {
    border: 2px dashed #4db6ac; /* Mittleres Grün, gestrichelt */
    border-radius: 15px;
    display: inline-block;
    padding: 12px 20px;
    cursor: pointer;
    background-color: #ffffff;
    color: #00796b;
    font-weight: 600;
    transition: all 0.3s ease;
    margin-bottom: 20px;
    display: flex; /* Für Icon und Text nebeneinander */
    align-items: center;
    justify-content: center;
    gap: 8px; /* Abstand zwischen Icon und Text */
  }
  
  .custom-file-upload:hover {
    background-color: #e0f2f1; /* Sehr helles Grün */
    border-color: #26a69a; /* Etwas dunkleres Grün */
    transform: translateY(-2px); /* Kleiner Hover-Effekt */
  }
  
  /* Vorschau-Bereich */
  .image-preview {
    margin-top: 25px;
    margin-bottom: 25px;
    padding: 15px;
    border: 1px solid #b2dfdb; /* Helles Grün */
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 15px;
  }
  
  .image-preview h3 {
    margin: 0 0 10px 0;
    font-size: 1em;
    color: #00796b;
    font-weight: 600;
  }
  
  .image-preview img {
    max-width: 100%;
    max-height: 250px;
    display: block;
    margin: 0 auto;
    border-radius: 10px; /* Abgerundete Ecken für das Bild */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* Upload Button */
  .upload-button {
    background: linear-gradient(45deg, #26a69a, #00897b); /* Grüner Farbverlauf */
    color: white;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1.1em;
    border: none;
    padding: 15px 30px;
    border-radius: 50px; /* Stark abgerundet / Pille */
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 121, 107, 0.4); /* Passender Schatten */
    margin-top: 10px;
    display: inline-flex; /* Für Icon/Text im Button-Span */
    align-items: center;
    gap: 8px;
  }
  
  .upload-button:hover:not(:disabled) {
    background: linear-gradient(45deg, #00897b, #00796b);
    transform: scale(1.05); /* Vergrößern bei Hover */
    box-shadow: 0 6px 20px rgba(0, 121, 107, 0.5);
  }
  
  .upload-button:active:not(:disabled) {
      transform: scale(0.98); /* Kleiner Klick-Effekt */
  }
  
  .upload-button:disabled {
    background: #a0a0a0; /* Grau für deaktiviert */
    cursor: not-allowed;
    opacity: 0.7;
    box-shadow: none;
  }
  
  /* Status Nachrichten */
  .status-message {
    margin-top: 20px;
    padding: 12px 20px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .status-message.success {
    background-color: #e8f5e9; /* Helles Grün */
    color: #2e7d32; /* Dunkles Grün */
    border: 1px solid #a5d6a7;
  }
  
  .status-message.error {
    background-color: #ffebee; /* Helles Rot */
    color: #c62828; /* Dunkles Rot */
    border: 1px solid #ef9a9a;
  }
  
  /* Link zur hochgeladenen Datei */
  .file-link {
      margin-top: 15px;
      font-size: 0.9em;
      color: #555;
  }
  
  .file-link a {
      color: #00796b; /* Grün */
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s ease;
  }
  
  .file-link a:hover {
      color: #004d40; /* Dunkleres Grün */
      text-decoration: underline;
  }
  </style>
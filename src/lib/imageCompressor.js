

/**
 * Utility function to compress images client-side before upload or local storage saving.
 * Keeps receipt legible while reducing file sizes by up to 95% (e.g. 4MB down to ~100KB).
 * Now natively supports iPhone HEIC images by converting them on the fly to JPEG.
 *
 * @param {File} file - The uploaded image file
 * @param {number} maxWidth - Bounding box max width
 * @param {number} maxHeight - Bounding box max height
 * @param {number} quality - JPEG compression quality (0.0 to 1.0)
 * @returns {Promise<string>} Bbox cropped base64 JPEG string
 */
export async function compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.7) {
  // If the file is a HEIC/HEIF format (common on iPhones), convert it to JPEG client-side first!
  const isHEIC = file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif') || 
                 file.type === 'image/heic' || 
                 file.type === 'image/heif';
  
  if (isHEIC) {
    try {
      console.log("HEIC file detected. Converting to JPEG on the fly...");
      // Dynamically import heic2any to prevent startup errors, improve initial bundle size, and handle CJS/ESM modules safely
      const heic2anyModule = await import("heic2any");
      const heic2any = heic2anyModule.default || heic2anyModule;
      
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.7
      });
      // heic2any might return an array of blobs if it is a multi-frame image. Take the first one.
      const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
      file = new File([singleBlob], newName, { type: "image/jpeg" });
      console.log("HEIC conversion successful. Converted file name:", file.name);
    } catch (err) {
      console.error("HEIC conversion failed, trying standard fallback:", err);
    }
  }

  return new Promise((resolve, reject) => {
    // If it is a PDF or other file that cannot be drawn onto a canvas, read as a raw data URL
    if (file.type === "application/pdf" || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio boundaries
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target.result); // Fallback to raw base64 if canvas context is missing
          return;
        }

        // Apply professional document-scanner filter: convert to grayscale and boost contrast 
        // to make faint receipt thermal ink dark and paper background pure white
        ctx.filter = 'grayscale(1) contrast(1.5) brightness(1.02)';

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        console.error("Image loading error in compressor:", err);
        resolve(event.target.result); // Fallback to uncompressed base64
      };
    };
    reader.onerror = (err) => {
      console.error("FileReader error in compressor:", err);
      reject(err);
    };
  });
}

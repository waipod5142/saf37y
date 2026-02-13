import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const defaultOptions = {
    maxSizeMB: 1, // 1MB max file size
    maxWidthOrHeight: 1920, // Max dimension (suitable for inspection photos)
    useWebWorker: true, // Use web worker for better performance
    quality: 0.8, // 80% quality (good balance of quality vs size)
    ...options
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    
    // Log compression results
    console.log(`Image compressed: ${file.name} - ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
};

// Preset compression settings for different use cases
export const CompressionPresets = {
  // For detailed defect documentation (higher quality)
  defectImages: {
    maxSizeMB: 1.2,
    maxWidthOrHeight: 1920,
    quality: 0.9,
    useWebWorker: true
  },
  
  // For general inspection images (balanced)
  generalImages: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    quality: 0.85,
    useWebWorker: true
  },
  
  // For thumbnail previews (aggressive compression)
  thumbnails: {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 800,
    quality: 0.7,
    useWebWorker: true
  }
};
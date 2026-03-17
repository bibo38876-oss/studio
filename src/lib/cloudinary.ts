'use client';
/**
 * @fileOverview Cloudinary upload utility for Timgad application.
 */

const CLOUD_NAME = 'df4ogwkyn';
const UPLOAD_PRESET = 'ml_default'; // استخدام الإعداد الافتراضي لـ Cloudinary

/**
 * Uploads a file to Cloudinary and returns the secure URL.
 * @param file The file to upload.
 * @returns Promise with the secure URL of the uploaded image.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || 'فشل رفع الصورة';
      
      // مساعدة المستخدم في حال كان الخطأ متعلقاً بالإعدادات
      if (errorMessage.includes('Upload preset not found')) {
        throw new Error('خطأ: لم يتم العثور على إعداد الرفع. يرجى الدخول إلى إعدادات Cloudinary وتفعيل Unsigned Upload باسم ml_default');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
}

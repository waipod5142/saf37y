"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { MoveIcon, XIcon } from "lucide-react";
import { compressImage, CompressionPresets } from "@/lib/imageCompression";
import { toast } from "sonner";

export type ImageUpload = {
  id: string;
  url: string;
  file?: File;
};

type Props = {
  images?: ImageUpload[];
  onImagesChange: (images: ImageUpload[]) => void;
  urlFormatter?: (image: ImageUpload) => string;
  compressionType?: 'defect' | 'general' | 'thumbnail';
};

export default function MultiImageUploader({
  images = [],
  onImagesChange,
  urlFormatter,
  compressionType = 'general',
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  console.log({ images });

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Add loading state
    setIsCompressing(true);
    
    try {
      // Get compression settings based on type
      const compressionOptions = compressionType === 'defect' 
        ? CompressionPresets.defectImages
        : compressionType === 'thumbnail'
        ? CompressionPresets.thumbnails
        : CompressionPresets.generalImages;

      const compressedImages = await Promise.all(
        files.map(async (file, index) => {
          // Only compress image files
          if (file.type.startsWith('image/')) {
            try {
              const compressedFile = await compressImage(file, compressionOptions);
              
              return {
                id: `${Date.now()}-${index}-${compressedFile.name}`,
                url: URL.createObjectURL(compressedFile),
                file: compressedFile,
              };
            } catch (error) {
              console.error(`Failed to compress ${file.name}:`, error);
              // Fall back to original file if compression fails
              return {
                id: `${Date.now()}-${index}-${file.name}`,
                url: URL.createObjectURL(file),
                file,
              };
            }
          } else {
            // Return non-image files unchanged
            return {
              id: `${Date.now()}-${index}-${file.name}`,
              url: URL.createObjectURL(file),
              file,
            };
          }
        })
      );
      
      onImagesChange([...images, ...compressedImages]);
      
      // Show success message with compression info
      const totalOriginalSize = files.reduce((sum, file) => sum + file.size, 0);
      const totalCompressedSize = compressedImages.reduce((sum, img) => sum + (img.file?.size || 0), 0);
      const compressionRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1);
      
      if (totalOriginalSize > totalCompressedSize) {
        toast.success(`Images compressed by ${compressionRatio}% (${(totalOriginalSize / 1024 / 1024).toFixed(1)}MB → ${(totalCompressedSize / 1024 / 1024).toFixed(1)}MB)`);
      }
      
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error('Failed to process images');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }

      const items = Array.from(images);
      const [reorderedImage] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedImage);
      onImagesChange(items);
    },
    [onImagesChange, images]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updatedImages = images.filter((image) => image.id !== id);
      onImagesChange(updatedImages);
    },
    [onImagesChange, images]
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <input
        className="hidden"
        ref={uploadInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleInputChange}
      />
      <Button
        className="w-full"
        variant="outline"
        type="button"
        disabled={isCompressing}
        onClick={() => uploadInputRef?.current?.click()}
      >
        {isCompressing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
            Compressing images...
          </>
        ) : (
          'Upload images'
        )}
      </Button>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="property-images" direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {images.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id} index={index}>
                  {(provided) => (
                    <div
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      className="relative p-2"
                    >
                      <div className="bg-gray-100 rounded-lg flex gap-2 items-center overflow-hidden">
                        <div className="size-16 w-16 h-16 relative">
                          <Image
                            src={urlFormatter ? urlFormatter(image) : image.url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium">
                            Image {index + 1}
                          </p>
                          {index === 0 && (
                            <Badge variant="success">Featured Image</Badge>
                          )}
                        </div>
                        <div className="flex items-center p-2">
                          <button
                            className="text-red-500 p-2"
                            onClick={() => handleDelete(image.id)}
                          >
                            <XIcon />
                          </button>
                          <div className="text-gray-500">
                            <MoveIcon />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

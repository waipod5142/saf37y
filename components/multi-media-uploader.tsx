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
import { MoveIcon, XIcon, VideoIcon, ImageIcon } from "lucide-react";
import { compressImage, CompressionPresets } from "@/lib/imageCompression";
import { toast } from "sonner";

export type MediaUpload = {
  id: string;
  url: string;
  file?: File;
  type: 'image' | 'video';
};

type Props = {
  media?: MediaUpload[];
  onMediaChange: (media: MediaUpload[]) => void;
  urlFormatter?: (media: MediaUpload) => string;
  compressionType?: 'defect' | 'general' | 'thumbnail';
  maxVideoSizeMB?: number;
};

export default function MultiMediaUploader({
  media = [],
  onMediaChange,
  urlFormatter,
  compressionType = 'general',
  maxVideoSizeMB = 50, // 50MB default max video size
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log({ media });

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Add loading state
    setIsProcessing(true);

    try {
      // Get compression settings based on type
      const compressionOptions = compressionType === 'defect'
        ? CompressionPresets.defectImages
        : compressionType === 'thumbnail'
        ? CompressionPresets.thumbnails
        : CompressionPresets.generalImages;

      const processedMedia = await Promise.all(
        files.map(async (file, index) => {
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');

          // Validate video size
          if (isVideo) {
            const fileSizeMB = file.size / 1024 / 1024;
            if (fileSizeMB > maxVideoSizeMB) {
              toast.error(`Video ${file.name} exceeds ${maxVideoSizeMB}MB limit (${fileSizeMB.toFixed(1)}MB)`);
              return null;
            }
          }

          // Only compress image files
          if (isImage) {
            try {
              const compressedFile = await compressImage(file, compressionOptions);

              return {
                id: `${Date.now()}-${index}-${compressedFile.name}`,
                url: URL.createObjectURL(compressedFile),
                file: compressedFile,
                type: 'image' as const,
              };
            } catch (error) {
              console.error(`Failed to compress ${file.name}:`, error);
              // Fall back to original file if compression fails
              return {
                id: `${Date.now()}-${index}-${file.name}`,
                url: URL.createObjectURL(file),
                file,
                type: 'image' as const,
              };
            }
          } else if (isVideo) {
            // Return video files unchanged
            return {
              id: `${Date.now()}-${index}-${file.name}`,
              url: URL.createObjectURL(file),
              file,
              type: 'video' as const,
            };
          } else {
            toast.error(`File ${file.name} is not an image or video`);
            return null;
          }
        })
      );

      // Filter out nulls from invalid files
      const validMedia = processedMedia.filter((m): m is MediaUpload => m !== null);
      onMediaChange([...media, ...validMedia]);

      // Show success message with compression info for images
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        const totalOriginalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
        const compressedImages = validMedia.filter(m => m.type === 'image');
        const totalCompressedSize = compressedImages.reduce((sum, img) => sum + (img.file?.size || 0), 0);
        const compressionRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1);

        if (totalOriginalSize > totalCompressedSize) {
          toast.success(`Images compressed by ${compressionRatio}% (${(totalOriginalSize / 1024 / 1024).toFixed(1)}MB → ${(totalCompressedSize / 1024 / 1024).toFixed(1)}MB)`);
        }
      }

      const videoCount = validMedia.filter(m => m.type === 'video').length;
      if (videoCount > 0) {
        toast.success(`${videoCount} video(s) added`);
      }

    } catch (error) {
      console.error('Media processing error:', error);
      toast.error('Failed to process media files');
    } finally {
      setIsProcessing(false);
      // Reset input so the same file can be uploaded again if needed
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }

      const items = Array.from(media);
      const [reorderedMedia] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedMedia);
      onMediaChange(items);
    },
    [onMediaChange, media]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updatedMedia = media.filter((item) => item.id !== id);
      onMediaChange(updatedMedia);
    },
    [onMediaChange, media]
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <input
        className="hidden"
        ref={uploadInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleInputChange}
      />
      <Button
        className="w-full"
        variant="outline"
        type="button"
        disabled={isProcessing}
        onClick={() => uploadInputRef?.current?.click()}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
            Processing media...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            <VideoIcon className="mr-2 h-4 w-4" />
            Upload Images/Videos
          </>
        )}
      </Button>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="media-uploads" direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {media.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      className="relative p-2"
                    >
                      <div className="bg-gray-100 rounded-lg flex gap-2 items-center overflow-hidden">
                        <div className="size-16 w-16 h-16 relative">
                          {item.type === 'image' ? (
                            <Image
                              src={urlFormatter ? urlFormatter(item) : item.url}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <VideoIcon className="h-8 w-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium">
                            {item.type === 'image' ? 'Image' : 'Video'} {index + 1}
                          </p>
                          {item.file && (
                            <p className="text-xs text-gray-500">
                              {(item.file.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                          )}
                          {index === 0 && (
                            <Badge variant="success">Featured</Badge>
                          )}
                        </div>
                        <div className="flex items-center p-2">
                          <button
                            type="button"
                            className="text-red-500 p-2"
                            onClick={() => handleDelete(item.id)}
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

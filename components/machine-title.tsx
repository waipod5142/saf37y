"use client";

import { useState, useEffect } from "react";
import { getMachineQuestions } from "@/lib/actions/forms";
import { toast } from "sonner";
import Image from "next/image";

interface MachineTitleProps {
  bu: string;
  type: string;
  id: string;
}

export default function MachineTitle({ bu, type, id }: MachineTitleProps) {
  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [formImage, setFormImage] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        setIsLoadingTitle(true);
        setImageError(false); // Reset image error state
        
        // Fetch title and image from forms collection
        const questionsResult = await getMachineQuestions(bu, type);
        
        if (questionsResult.success) {
          if (questionsResult.title) {
            setFormTitle(questionsResult.title);
          }
          if (questionsResult.image) {
            // Validate image URL before setting it
            try {
              const response = await fetch(questionsResult.image, { method: 'HEAD' });
              if (response.ok) {
                setFormImage(questionsResult.image);
              } else {
                console.warn("Image URL not accessible:", questionsResult.image, response.status);
                setFormImage(null);
              }
            } catch (fetchError) {
              console.warn("Failed to validate image URL:", questionsResult.image, fetchError);
              setFormImage(null);
            }
          }
        } else {
          console.warn("No form data found for machine:", { bu, type });
          setFormTitle(null);
          setFormImage(null);
          if (questionsResult.error) {
            toast.error(questionsResult.error);
          }
        }
      } catch (error) {
        console.error("Error loading form data:", error);
        toast.error("Failed to load form data");
        setFormTitle(null);
        setFormImage(null);
      } finally {
        setIsLoadingTitle(false);
      }
    };

    fetchTitle();
  }, [bu, type, id]);

  // Get the title for the current machine type
  const getTitle = () => {
    if (formTitle) {
      return formTitle;
    }
    // Simple fallback if no dynamic title is available
    return `${type} Inspection`;
  };

  // Add loading state while title is being fetched
  if (isLoadingTitle) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      <div className="p-6">
        {formImage && !imageError && (
          <div className="flex justify-center mb-4">
            <Image
              src={formImage}
              alt={getTitle()}
              width={200}
              height={150}
              className="rounded-lg object-cover"
              priority
              onError={() => {
                console.warn("Failed to load image:", formImage);
                setImageError(true);
              }}
            />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          {getTitle()}
        </h1>
      </div>
    </div>
  );
}

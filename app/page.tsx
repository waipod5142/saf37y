"use client";

import { useEffect, useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCodeComponent from "@/components/qr-code";
import { Loader2 } from "lucide-react";

interface LocalStorageDataItem {
  bu: string;
  id: string;
}

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm();

  const [localStorageData, setLocalStorageData] = useState<LocalStorageDataItem[]>([]);

  // Function to retrieve data from local storage and set it in state
  const getDataFromLocalStorage = () => {
    const storedData = JSON.parse(localStorage.getItem('inseeId') || '[]');
    setLocalStorageData(storedData);
  };

  // Call the function to retrieve data on initial load
  useEffect(() => {
    getDataFromLocalStorage();
  }, []);

  // Redirect if there is data in localStorageData
  useEffect(() => {
    if (localStorageData.length > 0) {
      const redirectTo = `/Man/${localStorageData[0].bu}/${
        localStorageData[0].bu === 'th' ? 'Sot' : 'Toolbox'
      }/${localStorageData[0].id}`;
      window.location.href = redirectTo;
    }
  }, [localStorageData]);

  const onSubmit = async (formData: FieldValues) => {
    const updatedData = {
      bu: formData.bu.replace(/[/\s]/g, '-'),
      id: formData.id.replace(/[/\s]/g, '-').toUpperCase(),
    };

    try {
      saveToLocalStorage(updatedData);
      getDataFromLocalStorage(); // Retrieve and display updated data after saving to local storage
      window.scrollTo(0, 0);
    } catch (error) {
      console.log(error);
    }
    reset();
    window.location.href = `/Man/${formData.bu}/${
      formData.bu === 'th' ? 'Sot' : 'Toolbox'
    }/${formData.id.replace(/[/\s]/g, '-').toUpperCase()}`;
  };

  // Function to save a single object as the value for 'inseeId' in local storage
  const saveToLocalStorage = (data: FieldValues) => {
    localStorage.setItem('inseeId', JSON.stringify([data]));
  };

  const handleBuSelect = (value: string) => {
    setValue('bu', value);
  };

  const handleStoredDataClick = (data: LocalStorageDataItem) => {
    window.location.href = `/Man/${data.bu}/${
      data.bu === 'th' ? 'Coupon' : 'Toolbox'
    }/${data.id}`;
  };

  return (
    <main className="min-h-screen -mt-24 relative p-6 md:p-24 flex items-center justify-center">
      <Image fill className="object-contain" src="/SCCC.BK_BIG.png" alt="" />
      <div className="absolute top-0 left-0 size-full bg-black/50 backdrop-blur-sm" />
      <div className="flex flex-col gap-8 text-white relative z-10 w-full max-w-2xl">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/SCCC.BK.svg"
            alt="INSEE Logo"
            width={120}
            height={120}
            className="w-24 h-24 md:w-32 md:h-32 filter brightness-0 invert"
          />
          <h1 className="uppercase tracking-widest font-semibold text-red-600 text-3xl md:text-4xl max-w-screen-md text-center brightness-0 invert">
            Insee Safety Application
          </h1>
        </div>

        {/* QR Code Section */}
        <div className="flex justify-center">
          <QRCodeComponent
            value="https://www.saf37y.com/"
            size={75}
            className="bg-white rounded-lg p-2"
          />
        </div>

        {/* Main Form Card */}
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">
              SAFETY App Main Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Unit Selection */}
              <div className="space-y-3">
                <Label htmlFor="bu" className="text-lg font-semibold text-slate-900">
                  Business Unit
                </Label>
                <Select onValueChange={handleBuSelect} required>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Select Business Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="th">ประเทศไทย (Thailand - TH)</SelectItem>
                    <SelectItem value="vn">Việt Nam (Vietnam - VN)</SelectItem>
                    <SelectItem value="lk">ශ්‍රී ලංකාව (Sri Lanka - LK)</SelectItem>
                    <SelectItem value="bd">বাংলাদেশ (Bangladesh - BD)</SelectItem>
                    <SelectItem value="cmic">កម្ពុជា (Cambodia - CMIC)</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" {...register('bu', { required: 'Business Unit is required' })} />
                {errors.bu && (
                  <p className="text-red-500 text-sm">{`${errors.bu?.message}`}</p>
                )}
              </div>

              {/* Staff ID Input */}
              <div className="space-y-3">
                <Label htmlFor="id" className="text-lg font-semibold text-slate-900">
                  Staff ID
                </Label>
                <Input
                  {...register('id', { required: 'Staff ID is required' })}
                  type="text"
                  placeholder="Enter Staff ID"
                  className="w-full h-12 text-base"
                />
                {errors.id && (
                  <p className="text-red-500 text-sm">{`${errors.id?.message}`}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                disabled={isSubmitting}
                type="submit"
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stored Data Section */}
        {localStorageData.length > 0 && (
          <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 text-center">
                Saved Staff ID
              </CardTitle>
              <p className="text-center text-slate-600">
                Click on the green box to continue with saved Staff ID
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {localStorageData.map((data, index) => (
                  <Card
                    key={index}
                    className="border-2 border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors duration-200 hover:shadow-md"
                    onClick={() => handleStoredDataClick(data)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-800">
                          BU: {data.bu.toUpperCase()}
                        </div>
                        <div className="text-lg font-semibold text-green-800">
                          Staff ID: {data.id}
                        </div>
                        <div className="text-sm text-green-600 mt-2">
                          Click to continue →
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {localStorageData.length === 0 && (
          <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="text-center py-6">
              <p className="text-slate-600">
                No saved Staff ID found.<br />
                Please enter your details above and click Submit.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

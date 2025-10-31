"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, X, Languages } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type LanguageCode,
  getTranslationsForBU,
  getAvailableLanguages,
} from "@/lib/translations/access-control";
import { toast } from "sonner";
import { db } from "@/firebase/client";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import QRCode from "qrcode";
import MachineReport from "./machine-formAccessReport";

interface MachineFormProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface FormData extends FieldValues {
  tel: string;
  company?: string;
  name?: string;
}

interface VisitorData {
  tel: string;
  company: string;
  name: string;
  bu: string;
}

interface VisitorTransaction {
  id: string; // plantId
  tel: string;
  name: string;
  company: string;
  bu: string;
  safetyRuleAccepted: boolean;
  checkInTimestamp: Date;
  checkOutTimestamp?: Date;
  active: boolean;
}

export default function MachineForm({
  bu,
  type,
  id,
  isInDialog = false,
}: MachineFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>();

  const {
    register: registerVisitor,
    handleSubmit: handleSubmitVisitor,
    formState: { errors: visitorErrors, isSubmitting: isSubmittingVisitor },
  } = useForm<VisitorData>();

  const [isCheckingVisitor, setIsCheckingVisitor] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const [showGoodbyeDialog, setShowGoodbyeDialog] = useState(false);
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [pendingTel, setPendingTel] = useState("");
  const [currentTransactionId, setCurrentTransactionId] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [currentTransactionData, setCurrentTransactionData] =
    useState<any>(null);
  const [latestTransaction, setLatestTransaction] = useState<any>(null);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);

  // Language support - default to local language based on business unit
  const getDefaultLanguage = (businessUnit: string): LanguageCode => {
    const languageMap: Record<string, LanguageCode> = {
      'th': 'th',
      'vn': 'vn',
      'kh': 'kh',
      'lk': 'si',
      'bd': 'bn',
    };
    return languageMap[businessUnit] || 'en';
  };

  const [language, setLanguage] = useState<LanguageCode>(getDefaultLanguage(bu));
  const availableLanguages = getAvailableLanguages(bu);
  const t = getTranslationsForBU(bu, language);

  // Fetch latest transaction for a visitor
  const fetchLatestTransaction = async (tel: string) => {
    try {
      setIsLoadingTransaction(true);
      const visitortrRef = collection(db, "visitortr");
      // Query without orderBy to avoid composite index requirement
      const q = query(
        visitortrRef,
        where("tel", "==", tel),
        where("id", "==", id)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Sort manually to get the latest transaction
        const transactions = querySnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            docId: doc.id,
          }))
          .sort((a: any, b: any) => {
            const aTime = a.checkInTimestamp?.toDate?.()?.getTime() || 0;
            const bTime = b.checkInTimestamp?.toDate?.()?.getTime() || 0;
            return bTime - aTime;
          });
        setLatestTransaction(transactions[0]);
      } else {
        setLatestTransaction(null);
      }
    } catch (error) {
      console.error("Error fetching latest transaction:", error);
      setLatestTransaction(null);
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  const checkVisitor = async (tel: string) => {
    try {
      setIsCheckingVisitor(true);

      // Query the visitor collection using bu_tel as document ID
      const docId = `${bu}_${tel}`;
      const visitorRef = doc(db, "visitor", docId);
      const visitorDoc = await getDoc(visitorRef);

      if (visitorDoc.exists()) {
        const data = visitorDoc.data() as VisitorData;
        setVisitorData(data);
        // Save the telephone number for auto-fill on next visit
        localStorage.setItem(`lastVisitorTel_${bu}`, tel);
        toast.success(`Welcome back, ${data.name} from ${data.company}!`);
        // Fetch latest transaction
        await fetchLatestTransaction(tel);
        return true;
      } else {
        // Visitor not found, show registration dialog
        setPendingTel(tel);
        setShowRegistrationDialog(true);
        return false;
      }
    } catch (error) {
      console.error("Error checking visitor:", error);
      toast.error("Failed to check visitor. Please try again.");
      return false;
    } finally {
      setIsCheckingVisitor(false);
    }
  };

  // Check for existing active transaction or retrieve QR code
  const checkExistingTransaction = async (tel: string, plantId: string) => {
    try {
      console.log("Checking transaction for tel:", tel, "plantId:", plantId);

      const visitortrRef = collection(db, "visitortr");
      // Simplified query without orderBy to avoid composite index requirement
      const q = query(
        visitortrRef,
        where("tel", "==", tel),
        where("id", "==", plantId),
        where("active", "==", true)
      );

      const querySnapshot = await getDocs(q);
      console.log("Query returned", querySnapshot.size, "documents");

      if (!querySnapshot.empty) {
        // Sort manually to get the latest transaction
        const transactions = querySnapshot.docs.map((doc) => {
          const data: any = doc.data();
          return {
            docId: doc.id, // Firestore document ID
            ...data,
          };
        });

        // Sort by checkInTimestamp descending
        transactions.sort((a, b) => {
          const aTime = a.checkInTimestamp?.toDate?.()?.getTime() || 0;
          const bTime = b.checkInTimestamp?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });

        const latestTransaction: any = transactions[0];
        console.log("Latest transaction:", latestTransaction);

        // Check if transaction is within 10 hours
        const checkInTime = latestTransaction.checkInTimestamp?.toDate();
        const now = new Date();
        const hoursDiff =
          (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

        console.log("Hours since check-in:", hoursDiff);

        if (hoursDiff < 10) {
          // Return existing transaction for checkout
          return {
            exists: true,
            transactionId: latestTransaction.docId, // Use docId (Firestore document ID)
            transactionData: latestTransaction,
            isCheckOut: !latestTransaction.checkOutTimestamp,
          };
        } else {
          console.log("Transaction is older than 10 hours");
        }
      } else {
        console.log("No active transactions found");
      }

      return {
        exists: false,
        transactionId: null,
        transactionData: null,
        isCheckOut: false,
      };
    } catch (error) {
      console.error("Error checking existing transaction:", error);
      return {
        exists: false,
        transactionId: null,
        transactionData: null,
        isCheckOut: false,
      };
    }
  };

  // Generate QR code with transaction data
  const generateQRCode = async (transactionData: any) => {
    try {
      const qrData = JSON.stringify({
        transactionId: transactionData.id || currentTransactionId,
        plantId: id,
        bu: bu,
        tel: transactionData.tel,
        name: transactionData.name,
        company: transactionData.company,
        checkInTimestamp:
          transactionData.checkInTimestamp instanceof Date
            ? transactionData.checkInTimestamp.toISOString()
            : transactionData.checkInTimestamp?.toDate?.()?.toISOString(),
        safetyRuleAccepted: transactionData.safetyRuleAccepted,
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
      });

      return qrCodeUrl;
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
      return null;
    }
  };

  // Create visitor transaction
  const createVisitorTransaction = async () => {
    try {
      if (!visitorData) return;

      const visitortrRef = collection(db, "visitortr");
      const newTransaction: VisitorTransaction = {
        id: id, // plantId from URL parameter
        tel: visitorData.tel,
        name: visitorData.name,
        company: visitorData.company,
        bu: bu,
        safetyRuleAccepted: true,
        checkInTimestamp: new Date(),
        active: true,
      };

      const docRef = await addDoc(visitortrRef, newTransaction);
      setCurrentTransactionId(docRef.id);

      // Store transaction data with ID for QR generation
      const transactionWithId = {
        ...newTransaction,
        id: docRef.id,
      };
      setCurrentTransactionData(transactionWithId);

      // Generate QR code
      const qrCode = await generateQRCode(transactionWithId);
      if (qrCode) {
        setQrCodeDataUrl(qrCode);
        setShowQRCodeDialog(true);
      }

      toast.success("Check-in successful! Welcome to the plant.");
    } catch (error) {
      console.error("Error creating visitor transaction:", error);
      toast.error("Failed to create check-in record");
    }
  };

  // Handle safety rule acceptance
  const handleSafetyAcceptance = async () => {
    setShowSafetyDialog(false);
    await createVisitorTransaction();
  };

  const onSubmitTel: SubmitHandler<FormData> = async (formData) => {
    const visitorExists = await checkVisitor(formData.tel);

    if (visitorExists && visitorData) {
      // Check for existing transaction or allow new check-in
      const existingTx = await checkExistingTransaction(formData.tel, id);

      if (
        existingTx.exists &&
        existingTx.transactionId &&
        existingTx.transactionData
      ) {
        // User has an active transaction within 10 hours - this is a checkout request
        if (existingTx.isCheckOut) {
          // Update the transaction with checkout timestamp
          await updateCheckoutTimestamp(existingTx.transactionId);
        } else {
          // Transaction already has checkout - shouldn't happen
          toast.info("You've already checked out from this visit.");
        }
      } else {
        // No active transaction in last 10 hours - new visit, show safety dialog
        setShowSafetyDialog(true);
      }
    }
  };

  // Update checkout timestamp
  const updateCheckoutTimestamp = async (transactionId: string) => {
    try {
      const docRef = doc(db, "visitortr", transactionId);
      await updateDoc(docRef, {
        checkOutTimestamp: new Date(),
        active: false,
      });

      // Show goodbye dialog
      setShowGoodbyeDialog(true);
    } catch (error) {
      console.error("Error updating checkout:", error);
      toast.error("Failed to check out. Please try again.");
    }
  };

  const onSubmitRegistration: SubmitHandler<VisitorData> = async (data) => {
    try {
      // Save new visitor to Firestore with bu_tel as document ID
      const docId = `${bu}_${pendingTel}`;
      const visitorRef = doc(db, "visitor", docId);
      const newVisitor: VisitorData = {
        tel: pendingTel,
        company: data.company,
        name: data.name,
        bu: bu,
      };

      await setDoc(visitorRef, newVisitor);

      setVisitorData(newVisitor);
      setShowRegistrationDialog(false);
      setValue("tel", pendingTel);

      // Save the telephone number for auto-fill on next visit
      localStorage.setItem(`lastVisitorTel_${bu}`, pendingTel);

      toast.success("Registration successful!");

      // Show safety dialog for new visitor
      setShowSafetyDialog(true);
    } catch (error) {
      console.error("Error registering visitor:", error);
      toast.error("Failed to register visitor. Please try again.");
    }
  };

  // Load the last used telephone number from localStorage
  const loadStoredTel = () => {
    const storedTel = localStorage.getItem(`lastVisitorTel_${bu}`);
    if (storedTel) {
      setValue("tel", storedTel);
      // Automatically check the visitor when tel is pre-filled
      checkVisitor(storedTel);
      toast.success("Telephone number loaded from storage");
    } else {
      toast.info("No saved telephone number found");
    }
  };

  // Load the last used telephone number from localStorage on mount
  useEffect(() => {
    const storedTel = localStorage.getItem(`lastVisitorTel_${bu}`);
    if (storedTel) {
      setValue("tel", storedTel);
      // Automatically check the visitor when tel is pre-filled
      checkVisitor(storedTel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bu]);

  return (
    <div className="relative">
      <MachineReport bu={bu} id={id} />
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-center text-2xl font-bold flex-1">
              {t.pageTitle}
            </CardTitle>
            {/* Language Selector */}
            {availableLanguages.length > 1 && (
              <Select value={language} onValueChange={(value) => setLanguage(value as LanguageCode)}>
                <SelectTrigger className="w-[140px]">
                  <Languages className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmitTel)} className="space-y-4 mb-8">
        {/* Telephone Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tel" className="text-lg font-semibold">
                  {t.telephoneLabel}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadStoredTel}
                  disabled={isCheckingVisitor}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t.loadSavedButton}
                </Button>
              </div>
              <Input
                {...register("tel", {
                  required: "Telephone number is required",
                  pattern: {
                    value: /^0[0-9]{9,11}$/,
                    message:
                      "Please enter a valid 10-12 digit phone number starting with 0 (no spaces or dashes)",
                  },
                })}
                type="tel"
                placeholder={t.telephonePlaceholder}
                className="w-full"
                disabled={isCheckingVisitor}
                onKeyDown={(e) => {
                  // Only allow numbers, backspace, delete, arrow keys, tab
                  const allowedKeys = [
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                  ];
                  if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                maxLength={12}
              />
              {errors.tel && (
                <p className="text-red-500 text-sm">{errors.tel.message}</p>
              )}
            </div>

            {/* Display visitor info if found */}
            {visitorData && (
              <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm">
                  <strong>{t.nameLabel}:</strong> {visitorData.name}
                </p>
                <p className="text-sm">
                  <strong>{t.companyLabel}:</strong> {visitorData.company}
                </p>
              </div>
            )}

            {/* Display latest transaction if found */}
            {isLoadingTransaction && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600">
                  Loading visit history...
                </p>
              </div>
            )}

            {!isLoadingTransaction && latestTransaction && (
              <div
                className={`mt-4 p-4 rounded-md border ${
                  latestTransaction.active
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">
                    {latestTransaction.active
                      ? t.currentVisit
                      : t.lastVisit}
                  </h4>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>{t.checkInLabel}:</strong>{" "}
                    {latestTransaction.checkInTimestamp?.toDate
                      ? latestTransaction.checkInTimestamp
                          .toDate()
                          .toLocaleString("en-GB", { hour12: false })
                      : "N/A"}
                  </p>
                  {latestTransaction.checkOutTimestamp && (
                    <>
                      <p>
                        <strong>{t.checkOutLabel}:</strong>{" "}
                        {latestTransaction.checkOutTimestamp?.toDate
                          ? latestTransaction.checkOutTimestamp
                              .toDate()
                              .toLocaleString("en-GB", { hour12: false })
                          : "N/A"}
                      </p>
                      <p className="text-purple-600 font-medium">
                        <strong>{t.durationLabel}:</strong>{" "}
                        {(() => {
                          const checkIn =
                            latestTransaction.checkInTimestamp?.toDate();
                          const checkOut =
                            latestTransaction.checkOutTimestamp?.toDate();
                          if (checkIn && checkOut) {
                            const diffMs =
                              checkOut.getTime() - checkIn.getTime();
                            const diffMins = Math.floor(diffMs / (1000 * 60));
                            const hours = Math.floor(diffMins / 60);
                            const mins = diffMins % 60;
                            if (hours > 0) {
                              return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""}`;
                            }
                            return `${mins} minute${mins !== 1 ? "s" : ""}`;
                          }
                          return "N/A";
                        })()}
                      </p>
                    </>
                  )}
                  {latestTransaction.active && (
                    <>
                      <p className="text-orange-600 font-medium">
                        <strong>{t.timeInPlantLabel}:</strong>{" "}
                        {(() => {
                          const checkIn =
                            latestTransaction.checkInTimestamp?.toDate();
                          if (checkIn) {
                            const now = new Date();
                            const diffMs = now.getTime() - checkIn.getTime();
                            const diffMins = Math.floor(diffMs / (1000 * 60));
                            const hours = Math.floor(diffMins / 60);
                            const mins = diffMins % 60;
                            if (hours > 0) {
                              return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""}`;
                            }
                            return `${mins} minute${mins !== 1 ? "s" : ""}`;
                          }
                          return "N/A";
                        })()}
                      </p>
                      <p className="text-blue-600 font-medium mt-2">
                        {t.submitAgainToCheckout}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || isCheckingVisitor}
          className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg mb-4"
        >
          {isCheckingVisitor ? "Checking..." : t.submitButton}
        </Button>
      </form>

      {/* Registration Dialog */}
      <Dialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
      >
        <DialogContent>
          <button
            onClick={() => setShowRegistrationDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader>
            <DialogTitle>{t.registrationTitle}</DialogTitle>
            <DialogDescription>
              {t.registrationDescription}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitVisitor(onSubmitRegistration)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="register-tel" className="text-sm font-semibold">
                {t.telephoneLabel}
              </Label>
              <Input
                id="register-tel"
                type="tel"
                value={pendingTel}
                disabled
                className="w-full bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-name" className="text-sm font-semibold">
                {t.nameLabel}
              </Label>
              <Input
                {...registerVisitor("name", {
                  required: "Name is required",
                })}
                id="register-name"
                type="text"
                placeholder={t.namePlaceholder}
                className="w-full"
              />
              {visitorErrors.name && (
                <p className="text-red-500 text-sm">
                  {visitorErrors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="register-company"
                className="text-sm font-semibold"
              >
                {t.companyLabel}
              </Label>
              <Input
                {...registerVisitor("company", {
                  required: "Company is required",
                })}
                id="register-company"
                type="text"
                placeholder={t.companyPlaceholder}
                className="w-full"
              />
              {visitorErrors.company && (
                <p className="text-red-500 text-sm">
                  {visitorErrors.company.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegistrationDialog(false)}
              >
                {t.cancelButton}
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingVisitor}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmittingVisitor ? t.registering : t.registerButton}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Safety Rule Acceptance Dialog */}
      <Dialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <button
            onClick={() => setShowSafetyDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t.safetyTitle}</DialogTitle>
            <DialogDescription>
              {t.safetyDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="font-semibold text-lg mb-3">
                {t.safetyRulesHeader}
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>{t.safetyRule1}</li>
                <li>{t.safetyRule2}</li>
                <li>{t.safetyRule3}</li>
                <li>{t.safetyRule4}</li>
                <li>{t.safetyRule5}</li>
                <li>{t.safetyRule6}</li>
                <li>{t.safetyRule7}</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm font-medium">
                {t.safetyConfirmHeader}
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>{t.safetyConfirm1}</li>
                <li>{t.safetyConfirm2}</li>
                <li>{t.safetyConfirm3}</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSafetyDialog(false)}
            >
              {t.cancelButton}
            </Button>
            <Button
              type="button"
              onClick={handleSafetyAcceptance}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {t.acceptButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Display Dialog */}
      <Dialog open={showQRCodeDialog} onOpenChange={setShowQRCodeDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <button
            onClick={async () => {
              setShowQRCodeDialog(false);
              // Refresh latest transaction
              if (visitorData?.tel) {
                await fetchLatestTransaction(visitorData.tel);
              }
            }}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-center">{t.visitorPassTitle}</DialogTitle>
            <DialogDescription className="text-center">
              {t.visitorPassDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-6 overflow-y-auto flex-1">
            {qrCodeDataUrl && (
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                <img
                  src={qrCodeDataUrl}
                  alt="Visitor QR Code"
                  className="w-64 h-64 sm:w-80 sm:h-80"
                />
              </div>
            )}

            {currentTransactionData && (
              <div className="text-center space-y-1">
                <p className="font-semibold text-lg">
                  {currentTransactionData.name}
                </p>
                <p className="text-sm text-gray-600">
                  {currentTransactionData.company}
                </p>
                <p className="text-xs text-gray-500">
                  Tel: {currentTransactionData.tel}
                </p>
                <div className="text-xs text-gray-400 mt-2 space-y-1">
                  <p>UUID: {currentTransactionData.id}</p>
                  <p>Country: {currentTransactionData.bu?.toUpperCase()}</p>
                  <p>
                    Safety Accepted:{" "}
                    {currentTransactionData.safetyRuleAccepted ? "Yes" : "No"}
                  </p>
                  <p>
                    {t.checkInLabel}:{" "}
                    {currentTransactionData.checkInTimestamp instanceof Date
                      ? currentTransactionData.checkInTimestamp.toLocaleString(
                          "en-GB",
                          { hour12: false }
                        )
                      : new Date(
                          currentTransactionData.checkInTimestamp
                        ).toLocaleString("en-GB", { hour12: false })}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 w-full">
              <p className="text-xs text-center text-gray-700">
                <strong>Note:</strong> {t.visitorPassNote}
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-center flex-shrink-0">
            <Button
              type="button"
              onClick={async () => {
                setShowQRCodeDialog(false);
                // Refresh latest transaction
                if (visitorData?.tel) {
                  await fetchLatestTransaction(visitorData.tel);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t.closeButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goodbye Dialog */}
      <Dialog open={showGoodbyeDialog} onOpenChange={setShowGoodbyeDialog}>
        <DialogContent className="sm:max-w-md">
          <button
            onClick={async () => {
              setShowGoodbyeDialog(false);
              // Refresh latest transaction
              if (visitorData?.tel) {
                await fetchLatestTransaction(visitorData.tel);
              }
            }}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {t.goodbyeTitle}
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {t.goodbyeDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="text-6xl">👋</div>

            {visitorData && (
              <div className="text-center space-y-2">
                <p className="font-semibold text-xl">{visitorData.name}</p>
                <p className="text-gray-600">{visitorData.company}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 w-full">
              <p className="text-center text-gray-700" style={{ whiteSpace: 'pre-line' }}>
                {t.goodbyeMessage}
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={async () => {
                setShowGoodbyeDialog(false);
                // Refresh latest transaction
                if (visitorData?.tel) {
                  await fetchLatestTransaction(visitorData.tel);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t.closeButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Machine } from "@/types/machine";
import Image from "next/image";

interface MachineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine & { machineKey: string };
  onUpdate: () => void;
}

export function MachineEditModal({
  isOpen,
  onClose,
  machine,
  onUpdate,
}: MachineEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bu: machine.bu || "",
    site: machine.site || "",
    type: machine.type || "",
    id: machine.id || "",
    kind: machine.kind || "",
    name: machine.name || "",
    description: machine.description || "",
    area: machine.area || "",
    department: machine.department || "",
    owner: machine.owner || "",
    location: machine.location || "",
    plantId: machine.plantId || "",
    email: machine.email || "",
    supemail: machine.supemail || "",
    registerDate: machine.registerDate || "",
    certifiedDate: machine.certifiedDate || "",
    remark: machine.remark || "",
    status: machine.status || "active",
    ownerId: machine.ownerId || "",
    interval: machine.interval || "",
    quantity: machine.quantity || "",
  });

  useEffect(() => {
    // Reset form when machine changes
    setFormData({
      bu: machine.bu || "",
      site: machine.site || "",
      type: machine.type || "",
      id: machine.id || "",
      kind: machine.kind || "",
      name: machine.name || "",
      description: machine.description || "",
      area: machine.area || "",
      department: machine.department || "",
      owner: machine.owner || "",
      location: machine.location || "",
      plantId: machine.plantId || "",
      email: machine.email || "",
      supemail: machine.supemail || "",
      registerDate: machine.registerDate || "",
      certifiedDate: machine.certifiedDate || "",
      remark: machine.remark || "",
      status: machine.status || "active",
      ownerId: machine.ownerId || "",
      interval: machine.interval || "",
      quantity: machine.quantity || "",
    });
  }, [machine]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/machines", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docId: machine.docId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Machine updated successfully!");
        onUpdate();
        onClose();
      } else {
        toast.error(data.error || "Failed to update machine");
      }
    } catch (error) {
      toast.error("Failed to update machine: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Machine</DialogTitle>
        </DialogHeader>
        <div>
          <Label>Document ID</Label>
          <Input
            className="font-light"
            value={machine.docId || "N/A"}
            disabled
          />
        </div>
        <div className="space-y-4">
          {/* Images */}
          {machine.images && machine.images.length > 0 && (
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="grid grid-cols-3 gap-2">
                {machine.images.map((img, idx) => (
                  <div key={idx} className="relative h-32">
                    <Image
                      src={img}
                      alt={`Machine ${idx + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bu">Business Unit (BU)</Label>
              <Input
                id="bu"
                name="bu"
                value={formData.bu}
                onChange={handleChange}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                name="site"
                value={formData.site}
                onChange={handleChange}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="id">Machine ID</Label>
              <Input
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="kind">Kind</Label>
              <Input
                id="kind"
                name="kind"
                value={formData.kind}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="plantId">Plant ID</Label>
              <Input
                id="plantId"
                name="plantId"
                value={formData.plantId}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="email">Email of responsible person</Label>
              <Textarea
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="min-h-[60px] resize-y"
              />
            </div>

            <div>
              <Label htmlFor="supemail">Supervisor Email</Label>
              <Textarea
                id="supemail"
                name="supemail"
                value={formData.supemail}
                onChange={handleChange}
                className="min-h-[60px] resize-y"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="min-h-[60px] resize-y"
              />
            </div>

            <div>
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="ownerId">Owner ID</Label>
              <Input
                id="ownerId"
                name="ownerId"
                value={formData.ownerId}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="registerDate">Register Date</Label>
              <Input
                id="registerDate"
                name="registerDate"
                type="date"
                value={formData.registerDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="certifiedDate">Certified Date</Label>
              <Input
                id="certifiedDate"
                name="certifiedDate"
                type="date"
                value={formData.certifiedDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="interval">Interval</Label>
              <Input
                id="interval"
                name="interval"
                value={formData.interval}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                className="min-h-[60px] resize-y"
              />
            </div>
          </div>

          {/* Read-only timestamp fields */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label>Created At</Label>
              <Input
                value={
                  machine.createdAt
                    ? new Date(
                        machine.createdAt.seconds
                          ? machine.createdAt.seconds * 1000
                          : machine.createdAt
                      ).toLocaleString()
                    : "N/A"
                }
                disabled
                className="font-light"
              />
            </div>

            <div>
              <Label>Created By</Label>
              <Input
                value={machine.createdBy || "N/A"}
                disabled
                className="font-light"
              />
            </div>

            <div>
              <Label>Updated At</Label>
              <Input
                value={
                  machine.updatedAt
                    ? new Date(
                        machine.updatedAt.seconds
                          ? machine.updatedAt.seconds * 1000
                          : machine.updatedAt
                      ).toLocaleString()
                    : "N/A"
                }
                disabled
                className="font-light"
              />
            </div>

            <div>
              <Label>Updated By</Label>
              <Input
                value={machine.updatedBy || "N/A"}
                disabled
                className="font-light"
              />
            </div>

            <div>
              <Label>Imported At</Label>
              <Input
                value={
                  machine.importedAt
                    ? new Date(
                        machine.importedAt.seconds
                          ? machine.importedAt.seconds * 1000
                          : machine.importedAt
                      ).toLocaleString()
                    : "N/A"
                }
                disabled
                className="font-light"
              />
            </div>

            <div>
              <Label>Last Imported At</Label>
              <Input
                value={
                  machine.lastImportedAt
                    ? new Date(
                        machine.lastImportedAt.seconds
                          ? machine.lastImportedAt.seconds * 1000
                          : machine.lastImportedAt
                      ).toLocaleString()
                    : "N/A"
                }
                disabled
                className="font-light"
              />
            </div>

            <div>
              <Label>Uploaded At</Label>
              <Input
                value={
                  machine.uploadedAt
                    ? new Date(
                        machine.uploadedAt.seconds
                          ? machine.uploadedAt.seconds * 1000
                          : machine.uploadedAt
                      ).toLocaleString()
                    : "N/A"
                }
                disabled
                className="font-light"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

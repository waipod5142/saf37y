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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bu: machine.bu || "",
    site: machine.site || "",
    type: machine.type || "",
    id: machine.id || "",
    kind: machine.kind || "",
    location: machine.location || "",
    plantId: machine.plantId || "",
    email: machine.email || "",
    status: machine.status || "active",
  });

  useEffect(() => {
    // Reset form when machine changes
    setFormData({
      bu: machine.bu || "",
      site: machine.site || "",
      type: machine.type || "",
      id: machine.id || "",
      kind: machine.kind || "",
      location: machine.location || "",
      plantId: machine.plantId || "",
      email: machine.email || "",
      status: machine.status || "active",
    });
    setIsEditing(false);
  }, [machine]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setIsEditing(false);
        onUpdate();
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
          <DialogTitle>
            {isEditing ? "Edit Machine" : "Machine Details"}
          </DialogTitle>
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
                disabled={true}
                readOnly={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                name="site"
                value={formData.site}
                onChange={handleChange}
                disabled={true}
                readOnly={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={true}
                readOnly={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="id">Machine ID</Label>
              <Input
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                disabled={true}
                readOnly={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="kind">Kind</Label>
              <Input
                id="kind"
                name="kind"
                value={formData.kind}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="plantId">Plant ID</Label>
              <Input
                id="plantId"
                name="plantId"
                value={formData.plantId}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="email">Email of responsible person</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form
                    setFormData({
                      bu: machine.bu || "",
                      site: machine.site || "",
                      type: machine.type || "",
                      id: machine.id || "",
                      kind: machine.kind || "",
                      location: machine.location || "",
                      plantId: machine.plantId || "",
                      email: machine.email || "",
                      status: machine.status || "active",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

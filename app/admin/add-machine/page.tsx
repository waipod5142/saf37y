"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

export default function AddMachine() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bu: "",
    site: "",
    type: "",
    id: "",
    kind: "",
    location: "",
    status: "active",
    plantId: "",
    email: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/machines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Machine created successfully!");
        router.push("/account/my-favourites");
      } else {
        toast.error(data.error || "Failed to create machine");
      }
    } catch (error) {
      toast.error("Request failed: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-5">
      <h1 className="text-4xl font-bold mb-5">Add New Machine</h1>

      <Card>
        <CardHeader>
          <CardTitle>Machine Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bu">Business Unit (BU) *</Label>
                <Input
                  id="bu"
                  name="bu"
                  value={formData.bu}
                  onChange={handleChange}
                  placeholder="e.g., vn, th, lk"
                  required
                />
              </div>

              <div>
                <Label htmlFor="site">Site *</Label>
                <Input
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  placeholder="e.g., thiv, scct, catl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="e.g., electrical, socket, mixer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="id">Machine ID *</Label>
                <Input
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder="e.g., THIV-SX-01"
                  required
                />
              </div>

              <div>
                <Label htmlFor="kind">Kind</Label>
                <Input
                  id="kind"
                  name="kind"
                  value={formData.kind}
                  onChange={handleChange}
                  placeholder="e.g., Socket & Plug"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Admin office"
                />
              </div>

              <div>
                <Label htmlFor="plantId">Plant ID</Label>
                <Input
                  id="plantId"
                  name="plantId"
                  value={formData.plantId}
                  onChange={handleChange}
                  placeholder="e.g., thiv"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., user@example.com"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Machine"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

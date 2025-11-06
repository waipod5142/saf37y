"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AddFavoritesAdmin() {
  const [userId, setUserId] = useState("");
  const [bu, setBu] = useState("");
  const [site, setSite] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/add-favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, bu, site }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully added ${data.count} machines to favorites!`);
        // Optionally clear form
        // setUserId("");
        // setBu("");
        // setSite("");
      } else {
        toast.error(data.error || "Failed to add favorites");
      }
    } catch (error) {
      toast.error("Request failed: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-5">
      <h1 className="text-4xl font-bold mb-5">Add Machine Favorites</h1>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Add Favorites for User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., DwfEM82kLdQOdqeEeNLdg9cuO1H3"
                required
              />
            </div>

            <div>
              <Label htmlFor="bu">Business Unit (BU)</Label>
              <Input
                id="bu"
                value={bu}
                onChange={(e) => setBu(e.target.value.toLowerCase())}
                placeholder="e.g., vn, th, lk"
                required
              />
            </div>

            <div>
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                value={site}
                onChange={(e) => setSite(e.target.value.toLowerCase())}
                placeholder="e.g., thiv, scct, catl"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding favorites..." : "Add Favorites"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>This will add ALL machines matching the BU and Site to the user's favorites</li>
              <li>The favorites are stored in the machineFavourites collection</li>
              <li>User can view their favorites at /account/my-favourites</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

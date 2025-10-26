"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  bu: z.string().optional(),
  type: z.string().optional(),
  site: z.string().optional(),
  id: z.string().optional(),
});

export default function FiltersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bu: searchParams.get("bu") ?? "",
      type: searchParams.get("type") ?? "",
      site: searchParams.get("site") ?? "",
      id: searchParams.get("id") ?? "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const newSearchParams = new URLSearchParams();

    if (data.bu) {
      newSearchParams.set("bu", data.bu);
    }

    if (data.type) {
      newSearchParams.set("type", data.type);
    }

    if (data.site) {
      newSearchParams.set("site", data.site);
    }

    if (data.id) {
      newSearchParams.set("id", data.id);
    }

    newSearchParams.set("page", "1");
    router.push(`/property-search?${newSearchParams.toString()}`);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid grid-cols-5 gap-2"
      >
        <FormField
          control={form.control}
          name="bu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>BU</FormLabel>
              <FormControl>
                <Input {...field} placeholder="BU (e.g., vn, th)" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Type (e.g., socket)" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="site"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Site (e.g., catl)" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ID (e.g., CATL-AD-11)" />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-auto">
          Search
        </Button>
      </form>
    </Form>
  );
}

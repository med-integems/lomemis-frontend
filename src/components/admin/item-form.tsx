"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Item } from "@/types";
import { useCreateItem, useUpdateItem } from "@/hooks/useAdmin";

const itemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  isActive: z.boolean(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  item?: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}

const unitOptions = [
  { value: "BOOKS", label: "Books" },
  { value: "BOTTLES", label: "Bottles" },
  { value: "BOXES", label: "Boxes" },
  { value: "BUNDLES", label: "Bundles" },
  { value: "CARTONS", label: "Cartons" },
  { value: "CASES", label: "Cases" },
  { value: "CENTIMETERS", label: "Centimeters" },
  { value: "CONTAINERS", label: "Containers" },
  { value: "COPIES", label: "Copies" },
  { value: "COURSES", label: "Courses" },
  { value: "DOWNLOADS", label: "Downloads" },
  { value: "DOZENS", label: "Dozens" },
  { value: "EACH", label: "Each" },
  { value: "EDITIONS", label: "Editions" },
  { value: "FEET", label: "Feet" },
  { value: "GALLONS", label: "Gallons" },
  { value: "GRAMS", label: "Grams" },
  { value: "GROSS", label: "Gross (144)" },
  { value: "HOURS", label: "Hours" },
  { value: "INCHES", label: "Inches" },
  { value: "ITEMS", label: "Items" },
  { value: "JARS", label: "Jars" },
  { value: "KILOGRAMS", label: "Kilograms" },
  { value: "KITS", label: "Kits" },
  { value: "LICENSES", label: "Licenses" },
  { value: "LITERS", label: "Liters" },
  { value: "METERS", label: "Meters" },
  { value: "MILLILITERS", label: "Milliliters" },
  { value: "MILLIMETERS", label: "Millimeters" },
  { value: "NOTEBOOKS", label: "Notebooks" },
  { value: "OUNCES", label: "Ounces" },
  { value: "PACKETS", label: "Packets" },
  { value: "PACKS", label: "Packs" },
  { value: "PADS", label: "Pads" },
  { value: "PAGES", label: "Pages" },
  { value: "PAIRS", label: "Pairs" },
  { value: "PIECES", label: "Pieces" },
  { value: "POUNDS", label: "Pounds" },
  { value: "REAMS", label: "Reams" },
  { value: "ROLLS", label: "Rolls" },
  { value: "SESSIONS", label: "Sessions" },
  { value: "SETS", label: "Sets" },
  { value: "SHEETS", label: "Sheets" },
  { value: "SQUARE_FEET", label: "Square Feet" },
  { value: "SQUARE_METERS", label: "Square Meters" },
  { value: "SUBSCRIPTIONS", label: "Subscriptions" },
  { value: "TUBES", label: "Tubes" },
  { value: "UNITS", label: "Units" },
  { value: "VOLUMES", label: "Volumes" },
  { value: "YARDS", label: "Yards" },
];

const categoryOptions = [
  { value: "ABACUS", label: "Abacus" },
  { value: "AGRICULTURE_TOOLS", label: "Agriculture Tools" },
  { value: "ART_SUPPLIES", label: "Art Supplies" },
  { value: "ATHLETIC_EQUIPMENT", label: "Athletic Equipment" },
  { value: "ATLASES", label: "Atlases" },
  { value: "AUDIO_VISUAL", label: "Audio-Visual Equipment" },
  { value: "BALLS", label: "Balls" },
  { value: "BLACKBOARDS", label: "Blackboards" },
  { value: "BRUSHES", label: "Brushes" },
  { value: "BUILDING_BLOCKS", label: "Building Blocks" },
  { value: "CALCULATORS", label: "Calculators" },
  { value: "CARDBOARD", label: "Cardboard" },
  { value: "CHAIRS", label: "Chairs" },
  { value: "CHART_PAPER", label: "Chart Paper" },
  { value: "CHARTS", label: "Charts" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "CLAY", label: "Clay" },
  { value: "CLEANING_SUPPLIES", label: "Cleaning Supplies" },
  { value: "COMPOSITION_BOOKS", label: "Composition Books" },
  { value: "COMPUTERS", label: "Computers" },
  { value: "CONSTRUCTION_PAPER", label: "Construction Paper" },
  { value: "CONSUMABLES", label: "Consumables" },
  { value: "COUNTING_MATERIALS", label: "Counting Materials" },
  { value: "CRAFT_MATERIALS", label: "Craft Materials" },
  { value: "CRAYONS", label: "Crayons" },
  { value: "DESKS", label: "Desks" },
  { value: "DICTIONARIES", label: "Dictionaries" },
  { value: "DIGITAL_CONTENT", label: "Digital Content" },
  { value: "DRAMA_PROPS", label: "Drama Props" },
  { value: "DRAWING_BOOKS", label: "Drawing Books" },
  { value: "TOYS_EDUCATIONAL", label: "Educational Toys" },
  { value: "ENCYCLOPEDIAS", label: "Encyclopedias" },
  { value: "ERASERS", label: "Erasers" },
  { value: "EXERCISE_BOOKS", label: "Exercise Books" },
  { value: "FILES_FOLDERS", label: "Files & Folders" },
  { value: "FIRST_AID", label: "First Aid Supplies" },
  { value: "FLASHCARDS", label: "Flashcards" },
  { value: "FORMS", label: "Forms" },
  { value: "FRACTION_KITS", label: "Fraction Kits" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "TEACHING_AIDS", label: "Teaching Aids" },
  { value: "GEOMETRY_SETS", label: "Geometry Sets" },
  { value: "GLASSWARE", label: "Laboratory Glassware" },
  { value: "GRAPH_BOOKS", label: "Graph Books" },
  { value: "HOME_ECONOMICS", label: "Home Economics Equipment" },
  { value: "HYGIENE_SUPPLIES", label: "Hygiene Supplies" },
  { value: "LABORATORY_EQUIPMENT", label: "Laboratory Equipment" },
  { value: "LANGUAGE_CARDS", label: "Language Cards" },
  { value: "MAINTENANCE_SUPPLIES", label: "Maintenance Supplies" },
  { value: "MANILA_PAPER", label: "Manila Paper" },
  { value: "MAPS", label: "Maps" },
  { value: "MARKERS", label: "Markers" },
  { value: "MATH_INSTRUMENTS", label: "Mathematical Instruments" },
  { value: "MEASURING_INSTRUMENTS", label: "Measuring Instruments" },
  { value: "MICROSCOPES", label: "Microscopes" },
  { value: "MODELS", label: "Models" },
  { value: "MUSIC_BOOKS", label: "Music Books" },
  { value: "MUSICAL_INSTRUMENTS", label: "Musical Instruments" },
  { value: "NETS", label: "Nets" },
  { value: "NON_CONSUMABLES", label: "Non-Consumables" },
  { value: "NOTEBOOKS", label: "Notebooks" },
  { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
  { value: "PAINTS", label: "Paints" },
  { value: "PAPER", label: "Paper" },
  { value: "PENCILS", label: "Pencils" },
  { value: "PENS", label: "Pens" },
  { value: "PHONICS_MATERIALS", label: "Phonics Materials" },
  { value: "PLAY_MATERIALS", label: "Play Materials" },
  { value: "PLAYGROUND_EQUIPMENT", label: "Playground Equipment" },
  { value: "POSTERS", label: "Posters" },
  { value: "PROJECTORS", label: "Projectors" },
  { value: "PUZZLES", label: "Puzzles" },
  { value: "READING_MATERIALS", label: "Reading Materials" },
  { value: "RECORD_BOOKS", label: "Record Books" },
  { value: "REFERENCE_BOOKS", label: "Reference Books" },
  { value: "REGISTERS", label: "Registers" },
  { value: "REPAIR_MATERIALS", label: "Repair Materials" },
  { value: "RULERS", label: "Rulers & Measuring Tools" },
  { value: "SAFETY_EQUIPMENT", label: "Safety Equipment" },
  { value: "SOFTWARE", label: "Software" },
  { value: "SPECIMENS", label: "Specimens" },
  { value: "SPORTS_EQUIPMENT", label: "Sports Equipment" },
  { value: "STORAGE", label: "Storage Solutions" },
  { value: "TABLES", label: "Tables" },
  { value: "TABLETS", label: "Tablets" },
  { value: "TEXTBOOKS", label: "Textbooks" },
  { value: "VOCATIONAL_TOOLS", label: "Vocational Tools" },
  { value: "WHITEBOARDS", label: "Whiteboards" },
  { value: "WORKBOOKS", label: "Workbooks" },
  // General categories at the end
  { value: "MISCELLANEOUS", label: "Miscellaneous" },
  { value: "OTHER", label: "Other" },
];

export function ItemForm({ item, onClose, onSuccess }: ItemFormProps) {
  const isEditing = !!item;

  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || "",
      code: item?.code || "",
      description: item?.description || "",
      category: item?.category || "",
      unitOfMeasure: item?.unitOfMeasure || "",
      isActive: item?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        code: item.code || "",
        description: item.description || "",
        category: item.category || "",
        unitOfMeasure: item.unitOfMeasure || "",
        isActive: item.isActive ?? true,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        description: "",
        category: "",
        unitOfMeasure: "",
        isActive: true,
      });
    }
  }, [item, form]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      const itemData = {
        ...data,
        category: data.category || undefined,
        description: data.description || undefined,
      };

      if (isEditing && item) {
        await updateItemMutation.mutateAsync({
          id: item.id,
          itemData,
        });
      } else {
        await createItemMutation.mutateAsync(itemData);
      }
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Item" : "Add New Item"}
          </h2>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update item information"
              : "Create a new teaching and learning material"}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter unique item code"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter item description..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure *</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Item is available for use in the system
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createItemMutation.isPending || updateItemMutation.isPending
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createItemMutation.isPending || updateItemMutation.isPending
                    ? "Saving..."
                    : isEditing
                    ? "Update Item"
                    : "Create Item"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Item, insertItemSchema, Customer, Category, Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

// Cylinder options (even numbers from 8" to 38" and 39")
const cylinderOptions = [
  8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 39
];

// Material options
const materialOptions = ["HDPE", "LDPE", "Regard"];

// Mast batch options
const mastBatchOptions = [
  "White EP11105W", "Clear MP00000", "Black EP82001", "Dark Blue EP41323",
  "Sample 00000", "Lt. Ivory EP21260", "Or. Yellow EP21262", "Pink EP31328",
  "Ivory EP21263", "D. Orange EP31045", "Light Blue PT-140006", "Turq Green EP51282",
  "Peach Pink EP31314", "Light Blue EP41307", "Cream EP21270", "Light Green MP11000",
  "Pink PT-180068", "Yellow EP21259", "Lt. Ivory 5045", "Dp Orange EP31368",
  "Gray EP71004", "Blue EP41237", "Red EP31324", "Silver EP91031",
  "Med Blue EP41290", "Tom Red EP31469", "Light Gray PT-170005", "Light Blue PT-140022",
  "Lt. Orange EP31311", "Parrot Green PT-150052", "Radiant Gold EP991193",
  "Ivory PT-120009", "Leaf Green EP51364", "Gold EP991184G", "Mnt Green 2 EP51186",
  "Light Ivory PT-120008", "Baby Pink EP31009", "Dark Red EP31323",
  "Choco Brown EP61021", "Mango Yellow EP21264", "Coffee Brown EP61020",
  "Yellow Ivory Mixed", "Cream 18156", "Yellow", "Light Beige EP61158",
  "Yellow 12837", "Yellow PT-130001", "Dark Blue PT-140017", "Yellow PT-130002",
  "Orange", "Light Green /Mixed", "Lime Yellow EP21097", "Beige EP61007",
  "Light Green PT-15005", "Med Ivory PT-120051", "Wheat Beige EP61067",
  "Ivory EP21260", "Red PT-180080", "Pink PT-180180", "Ivory 5044",
  "Indigo EP41336", "Pista Green PT-150080", "Dark Orange PT-180143",
  "Baby Blue PT-140032", "Beige PT-1200013", "Violet PT-140010",
  "Pink PT-180160", "Red PT-180168", "Violet EP41017", "Baby Pink EP180179"
];

// Cutting unit options
const cuttingUnitOptions = [
  "Kg.", "Packet", "Box", "Roll", "5 Roll", "Pcs.", "6 Roll", 
  "Roll W/Core", "7 Roll", "3 Roll", "4 Roll"
];

// Punching options
const punchingOptions = ["None", "Banana", "T-Shirt W/Hook", "T-Shirt"];

// Cover options
const coverOptions = ["Plain", "Modern Plastic Bag Factory", "Customer Name", "Yasser Bahrain"];

// Extend the insert schema with additional validations
const formSchema = insertItemSchema
  .extend({
    // Make sure nullable fields are properly typed to avoid form errors
    thickness: z.number().optional().nullable().transform(val => val === null ? undefined : val),
    cylinder_inch: z.number().optional().nullable().transform(val => val === null ? undefined : val),
    cutting_length_cm: z.number().optional().nullable().transform(val => val === null ? undefined : val),
    unit_weight_kg: z.number().optional().nullable().transform(val => val === null ? undefined : val),
    pcs_pack_roll_qty: z.number().optional().nullable().transform(val => val === null ? undefined : val),
    size_details: z.string().optional().default(""),
    raw_material: z.string().optional().default(""),
    mast_batch: z.string().optional().default(""),
    is_printed: z.boolean().optional().default(false),
    cutting_unit: z.string().optional().default(""),
    packing: z.string().optional().default(""),
    punching: z.string().optional().default(""),
    cover: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      // Ensure required fields based on business logic
      return data.pcid && data.customer_id && data.category_id && data.sub_category_id;
    },
    {
      message: "Required fields are missing",
      path: ["pcid"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface ItemFormProps {
  id?: number;
}

export default function ItemForm({ id }: ItemFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(!!id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Extract customerId from URL if present (for new items)
  const searchParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search) 
    : new URLSearchParams('');
  const initialCustomerId = searchParams.get('customerId') 
    ? parseInt(searchParams.get('customerId') as string) 
    : null;

  // Get item data if editing
  const { data: itemData, isLoading: isLoadingItem } = useQuery<Item>({
    queryKey: [`/api/items/${id}`],
    enabled: !!id,
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch products filtered by selected category
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/category', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId || isNaN(selectedCategoryId) || selectedCategoryId <= 0) {
        return [];
      }
      return await fetch(`/api/products/category/${selectedCategoryId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      });
    },
    enabled: !!selectedCategoryId && !isNaN(selectedCategoryId) && selectedCategoryId > 0,
  });

  // Create/update item mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing && id) {
        await apiRequest('PATCH', `/api/items/${id}`, values);
      } else {
        await apiRequest('POST', '/api/items', values);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Item updated" : "Item created",
        description: `The item has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      // Redirect to customer products page after save
      const customerId = form.getValues().customer_id;
      navigate(`/customers/products?customerId=${customerId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/items/customer/${customerId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} item: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Initialize form with empty values or item data if editing
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pcid: "",
      customer_id: initialCustomerId || 0,
      category_id: 0,
      sub_category_id: 0,
      size_details: "",
      thickness: undefined,
      cylinder_inch: undefined,
      cutting_length_cm: undefined,
      raw_material: "",
      mast_batch: "",
      is_printed: false,
      cutting_unit: "",
      unit_weight_kg: undefined,
      packing: "",
      punching: "",
      cover: "",
      notes: "",
      pcs_pack_roll_qty: 0,
    },
  });

  // Update form values when item data is loaded
  useEffect(() => {
    if (itemData) {
      setSelectedCategoryId(itemData.category_id);
      form.reset({
        pcid: itemData.pcid,
        customer_id: itemData.customer_id,
        category_id: itemData.category_id,
        sub_category_id: itemData.sub_category_id,
        size_details: itemData.size_details || "",
        thickness: itemData.thickness ?? undefined,
        cylinder_inch: itemData.cylinder_inch ?? undefined,
        cutting_length_cm: itemData.cutting_length_cm ?? undefined,
        raw_material: itemData.raw_material || "",
        mast_batch: itemData.mast_batch || "",
        is_printed: itemData.is_printed || false,
        cutting_unit: itemData.cutting_unit || "",
        unit_weight_kg: itemData.unit_weight_kg ?? undefined,
        packing: itemData.packing || "",
        punching: itemData.punching || "",
        cover: itemData.cover || "",
        notes: itemData.notes || "",
        pcs_pack_roll_qty: itemData.pcs_pack_roll_qty || 0,
      });
    }
  }, [itemData, form]);

  // Generate a PCID based on category
  const generatePcid = (categoryId: number) => {
    if (!categoryId || categoryId <= 0) return "";
    
    // Find the selected category
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (!selectedCategory) return "";
    
    // Generate a timestamp code
    const timestamp = new Date().getTime().toString().slice(-4);
    
    // Format: CAT-{first 3 chars of category name}-{timestamp}
    const categoryPrefix = selectedCategory.name.slice(0, 3).toUpperCase();
    const categoryCode = selectedCategory.category_identification || `CAT${categoryId}`;
    return `${categoryCode}-${categoryPrefix}-${timestamp}`;
  };

  // Update selected category when form value changes and generate PCID
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'category_id' && value.category_id) {
        const categoryId = Number(value.category_id);
        if (!isNaN(categoryId) && categoryId > 0) {
          setSelectedCategoryId(categoryId);
          
          // Only generate PCID for new items, not when editing
          if (!isEditing) {
            const generatedPcid = generatePcid(categoryId);
            form.setValue("pcid", generatedPcid);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, categories, isEditing]);

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  // Handle back button click
  const handleBack = () => {
    const customerId = form.getValues().customer_id;
    if (customerId) {
      navigate(`/customers/products?customerId=${customerId}`);
    } else {
      navigate("/customers/products");
    }
  };

  // Show loading state
  if (id && isLoadingItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading item details...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Item" : "Create New Item"}
          </h1>
          <p className="text-slate-600">
            {isEditing
              ? "Update the details of an existing customer product"
              : "Add a new product to a customer's product list"}
          </p>
        </div>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Selection */}
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        disabled={!!initialCustomerId}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                {customer.arabic_name && (
                                  <span dir="rtl" className="text-base text-slate-700 font-semibold">
                                    {customer.arabic_name}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PCID */}
                <FormField
                  control={form.control}
                  name="pcid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Code (PCID)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={isEditing ? "Enter product code" : "Select a category to auto-generate"} 
                          {...field} 
                          readOnly={!isEditing && selectedCategoryId !== null}
                          className={!isEditing && selectedCategoryId !== null ? "bg-slate-50" : ""}
                        />
                      </FormControl>
                      {!isEditing && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedCategoryId 
                            ? "Code auto-generated from category" 
                            : "Will be generated when you select a category"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product (Sub-category) */}
                <FormField
                  control={form.control}
                  name="sub_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                        disabled={!selectedCategoryId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedCategoryId ? "Select a product" : "Select a category first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Size Details */}
                <FormField
                  control={form.control}
                  name="size_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Details</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., 12x15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Thickness */}
                <FormField
                  control={form.control}
                  name="thickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thickness</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter thickness"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ""}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cylinder (Inch) */}
                <FormField
                  control={form.control}
                  name="cylinder_inch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cylinder (Inch)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseFloat(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cylinder size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cylinderOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}"
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cutting Length (CM) */}
                <FormField
                  control={form.control}
                  name="cutting_length_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cutting Length (CM)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter cutting length in cm"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ""}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Raw Material */}
                <FormField
                  control={form.control}
                  name="raw_material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw Material</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select raw material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materialOptions.map((material) => (
                            <SelectItem key={material} value={material}>
                              {material}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mast Batch */}
                <FormField
                  control={form.control}
                  name="mast_batch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mast Batch</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mast batch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {mastBatchOptions.map((batch) => (
                            <SelectItem key={batch} value={batch}>
                              {batch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Printed */}
                <FormField
                  control={form.control}
                  name="is_printed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Printed</FormLabel>
                        <p className="text-sm text-gray-500">
                          Check if this item requires printing
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cutting Unit */}
                <FormField
                  control={form.control}
                  name="cutting_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cutting Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cutting unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cuttingUnitOptions.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Weight (KG) */}
                <FormField
                  control={form.control}
                  name="unit_weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Weight (KG)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter unit weight in kg"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ""}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Packing */}
                <FormField
                  control={form.control}
                  name="packing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter packing details" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Punching */}
                <FormField
                  control={form.control}
                  name="punching"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Punching</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select punching option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {punchingOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cover */}
                <FormField
                  control={form.control}
                  name="cover"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cover option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {coverOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pieces/Pack/Roll Quantity */}
                <FormField
                  control={form.control}
                  name="pcs_pack_roll_qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (Pcs/Pack/Roll)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          value={field.value ?? 0}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes or details about this item"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="button" variant="outline" className="mr-2" onClick={handleBack}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {mutation.isPending
                    ? isEditing ? "Updating..." : "Creating..."
                    : isEditing ? "Update Item" : "Create Item"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
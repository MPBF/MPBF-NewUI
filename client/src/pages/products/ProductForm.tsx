import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { insertProductSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the insertProductSchema with some validation
const formSchema = insertProductSchema.extend({
  category_id: z.string().transform(val => parseInt(val)),
  name: z.string().min(2, "Name must be at least 2 characters"),
  size_caption: z.string().min(1, "Size caption is required"),
  product_identification: z.string().min(1, "Product code is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  id?: number;
}

export default function ProductForm({ id }: ProductFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;
  
  // Fetch product if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: isEditing,
  });
  
  // Fetch categories for dropdown
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: "",
      name: "",
      size_caption: "",
      product_identification: "",
    },
  });
  
  // Update form values when product data is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        category_id: String(product.category_id),
        name: product.name,
        size_caption: product.size_caption,
        product_identification: product.product_identification,
      });
    }
  }, [product, form]);
  
  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        await apiRequest('PATCH', `/api/products/${id}`, values);
      } else {
        await apiRequest('POST', '/api/products', values);
      }
    },
    onSuccess: () => {
      toast({
        title: `Product ${isEditing ? "updated" : "created"}`,
        description: `Product has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      navigate('/products');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} product: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/products")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {isEditing ? "Edit Product" : "New Product"}
          </h1>
        </div>
      </div>
      
      {isEditing && isLoadingProduct ? (
        <div className="text-center p-6">Loading product data...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Product Details" : "Create New Product"}</CardTitle>
            <CardDescription>
              Enter the product information below. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!isLoadingCategories && categories?.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={String(category.id)}
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
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Product name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="size_caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Caption *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 10GP" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="product_identification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Code *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Unique product code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {mutation.isPending ? "Saving..." : "Save Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

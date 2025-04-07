import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { insertCategorySchema } from "@shared/schema";
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

// Extend the insertCategorySchema with some validation
const formSchema = insertCategorySchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category_identification: z.string().min(1, "Category code is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  id?: number;
}

export default function CategoryForm({ id }: CategoryFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;
  
  // Fetch category if editing
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: [`/api/categories/${id}`],
    enabled: isEditing,
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_identification: "",
    },
  });
  
  // Update form values when category data is loaded
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        category_identification: category.category_identification,
      });
    }
  }, [category, form]);
  
  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        await apiRequest('PATCH', `/api/categories/${id}`, values);
      } else {
        await apiRequest('POST', '/api/categories', values);
      }
    },
    onSuccess: () => {
      toast({
        title: `Category ${isEditing ? "updated" : "created"}`,
        description: `Category has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      navigate('/categories');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} category: ${error.message}`,
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
            onClick={() => navigate("/categories")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {isEditing ? "Edit Category" : "New Category"}
          </h1>
        </div>
      </div>
      
      {isEditing && isLoadingCategory ? (
        <div className="text-center p-6">Loading category data...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Category Details" : "Create New Category"}</CardTitle>
            <CardDescription>
              Enter the category information below. All fields are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Category name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category_identification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Code *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Unique category code" />
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
                    {mutation.isPending ? "Saving..." : "Save Category"}
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

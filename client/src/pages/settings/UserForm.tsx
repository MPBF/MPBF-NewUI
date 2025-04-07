import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth";
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
import { FormSkeleton } from "@/components/ui/skeletons";

// Extend the insertUserSchema with some validation
const formSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  arabic_name: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  language_preference: z.string().default("english"),
});

// Update form schema without password validation for editing
const updateFormSchema = formSchema.extend({
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type UpdateFormValues = z.infer<typeof updateFormSchema>;

interface UserFormProps {
  id?: number;
}

export default function UserForm({ id }: UserFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isEditing = !!id;
  
  // Check if current user can edit users
  const canEdit = currentUser?.role === "admin" || currentUser?.id === id;
  
  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit users.",
        variant: "destructive",
      });
      navigate("/settings/users");
    }
  }, [canEdit, navigate, toast]);
  
  // Fetch user if editing
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: isEditing,
  });
  
  // Form setup
  const form = useForm<FormValues | UpdateFormValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : formSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      arabic_name: "",
      role: "",
      mobile: "",
      section: "",
      language_preference: "english",
    },
  });
  
  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        name: user.name,
        arabic_name: user.arabic_name || "",
        role: user.role,
        mobile: user.mobile || "",
        section: user.section || "",
        language_preference: user.language_preference || "english",
      });
    }
  }, [user, form]);
  
  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues | UpdateFormValues) => {
      if (isEditing) {
        // If password is empty, remove it from request
        if (!values.password) {
          const { password, ...rest } = values;
          await apiRequest('PATCH', `/api/users/${id}`, rest);
        } else {
          await apiRequest('PATCH', `/api/users/${id}`, values);
        }
      } else {
        await apiRequest('POST', '/api/users', values);
      }
    },
    onSuccess: () => {
      toast({
        title: `User ${isEditing ? "updated" : "created"}`,
        description: `User has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      navigate('/settings/users');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} user: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (values: FormValues | UpdateFormValues) => {
    mutation.mutate(values);
  };
  
  if (!canEdit) {
    return null;
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/settings/users")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {isEditing ? "Edit User" : "New User"}
          </h1>
        </div>
      </div>
      
      {isEditing && isLoadingUser ? (
        <FormSkeleton fields={6} columns={1} hasButtons={true} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit User Details" : "Create New User"}</CardTitle>
            <CardDescription>
              Enter the user information below. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Username" disabled={isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEditing ? "New Password (leave blank to keep current)" : "Password *"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder={isEditing ? "New password (optional)" : "Password"} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="arabic_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arabic Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="الاسم بالعربية" dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="language_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language Preference</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="arabic">Arabic (العربية)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={currentUser?.role !== "admin"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="production_manager">Production Manager</SelectItem>
                          <SelectItem value="salesperson">Salesperson</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mobile number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section / Department</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Section or department" />
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
                    {mutation.isPending ? "Saving..." : "Save User"}
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

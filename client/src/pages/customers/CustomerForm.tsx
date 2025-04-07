import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { insertCustomerSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { t, useLanguage } from "@/utils/language";
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

// Extend the insertCustomerSchema with some validation
const formSchema = insertCustomerSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  arabic_name: z.string().optional(),
  address: z.string().optional(),
  drawer_no: z.string().optional(),
  salesperson_id: z.string().optional().transform(val => val && val !== "none" ? parseInt(val) : undefined),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  id?: number;
}

export default function CustomerForm({ id }: CustomerFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;
  
  // Fetch customer if editing
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: [`/api/customers/${id}`],
    enabled: isEditing,
  });
  
  // Fetch salespersons for dropdown
  const { data: salespersons, isLoading: isLoadingSalespersons } = useQuery({
    queryKey: ['/api/salespersons'],
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      arabic_name: "",
      address: "",
      drawer_no: "",
      salesperson_id: "none",
    },
  });
  
  // Update form values when customer data is loaded
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        arabic_name: customer.arabic_name || "",
        address: customer.address || "",
        drawer_no: customer.drawer_no || "",
        salesperson_id: customer.salesperson_id ? String(customer.salesperson_id) : "none",
      });
    }
  }, [customer, form]);
  
  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        await apiRequest('PATCH', `/api/customers/${id}`, values);
      } else {
        await apiRequest('POST', '/api/customers', values);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? t('customerUpdated', { fallback: 'Customer updated' }) : t('customerCreated', { fallback: 'Customer created' }),
        description: isEditing ? t('customerUpdatedDescription', { fallback: 'Customer has been successfully updated.' }) : t('customerCreatedDescription', { fallback: 'Customer has been successfully created.' }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      if (!isEditing) {
        navigate('/customers');
      }
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: isEditing ? t('failedToUpdateCustomer', { fallback: `Failed to update customer: ${error.message}` }) : t('failedToCreateCustomer', { fallback: `Failed to create customer: ${error.message}` }),
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
            onClick={() => navigate("/customers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToCustomers', { fallback: 'Back to Customers' })}
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {isEditing ? t('editCustomer', { fallback: 'Edit Customer' }) : t('newCustomer', { fallback: 'New Customer' })}
          </h1>
        </div>
      </div>
      
      {isEditing && isLoadingCustomer ? (
        <FormSkeleton fields={4} columns={1} hasButtons={true} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? t('editCustomerDetails', { fallback: 'Edit Customer Details' }) : t('createNewCustomer', { fallback: 'Create New Customer' })}</CardTitle>
            <CardDescription>
              {t('customerFormDescription', { fallback: 'Enter the customer information below. All fields marked with * are required.' })}
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
                      <FormLabel>{t('name')} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('customerNamePlaceholder', { fallback: "Customer name" })} />
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
                      <FormLabel>{t('arabicName')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="اسم العميل بالعربية" 
                          dir="rtl" 
                          className="text-right font-semibold text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('address')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('customerAddressPlaceholder', { fallback: "Customer address" })} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="drawer_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('drawerNo')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('drawerNumberPlaceholder', { fallback: "Drawer number" })} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="salesperson_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('salesperson')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectSalesperson', { fallback: "Select a salesperson" })} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('none', { fallback: "None" })}</SelectItem>
                          {!isLoadingSalespersons && salespersons?.map((salesperson) => (
                            <SelectItem 
                              key={salesperson.id} 
                              value={String(salesperson.id)}
                            >
                              {salesperson.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    {mutation.isPending ? t('saving', { fallback: "Saving..." }) : t('saveCustomer', { fallback: "Save Customer" })}
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

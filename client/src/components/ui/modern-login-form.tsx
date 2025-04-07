import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, User, Lock, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function ModernLoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [securityTip, setSecurityTip] = useState<string>("Never share your login credentials with anyone.");
  
  // Array of security tips to cycle through
  const securityTips = [
    "Never share your login credentials with anyone.",
    "Use a strong, unique password for your account.",
    "Ensure you log out when using shared devices.",
    "Enable two-factor authentication if available.",
    "Check that you're on the correct website before logging in."
  ];
  
  // Cycle security tips every few seconds
  useState(() => {
    const intervalId = setInterval(() => {
      setSecurityTip(securityTips[Math.floor(Math.random() * securityTips.length)]);
    }, 8000);
    
    return () => clearInterval(intervalId);
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Simple login approach that uses the auth context
      await login(values.username, values.password);
      
      toast({
        title: "Login successful",
        description: "Welcome back to the MPBF System.",
      });
      
      // Simple redirect to home page
      window.location.href = '/';
      
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Card className="border-0 shadow-xl bg-white overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-center text-blue-800">
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Enter your credentials to access the production system
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="standard" className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>
            <TabsContent value="standard">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            className="bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            {...field}
                            disabled={isLoading}
                          />
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
                        <FormLabel className="text-slate-700 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-blue-600" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.span 
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                        Authenticating...
                      </motion.span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn className="h-5 w-5" />
                        Sign In
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="qr">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="p-4 bg-slate-100 rounded-lg">
                  <p className="text-sm text-slate-600 text-center mb-4">Scan with your mobile app</p>
                  {/* Placeholder for QR code scanner */}
                  <div className="w-48 h-48 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                    <p className="text-slate-400 text-sm text-center px-2">QR Authentication coming soon</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between mt-6">
            <div className="flex-1 border-t border-slate-200"></div>
            <div className="px-2 text-xs text-slate-500">OR</div>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <div className="mt-6 flex flex-col space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              type="button"
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h6"></path>
                  <path d="M12 9v6"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Request Access
              </span>
            </Button>
          </div>
        </CardContent>

        <div className="px-6 pb-6">
          <Separator className="my-4" />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <p className="text-xs">{securityTip}</p>
          </div>
        </div>

        <CardFooter className="bg-slate-50 py-4 px-6 text-center text-sm text-slate-600 border-t">
          <div className="w-full">
            Demo credentials: <span className="font-medium text-blue-700">admin / admin123</span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default ModernLoginForm;
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Customer, Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SmsNotifications() {
  const { toast } = useToast();
  const [singleMessage, setSingleMessage] = useState("");
  const [singlePhoneNumber, setSinglePhoneNumber] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<string>("completed");
  const [orderMessage, setOrderMessage] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch orders for dropdown
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Single SMS mutation
  const sendSingleSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      return await apiRequest('POST', '/api/sms/send', data);
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent",
        description: "Message has been sent successfully.",
      });
      setSingleMessage("");
      setSinglePhoneNumber("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send SMS",
        description: error.message || "An error occurred while sending the message.",
        variant: "destructive",
      });
    }
  });

  // Customer notification mutation
  const notifyCustomerMutation = useMutation({
    mutationFn: async (data: { customerId: number; message: string }) => {
      return await apiRequest('POST', '/api/sms/notify-customer', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Customer Notified",
        description: `Message sent to ${data.customer.name}.`,
      });
      setSelectedCustomerId("");
      setCustomerMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to notify customer",
        description: error.message || "An error occurred while sending the notification.",
        variant: "destructive",
      });
    }
  });

  // Order notification mutation
  const notifyOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; status: string; customMessage?: string }) => {
      return await apiRequest('POST', '/api/sms/notify-order-status', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Order Status Notification Sent",
        description: `Status update for Order #${data.order.id} sent to customer.`,
      });
      setSelectedOrderId("");
      setOrderStatus("completed");
      setOrderMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send order notification",
        description: error.message || "An error occurred while sending the notification.",
        variant: "destructive",
      });
    }
  });

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return await apiRequest('POST', '/api/sms/notify-all-customers', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Broadcast Message Sent",
        description: `Message sent to ${data.customersCount} customers.`,
      });
      setBroadcastMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send broadcast",
        description: error.message || "An error occurred while sending the broadcast.",
        variant: "destructive",
      });
    }
  });

  // Handle sending single SMS
  const handleSendSingleSMS = () => {
    if (!singlePhoneNumber.trim() || !singleMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Phone number and message are required.",
        variant: "destructive",
      });
      return;
    }

    sendSingleSMSMutation.mutate({
      phoneNumber: singlePhoneNumber.trim(),
      message: singleMessage.trim()
    });
  };

  // Handle customer notification
  const handleNotifyCustomer = () => {
    if (!selectedCustomerId || !customerMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer and message are required.",
        variant: "destructive",
      });
      return;
    }

    notifyCustomerMutation.mutate({
      customerId: parseInt(selectedCustomerId, 10),
      message: customerMessage.trim()
    });
  };

  // Handle order status notification
  const handleOrderStatusNotification = () => {
    if (!selectedOrderId || !orderStatus) {
      toast({
        title: "Validation Error",
        description: "Order and status are required.",
        variant: "destructive",
      });
      return;
    }

    notifyOrderMutation.mutate({
      orderId: parseInt(selectedOrderId, 10),
      status: orderStatus,
      customMessage: orderMessage.trim() || undefined
    });
  };

  // Handle broadcast to all customers
  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Message is required for broadcast.",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate({
      message: broadcastMessage.trim()
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SMS Notifications</h1>
        <p className="text-slate-600">Send SMS notifications to customers and users</p>
      </div>

      <Tabs defaultValue="single" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single">
            <MessageSquare className="h-4 w-4 mr-2" />
            Single SMS
          </TabsTrigger>
          <TabsTrigger value="customer">
            <Users className="h-4 w-4 mr-2" />
            Customer Notification
          </TabsTrigger>
          <TabsTrigger value="order">
            <Package className="h-4 w-4 mr-2" />
            Order Updates
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Send className="h-4 w-4 mr-2" />
            Broadcast
          </TabsTrigger>
        </TabsList>

        {/* Single SMS Tab */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Send Single SMS</CardTitle>
              <CardDescription>
                Send an SMS message to any phone number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  placeholder="e.g. +966501234567"
                  value={singlePhoneNumber}
                  onChange={(e) => setSinglePhoneNumber(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter with country code (e.g., +966 for Saudi Arabia)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={singleMessage}
                  onChange={(e) => setSingleMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {singleMessage.length} characters
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSendSingleSMS}
                disabled={sendSingleSMSMutation.isPending}
              >
                {sendSingleSMSMutation.isPending ? "Sending..." : "Send SMS"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Customer Notification Tab */}
        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <CardTitle>Customer Notification</CardTitle>
              <CardDescription>
                Send an SMS notification to a specific customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} {customer.phone ? `(${customer.phone})` : "(No phone)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  placeholder="Type your message to the customer..."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {customerMessage.length} characters
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleNotifyCustomer}
                disabled={notifyCustomerMutation.isPending}
              >
                {notifyCustomerMutation.isPending ? "Sending..." : "Send Notification"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Order Status Tab */}
        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Updates</CardTitle>
              <CardDescription>
                Notify customers about order status changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <Select
                  value={selectedOrderId}
                  onValueChange={setSelectedOrderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map(order => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        Order #{order.id} - {order.customer_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={orderStatus}
                  onValueChange={setOrderStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Custom Message (Optional)</label>
                <Textarea
                  placeholder="Leave blank to use default status update message..."
                  value={orderMessage}
                  onChange={(e) => setOrderMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {orderMessage.length} characters - If left blank, a default message will be sent
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleOrderStatusNotification}
                disabled={notifyOrderMutation.isPending}
              >
                {notifyOrderMutation.isPending ? "Sending..." : "Send Status Update"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Message</CardTitle>
              <CardDescription>
                Send a message to all customers with registered phone numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  placeholder="Type broadcast message here..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {broadcastMessage.length} characters - This will be sent to all customers with phone numbers
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleBroadcast}
                disabled={broadcastMutation.isPending}
              >
                {broadcastMutation.isPending ? "Broadcasting..." : "Send to All Customers"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
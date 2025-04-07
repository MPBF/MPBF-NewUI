import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Search, ChevronDown } from "lucide-react";

// Type definitions
interface JobOrder {
  id: number;
  customer_id: number;
  item_id: number;
  quantity: number;
  status: string;
  size_details?: string | null;
  raw_material?: string | null;
  mast_batch?: string | null;
}

interface Customer {
  id: number;
  name: string;
}

interface Item {
  id: number;
  pcid?: string;
  product_name?: string;
}

interface Roll {
  id: number;
  job_order_id: number;
  extruding_qty: number | null;
}

interface JobOrderSelectorProps {
  value: number | null;
  onChange: (jobOrderId: number) => void;
  onQuantityChange?: (quantity: number) => void;
  customerId?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  width?: string;
  filterActive?: boolean;
}

/**
 * Custom Job Order Selector with Modal Dialog
 * 
 * This component provides a custom job order selector with a modal dialog
 * that shows detailed information about each job order in a visually rich format.
 */
export default function JobOrderSelector({
  value,
  onChange,
  onQuantityChange,
  customerId,
  disabled = false,
  className = "",
  placeholder = "Select a job order",
  width = "full",
  filterActive = true
}: JobOrderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch the necessary data
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery<JobOrder[]>({
    queryKey: ['/api/job-orders'],
    queryFn: () => apiRequest<JobOrder[]>('GET', '/api/job-orders'),
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest<Customer[]>('GET', '/api/customers'),
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest<Item[]>('GET', '/api/items'),
  });

  const { data: rolls } = useQuery<Roll[]>({
    queryKey: ['/api/rolls'],
    queryFn: () => apiRequest<Roll[]>('GET', '/api/rolls'),
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds to ensure latest data
  });

  // Get the selected job order details
  const selectedJobOrder = value 
    ? jobOrders?.find((jo: JobOrder) => jo.id === value) 
    : null;

  // Filter job orders by customer if customerId is provided
  const filteredJobOrders = jobOrders?.filter((jo: JobOrder) => {
    // Filter by customer if customerId is provided
    if (customerId && jo.customer_id !== customerId) {
      return false;
    }
    
    // If filtering active is enabled, only show active job orders
    if (filterActive && jo.status === "Completed") {
      return false;
    }
    
    // Apply search term if present
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const item = items?.find((i: Item) => i.id === jo.item_id);
      const customer = customers?.find((c: Customer) => c.id === jo.customer_id);
      
      return (
        jo.id.toString().includes(term) ||
        (item?.pcid?.toLowerCase().includes(term) || false) ||
        (customer?.name?.toLowerCase().includes(term) || false) ||
        (jo.size_details?.toLowerCase().includes(term) || false) ||
        (jo.raw_material?.toLowerCase().includes(term) || false) ||
        (jo.mast_batch?.toLowerCase().includes(term) || false)
      );
    }
    
    return true;
  });

  // Calculate remaining quantity for a job order
  const calculateRemainingQuantity = (jobOrderId: number, totalQuantity: number): number => {
    if (!rolls) return totalQuantity;
    
    // Calculate total extruded quantity for this job order
    const jobOrderRolls = rolls.filter((roll: Roll) => roll.job_order_id === jobOrderId);
    const totalExtrudedQty = jobOrderRolls.reduce((sum: number, r: Roll) => 
      sum + (r.extruding_qty || 0), 0);
    
    return Math.max(0, totalQuantity - totalExtrudedQty);
  };

  // Returns item details for a given item id
  const getItemDetails = (itemId?: number) => {
    if (!itemId || !items) return null;
    return items.find((i: Item) => i.id === itemId);
  };

  // Returns customer name for a given customer id
  const getCustomerName = (customerId?: number) => {
    if (!customerId || !customers) return "Unknown";
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };

  // Handle selection
  const handleSelection = (jobOrder: JobOrder) => {
    onChange(jobOrder.id);
    
    // If onQuantityChange is provided, pass the remaining quantity
    if (onQuantityChange) {
      const remainingQty = calculateRemainingQuantity(jobOrder.id, jobOrder.quantity);
      onQuantityChange(remainingQty);
    }
    
    setIsOpen(false);
  };

  // Reset search when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        className={`${width === "full" ? "w-full" : ""} justify-between`}
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        {selectedJobOrder ? (
          <div className="flex items-center">
            <span className="font-medium text-primary mr-2">
              JO #{selectedJobOrder.id}
            </span>
            {items && (
              <Badge variant="outline" className="text-xs bg-primary/5">
                {getItemDetails(selectedJobOrder.item_id)?.pcid || 'N/A'}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-4 pt-16 md:pt-[15vh]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="bg-background rounded-md shadow-lg w-[90%] max-w-[600px] max-h-[70vh] z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Select Job Order</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            {/* Search Input */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8"
                />
              </div>
            </div>
            
            {/* Job Order List */}
            <div className="overflow-y-auto p-2">
              {isLoadingJobOrders ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading job orders...</p>
                </div>
              ) : filteredJobOrders && filteredJobOrders.length > 0 ? (
                filteredJobOrders.map((jobOrder: JobOrder) => {
                  // Get the item details
                  const item = getItemDetails(jobOrder.item_id);
                  // Calculate remaining quantity
                  const balanceQty = calculateRemainingQuantity(jobOrder.id, jobOrder.quantity);
                  
                  return (
                    <div
                      key={jobOrder.id}
                      className={`p-3 mb-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${
                        value === jobOrder.id ? 'bg-primary/10 border-primary' : 'bg-card'
                      }`}
                      onClick={() => handleSelection(jobOrder)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className="px-2 py-0.5" variant="outline">JO #{jobOrder.id}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {item?.pcid || 'N/A'}
                          </Badge>
                        </div>
                        <Badge variant={jobOrder.status === 'Processing' ? 'default' : 'outline'}>
                          {jobOrder.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Customer</p>
                          <p className="font-medium truncate">{getCustomerName(jobOrder.customer_id)}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Available Balance</p>
                          <p className="font-bold text-primary">{balanceQty.toFixed(2)} kg</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Product</p>
                          <p className="font-medium truncate">{item?.product_name || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Size Details</p>
                          <p className="font-medium truncate">{jobOrder.size_details || 'N/A'}</p>
                        </div>
                        
                        {jobOrder.raw_material && (
                          <div>
                            <p className="text-xs text-muted-foreground">Raw Material</p>
                            <p className="font-medium truncate">{jobOrder.raw_material}</p>
                          </div>
                        )}
                        
                        {jobOrder.mast_batch && (
                          <div>
                            <p className="text-xs text-muted-foreground">Mast Batch</p>
                            <p className="font-medium truncate">{jobOrder.mast_batch}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm ? "No matching job orders found" : "No available job orders"}
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                disabled={!value}
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
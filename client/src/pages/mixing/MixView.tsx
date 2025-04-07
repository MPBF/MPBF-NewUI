import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronRight, Edit, FileDown, Printer } from "lucide-react";
import jsPDF from "jspdf";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useLanguage, t } from "@/utils/language";
import { generatePdf } from "@/utils/pdf";
import { TableSkeleton } from "@/components/ui/skeletons";
import { usePermissions } from "@/utils/permissions";

// Material types constants with composition guidelines
const MATERIAL_TYPES_INFO = [
  { type: "HDPE", description: "High-Density Polyethylene", defaultPercentage: 60, color: "#3b82f6" },
  { type: "LDPE", description: "Low-Density Polyethylene", defaultPercentage: 15, color: "#60a5fa" },
  { type: "LLDPE", description: "Linear Low-Density Polyethylene", defaultPercentage: 10, color: "#93c5fd" },
  { type: "Regrind", description: "Recycled Material", defaultPercentage: 5, color: "#4ade80" },
  { type: "Filler", description: "Calcium Carbonate/Talc", defaultPercentage: 5, color: "#d4d4d4" },
  { type: "Color", description: "Color Masterbatch", defaultPercentage: 3, color: "#f472b6" },
  { type: "D2w", description: "Degradable Additive", defaultPercentage: 2, color: "#a78bfa" }
];

// Simple list of material types
const MATERIAL_TYPES = MATERIAL_TYPES_INFO.map(material => material.type);

export default function MixView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { language, isRtl } = useLanguage();
  const { hasRole } = usePermissions();
  const [activeTab, setActiveTab] = useState("materials");

  // Define the interfaces for type safety
  interface Mix {
    id: number;
    mix_date: string | Date;
    created_by: number;
    batch_number?: string;
    status?: string;
    notes?: string | null;
  }
  
  interface MixItem {
    id: number;
    mix_id: number;
    material_type: string;
    quantity_kg: number;
    notes?: string | null;
  }
  
  interface Order {
    id: number;
    order_date: string;
    customer_id: number;
    customer_name?: string;
    status?: string;
  }
  
  interface Machine {
    id: number;
    identification: string;
    section: string;
    code: string;
    manufacturer_name?: string | null;
  }
  
  interface User {
    id: number;
    username: string;
    name: string;
    role: string;
  }
  
  interface MaterialSummary {
    type: string;
    weight: number;
    percentage: string;
  }

  // Parse ID safely
  const mixId = id ? parseInt(id) : undefined;

  // Query for mix details
  const { data: mix, isLoading: isMixLoading } = useQuery<Mix>({
    queryKey: ["/api/mixes", mixId],
    enabled: !!mixId, // Only run if id is valid
  });

  // Query for mix items
  const { data: mixItems = [], isLoading: isMixItemsLoading } = useQuery<MixItem[]>({
    queryKey: ["/api/mix-items", mixId],
    enabled: !!mixId, // Only run if id is valid
  });

  // Query for related orders
  const { data: relatedOrders = [], isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/mixes", mixId, "orders"],
    enabled: !!mixId, // Only run if id is valid
  });

  // Query for related machines
  const { data: relatedMachines = [], isLoading: isMachinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/mixes", mixId, "machines"],
    enabled: !!mixId, // Only run if id is valid
  });

  // Query for users (to get operator name)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Calculate total weight
  const totalWeight = mixItems.reduce((sum: number, item: any) => sum + parseFloat(item.quantity_kg), 0);

  // Prepare columns for mix items table
  const mixItemColumns = [
    {
      header: t("materialType", { lang: language }),
      accessorKey: "material_type",
    },
    {
      header: t("quantityKg", { lang: language }),
      accessorKey: "quantity_kg",
      cell: (item: any) => `${item.quantity_kg} kg`,
    },
    {
      header: t("percentage", { lang: language }),
      accessorKey: "percentage",
      cell: (item: any) => {
        const percentage = totalWeight > 0 
          ? ((parseFloat(item.quantity_kg) / totalWeight) * 100).toFixed(2) 
          : "0";
        return `${percentage}%`;
      },
    },
    {
      header: t("mixNotes", { lang: language, fallback: "Notes" }),
      accessorKey: "notes",
      cell: (item: any) => item.notes || "—",
    },
  ];

  // Prepare columns for orders table
  const orderColumns = [
    {
      header: t("id", { lang: language }),
      accessorKey: "id",
      cell: (order: any) => `#${order.id}`,
    },
    {
      header: t("date", { lang: language }),
      accessorKey: "order_date",
      cell: (order: any) => format(new Date(order.order_date), "MMM d, yyyy"),
    },
    {
      header: t("customer", { lang: language }),
      accessorKey: "customer_id",
      cell: (order: any) => {
        // Find customer name if available
        const customer = order.customer_name || `Customer #${order.customer_id}`;
        return customer;
      },
    },
    {
      header: t("status", { lang: language }),
      accessorKey: "status",
      cell: (order: any) => (
        <Badge variant={
          order.status === "Completed" ? "default" : 
          order.status === "In Progress" ? "secondary" : "outline"
        }>
          {order.status}
        </Badge>
      ),
    },
  ];

  // Prepare columns for machines table
  const machineColumns = [
    {
      header: t("id", { lang: language }),
      accessorKey: "id",
      cell: (machine: any) => `#${machine.id}`,
    },
    {
      header: t("identification", { lang: language }),
      accessorKey: "identification",
      cell: (machine: any) => machine.identification || "—",
    },
    {
      header: t("section", { lang: language }),
      accessorKey: "section",
    },
    {
      header: t("code", { lang: language }),
      accessorKey: "code",
    },
    {
      header: t("manufacturerName", { lang: language }),
      accessorKey: "manufacturer_name",
      cell: (machine: any) => machine.manufacturer_name || "—",
    },
  ];

  // Function to get operator name by ID
  const getOperatorName = (operatorId: number) => {
    const operator = users.find((user: any) => user.id === operatorId);
    return operator ? operator.name : `Operator #${operatorId}`;
  };

  // Function to generate and download mix report as PDF
  const generateMixReport = () => {
    if (!mix || !mixItems) return;

    const operatorName = getOperatorName(mix.created_by);
    
    // Create material summary data first
    const summaryData: string[][] = [];
    summaryData.push([
      t("materialType", { lang: language }),
      t("totalWeight", { lang: language }),
      t("percentage", { lang: language })
    ]);
    
    // Add each material type that is present in the mix
    MATERIAL_TYPES.forEach(materialType => {
      // Filter items by material type
      const materialsOfType = mixItems.filter((item: any) => 
        item.material_type === materialType
      );
      
      // Skip if there are no materials of this type
      if (materialsOfType.length === 0) return;
      
      // Calculate total weight of this material type
      const typeWeight = materialsOfType.reduce(
        (sum: number, item: any) => sum + parseFloat(item.quantity_kg), 0
      );
      
      // Calculate percentage
      const percentage = totalWeight > 0 
        ? ((typeWeight / totalWeight) * 100).toFixed(2) 
        : "0";
        
      summaryData.push([
        materialType,
        `${typeWeight.toFixed(2)} kg`,
        `${percentage}%`
      ]);
    });
    
    // Add total row
    summaryData.push([
      t("total", { lang: language }),
      `${totalWeight.toFixed(2)} kg`,
      "100%"
    ]);
    
    // Material details data
    const materialsData = mixItems.map((item: any) => [
      item.material_type,
      `${item.quantity_kg} kg`,
      totalWeight > 0 
        ? `${((parseFloat(item.quantity_kg) / totalWeight) * 100).toFixed(2)}%` 
        : "0%",
      item.notes || "—"
    ]);

    // Add batch number and status info
    const batchInfo = mix.batch_number ? 
      `${t("batchNumber", { lang: language })}: ${mix.batch_number}` : 
      "";
      
    const statusInfo = mix.status ? 
      `${t("status", { lang: language })}: ${mix.status}` : 
      `${t("status", { lang: language })}: ${t("pending", { lang: language })}`;
      
    const ordersInfo = relatedOrders.length > 0 
      ? `${t("relatedOrders", { lang: language })}: ${relatedOrders.map((o: any) => `#${o.id}`).join(", ")}` 
      : t("noRelatedOrders", { lang: language });
    
    const machinesInfo = relatedMachines.length > 0 
      ? `${t("machinesList", { lang: language })}: ${relatedMachines.map((m: any) => m.identification || `#${m.id}`).join(", ")}` 
      : t("noMachines", { lang: language });

    generatePdf({
      title: `${t("mix", { lang: language })} ${t("report", { lang: language })} #${mix.id}`,
      subtitle: `${t("date", { lang: language })}: ${mix.mix_date ? format(new Date(mix.mix_date), "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy")}`,
      filterInfo: `${t("operator", { lang: language })}: ${operatorName} | ${batchInfo} | ${statusInfo}`,
      dateRange: `${t("totalWeight", { lang: language })}: ${totalWeight.toFixed(2)} kg | ${ordersInfo} | ${machinesInfo}`,
      columns: [t("materialType", { lang: language }), t("quantity", { lang: language }), t("percentage", { lang: language }), t("notes", { lang: language, fallback: "Notes" })],
      data: materialsData,
      orientation: "portrait",
      pageSize: "A4",
    });
  };
  
  // Function to generate and download mix order format PDF
  const generateMixOrderPdf = () => {
    if (!mix || !mixItems) return;

    const operatorName = getOperatorName(mix.created_by);
    const mixDate = mix.mix_date ? format(new Date(mix.mix_date), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy");
    
    // Create a PDF document
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Mix Order Form", 14, 15);
    
    // Add Mix ID and Date
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Mix No. MIX-${mix.id.toString().padStart(3, '0')}`, 14, 25);
    doc.text(`Mix Date: ${mixDate}`, 140, 25);
    
    // Add Batch Number and Status
    doc.text(`Batch No: ${mix.batch_number || "—"}`, 14, 35);
    doc.text(`Status: ${mix.status || "Pending"}`, 140, 35);
    
    // Add Created by and Notes
    doc.text(`Created by: ${operatorName}`, 14, 45);
    doc.text(`Mix Note: ${mix.notes || "—"}`, 140, 45);
    
    // Add table header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("#", 14, 55);
    doc.text("Material", 25, 55);
    doc.text("Qty", 100, 55);
    doc.text("%", 120, 55);
    
    // Add horizontal line
    doc.line(14, 57, 196, 57);
    
    // Add table data
    doc.setFont("helvetica", "normal");
    let yPos = 65;
    let index = 1;
    
    // Prepare material data
    const materialData: MaterialSummary[] = [];
    
    MATERIAL_TYPES.forEach(materialType => {
      // Filter items by material type
      const materialsOfType = mixItems.filter((item: any) => 
        item.material_type === materialType
      );
      
      // Skip if there are no materials of this type
      if (materialsOfType.length === 0) return;
      
      // Calculate total weight of this material type
      const typeWeight = materialsOfType.reduce(
        (sum: number, item: any) => sum + parseFloat(item.quantity_kg), 0
      );
      
      // Calculate percentage
      const percentage = totalWeight > 0 
        ? ((typeWeight / totalWeight) * 100).toFixed(1) 
        : "0";
      
      materialData.push({
        type: materialType,
        weight: typeWeight,
        percentage: percentage
      });
    });
    
    // Add each material row
    materialData.forEach(material => {
      doc.text(`${index}-`, 14, yPos);
      doc.text(material.type, 25, yPos);
      doc.text(`${material.weight}`, 100, yPos);
      doc.text(`${material.percentage}%`, 120, yPos);
      yPos += 8;
      index++;
    });
    
    // Add total line
    doc.line(14, yPos, 196, yPos);
    yPos += 8;
    
    // Add total row
    doc.setFont("helvetica", "bold");
    doc.text("Total", 14, yPos);
    doc.text(`${totalWeight.toFixed(1)}`, 100, yPos);
    doc.text("100%", 120, yPos);
    
    // Save the PDF
    doc.save(`Mix-Order-${mix.id}.pdf`);
  };
  
  // Function to generate a comprehensive PDF with mix information, materials details, and summary
  const generateCompleteMixPdf = () => {
    if (!mix || !mixItems) return;

    const operatorName = getOperatorName(mix.created_by);
    const mixDate = mix.mix_date ? format(new Date(mix.mix_date), "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy");
    
    // Create a PDF document
    const doc = new jsPDF();
    
    // Add the company logo (base64 embedded to avoid path issues)
    const logoBase64 = 'data:image/png;base64,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';

    // Add the logo to the PDF 
    doc.addImage(logoBase64, 'PNG', 10, 10, 15, 15);
    
    // Add company name with logo
    doc.setTextColor(51, 75, 115);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MODERN PLASTIC BAG FACTORY', 30, 15);
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t("mix", { lang: language })} ${t("report", { lang: language })}`, 14, 30);
    
    // Add Mix ID and Batch Number
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t("mix", { lang: language })} #${mix.id}`, 14, 40);
    if (mix.batch_number) {
      doc.text(`${t("batchNumber", { lang: language })}: ${mix.batch_number}`, 14, 45);
    }
    
    // Add Mix Info Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t("mixInfo", { lang: language })}`, 14, 55);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t("date", { lang: language })}: ${mixDate}`, 14, 62);
    doc.text(`${t("createdBy", { lang: language })}: ${operatorName}`, 14, 68);
    doc.text(`${t("status", { lang: language })}: ${mix.status || t("pending", { lang: language })}`, 14, 74);
    doc.text(`${t("totalWeight", { lang: language })}: ${totalWeight.toFixed(2)} kg`, 14, 80);

    if (mix.notes) {
      doc.text(`${t("notes", { lang: language })}:`, 14, 86);
      doc.setFontSize(10);
      
      // Handle long notes by wrapping text
      const splitNotes = doc.splitTextToSize(mix.notes, 180);
      doc.text(splitNotes, 14, 92);
    }
    
    // Add Material Summary Section
    let yPosition = mix.notes ? 92 + (doc.splitTextToSize(mix.notes, 180).length * 6) : 90;
    
    // Ensure we have space for the materials summary, otherwise add a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t("materialSummary", { lang: language })}`, 14, yPosition);
    
    yPosition += 10;
    
    // Add summary table headers
    doc.setFontSize(10);
    doc.text(`${t("materialType", { lang: language })}`, 14, yPosition);
    doc.text(`${t("quantity", { lang: language })}`, 100, yPosition);
    doc.text(`${t("percentage", { lang: language })}`, 140, yPosition);
    
    // Add horizontal line
    doc.line(14, yPosition + 2, 196, yPosition + 2);
    
    // Prepare summary data
    const materialSummary: MaterialSummary[] = [];
    
    MATERIAL_TYPES.forEach(materialType => {
      // Filter items by material type
      const materialsOfType = mixItems.filter((item: any) => 
        item.material_type === materialType
      );
      
      // Skip if there are no materials of this type
      if (materialsOfType.length === 0) return;
      
      // Calculate total weight of this material type
      const typeWeight = materialsOfType.reduce(
        (sum: number, item: any) => sum + parseFloat(item.quantity_kg), 0
      );
      
      // Calculate percentage
      const percentage = totalWeight > 0 
        ? ((typeWeight / totalWeight) * 100).toFixed(1) 
        : "0";
      
      materialSummary.push({
        type: materialType,
        weight: typeWeight,
        percentage
      });
    });
    
    // Add summary data
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    
    materialSummary.forEach(material => {
      doc.text(material.type, 14, yPosition);
      doc.text(`${material.weight.toFixed(2)} kg`, 100, yPosition);
      doc.text(`${material.percentage}%`, 140, yPosition);
      yPosition += 6;
    });
    
    // Add horizontal line
    doc.line(14, yPosition, 196, yPosition);
    
    // Add total row
    yPosition += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`${t("total", { lang: language })}`, 14, yPosition);
    doc.text(`${totalWeight.toFixed(2)} kg`, 100, yPosition);
    doc.text("100%", 140, yPosition);
    
    // Add Material Details Section
    yPosition += 15;
    
    // Check if we need a new page for material details
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t("materialDetails", { lang: language })}`, 14, yPosition);
    
    yPosition += 10;
    
    // Add details table headers
    doc.setFontSize(10);
    doc.text("#", 14, yPosition);
    doc.text(`${t("materialType", { lang: language })}`, 25, yPosition);
    doc.text(`${t("quantity", { lang: language })}`, 90, yPosition);
    doc.text(`${t("percentage", { lang: language })}`, 125, yPosition);
    doc.text(`${t("mixItemNotes", { lang: language })}`, 155, yPosition);
    
    // Add horizontal line
    doc.line(14, yPosition + 2, 196, yPosition + 2);
    
    // Add details data
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    
    mixItems.forEach((item, index) => {
      const percentage = totalWeight > 0 
        ? ((parseFloat(item.quantity_kg.toString()) / totalWeight) * 100).toFixed(1) 
        : "0";
      
      doc.text(`${index + 1}`, 14, yPosition);
      doc.text(item.material_type, 25, yPosition);
      doc.text(`${parseFloat(item.quantity_kg.toString()).toFixed(2)} kg`, 90, yPosition);
      doc.text(`${percentage}%`, 125, yPosition);
      
      // Add notes with truncation if needed
      const notesText = item.notes || "—";
      if (notesText.length > 20) {
        doc.text(notesText.substring(0, 20) + "...", 155, yPosition);
      } else {
        doc.text(notesText, 155, yPosition);
      }
      
      yPosition += 6;
      
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Re-add headers on the new page
        doc.setFont('helvetica', 'bold');
        doc.text("#", 14, yPosition);
        doc.text(`${t("materialType", { lang: language })}`, 25, yPosition);
        doc.text(`${t("quantity", { lang: language })}`, 90, yPosition);
        doc.text(`${t("percentage", { lang: language })}`, 125, yPosition);
        doc.text(`${t("mixItemNotes", { lang: language })}`, 155, yPosition);
        
        // Add horizontal line
        doc.line(14, yPosition + 2, 196, yPosition + 2);
        
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
      }
    });
    
    // Add info about related orders and machines
    if (relatedOrders.length > 0 || relatedMachines.length > 0) {
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${t("additionalInfo", { lang: language })}`, 14, yPosition);
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Related Orders
      if (relatedOrders.length > 0) {
        doc.text(`${t("relatedOrders", { lang: language })}: ${relatedOrders.map((o: any) => `#${o.id}`).join(", ")}`, 14, yPosition);
        yPosition += 6;
      }
      
      // Related Machines
      if (relatedMachines.length > 0) {
        const machineText = `${t("machinesList", { lang: language })}: ${relatedMachines.map((m: any) => m.identification || `#${m.id}`).join(", ")}`;
        const splitMachines = doc.splitTextToSize(machineText, 180);
        doc.text(splitMachines, 14, yPosition);
      }
    }
    
    // Add page numbers
    const pageCount = (doc as any).internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`${t("page", { lang: language, fallback: "Page" })} ${i} ${t("of", { lang: language, fallback: "of" })} ${pageCount}`, 180, 290);
      
      // Add timestamp to footer
      const timestamp = `${t("generated", { lang: language, fallback: "Generated on" })}: ${new Date().toLocaleString()}`;
      doc.text(timestamp, 14, 290);
    }
    
    // Save the PDF
    doc.save(`Mix-Complete-${mix.id}.pdf`);
  };

  // Loading states
  const isLoading = isMixLoading || isMixItemsLoading || isOrdersLoading || isMachinesLoading;

  // Find material info for color coding and display
  const getMaterialInfo = (type: string) => {
    return MATERIAL_TYPES_INFO.find((m) => m.type === type) || 
      { type, description: type, defaultPercentage: 0, color: "#888888" };
  };

  // Create material composition data for visualization
  const materialComposition = MATERIAL_TYPES.map(materialType => {
    // Filter items by material type
    const materialsOfType = mixItems.filter((item: any) => 
      item.material_type === materialType
    );
    
    // Skip if there are no materials of this type
    if (materialsOfType.length === 0) return null;
    
    // Calculate total weight of this material type
    const typeWeight = materialsOfType.reduce(
      (sum: number, item: any) => sum + parseFloat(item.quantity_kg), 0
    );
    
    // Calculate percentage
    const percentage = totalWeight > 0 
      ? ((typeWeight / totalWeight) * 100)
      : 0;
      
    const info = getMaterialInfo(materialType);
    
    return {
      type: materialType,
      weight: typeWeight,
      percentage,
      color: info.color,
      description: info.description
    };
  }).filter(Boolean);

  // Get status color by value
  const getStatusColor = (status?: string) => {
    switch(status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-300";
      case "In Progress": return "bg-blue-100 text-blue-800 border-blue-300";
      case "On Hold": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Failed": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center mb-4 text-sm text-muted-foreground">
        <Button variant="link" onClick={() => setLocation("/production/mixing")}>
          {t("mixes", { lang: language })}
        </Button>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span>{t("mixDetails", { lang: language })}</span>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("mixDetails", { lang: language })}</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={4} columns={2} />
          </CardContent>
        </Card>
      ) : mix ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {t("mix", { lang: language })} #{mix.id}
            </h2>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={generateMixReport}>
                <FileDown className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t("downloadReport", { lang: language })}
              </Button>
              <Button variant="outline" onClick={generateMixOrderPdf}>
                <FileDown className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t("mix", { lang: language })} {t("report", { lang: language })}
              </Button>
              <Button variant="outline" onClick={generateCompleteMixPdf}>
                <Printer className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t("print", { lang: language })}
              </Button>
              {hasRole(["Admin", "ProductionManager"]) && (
                <Button onClick={() => setLocation(`/production/mixing/edit/${mix.id}`)}>
                  <Edit className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t("edit", { lang: language })}
                </Button>
              )}
            </div>
          </div>

          {/* Material Composition Visualization */}
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle>{t("materialComposition", { lang: language, fallback: "Material Composition" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row">
                {/* Visual Mix Bar */}
                <div className="w-full md:w-2/3 pr-0 md:pr-6">
                  <div className="h-16 flex rounded-md overflow-hidden mb-2">
                    {materialComposition.map((material, index) => (
                      material && (
                        <div 
                          key={index}
                          className="h-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ 
                            backgroundColor: material.color, 
                            width: `${material.percentage}%`,
                            minWidth: material.percentage < 3 ? '3%' : undefined
                          }}
                          title={`${material.type}: ${material.percentage.toFixed(1)}%`}
                        >
                          {material.percentage >= 5 && `${material.percentage.toFixed(0)}%`}
                        </div>
                      )
                    ))}
                  </div>
                  
                  {/* Labels */}
                  <div className="flex flex-wrap mt-4">
                    {materialComposition.map((material, index) => (
                      material && (
                        <div key={index} className="flex items-center mr-4 mb-2">
                          <div 
                            className="w-4 h-4 mr-1 rounded-sm" 
                            style={{ backgroundColor: material.color }}
                          ></div>
                          <span className="text-sm">
                            {material.type} 
                            <span className="text-muted-foreground ml-1">
                              ({material.percentage.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
                
                {/* Mix Information */}
                <div className="w-full md:w-1/3 mt-4 md:mt-0">
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{t("mixInfo", { lang: language, fallback: "Mix Info" })}</h3>
                    </div>
                    
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("date", { lang: language, fallback: "Date" })}</span>
                        <span className="font-medium">
                          {mix.mix_date ? format(new Date(mix.mix_date), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("totalWeight", { lang: language, fallback: "Total Weight" })}</span>
                        <span className="font-medium">{totalWeight.toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("createdBy", { lang: language, fallback: "Created By" })}</span>
                        <span className="font-medium">{getOperatorName(mix.created_by)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("mixDetails", { lang: language, fallback: "Mix Details" })}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-y-3">
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("date", { lang: language, fallback: "Date" })}:</dt>
                    <dd>
                      {mix.mix_date ? 
                        format(new Date(mix.mix_date), "MMMM d, yyyy") : 
                        format(new Date(), "MMMM d, yyyy")}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("createdBy", { lang: language, fallback: "Created By" })}:</dt>
                    <dd>{getOperatorName(mix.created_by)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("totalWeight", { lang: language, fallback: "Total Weight" })}:</dt>
                    <dd>{totalWeight.toFixed(2)} kg</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("materialSummary", { lang: language, fallback: "Material Summary" })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {materialComposition.map((material, index) => (
                    material && (
                      <div key={index} className="flex flex-col">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <div 
                              className="w-3 h-3 mr-1.5 rounded-sm" 
                              style={{ backgroundColor: material.color }}
                            ></div>
                            {material.type}
                          </span>
                          <span className="text-sm">
                            {material.weight.toFixed(2)} kg
                            <span className="text-muted-foreground ml-1">
                              ({material.percentage.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full" 
                            style={{ 
                              width: `${material.percentage}%`,
                              backgroundColor: material.color
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {material.description}
                        </div>
                      </div>
                    )
                  ))}
                  
                  {/* Total line */}
                  <div className="flex justify-between pt-2 mt-2 border-t">
                    <span className="font-medium">{t("total", { lang: language, fallback: "Total" })}</span>
                    <span className="font-medium">{totalWeight.toFixed(2)} kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {mix.notes && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t("notes", { lang: language, fallback: "Notes" })}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{mix.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("detailedInfo", { lang: language, fallback: "Detailed Information" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="materials" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="materials">{t("materials", { lang: language, fallback: "Materials" })}</TabsTrigger>
                  <TabsTrigger value="orders">{t("relatedOrders", { lang: language, fallback: "Related Orders" })}</TabsTrigger>
                  <TabsTrigger value="machines">{t("machinesList", { lang: language, fallback: "Machines" })}</TabsTrigger>
                </TabsList>

                <TabsContent value="materials">
                  {/* Material detailed list */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("materialDetails", { lang: language, fallback: "Material Details" })}</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 px-4 text-left">{t("materialType", { lang: language, fallback: "Material Type" })}</th>
                          <th className="py-2 px-4 text-right">{t("quantity", { lang: language, fallback: "Quantity" })}</th>
                          <th className="py-2 px-4 text-right">{t("percentage", { lang: language, fallback: "Percentage" })}</th>
                          <th className="py-2 px-4 text-left">{t("notes", { lang: language, fallback: "Notes" })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mixItems.map((item, index) => {
                          const percentage = totalWeight > 0 
                            ? ((parseFloat(item.quantity_kg.toString()) / totalWeight) * 100).toFixed(2) 
                            : "0";
                          
                          const info = getMaterialInfo(item.material_type);
                            
                          return (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-4">
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 mr-2 rounded-sm" 
                                    style={{ backgroundColor: info.color }}
                                  ></div>
                                  {item.material_type}
                                </div>
                              </td>
                              <td className="py-2 px-4 text-right">{parseFloat(item.quantity_kg.toString()).toFixed(2)} kg</td>
                              <td className="py-2 px-4 text-right">{percentage}%</td>
                              <td className="py-2 px-4">{item.notes || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="orders">
                  {relatedOrders.length > 0 ? (
                    <DataTable
                      data={relatedOrders}
                      columns={orderColumns}
                      searchable={false}
                      pagination={false}
                    />
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {t("noRelatedOrders", { lang: language })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="machines">
                  {relatedMachines.length > 0 ? (
                    <DataTable
                      data={relatedMachines}
                      columns={machineColumns}
                      searchable={false}
                      pagination={false}
                    />
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {t("noMachines", { lang: language })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="text-lg font-medium">{t("mixNotFound", { lang: language })}</h3>
              <p className="text-muted-foreground mt-2">
                {t("mixNotFoundDescription", { lang: language })}
              </p>
              <Button className="mt-4" onClick={() => setLocation("/production/mixing")}>
                {t("backToMixes", { lang: language })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search 
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeletons";

/**
 * Generic Column interface for DataTable component
 */
interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

/**
 * Props for DataTable component
 */
interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  pagination?: boolean;
  actions?: (item: T) => React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  searchable = true, 
  pagination = true,
  actions,
  isLoading = false
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter data based on search query
  const filteredData = searchable 
    ? data.filter(item => 
        columns.some(column => {
          const value = item[column.accessorKey as keyof typeof item];
          return value !== undefined && 
            value !== null && 
            value.toString().toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : data;
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = pagination 
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) 
    : filteredData;
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full">
      {/* Display skeleton when loading */}
      {isLoading ? (
        <TableSkeleton 
          rows={5} 
          columns={columns.length} 
          hasActions={!!actions}
        />
      ) : (
        <>
          {/* Search bar */}
          {searchable && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {/* Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index} className="font-bold text-black">
                      {column.header}
                    </TableHead>
                  ))}
                  {actions && <TableHead className="font-bold text-black">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          {column.cell 
                            ? column.cell(item) 
                            : item[column.accessorKey as keyof typeof item] !== undefined 
                              ? String(item[column.accessorKey as keyof typeof item]) 
                              : ""}
                        </TableCell>
                      ))}
                      {actions && (
                        <TableCell>
                          {actions(item)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pagination && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show 5 pages at most, centered around the current page
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else {
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, startPage + 4);
                    pageToShow = i + startPage;
                    if (pageToShow > endPage) return null;
                  }
                  
                  return (
                    <button
                      key={pageToShow}
                      onClick={() => handlePageChange(pageToShow)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === pageToShow
                          ? 'bg-primary-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {pageToShow}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

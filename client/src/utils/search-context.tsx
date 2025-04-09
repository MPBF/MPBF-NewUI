import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Fuse from 'fuse.js';
import { useApi } from '../hooks/use-api';
import { useLanguage } from './language';

// Define the search result item structure
export interface SearchResult {
  id: number;
  title: string;
  description: string;
  module: string;
  url: string;
  // Optional fields for displaying additional information
  tags?: string[];
  image?: string;
  date?: string;
}

// Define the search context interface
interface SearchContextType {
  query: string;
  results: SearchResult[];
  searching: boolean;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
}

// Create the context with default values
const SearchContext = createContext<SearchContextType>({
  query: '',
  results: [],
  searching: false,
  setQuery: () => {},
  clearSearch: () => {},
  isOpen: false,
  setIsOpen: () => {},
  toggleSearch: () => {}
});

// Hook to use the search context
export const useSearch = () => useContext(SearchContext);

// Provider component
export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [allItems, setAllItems] = useState<SearchResult[]>([]);
  const { get } = useApi();
  const { language } = useLanguage();

  // Function to toggle search modal
  const toggleSearch = () => setIsOpen(!isOpen);

  // Function to clear search results
  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  // Effect to fetch all searchable items when the component mounts or language changes
  useEffect(() => {
    // We'll use a flag to track if the component is mounted to avoid memory leaks
    let isMounted = true;
    
    const fetchSearchableItems = async () => {
      if (!isMounted) return;
      
      try {
        // Fetch data from all modules
        const [customers, products, orders, jobOrders, users, machines, rolls] = await Promise.all([
          get('/api/customers'),
          get('/api/products'), 
          get('/api/orders'),
          get('/api/job-orders'),
          get('/api/users'),
          get('/api/machines'),
          get('/api/rolls')
        ]);

        // If component unmounted during fetch, don't update state
        if (!isMounted) return;

        // Transform the data into a consistent format for searching
        const searchableItems: SearchResult[] = [
          // Map customers to SearchResult format
          ...customers.map((customer: any) => ({
            id: customer.id,
            title: language === 'english' ? customer.name : (customer.arabic_name || customer.name),
            description: customer.address || '',
            module: 'customers',
            url: `/customers/${customer.id}`,
            tags: ['customer', 'client']
          })),

          // Map products to SearchResult format
          ...products.map((product: any) => ({
            id: product.id,
            title: product.name,
            description: `Category: ${product.category_name || ''}`,
            module: 'products',
            url: `/products/${product.id}`,
            tags: ['product', 'item']
          })),

          // Map orders to SearchResult format
          ...orders.map((order: any) => ({
            id: order.id,
            title: `Order #${order.id}`,
            description: `Customer: ${language === 'english' ? order.customer_name : (order.customer_arabic_name || order.customer_name)}`,
            module: 'orders',
            url: `/orders/${order.id}`,
            date: new Date(order.order_date).toLocaleDateString(),
            tags: ['order', 'production']
          })),

          // Map job orders to SearchResult format
          ...jobOrders.map((jobOrder: any) => ({
            id: jobOrder.id,
            title: `Job Order #${jobOrder.id}`,
            description: `Order: #${jobOrder.order_id}, Product: ${jobOrder.product_name}`,
            module: 'jobOrders',
            url: `/production/joborders?id=${jobOrder.id}`,
            tags: ['job', 'production']
          })),

          // Map users to SearchResult format
          ...users.map((user: any) => ({
            id: user.id,
            title: user.name,
            description: `Username: ${user.username}, Role: ${user.role}`,
            module: 'users',
            url: `/settings/users/${user.id}`,
            tags: ['user', 'staff']
          })),

          // Map machines to SearchResult format
          ...machines.map((machine: any) => ({
            id: machine.id,
            title: machine.identification || machine.name || `Machine #${machine.id}`,
            description: `Section: ${machine.section || ''}`,
            module: 'machines',
            url: `/machines/${machine.id}`,
            tags: ['machine', 'equipment']
          })),

          // Map rolls to SearchResult format
          ...rolls.map((roll: any) => ({
            id: roll.id,
            title: `Roll #${roll.roll_number}`,
            description: `Job Order: #${roll.job_order_id}, Status: ${roll.status}`,
            module: 'rolls',
            url: `/production/rolls/${roll.id}`,
            date: roll.created_at ? new Date(roll.created_at).toLocaleDateString() : undefined,
            tags: ['roll', 'production']
          }))
        ];

        setAllItems(searchableItems);
      } catch (error) {
        console.error('Error fetching searchable items:', error);
      }
    };

    fetchSearchableItems();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [get, language]);

  // Effect to perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    // Configure Fuse.js for fuzzy searching
    const fuse = new Fuse(allItems, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'module', weight: 0.1 }
      ],
      includeScore: true,
      threshold: 0.4, // Lower threshold means more strict matching
      ignoreLocation: true
    });

    // Perform the search
    const searchResults = fuse.search(query);
    setResults(searchResults.map(result => result.item));
    setSearching(false);
  }, [query, allItems]);

  return (
    <SearchContext.Provider 
      value={{ 
        query, 
        results, 
        searching,
        setQuery, 
        clearSearch, 
        isOpen,
        setIsOpen,
        toggleSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
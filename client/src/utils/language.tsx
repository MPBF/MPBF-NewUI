import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth';

// Define the languages we support
export type Language = 'english' | 'arabic';

// Define the content of the language context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
  toggleLanguage: () => void;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'english',
  setLanguage: () => {},
  isRtl: false,
  toggleLanguage: () => {},
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('english');
  
  // Initialize language preference
  useEffect(() => {
    // Priority order for language detection:
    // 1. Stored preference in localStorage
    // 2. User account preference (if logged in)
    // 3. Browser language
    // 4. Default to English
    
    // Check localStorage first (for guests and returning users)
    try {
      const storedPreference = localStorage.getItem('language_preference') as Language;
      if (storedPreference === 'arabic' || storedPreference === 'english') {
        setLanguage(storedPreference);
        return;
      }
    } catch (e) {
      console.error('Error reading stored language preference:', e);
    }
    
    // Then check user account preference
    if (user) {
      const userPreference = (user as any)?.language_preference;
      if (userPreference === 'arabic' || userPreference === 'english') {
        setLanguage(userPreference);
        return;
      }
    }
    
    // Finally, fall back to browser language
    const browserLanguage = navigator.language.startsWith('ar') ? 'arabic' : 'english';
    setLanguage(browserLanguage);
  }, [user]);
  
  // Function to update language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Save preference in localStorage for persistence
    try {
      localStorage.setItem('language_preference', lang);
    } catch (e) {
      console.error('Error saving language preference:', e);
    }
    
    // Apply RTL direction for Arabic language
    if (lang === 'arabic') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  };
  
  // Toggle language between English and Arabic
  const toggleLanguage = () => {
    const newLang = language === 'english' ? 'arabic' : 'english';
    setLanguage(newLang);
  };
  
  // Is the current language right-to-left?
  const isRtl = language === 'arabic';
  
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isRtl,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// List of words in both languages for common UI elements
export const translations = {
  english: {
    dashboard: 'Dashboard',
    setup: 'Setup',
    customers: 'Customers',
    manageCustomers: 'Manage and view all customers',
    customerProducts: 'Customer Products',
    products: 'Products',
    orders: 'Orders',
    production: 'Production',
    reports: 'Reports',
    settings: 'Settings',
    machines: 'Machines',
    jobOrders: 'Job Orders',
    tools: 'Tools',
    // Production related translations
    realTimeDashboard: 'Real-Time Dashboard',
    rollManagement: 'Roll Management',
    warehouseReceiving: 'Warehouse Receiving',
    processWorkflows: 'Process Workflows',
    inventory: 'Inventory',
    smsNotifications: 'SMS Notifications',
    // Production dashboard translations
    productionDashboard: 'Production Dashboard',
    realTimeStatus: 'Real-time status of machines, orders, and production lines',
    connected: 'Connected',
    disconnected: 'Disconnected',
    connectionError: 'Connection Error',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    loadingProduction: 'Loading production data...',
    noDataFound: 'No data found',
    totalMachines: 'Total Machines',
    activeMachines: 'active machines',
    login: 'Login',
    logout: 'Logout',
    signOut: 'Sign out',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    name: 'Name',
    arabicName: 'Arabic Name',
    address: 'Address',
    drawerNo: 'Drawer No',
    salesperson: 'Salesperson',
    back: 'Back',
    new: 'New',
    language: 'Language',
    switchToArabic: 'Switch to Arabic',
    switchToEnglish: 'Switch to English',
    requiredField: 'This field is required',
    successfullyCreated: 'Successfully created',
    successfullyUpdated: 'Successfully updated',
    successfullyDeleted: 'Successfully deleted',
    error: 'Error',
    welcome: 'Welcome',
    profile: 'Profile',
    user: 'User',
    role: 'Role',
    admin: 'Administrator',
    manager: 'Manager',
    salespersonRole: 'Salesperson',
    operator: 'Operator',
    // Maintenance related translations
    maintenance: 'Maintenance',
    maintenanceRequests: 'Maintenance Requests',
    maintenanceActions: 'Maintenance Actions',
    requestDetails: 'Request Details',
    newRequest: 'New Request',
    editRequest: 'Edit Request',
    requestDate: 'Request Date',
    requestStatus: 'Status',
    requestDescription: 'Description',
    maintenanceNotes: 'Notes',
    actions: 'Actions',
    addAction: 'Add Action',
    editAction: 'Edit Action',
    actionDate: 'Action Date',
    partType: 'Part Type',
    actionType: 'Action Type',
    createMaintenanceRequest: 'Create Maintenance Request',
    updateMaintenanceRequest: 'Update Maintenance Request',
    maintenanceHistory: 'Maintenance History',
    machineDetails: 'Machine Details',
    selectMachine: 'Select Machine',
    // Waste monitoring related translations
    wasteMonitoring: 'Waste Monitoring',
    trackWaste: 'Track and analyze production waste metrics',
    exportCSV: 'Export CSV',
    exportPDF: 'Export PDF',
    dateRange: 'Date Range',
    totalWaste: 'Total Waste',
    averageWaste: 'Average Waste',
    productionOverview: 'Production Overview',
    productionSummary: 'Summary of production and waste',
    totalProduction: 'Total Production',
    // Tools related translations
    // New production tools translations
    productionTools: 'Production Tools',
    productionToolsDescription: 'Professional manufacturing tools to enhance your production',
    bagWeightCalculator: 'Bag Weight Calculator',
    bagWeightCalculatorDescription: 'Calculate the weight of plastic bags based on dimensions and material',
    filmYieldCalculator: 'Film Yield Calculator',
    filmYieldCalculatorDescription: 'Calculate the yield of plastic film based on weight and dimensions',
    materialMixingCalculator: 'Material Mixing Calculator',
    materialMixingCalculatorDescription: 'Calculate the proportions of different materials for mixing',
    productionCostCalculator: 'Production Cost Calculator',
    productionCostCalculatorDescription: 'Calculate the cost of production based on materials and time',
    wasteReductionCalculator: 'Waste Reduction Calculator',
    wasteReductionCalculatorDescription: 'Calculate potential waste reduction based on process improvements',
    // Legacy tools translations for backward compatibility
    helpfulTools: 'Helpful Tools',
    helpfulToolsDescription: 'A collection of useful tools to help with your daily work',
    materialCalculator: 'Material Calculator',
    materialCalculatorDescription: 'Calculate properties of plastic materials',
    unitConversion: 'Unit Conversion',
    unitConversionDescription: 'Convert between different weight units',
    notesFeature: 'Notes',
    notesDescription: 'Store and manage your personal notes',
    title: 'Title',
    content: 'Content',
    noteTitlePlaceholder: 'Enter note title...',
    noteContentPlaceholder: 'Enter note content...',
    saveNote: 'Save Note',
    savedNotes: 'Saved Notes',
    noNotes: 'No saved notes yet',
    weight: 'Weight',
    weightUnit: 'Weight Unit',
    calculate: 'Calculate',
    result: 'Result',
    density: 'Density',
    volume: 'Volume',
    cubeDimensions: 'Cube Dimensions',
    invalidWeight: 'Invalid weight value',
    calculationError: 'Error in calculation',
    densityValues: 'Using standard density values for plastic materials',
    fromUnit: 'From Unit',
    toUnit: 'To Unit',
    value: 'Value',
    convert: 'Convert',
    invalidValue: 'Invalid value',
    conversionError: 'Error in conversion',
    conversionFactors: 'Standard conversion factors between weight units',
    // Mix related translations
    mixes: 'Mixing Management',
    mix: 'Mix',
    mixDetails: 'Mix Details',
    mixInfo: 'Mix Information',
    additionalInfo: 'Additional Information',
    batchNumber: 'Batch Number',
    mixDate: 'Mix Date',
    createdBy: 'Created By',
    materials: 'Materials',
    material: 'Material',
    materialType: 'Material Type',
    quantity: 'Quantity',
    quantityKg: 'Quantity (kg)',
    totalMaterials: 'Total Materials',
    totalQuantity: 'Total Quantity',
    totalWeight: 'Total Weight',
    relatedOrders: 'Related Orders',
    ordersList: 'Orders',
    orderNo: 'Order No.',
    noRelatedOrders: 'No related orders',
    mixMachines: 'Mix Machines',
    mixItems: 'Mix Items',
    noMachines: 'No machines assigned',
    mixNotFound: 'Mix Not Found',
    mixNotFoundDescription: 'The requested mix could not be found.',
    backToMixes: 'Back to Mixes',
    downloadReport: 'Download Report',
    print: 'Print',
    newMix: 'New Mix',
    editMix: 'Edit Mix',
    saveMix: 'Save Mix',
    updateMix: 'Update Mix',
    selectDate: 'Select Date',
    selectOperator: 'Select Operator',
    selectStatus: 'Select Status',
    enterBatchNumber: 'Enter Batch Number',
    enterNotes: 'Enter Notes',
    selectMaterial: 'Select Material',
    date: 'Date',
    status: 'Status',
    mixNotes: 'Mix Notes',
    id: 'ID',
    customer: 'Customer',
    mixCreated: 'Mix created successfully',
    mixUpdated: 'Mix updated successfully',
    mixDeleted: 'Mix deleted successfully',
    createSuccess: 'Success',
    updateSuccess: 'Success',
    createError: 'Error',
    updateError: 'Error',
    deleteSuccess: 'Success',
    deleteError: 'Error',
    confirmDelete: 'Are you sure you want to delete this mix?',
    confirmDeletion: 'Confirm Deletion',
    confirmDeleteCustomer: 'Are you sure you want to delete this customer? This action cannot be undone.',
    deleting: 'Deleting...',
    customerDeleted: 'Customer deleted',
    customerDeletedDescription: 'The customer has been successfully deleted.',
    failedToDeleteCustomer: 'Failed to delete customer',
    customersImported: 'Customers have been successfully imported.',
    customerCreated: 'Customer created',
    customerUpdated: 'Customer updated',
    customerCreatedDescription: 'The customer has been successfully created.',
    customerUpdatedDescription: 'The customer has been successfully updated.',
    failedToCreateCustomer: 'Failed to create customer',
    failedToUpdateCustomer: 'Failed to update customer',
    backToCustomers: 'Back to Customers',
    editCustomer: 'Edit Customer',
    newCustomer: 'New Customer',
    editCustomerDetails: 'Edit Customer Details',
    createNewCustomer: 'Create New Customer',
    customerFormDescription: 'Enter the customer information below. All fields marked with * are required.',
    customerNamePlaceholder: 'Customer name',
    customerAddressPlaceholder: 'Customer address',
    drawerNumberPlaceholder: 'Drawer number',
    selectSalesperson: 'Select a salesperson',
    none: 'None',
    saveCustomer: 'Save Customer',
    saving: 'Saving...',
    // Workflow visualization
    productionWorkflow: 'Production Workflow',
    simulateWorkflow: 'Simulate Workflow',
    speed: 'Speed',
    importSuccess: 'Import Success',
    importError: 'Import Error',
    mixesImported: 'Mixes imported successfully',
    import: 'Import',
    export: 'Export',
    addCustomer: 'Add Customer',
    all: 'All',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    identification: 'Identification',
    section: 'Section',
    code: 'Code',
    manufacturerName: 'Manufacturer',
    machinesList: 'Machines',
    total: 'Total',
    percentage: 'Percentage',
    materialSummary: 'Material Summary',
    materialDetails: 'Material Details',
    materialComposition: 'Material Composition',
    generalNotes: 'Notes',
    mixItemNotes: 'Mix Item Notes',
    detailedInfo: 'Detailed Information',
    report: 'Report',
    page: 'Page',
    of: 'of',
    generated: 'Generated on',
  },
  arabic: {
    dashboard: 'لوحة التحكم',
    setup: 'الإعداد',
    customers: 'العملاء',
    manageCustomers: 'إدارة وعرض جميع العملاء',
    customerProducts: 'منتجات العملاء',
    products: 'المنتجات',
    orders: 'الطلبات',
    production: 'الإنتاج',
    reports: 'التقارير',
    settings: 'الإعدادات',
    machines: 'الآلات',
    jobOrders: 'أوامر العمل',
    tools: 'أدوات الإنتاج',
    // Production related translations
    realTimeDashboard: 'لوحة مراقبة مباشرة',
    rollManagement: 'إدارة اللفات',
    warehouseReceiving: 'استلام المخازن',
    processWorkflows: 'سير عمليات الإنتاج',
    inventory: 'المخزون',
    smsNotifications: 'إشعارات الرسائل',
    // Production dashboard translations
    productionDashboard: 'لوحة الإنتاج',
    realTimeStatus: 'الحالة المباشرة للآلات والطلبات وخطوط الإنتاج',
    connected: 'متصل',
    disconnected: 'غير متصل',
    connectionError: 'خطأ في الاتصال',
    refresh: 'تحديث',
    refreshing: 'جاري التحديث...',
    loadingProduction: 'جاري تحميل بيانات الإنتاج...',
    noDataFound: 'لا توجد بيانات',
    totalMachines: 'إجمالي الآلات',
    activeMachines: 'الآلات النشطة',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    signOut: 'تسجيل الخروج',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    name: 'الاسم',
    arabicName: 'الاسم بالعربية',
    address: 'العنوان',
    drawerNo: 'رقم الدرج',
    salesperson: 'مندوب المبيعات',
    back: 'رجوع',
    new: 'جديد',
    language: 'اللغة',
    switchToArabic: 'التبديل إلى العربية',
    switchToEnglish: 'التبديل إلى الإنجليزية',
    requiredField: 'هذا الحقل مطلوب',
    successfullyCreated: 'تم الإنشاء بنجاح',
    successfullyUpdated: 'تم التحديث بنجاح',
    successfullyDeleted: 'تم الحذف بنجاح',
    error: 'خطأ',
    welcome: 'مرحبا',
    profile: 'الملف الشخصي',
    user: 'مستخدم',
    role: 'الدور',
    admin: 'مدير النظام',
    manager: 'مدير',
    salespersonRole: 'مندوب مبيعات',
    operator: 'مشغل',
    // Maintenance related translations
    maintenance: 'الصيانة',
    maintenanceRequests: 'طلبات الصيانة',
    maintenanceActions: 'إجراءات الصيانة',
    requestDetails: 'تفاصيل الطلب',
    newRequest: 'طلب جديد',
    editRequest: 'تعديل الطلب',
    requestDate: 'تاريخ الطلب',
    requestStatus: 'الحالة',
    requestDescription: 'الوصف',
    maintenanceNotes: 'ملاحظات',
    actions: 'الإجراءات',
    addAction: 'إضافة إجراء',
    editAction: 'تعديل الإجراء',
    actionDate: 'تاريخ الإجراء',
    partType: 'نوع القطعة',
    actionType: 'نوع الإجراء',
    createMaintenanceRequest: 'إنشاء طلب صيانة',
    updateMaintenanceRequest: 'تحديث طلب الصيانة',
    maintenanceHistory: 'سجل الصيانة',
    machineDetails: 'تفاصيل الآلة',
    selectMachine: 'اختر الآلة',
    // Waste monitoring related translations
    wasteMonitoring: 'مراقبة الهدر',
    trackWaste: 'تتبع وتحليل مقاييس هدر الإنتاج',
    exportCSV: 'تصدير CSV',
    exportPDF: 'تصدير PDF',
    dateRange: 'نطاق التاريخ',
    totalWaste: 'إجمالي الهدر',
    averageWaste: 'متوسط الهدر',
    productionOverview: 'نظرة عامة على الإنتاج',
    productionSummary: 'ملخص الإنتاج والهدر',
    totalProduction: 'إجمالي الإنتاج',
    // Tools related translations
    // New production tools translations
    productionTools: 'أدوات الإنتاج',
    productionToolsDescription: 'أدوات تصنيع احترافية لتعزيز إنتاجك',
    bagWeightCalculator: 'حاسبة وزن الأكياس',
    bagWeightCalculatorDescription: 'حساب وزن الأكياس البلاستيكية بناءً على الأبعاد والمادة',
    filmYieldCalculator: 'حاسبة إنتاجية الفيلم',
    filmYieldCalculatorDescription: 'حساب إنتاجية الفيلم البلاستيكي بناءً على الوزن والأبعاد',
    materialMixingCalculator: 'حاسبة خلط المواد',
    materialMixingCalculatorDescription: 'حساب نسب المواد المختلفة للخلط',
    productionCostCalculator: 'حاسبة تكلفة الإنتاج',
    productionCostCalculatorDescription: 'حساب تكلفة الإنتاج بناءً على المواد والوقت',
    wasteReductionCalculator: 'حاسبة تقليل الهدر',
    wasteReductionCalculatorDescription: 'حساب التقليل المحتمل للهدر بناءً على تحسينات العملية',
    // Legacy tools translations for backward compatibility
    helpfulTools: 'أدوات مساعدة',
    helpfulToolsDescription: 'مجموعة من الأدوات المفيدة للمساعدة في عملك اليومي',
    materialCalculator: 'حاسبة المواد',
    materialCalculatorDescription: 'حساب خصائص المواد البلاستيكية',
    unitConversion: 'تحويل الوحدات',
    unitConversionDescription: 'التحويل بين وحدات الوزن المختلفة',
    notesFeature: 'الملاحظات',
    notesDescription: 'تخزين وإدارة ملاحظاتك الشخصية',
    title: 'العنوان',
    content: 'المحتوى',
    noteTitlePlaceholder: 'أدخل عنوان الملاحظة...',
    noteContentPlaceholder: 'أدخل محتوى الملاحظة...',
    saveNote: 'حفظ الملاحظة',
    savedNotes: 'الملاحظات المحفوظة',
    noNotes: 'لا توجد ملاحظات محفوظة بعد',
    weight: 'الوزن',
    weightUnit: 'وحدة الوزن',
    calculate: 'حساب',
    result: 'النتيجة',
    density: 'الكثافة',
    volume: 'الحجم',
    cubeDimensions: 'أبعاد المكعب',
    invalidWeight: 'قيمة وزن غير صالحة',
    calculationError: 'خطأ في الحساب',
    densityValues: 'استخدام قيم الكثافة القياسية للمواد البلاستيكية',
    fromUnit: 'من وحدة',
    toUnit: 'إلى وحدة',
    value: 'القيمة',
    convert: 'تحويل',
    invalidValue: 'قيمة غير صالحة',
    conversionError: 'خطأ في التحويل',
    conversionFactors: 'عوامل التحويل القياسية بين وحدات الوزن',
    // Mix related translations
    mixes: 'إدارة الخلط',
    mix: 'خلطة',
    mixDetails: 'تفاصيل الخلطة',
    mixInfo: 'معلومات الخلطة',
    additionalInfo: 'معلومات إضافية',
    batchNumber: 'رقم الدفعة',
    mixDate: 'تاريخ الخلط',
    createdBy: 'أنشئت بواسطة',
    materials: 'المواد',
    material: 'المادة',
    materialType: 'نوع المادة',
    quantity: 'الكمية',
    quantityKg: 'الكمية (كجم)',
    totalMaterials: 'إجمالي المواد',
    totalQuantity: 'إجمالي الكمية',
    totalWeight: 'الوزن الإجمالي',
    relatedOrders: 'الطلبات ذات الصلة',
    ordersList: 'الطلبات',
    orderNo: 'رقم الطلب',
    noRelatedOrders: 'لا توجد طلبات ذات صلة',
    mixMachines: 'الآلات',
    mixItems: 'عناصر الخلطة',
    noMachines: 'لا توجد آلات مخصصة',
    mixNotFound: 'الخلطة غير موجودة',
    mixNotFoundDescription: 'لم يتم العثور على الخلطة المطلوبة.',
    backToMixes: 'العودة إلى الخلطات',
    downloadReport: 'تنزيل التقرير',
    print: 'طباعة',
    newMix: 'خلطة جديدة',
    editMix: 'تعديل الخلطة',
    saveMix: 'حفظ الخلطة',
    updateMix: 'تحديث الخلطة',
    selectDate: 'اختر التاريخ',
    selectOperator: 'اختر المشغل',
    selectStatus: 'اختر الحالة',
    enterBatchNumber: 'أدخل رقم الدفعة',
    enterNotes: 'أدخل ملاحظات',
    selectMaterial: 'اختر المادة',
    date: 'التاريخ',
    status: 'الحالة',
    mixNotes: 'ملاحظات الخلطة',
    id: 'المعرف',
    customer: 'العميل',
    mixCreated: 'تم إنشاء الخلطة بنجاح',
    mixUpdated: 'تم تحديث الخلطة بنجاح',
    mixDeleted: 'تم حذف الخلطة بنجاح',
    createSuccess: 'نجاح',
    updateSuccess: 'نجاح',
    createError: 'خطأ',
    updateError: 'خطأ',
    deleteSuccess: 'نجاح',
    deleteError: 'خطأ',
    confirmDelete: 'هل أنت متأكد أنك تريد حذف هذه الخلطة؟',
    confirmDeletion: 'تأكيد الحذف',
    confirmDeleteCustomer: 'هل أنت متأكد أنك تريد حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.',
    deleting: 'جاري الحذف...',
    customerDeleted: 'تم حذف العميل',
    customerDeletedDescription: 'تم حذف العميل بنجاح.',
    failedToDeleteCustomer: 'فشل في حذف العميل',
    customersImported: 'تم استيراد العملاء بنجاح.',
    customerCreated: 'تم إنشاء العميل',
    customerUpdated: 'تم تحديث العميل',
    customerCreatedDescription: 'تم إنشاء العميل بنجاح.',
    customerUpdatedDescription: 'تم تحديث العميل بنجاح.',
    failedToCreateCustomer: 'فشل في إنشاء العميل',
    failedToUpdateCustomer: 'فشل في تحديث العميل',
    backToCustomers: 'العودة إلى العملاء',
    editCustomer: 'تعديل العميل',
    newCustomer: 'عميل جديد',
    editCustomerDetails: 'تعديل بيانات العميل',
    createNewCustomer: 'إنشاء عميل جديد',
    customerFormDescription: 'أدخل معلومات العميل أدناه. جميع الحقول المميزة بعلامة * مطلوبة.',
    customerNamePlaceholder: 'اسم العميل',
    customerAddressPlaceholder: 'عنوان العميل',
    drawerNumberPlaceholder: 'رقم الدرج',
    selectSalesperson: 'اختر مندوب المبيعات',
    none: 'لا يوجد',
    saveCustomer: 'حفظ العميل',
    saving: 'جاري الحفظ...',
    importSuccess: 'نجاح الاستيراد',
    importError: 'خطأ في الاستيراد',
    mixesImported: 'تم استيراد الخلطات بنجاح',
    import: 'استيراد',
    export: 'تصدير',
    addCustomer: 'إضافة عميل',
    all: 'الكل',
    pending: 'قيد الانتظار',
    inProgress: 'قيد التنفيذ',
    completed: 'مكتمل',
    identification: 'التعريف',
    section: 'القسم',
    code: 'الرمز',
    manufacturerName: 'الشركة المصنعة',
    machinesList: 'الآلات',
    total: 'المجموع',
    percentage: 'النسبة المئوية',
    materialSummary: 'ملخص المواد',
    materialDetails: 'تفاصيل المواد',
    materialComposition: 'تكوين المواد',
    generalNotes: 'ملاحظات',
    mixItemNotes: 'ملاحظات العناصر',
    detailedInfo: 'معلومات مفصلة',
    report: 'تقرير',
    page: 'صفحة',
    of: 'من',
    generated: 'تم إنشاؤه في',
  }
};

// Helper function to get translation
export function t(
  key: keyof typeof translations.english, 
  options?: { lang?: Language; fallback?: string }
): string {
  const currentLang = options?.lang || useLanguage().language;
  const fallback = options?.fallback || key as string;
  
  // Make sure the key exists in both language dictionaries
  return currentLang === 'english' 
    ? translations.english[key] || fallback
    : translations.arabic[key as keyof typeof translations.arabic] || fallback;
}
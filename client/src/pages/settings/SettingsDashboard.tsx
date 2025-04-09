import React from 'react';
import { useLanguage } from '../../utils/language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Users, MessageSquare, Settings2, Shield, Bell, Server } from 'lucide-react';
import { Link } from 'wouter';

export default function SettingsDashboard() {
  const { isRtl, language } = useLanguage();
  const translations = {
    english: {
      users: 'Users',
      manageUsers: 'Create and manage user accounts',
      smsNotifications: 'SMS Notifications',
      manageSmsNotifications: 'Set up and configure SMS notifications',
      machines: 'Machines',
      manageMachines: 'Configure and maintain production machines',
      permissions: 'Permissions',
      managePermissions: 'Manage user roles and access rights',
      notifications: 'Notifications',
      manageNotifications: 'Configure system notifications',
      systemSettings: 'System Settings',
      manageSystemSettings: 'Configure general system settings',
      settings: 'Settings',
      settingsDescription: 'Manage your system settings and preferences',
      manage: 'Manage'
    },
    arabic: {
      users: 'المستخدمين',
      manageUsers: 'إنشاء وإدارة حسابات المستخدمين',
      smsNotifications: 'إشعارات الرسائل',
      manageSmsNotifications: 'إعداد وتكوين إشعارات الرسائل القصيرة',
      machines: 'الآلات',
      manageMachines: 'تكوين وصيانة آلات الإنتاج',
      permissions: 'الصلاحيات',
      managePermissions: 'إدارة أدوار المستخدمين وحقوق الوصول',
      notifications: 'الإشعارات',
      manageNotifications: 'تكوين إشعارات النظام',
      systemSettings: 'إعدادات النظام',
      manageSystemSettings: 'تكوين إعدادات النظام العامة',
      settings: 'الإعدادات',
      settingsDescription: 'إدارة إعدادات النظام وتفضيلاته',
      manage: 'إدارة'
    }
  };

  // Helper function for translations
  const t = (key: keyof typeof translations.english) => {
    return language === 'english' ? translations.english[key] : translations.arabic[key];
  };

  // Define the settings cards
  const settingsCards = [
    {
      title: t('users'),
      description: t('manageUsers'),
      icon: <Users className="h-8 w-8 text-primary" />,
      link: '/settings/users',
      color: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: t('smsNotifications'),
      description: t('manageSmsNotifications'),
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      link: '/settings/sms',
      color: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: t('machines'),
      description: t('manageMachines'),
      icon: <Server className="h-8 w-8 text-primary" />,
      link: '/machines',
      color: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: t('permissions'),
      description: t('managePermissions'),
      icon: <Shield className="h-8 w-8 text-primary" />,
      link: '/settings/permissions',
      color: 'bg-yellow-50 dark:bg-yellow-950',
    },
    {
      title: t('notifications'),
      description: t('manageNotifications'),
      icon: <Bell className="h-8 w-8 text-primary" />,
      link: '/settings/notifications',
      color: 'bg-red-50 dark:bg-red-950',
    },
    {
      title: t('systemSettings'),
      description: t('manageSystemSettings'),
      icon: <Settings2 className="h-8 w-8 text-primary" />,
      link: '/settings/system',
      color: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">{t('settings')}</h2>
        <p className="text-muted-foreground">
          {t('settingsDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card, index) => (
          <Link key={index} href={card.link}>
            <Card className={`cursor-pointer transition-all hover:shadow-md ${card.color}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
                <div className="flex h-12 w-12 items-center justify-center rounded-full">
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {card.description}
                </CardDescription>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                >
                  {t('manage')}
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
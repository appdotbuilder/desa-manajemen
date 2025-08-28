import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResidentsManagement } from '@/components/ResidentsManagement';
import { VillageFinanceManagement } from '@/components/VillageFinanceManagement';
import { VillageEventsManagement } from '@/components/VillageEventsManagement';
import { VillageAssetsManagement } from '@/components/VillageAssetsManagement';
import { PublicServicesManagement } from '@/components/PublicServicesManagement';
import { DashboardOverview } from '@/components/DashboardOverview';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Building, 
  FileText,
  BarChart3 
} from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🏘️ Sistem Manajemen Desa
          </h1>
          <p className="text-lg text-gray-600">
            Platform terpadu untuk mengelola administrasi dan layanan desa
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-white shadow-md">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="residents" 
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
            >
              <Users className="w-4 h-4" />
              Penduduk
            </TabsTrigger>
            <TabsTrigger 
              value="finance" 
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
            >
              <DollarSign className="w-4 h-4" />
              Keuangan
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
            >
              <Calendar className="w-4 h-4" />
              Acara
            </TabsTrigger>
            <TabsTrigger 
              value="assets" 
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
            >
              <Building className="w-4 h-4" />
              Aset
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
            >
              <FileText className="w-4 h-4" />
              Layanan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <BarChart3 className="w-5 h-5" />
                  Dashboard Ringkasan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardOverview />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="residents">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Users className="w-5 h-5" />
                  Manajemen Data Penduduk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResidentsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="w-5 h-5" />
                  Manajemen Keuangan Desa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VillageFinanceManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Calendar className="w-5 h-5" />
                  Manajemen Acara & Kegiatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VillageEventsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Building className="w-5 h-5" />
                  Manajemen Aset Desa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VillageAssetsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <FileText className="w-5 h-5" />
                  Manajemen Layanan Publik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PublicServicesManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Building, 
  FileText,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';
import type { 
  Resident, 
  VillageFinance, 
  VillageEvent, 
  VillageAsset, 
  PublicService 
} from '../../../server/src/schema';

interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface AssetsSummary {
  totalValue: number;
  totalCount: number;
  byCondition: Record<string, number>;
}

export function DashboardOverview() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [finances, setFinances] = useState<VillageFinance[]>([]);
  const [events, setEvents] = useState<VillageEvent[]>([]);
  const [assets, setAssets] = useState<VillageAsset[]>([]);
  const [services, setServices] = useState<PublicService[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [assetsSummary, setAssetsSummary] = useState<AssetsSummary | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<VillageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load all data concurrently
      const [
        residentsData,
        financesData,
        eventsData,
        assetsData,
        servicesData,
        financeSummaryData,
        assetsSummaryData,
        upcomingEventsData
      ] = await Promise.all([
        trpc.getResidents.query(),
        trpc.getVillageFinances.query(),
        trpc.getVillageEvents.query(),
        trpc.getVillageAssets.query(),
        trpc.getPublicServices.query(),
        trpc.getFinanceSummary.query(),
        trpc.getAssetsSummary.query(),
        trpc.getUpcomingEvents.query()
      ]);

      setResidents(residentsData);
      setFinances(financesData);
      setEvents(eventsData);
      setAssets(assetsData);
      setServices(servicesData);
      setFinanceSummary(financeSummaryData);
      setAssetsSummary(assetsSummaryData);
      setUpcomingEvents(upcomingEventsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penduduk</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{residents.length}</div>
            <p className="text-xs text-blue-100">
              Warga terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas Desa</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financeSummary ? formatCurrency(financeSummary.balance) : 'Rp 0'}
            </div>
            <p className="text-xs text-green-100 flex items-center gap-1">
              {financeSummary && financeSummary.balance >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              Selisih pemasukan dan pengeluaran
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acara Mendatang</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-purple-100">
              Kegiatan yang akan datang
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Total Aset</CardTitle>
            <Building className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assetsSummary ? formatCurrency(assetsSummary.totalValue) : 'Rp 0'}
            </div>
            <p className="text-xs text-orange-100">
              {assetsSummary ? assetsSummary.totalCount : 0} aset terdaftar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Ringkasan Keuangan</CardTitle>
          </CardHeader>
          <CardContent>
            {financeSummary ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Pemasukan:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(financeSummary.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Pengeluaran:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(financeSummary.totalExpense)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Saldo:</span>
                  <span className={`font-bold ${financeSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(financeSummary.balance)}
                  </span>
                </div>
                <div className="text-center mt-4">
                  <div className="text-sm text-gray-600">
                    Status kas desa berdasarkan total pemasukan dan pengeluaran
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Tidak ada data keuangan</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Acara Mendatang</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event: VillageEvent) => (
                  <div key={event.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.name}</h4>
                      <p className="text-xs text-gray-500">{event.location}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.event_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <Badge className={getEventStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                ))}
                {upcomingEvents.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{upcomingEvents.length - 5} acara lainnya
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Tidak ada acara mendatang</p>
            )}
          </CardContent>
        </Card>

        {/* Assets Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Kondisi Aset</CardTitle>
          </CardHeader>
          <CardContent>
            {assetsSummary ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {assetsSummary.byCondition.excellent || 0}
                  </div>
                  <div className="text-xs text-gray-500">Sangat Baik</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {assetsSummary.byCondition.good || 0}
                  </div>
                  <div className="text-xs text-gray-500">Baik</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {assetsSummary.byCondition.fair || 0}
                  </div>
                  <div className="text-xs text-gray-500">Cukup</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {assetsSummary.byCondition.poor || 0}
                  </div>
                  <div className="text-xs text-gray-500">Buruk</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Tidak ada data aset</p>
            )}
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Layanan Publik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Layanan:</span>
                <span className="font-semibold">{services.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Layanan Aktif:</span>
                <span className="font-semibold text-green-600">
                  {services.filter((service: PublicService) => service.is_active === 1).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Layanan Nonaktif:</span>
                <span className="font-semibold text-red-600">
                  {services.filter((service: PublicService) => service.is_active === 0).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
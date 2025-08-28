import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Building, MapPin, Calendar, DollarSign, Search, Filter } from 'lucide-react';
import type { VillageAsset, CreateVillageAssetInput, UpdateVillageAssetInput } from '../../../server/src/schema';

interface AssetsSummary {
  totalValue: number;
  totalCount: number;
  byCondition: Record<string, number>;
}

export function VillageAssetsManagement() {
  const [assets, setAssets] = useState<VillageAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<VillageAsset[]>([]);
  const [assetsSummary, setAssetsSummary] = useState<AssetsSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'excellent' | 'good' | 'fair' | 'poor'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<VillageAsset | null>(null);

  const [formData, setFormData] = useState<CreateVillageAssetInput>({
    name: '',
    description: null,
    category: '',
    value: 0,
    condition: 'good',
    location: '',
    purchase_date: null,
  });

  const loadAssets = useCallback(async () => {
    try {
      const [assetsData, summaryData] = await Promise.all([
        trpc.getVillageAssets.query(),
        trpc.getAssetsSummary.query()
      ]);
      
      setAssets(assetsData);
      setFilteredAssets(assetsData);
      setAssetsSummary(summaryData);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter((asset: VillageAsset) =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (conditionFilter !== 'all') {
      filtered = filtered.filter((asset: VillageAsset) => asset.condition === conditionFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter((asset: VillageAsset) => 
        asset.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  }, [searchTerm, conditionFilter, categoryFilter, assets]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
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

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'excellent': return '🟢 Sangat Baik';
      case 'good': return '🔵 Baik';
      case 'fair': return '🟡 Cukup';
      case 'poor': return '🔴 Buruk';
      default: return condition;
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'excellent': return '⭐';
      case 'good': return '👍';
      case 'fair': return '👌';
      case 'poor': return '⚠️';
      default: return '❓';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingAsset) {
        const updateData: UpdateVillageAssetInput = {
          id: editingAsset.id,
          ...formData
        };
        const updatedAsset = await trpc.updateVillageAsset.mutate(updateData);
        setAssets((prev: VillageAsset[]) => 
          prev.map((asset: VillageAsset) => 
            asset.id === editingAsset.id ? updatedAsset : asset
          )
        );
      } else {
        const newAsset = await trpc.createVillageAsset.mutate(formData);
        setAssets((prev: VillageAsset[]) => [...prev, newAsset]);
      }

      // Reload summary
      const summaryData = await trpc.getAssetsSummary.query();
      setAssetsSummary(summaryData);

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (asset: VillageAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description,
      category: asset.category,
      value: asset.value,
      condition: asset.condition,
      location: asset.location,
      purchase_date: asset.purchase_date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteVillageAsset.mutate({ id });
      setAssets((prev: VillageAsset[]) => prev.filter((asset: VillageAsset) => asset.id !== id));
      
      // Reload summary
      const summaryData = await trpc.getAssetsSummary.query();
      setAssetsSummary(summaryData);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      category: '',
      value: 0,
      condition: 'good',
      location: '',
      purchase_date: null,
    });
    setEditingAsset(null);
  };

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(assets.map((asset: VillageAsset) => asset.category)));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {assetsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Nilai Aset</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(assetsSummary.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Aset</p>
                  <p className="text-2xl font-bold">{assetsSummary.totalCount}</p>
                </div>
                <Building className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Kondisi Baik & Sangat Baik</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {(assetsSummary.byCondition.excellent || 0) + (assetsSummary.byCondition.good || 0)}
              </div>
              <div className="text-sm text-gray-500">
                {assetsSummary.totalCount > 0 ? (((assetsSummary.byCondition.excellent || 0) + (assetsSummary.byCondition.good || 0)) / assetsSummary.totalCount * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Kondisi Cukup & Buruk</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600">
                {(assetsSummary.byCondition.fair || 0) + (assetsSummary.byCondition.poor || 0)}
              </div>
              <div className="text-sm text-gray-500">
                Perlu perhatian
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari aset berdasarkan nama, kategori, atau lokasi..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={conditionFilter} onValueChange={(value: 'all' | 'excellent' | 'good' | 'fair' | 'poor') => setConditionFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kondisi</SelectItem>
              <SelectItem value="excellent">Sangat Baik</SelectItem>
              <SelectItem value="good">Baik</SelectItem>
              <SelectItem value="fair">Cukup</SelectItem>
              <SelectItem value="poor">Buruk</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kategori</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Aset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAsset ? '✏️ Edit Aset' : '🏢 Tambah Aset Baru'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Aset</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateVillageAssetInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masukkan nama aset"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateVillageAssetInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Masukkan deskripsi aset"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVillageAssetInput) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="Masukkan kategori aset"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="value">Nilai Aset (Rp)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVillageAssetInput) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Kondisi Aset</Label>
                  <Select 
                    value={formData.condition} 
                    onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') => 
                      setFormData((prev: CreateVillageAssetInput) => ({ ...prev, condition: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">⭐ Sangat Baik</SelectItem>
                      <SelectItem value="good">👍 Baik</SelectItem>
                      <SelectItem value="fair">👌 Cukup</SelectItem>
                      <SelectItem value="poor">⚠️ Buruk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVillageAssetInput) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Masukkan lokasi aset"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="purchase_date">Tanggal Pembelian (Opsional)</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateVillageAssetInput) => ({ 
                      ...prev, 
                      purchase_date: e.target.value || null 
                    }))
                  }
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? 'Menyimpan...' : editingAsset ? 'Perbarui' : 'Tambah'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Total: {assets.length} aset
        </Badge>
        {(searchTerm || conditionFilter !== 'all' || categoryFilter) && (
          <Badge variant="outline">
            Ditemukan: {filteredAssets.length} hasil
          </Badge>
        )}
      </div>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || conditionFilter !== 'all' || categoryFilter ? 'Tidak ada hasil' : 'Belum ada aset'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || conditionFilter !== 'all' || categoryFilter 
                ? 'Coba ubah kriteria pencarian atau filter'
                : 'Mulai dengan menambahkan aset pertama'
              }
            </p>
            {!searchTerm && conditionFilter === 'all' && !categoryFilter && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Aset Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAssets.map((asset: VillageAsset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                          {asset.name}
                        </h3>
                      </div>
                      <Badge className={getConditionColor(asset.condition)}>
                        {getConditionText(asset.condition)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Kategori:</span>
                        <span>{asset.category}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 font-medium">Nilai:</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(asset.value)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{asset.location}</span>
                      </div>

                      {asset.purchase_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            Dibeli: {new Date(asset.purchase_date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>

                    {asset.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        {asset.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      Terdaftar: {asset.created_at.toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(asset)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Aset</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus aset <strong>{asset.name}</strong>? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(asset.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
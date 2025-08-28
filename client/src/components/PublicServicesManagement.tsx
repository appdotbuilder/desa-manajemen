import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, FileText, Clock, DollarSign, User, Phone, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import type { PublicService, CreatePublicServiceInput, UpdatePublicServiceInput } from '../../../server/src/schema';

export function PublicServicesManagement() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [filteredServices, setFilteredServices] = useState<PublicService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PublicService | null>(null);

  const [formData, setFormData] = useState<CreatePublicServiceInput>({
    name: '',
    description: '',
    requirements: null,
    process_time: null,
    cost: null,
    contact_person: null,
    office_hours: null,
    is_active: 1,
  });

  const loadServices = useCallback(async () => {
    try {
      const result = await trpc.getPublicServices.query();
      setServices(result);
      setFilteredServices(result);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter((service: PublicService) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.contact_person && service.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active' ? 1 : 0;
      filtered = filtered.filter((service: PublicService) => service.is_active === isActive);
    }

    setFilteredServices(filtered);
  }, [searchTerm, statusFilter, services]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingService) {
        const updateData: UpdatePublicServiceInput = {
          id: editingService.id,
          ...formData
        };
        const updatedService = await trpc.updatePublicService.mutate(updateData);
        setServices((prev: PublicService[]) => 
          prev.map((service: PublicService) => 
            service.id === editingService.id ? updatedService : service
          )
        );
      } else {
        const newService = await trpc.createPublicService.mutate(formData);
        setServices((prev: PublicService[]) => [...prev, newService]);
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: PublicService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      requirements: service.requirements,
      process_time: service.process_time,
      cost: service.cost,
      contact_person: service.contact_person,
      office_hours: service.office_hours,
      is_active: service.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePublicService.mutate({ id });
      setServices((prev: PublicService[]) => prev.filter((service: PublicService) => service.id !== id));
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const updatedService = await trpc.togglePublicServiceStatus.mutate({ id });
      setServices((prev: PublicService[]) => 
        prev.map((service: PublicService) => 
          service.id === id ? updatedService : service
        )
      );
    } catch (error) {
      console.error('Failed to toggle service status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      requirements: null,
      process_time: null,
      cost: null,
      contact_person: null,
      office_hours: null,
      is_active: 1,
    });
    setEditingService(null);
  };

  const activeServices = services.filter((service: PublicService) => service.is_active === 1);
  const inactiveServices = services.filter((service: PublicService) => service.is_active === 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total Layanan</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
              <FileText className="h-8 w-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Layanan Aktif</p>
                <p className="text-2xl font-bold">{activeServices.length}</p>
              </div>
              <ToggleRight className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Layanan Nonaktif</p>
                <p className="text-2xl font-bold">{inactiveServices.length}</p>
              </div>
              <ToggleLeft className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari layanan berdasarkan nama atau deskripsi..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Layanan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? '✏️ Edit Layanan' : '📋 Tambah Layanan Baru'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Layanan</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePublicServiceInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masukkan nama layanan"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePublicServiceInput) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Masukkan deskripsi layanan"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="requirements">Persyaratan (Opsional)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePublicServiceInput) => ({ 
                      ...prev, 
                      requirements: e.target.value || null 
                    }))
                  }
                  placeholder="Masukkan persyaratan yang diperlukan"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="process_time">Waktu Proses (Opsional)</Label>
                  <Input
                    id="process_time"
                    value={formData.process_time || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePublicServiceInput) => ({ 
                        ...prev, 
                        process_time: e.target.value || null 
                      }))
                    }
                    placeholder="Contoh: 3 hari kerja"
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Biaya (Opsional)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePublicServiceInput) => ({ 
                        ...prev, 
                        cost: e.target.value ? parseFloat(e.target.value) : null 
                      }))
                    }
                    placeholder="0 jika gratis"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Penanggung Jawab (Opsional)</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePublicServiceInput) => ({ 
                        ...prev, 
                        contact_person: e.target.value || null 
                      }))
                    }
                    placeholder="Nama penanggung jawab"
                  />
                </div>

                <div>
                  <Label htmlFor="office_hours">Jam Layanan (Opsional)</Label>
                  <Input
                    id="office_hours"
                    value={formData.office_hours || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePublicServiceInput) => ({ 
                        ...prev, 
                        office_hours: e.target.value || null 
                      }))
                    }
                    placeholder="Contoh: Senin-Jumat 08:00-16:00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active === 1}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: CreatePublicServiceInput) => ({ ...prev, is_active: checked ? 1 : 0 }))
                  }
                />
                <Label htmlFor="is_active">Layanan Aktif</Label>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? 'Menyimpan...' : editingService ? 'Perbarui' : 'Tambah'}
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
        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
          Total: {services.length} layanan
        </Badge>
        {(searchTerm || statusFilter !== 'all') && (
          <Badge variant="outline">
            Ditemukan: {filteredServices.length} hasil
          </Badge>
        )}
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada layanan'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Coba ubah kriteria pencarian atau filter'
                : 'Mulai dengan menambahkan layanan pertama'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Layanan Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredServices.map((service: PublicService) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                          {service.name}
                        </h3>
                      </div>
                      <Badge className={service.is_active === 1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }>
                        {service.is_active === 1 ? '✅ Aktif' : '❌ Nonaktif'}
                      </Badge>
                    </div>

                    <p className="text-gray-600 mb-3 text-sm">
                      {service.description}
                    </p>

                    {service.requirements && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-700 text-sm mb-1">Persyaratan:</h4>
                        <p className="text-gray-600 text-sm">{service.requirements}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      {service.process_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          <span>Waktu: {service.process_time}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-indigo-500" />
                        <span>Biaya: {formatCurrency(service.cost)}</span>
                      </div>

                      {service.contact_person && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span>PJ: {service.contact_person}</span>
                        </div>
                      )}

                      {service.office_hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          <span>Jam: {service.office_hours}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400">
                      Dibuat: {service.created_at.toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(service.id)}
                      className={service.is_active === 1 
                        ? "hover:bg-red-50 hover:text-red-600" 
                        : "hover:bg-green-50 hover:text-green-600"
                      }
                      title={service.is_active === 1 ? 'Nonaktifkan layanan' : 'Aktifkan layanan'}
                    >
                      {service.is_active === 1 ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(service)}
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
                          <AlertDialogTitle>Hapus Layanan</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus layanan <strong>{service.name}</strong>? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(service.id)}
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
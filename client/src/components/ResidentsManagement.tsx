import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, User, MapPin, Briefcase, Search } from 'lucide-react';
import type { Resident, CreateResidentInput, UpdateResidentInput } from '../../../server/src/schema';

export function ResidentsManagement() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  const [formData, setFormData] = useState<CreateResidentInput>({
    name: '',
    address: '',
    job: '',
  });

  const loadResidents = useCallback(async () => {
    try {
      const result = await trpc.getResidents.query();
      setResidents(result);
      setFilteredResidents(result);
    } catch (error) {
      console.error('Failed to load residents:', error);
    }
  }, []);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  useEffect(() => {
    const filtered = residents.filter((resident: Resident) =>
      resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.job.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResidents(filtered);
  }, [searchTerm, residents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingResident) {
        const updateData: UpdateResidentInput = {
          id: editingResident.id,
          ...formData
        };
        const updatedResident = await trpc.updateResident.mutate(updateData);
        setResidents((prev: Resident[]) => 
          prev.map((resident: Resident) => 
            resident.id === editingResident.id ? updatedResident : resident
          )
        );
      } else {
        const newResident = await trpc.createResident.mutate(formData);
        setResidents((prev: Resident[]) => [...prev, newResident]);
      }

      // Reset form
      setFormData({
        name: '',
        address: '',
        job: '',
      });
      setEditingResident(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save resident:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name,
      address: resident.address,
      job: resident.job,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteResident.mutate({ id });
      setResidents((prev: Resident[]) => prev.filter((resident: Resident) => resident.id !== id));
    } catch (error) {
      console.error('Failed to delete resident:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      job: '',
    });
    setEditingResident(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari penduduk berdasarkan nama, alamat, atau pekerjaan..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Penduduk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingResident ? '✏️ Edit Data Penduduk' : '👤 Tambah Penduduk Baru'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateResidentInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateResidentInput) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Masukkan alamat lengkap"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="job">Pekerjaan</Label>
                <Input
                  id="job"
                  value={formData.job}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateResidentInput) => ({ ...prev, job: e.target.value }))
                  }
                  placeholder="Masukkan pekerjaan"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Menyimpan...' : editingResident ? 'Perbarui' : 'Tambah'}
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
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Total: {residents.length} penduduk
        </Badge>
        {searchTerm && (
          <Badge variant="outline">
            Ditemukan: {filteredResidents.length} hasil
          </Badge>
        )}
      </div>

      {/* Residents List */}
      {filteredResidents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data penduduk'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `Tidak ditemukan penduduk dengan kata kunci "${searchTerm}"`
                : 'Mulai dengan menambahkan data penduduk pertama'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Penduduk Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResidents.map((resident: Resident) => (
            <Card key={resident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {resident.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{resident.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span>{resident.job}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400">
                      Terdaftar: {resident.created_at.toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(resident)}
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
                          <AlertDialogTitle>Hapus Data Penduduk</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data <strong>{resident.name}</strong>? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(resident.id)}
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
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
import { Plus, Edit, Trash2, Calendar, MapPin, Users, DollarSign, Search } from 'lucide-react';
import type { VillageEvent, CreateVillageEventInput, UpdateVillageEventInput } from '../../../server/src/schema';

export function VillageEventsManagement() {
  const [events, setEvents] = useState<VillageEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<VillageEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'ongoing' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<VillageEvent | null>(null);

  const [formData, setFormData] = useState<CreateVillageEventInput>({
    name: '',
    description: null,
    location: '',
    event_date: new Date().toISOString().split('T')[0],
    organizer: '',
    participant_count: null,
    budget: null,
    status: 'planned',
  });

  const loadEvents = useCallback(async () => {
    try {
      const result = await trpc.getVillageEvents.query();
      setEvents(result);
      setFilteredEvents(result);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter((event: VillageEvent) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((event: VillageEvent) => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  }, [searchTerm, statusFilter, events]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Tidak ada anggaran';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return '📅 Direncanakan';
      case 'ongoing': return '🔄 Berlangsung';
      case 'completed': return '✅ Selesai';
      case 'cancelled': return '❌ Dibatalkan';
      default: return status;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingEvent) {
        const updateData: UpdateVillageEventInput = {
          id: editingEvent.id,
          ...formData
        };
        const updatedEvent = await trpc.updateVillageEvent.mutate(updateData);
        setEvents((prev: VillageEvent[]) => 
          prev.map((event: VillageEvent) => 
            event.id === editingEvent.id ? updatedEvent : event
          )
        );
      } else {
        const newEvent = await trpc.createVillageEvent.mutate(formData);
        setEvents((prev: VillageEvent[]) => [...prev, newEvent]);
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (event: VillageEvent) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      organizer: event.organizer,
      participant_count: event.participant_count,
      budget: event.budget,
      status: event.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteVillageEvent.mutate({ id });
      setEvents((prev: VillageEvent[]) => prev.filter((event: VillageEvent) => event.id !== id));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      location: '',
      event_date: new Date().toISOString().split('T')[0],
      organizer: '',
      participant_count: null,
      budget: null,
      status: 'planned',
    });
    setEditingEvent(null);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari acara berdasarkan nama, lokasi, atau penyelenggara..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: 'all' | 'planned' | 'ongoing' | 'completed' | 'cancelled') => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="planned">Direncanakan</SelectItem>
              <SelectItem value="ongoing">Berlangsung</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Acara
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? '✏️ Edit Acara' : '🎉 Tambah Acara Baru'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Acara</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateVillageEventInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masukkan nama acara"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateVillageEventInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Masukkan deskripsi acara"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVillageEventInput) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Masukkan lokasi acara"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="event_date">Tanggal Acara</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVillageEventInput) => ({ ...prev, event_date: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="organizer">Penyelenggara</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateVillageEventInput) => ({ ...prev, organizer: e.target.value }))
                  }
                  placeholder="Masukkan nama penyelenggara"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="participant_count">Jumlah Peserta (Opsional)</Label>
                  <Input
                    id="participant_count"
                    type="number"
                    value={formData.participant_count || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVillageEventInput) => ({ 
                        ...prev, 
                        participant_count: e.target.value ? parseInt(e.target.value) : null 
                      }))
                    }
                    placeholder="Jumlah peserta"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Anggaran (Opsional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVillageEventInput) => ({ 
                        ...prev, 
                        budget: e.target.value ? parseFloat(e.target.value) : null 
                      }))
                    }
                    placeholder="Anggaran dalam Rupiah"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div>
                <Label>Status Acara</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'planned' | 'ongoing' | 'completed' | 'cancelled') => 
                    setFormData((prev: CreateVillageEventInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Direncanakan</SelectItem>
                    <SelectItem value="ongoing">Berlangsung</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? 'Menyimpan...' : editingEvent ? 'Perbarui' : 'Tambah'}
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
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Total: {events.length} acara
        </Badge>
        {(searchTerm || statusFilter !== 'all') && (
          <Badge variant="outline">
            Ditemukan: {filteredEvents.length} hasil
          </Badge>
        )}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada acara'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Coba ubah kriteria pencarian atau filter'
                : 'Mulai dengan menambahkan acara pertama'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Acara Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event: VillageEvent) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {event.name}
                      </h3>
                      <Badge className={getStatusColor(event.status)}>
                        {getStatusText(event.status)}
                      </Badge>
                    </div>

                    {event.description && (
                      <p className="text-gray-600 mb-3 text-sm">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>{new Date(event.event_date).toLocaleDateString('id-ID', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>Organizer: {event.organizer}</span>
                      </div>

                      {event.participant_count && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span>{event.participant_count} peserta</span>
                        </div>
                      )}

                      {event.budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-purple-500" />
                          <span>{formatCurrency(event.budget)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400">
                      Dibuat: {event.created_at.toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(event)}
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
                          <AlertDialogTitle>Hapus Acara</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus acara <strong>{event.name}</strong>? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(event.id)}
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
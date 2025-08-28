import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Search, Calendar } from 'lucide-react';
import type { VillageFinance, CreateVillageFinanceInput, UpdateVillageFinanceInput, VillageBudget, CreateVillageBudgetInput } from '../../../server/src/schema';

interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function VillageFinanceManagement() {
  const [finances, setFinances] = useState<VillageFinance[]>([]);
  const [budgets, setBudgets] = useState<VillageBudget[]>([]);
  const [filteredFinances, setFilteredFinances] = useState<VillageFinance[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinanceDialogOpen, setIsFinanceDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<VillageFinance | null>(null);

  const [financeFormData, setFinanceFormData] = useState<CreateVillageFinanceInput>({
    type: 'income',
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [budgetFormData, setBudgetFormData] = useState<CreateVillageBudgetInput>({
    category: '',
    allocated_amount: 0,
    year: new Date().getFullYear(),
  });

  const loadData = useCallback(async () => {
    try {
      const [financesData, budgetsData, summaryData] = await Promise.all([
        trpc.getVillageFinances.query(),
        trpc.getVillageBudgets.query(),
        trpc.getFinanceSummary.query()
      ]);
      
      setFinances(financesData);
      setBudgets(budgetsData);
      setFilteredFinances(financesData);
      setFinanceSummary(summaryData);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let filtered = finances;

    if (searchTerm) {
      filtered = filtered.filter((finance: VillageFinance) =>
        finance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finance.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((finance: VillageFinance) => finance.type === typeFilter);
    }

    setFilteredFinances(filtered);
  }, [searchTerm, typeFilter, finances]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingFinance) {
        const updateData: UpdateVillageFinanceInput = {
          id: editingFinance.id,
          ...financeFormData
        };
        const updatedFinance = await trpc.updateVillageFinance.mutate(updateData);
        setFinances((prev: VillageFinance[]) => 
          prev.map((finance: VillageFinance) => 
            finance.id === editingFinance.id ? updatedFinance : finance
          )
        );
      } else {
        const newFinance = await trpc.createVillageFinance.mutate(financeFormData);
        setFinances((prev: VillageFinance[]) => [...prev, newFinance]);
      }

      // Reload summary
      const summaryData = await trpc.getFinanceSummary.query();
      setFinanceSummary(summaryData);

      resetFinanceForm();
      setIsFinanceDialogOpen(false);
    } catch (error) {
      console.error('Failed to save finance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newBudget = await trpc.createVillageBudget.mutate(budgetFormData);
      setBudgets((prev: VillageBudget[]) => [...prev, newBudget]);

      setBudgetFormData({
        category: '',
        allocated_amount: 0,
        year: new Date().getFullYear(),
      });
      setIsBudgetDialogOpen(false);
    } catch (error) {
      console.error('Failed to create budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFinance = (finance: VillageFinance) => {
    setEditingFinance(finance);
    setFinanceFormData({
      type: finance.type,
      description: finance.description,
      amount: finance.amount,
      category: finance.category,
      date: finance.date,
    });
    setIsFinanceDialogOpen(true);
  };

  const handleDeleteFinance = async (id: number) => {
    try {
      await trpc.deleteVillageFinance.mutate({ id });
      setFinances((prev: VillageFinance[]) => prev.filter((finance: VillageFinance) => finance.id !== id));
      
      // Reload summary
      const summaryData = await trpc.getFinanceSummary.query();
      setFinanceSummary(summaryData);
    } catch (error) {
      console.error('Failed to delete finance:', error);
    }
  };

  const resetFinanceForm = () => {
    setFinanceFormData({
      type: 'income',
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingFinance(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transaksi Keuangan</TabsTrigger>
          <TabsTrigger value="budget">Anggaran</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Finance Summary Cards */}
          {financeSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Pemasukan</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(financeSummary.totalIncome)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Total Pengeluaran</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(financeSummary.totalExpense)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${financeSummary.balance >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${financeSummary.balance >= 0 ? 'text-blue-100' : 'text-orange-100'} text-sm`}>
                        Saldo Kas
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(financeSummary.balance)}
                      </p>
                    </div>
                    <DollarSign className={`h-8 w-8 ${financeSummary.balance >= 0 ? 'text-blue-200' : 'text-orange-200'}`} />
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
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={(value: 'all' | 'income' | 'expense') => setTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Transaksi</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isFinanceDialogOpen} onOpenChange={setIsFinanceDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetFinanceForm}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingFinance ? '✏️ Edit Transaksi' : '💰 Tambah Transaksi Baru'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleFinanceSubmit} className="space-y-4">
                  <div>
                    <Label>Jenis Transaksi</Label>
                    <Select 
                      value={financeFormData.type} 
                      onValueChange={(value: 'income' | 'expense') => 
                        setFinanceFormData((prev: CreateVillageFinanceInput) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Pemasukan</SelectItem>
                        <SelectItem value="expense">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input
                      id="description"
                      value={financeFormData.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFinanceFormData((prev: CreateVillageFinanceInput) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Masukkan deskripsi transaksi"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Jumlah (Rp)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={financeFormData.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFinanceFormData((prev: CreateVillageFinanceInput) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="0"
                      min="1"
                      step="1000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={financeFormData.category}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFinanceFormData((prev: CreateVillageFinanceInput) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="Masukkan kategori"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={financeFormData.date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFinanceFormData((prev: CreateVillageFinanceInput) => ({ ...prev, date: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? 'Menyimpan...' : editingFinance ? 'Perbarui' : 'Tambah'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsFinanceDialogOpen(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Transactions List */}
          {filteredFinances.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || typeFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada transaksi'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Coba ubah kriteria pencarian'
                    : 'Mulai dengan menambahkan transaksi pertama'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredFinances.map((finance: VillageFinance) => (
                <Card key={finance.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge 
                            className={finance.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {finance.type === 'income' ? '⬆️ Pemasukan' : '⬇️ Pengeluaran'}
                          </Badge>
                          <span className={`text-lg font-bold ${
                            finance.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(finance.amount)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {finance.description}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📂 {finance.category}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(finance.date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditFinance(finance)}
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
                              <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus transaksi ini? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFinance(finance.id)}
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
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          {/* Budget Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Anggaran Desa</h3>
            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Anggaran
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>📊 Tambah Anggaran Baru</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="budget-category">Kategori</Label>
                    <Input
                      id="budget-category"
                      value={budgetFormData.category}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBudgetFormData((prev: CreateVillageBudgetInput) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="Masukkan kategori anggaran"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="allocated-amount">Jumlah Anggaran (Rp)</Label>
                    <Input
                      id="allocated-amount"
                      type="number"
                      value={budgetFormData.allocated_amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBudgetFormData((prev: CreateVillageBudgetInput) => ({ ...prev, allocated_amount: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="0"
                      min="1"
                      step="1000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="budget-year">Tahun</Label>
                    <Input
                      id="budget-year"
                      type="number"
                      value={budgetFormData.year}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBudgetFormData((prev: CreateVillageBudgetInput) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
                      }
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? 'Menyimpan...' : 'Tambah'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsBudgetDialogOpen(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Budget List */}
          {budgets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium mb-2">Belum ada anggaran</h3>
                <p className="text-gray-500 mb-4">
                  Mulai dengan menambahkan anggaran pertama
                </p>
                <Button 
                  onClick={() => setIsBudgetDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Anggaran Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {budgets.map((budget: VillageBudget) => (
                <Card key={budget.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {budget.category}
                          </h3>
                          <Badge variant="outline">
                            {budget.year}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Anggaran:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(budget.allocated_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Terpakai:</span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(budget.used_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sisa:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(budget.allocated_amount - budget.used_amount)}
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                budget.used_amount > budget.allocated_amount 
                                  ? 'bg-red-500' 
                                  : 'bg-blue-500'
                              }`}
                              style={{ 
                                width: `${Math.min((budget.used_amount / budget.allocated_amount) * 100, 100)}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            {((budget.used_amount / budget.allocated_amount) * 100).toFixed(1)}% terpakai
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
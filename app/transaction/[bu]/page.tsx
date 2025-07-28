"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getMachineEmoji } from "@/lib/machine-types";
import { getAllVocabulariesAction } from "@/lib/actions/vocabulary";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, User, Clock, CheckCircle, XCircle, Filter, Download, Search } from "lucide-react";
import { MachineDetailDialog } from "@/components/MachineDetailDialog";
import { convertFirebaseTimestamp, formatDateTime, formatRelativeDateTime } from "@/components/ui/date-utils";

function getInspectionStatus(record: MachineInspectionRecord): { status: 'pass' | 'fail' | 'na'; failedItems: string[] } {
  const failedItems: string[] = [];
  let passCount = 0;
  let totalItems = 0;

  // Check all inspection fields for pass/fail status
  Object.entries(record).forEach(([key, value]) => {
    if (typeof value === 'string' && !['id', 'bu', 'type', 'site', 'inspector', 'remark', 'docId'].includes(key)) {
      totalItems++;
      const normalizedValue = value.toLowerCase();
      if (normalizedValue === 'fail' || normalizedValue === 'failed' || normalizedValue === 'ng' || normalizedValue === 'no') {
        failedItems.push(key);
      } else if (normalizedValue === 'pass' || normalizedValue === 'passed' || normalizedValue === 'ok' || normalizedValue === 'yes') {
        passCount++;
      }
    }
  });

  if (failedItems.length === 0) return { status: 'pass', failedItems: [] };
  if (passCount === 0) return { status: 'fail', failedItems };
  return { status: 'na', failedItems };
}

interface TransactionItemProps {
  record: MachineInspectionRecord;
  machineTypeMapping: Record<string, string>;
  onMachineClick: (machineId: string, machineType: string) => void;
}

function TransactionItem({ record, machineTypeMapping, onMachineClick }: TransactionItemProps) {
  const { status, failedItems } = getInspectionStatus(record);
  const machineEmoji = getMachineEmoji(record.type) || "🔧";
  const displayType = machineTypeMapping[record.type] || record.type;
  
  // Handle timestamp with proper error handling
  const combinedDateTime = formatRelativeDateTime(record.timestamp);

  const StatusIcon = status === 'pass' ? CheckCircle : XCircle;
  const statusColor = status === 'pass' ? 'text-green-600' : status === 'fail' ? 'text-red-600' : 'text-yellow-600';
  const statusBg = status === 'pass' ? 'bg-green-50 border-green-200' : status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';

  return (
    <Card className={`mb-4 hover:shadow-md transition-shadow ${statusBg}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{machineEmoji}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-lg text-blue-600 hover:text-blue-800"
                  onClick={() => onMachineClick(record.id, record.type)}
                >
                  {record.id}
                </Button>
                <Badge variant="outline" className="text-xs">{displayType}</Badge>
                <StatusIcon className={`h-5 w-5 ${statusColor}`} />
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{record.inspector}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{record.site?.toUpperCase() || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{combinedDateTime}</span>
                </div>
              </div>
              
              {failedItems.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-600 font-medium mb-1">Failed Items:</p>
                  <div className="flex flex-wrap gap-1">
                    {failedItems.slice(0, 3).map((item, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {item.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Badge>
                    ))}
                    {failedItems.length > 3 && (
                      <Badge variant="destructive" className="text-xs">
                        +{failedItems.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {record.remark && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Remark:</strong> {record.remark}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <Badge 
              variant={status === 'pass' ? 'success' : status === 'fail' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TransactionPage() {
  const params = useParams();
  const bu = params.bu as string;
  
  const [transactions, setTransactions] = useState<MachineInspectionRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<MachineInspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [siteMapping, setSiteMapping] = useState<Record<string, string[]>>({});
  const [buDisplay, setBuDisplay] = useState<Record<string, { name: string; flag: string }>>({});
  const [machineTypeMapping, setMachineTypeMapping] = useState<Record<string, string>>({});
  const [vocabularyLoading, setVocabularyLoading] = useState(true);
  const [showMachineDetail, setShowMachineDetail] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedMachineType, setSelectedMachineType] = useState("");
  
  const sites = siteMapping[bu] || [];
  const buInfo = buDisplay[bu] || { name: "Unknown", flag: "🏳️" };
  
  const handleMachineClick = (machineId: string, machineType: string) => {
    setSelectedMachineId(machineId);
    setSelectedMachineType(machineType);
    setShowMachineDetail(true);
  };

  const handleMachineDetailClose = () => {
    setShowMachineDetail(false);
    setSelectedMachineId("");
    setSelectedMachineType("");
  };

  useEffect(() => {
    async function fetchVocabularies() {
      try {
        setVocabularyLoading(true);
        const result = await getAllVocabulariesAction();
        
        if (result.success && result.siteMapping && result.buDisplay) {
          setSiteMapping(result.siteMapping);
          setBuDisplay(result.buDisplay);
          if (result.machineTypeMapping) {
            setMachineTypeMapping(result.machineTypeMapping);
          }
        }
      } catch (error) {
        console.error('Error fetching vocabularies:', error);
      } finally {
        setVocabularyLoading(false);
      }
    }
    
    fetchVocabularies();
  }, []);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch(`/api/transactions?bu=${bu}&page=${page}&limit=20`);
        const data = await response.json();
        
        if (page === 1) {
          setTransactions(data.transactions);
        } else {
          setTransactions(prev => [...prev, ...data.transactions]);
        }
        
        setHasMore(data.hasMore);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [bu, page]);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.inspector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType !== "all") {
      filtered = filtered.filter(record => record.type === selectedType);
    }
    
    if (selectedSite !== "all") {
      filtered = filtered.filter(record => record.site === selectedSite);
    }
    
    if (selectedStatus !== "all") {
      filtered = filtered.filter(record => {
        const { status } = getInspectionStatus(record);
        return status === selectedStatus;
      });
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, selectedType, selectedSite, selectedStatus]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    // Prepare CSV data
    const headers = [
      'Machine ID',
      'Type',
      'Inspector',
      'Site',
      'Date',
      'Time',
      'Status',
      'Failed Items',
      'Remark'
    ];

    const csvData = filteredTransactions.map(record => {
      const { status, failedItems } = getInspectionStatus(record);
      const displayType = machineTypeMapping[record.type] || record.type;
      
      // Handle timestamp with proper error handling
      let formattedDate = "Unknown Date";
      let formattedTime = "Unknown Time";
      
      try {
        const recordDate = convertFirebaseTimestamp(record.timestamp);
        if (recordDate) {
          const dateTimeInfo = formatDateTime(recordDate);
          formattedDate = dateTimeInfo.formattedDate;
          formattedTime = dateTimeInfo.formattedTime;
        }
      } catch (error) {
        console.error("Error formatting timestamp for CSV:", error);
      }
      
      return [
        record.id || '',
        displayType,
        record.inspector || '',
        record.site?.toUpperCase() || 'Unknown',
        formattedDate,
        formattedTime,
        status.toUpperCase(),
        failedItems.join(', '),
        record.remark || ''
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
           .join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${buInfo.name}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unique machine types from transactions
  const uniqueTypes = Array.from(new Set(transactions.map(t => t.type)));

  if ((loading && page === 1) || vocabularyLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">
            {vocabularyLoading ? "Loading configuration..." : "Loading transactions..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Latest Transactions", href: "/transaction" },
          { label: buInfo.name },
        ]}
      />
      
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{buInfo.flag}</span>
          <h1 className="text-3xl font-bold">{buInfo.name} - Latest Inspection Transactions</h1>
        </div>
        <p className="text-gray-600">Recent machine inspection records and transaction history</p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by ID or inspector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Machine Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {machineTypeMapping[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger>
                <SelectValue placeholder="Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((site: string) => (
                  <SelectItem key={site} value={site}>
                    {site.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                {transactions.length === 0 ? "No transactions found" : "No transactions match your filters"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''} Found
              </h2>
            </div>
            
            {filteredTransactions.map((transaction, index) => (
              <TransactionItem 
                key={`${transaction.docId}-${index}`} 
                record={transaction} 
                machineTypeMapping={machineTypeMapping}
                onMachineClick={handleMachineClick}
              />
            ))}
            
            {hasMore && (
              <div className="text-center pt-6">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={loading}
                  className="px-8"
                >
                  {loading ? "Loading..." : "Load More Transactions"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <MachineDetailDialog
        isOpen={showMachineDetail}
        onClose={handleMachineDetailClose}
        bu={bu}
        type={selectedMachineType.charAt(0).toUpperCase() + selectedMachineType.slice(1)}
        id={selectedMachineId}
      />
    </div>
  );
}
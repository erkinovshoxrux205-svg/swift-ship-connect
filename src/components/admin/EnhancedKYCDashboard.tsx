import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Loader2, Clock, Eye, CheckCircle, XCircle, AlertCircle,
  FileText, Camera, User, Brain, Shield, RefreshCw, Ban, 
  ChevronDown, ChevronUp, ExternalLink, Copy
} from "lucide-react";
import { format } from "date-fns";

interface KYCDocument {
  id: string;
  user_id: string;
  passport_front_url: string | null;
  passport_back_url: string | null;
  selfie_url: string | null;
  video_selfie_url: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  date_of_birth: string | null;
  passport_series: string | null;
  passport_number: string | null;
  passport_country: string | null;
  passport_expiry: string | null;
  address: string | null;
  ocr_extracted_name: string | null;
  ocr_extracted_surname: string | null;
  ocr_extracted_dob: string | null;
  ocr_extracted_passport_number: string | null;
  ocr_extracted_country: string | null;
  ocr_extracted_expiry: string | null;
  ocr_confidence: number | null;
  ocr_raw_data: any;
  data_match_score: number | null;
  fraud_score: number | null;
  risk_level: string | null;
  face_match_score: number | null;
  liveness_score: number | null;
  document_authenticity_score: number | null;
  status: 'not_started' | 'pending' | 'verified' | 'rejected' | 'manual_review';
  rejection_reason: string | null;
  auto_verified: boolean | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    phone: string | null;
    email?: string | null;
  };
}

const statusConfig = {
  not_started: { label: "Not Started", icon: Clock, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  pending: { label: "Pending", icon: AlertCircle, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  verified: { label: "Verified", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  manual_review: { label: "Manual Review", icon: Eye, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

const riskColors = {
  low: "text-green-600 bg-green-100",
  medium: "text-yellow-600 bg-yellow-100",
  high: "text-red-600 bg-red-100",
};

export const EnhancedKYCDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching KYC documents:", error);
      setLoading(false);
      return;
    }

    const userIds = data?.map(d => d.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
    const enrichedDocs = data?.map(doc => ({
      ...doc,
      profile: profileMap.get(doc.user_id)
    })) || [];

    setDocuments(enrichedDocs as unknown as KYCDocument[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleStatusUpdate = async (docId: string, newStatus: KYCDocument['status'], reason?: string) => {
    setProcessing(true);
    
    const updateData: any = {
      status: newStatus,
      rejection_reason: reason || null,
      admin_notes: adminNotes || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString()
    };

    // If verified, update user profile
    if (newStatus === 'verified') {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('user_id', doc.user_id);
      }
    }

    const { error } = await supabase
      .from("kyc_documents")
      .update(updateData)
      .eq("id", docId);

    if (error) {
      toast({ title: "Error", description: "Failed to update KYC status", variant: "destructive" });
      setProcessing(false);
      return;
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action: `kyc_${newStatus}`,
      entity_type: 'kyc_document',
      entity_id: docId,
      new_data: { status: newStatus, reason }
    });

    toast({ title: "Success", description: `KYC status updated to ${statusConfig[newStatus].label}` });
    
    setSelectedDoc(null);
    setRejectionReason("");
    setAdminNotes("");
    setProcessing(false);
    fetchDocuments();
  };

  const rerunAIVerification = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc?.passport_front_url) {
      toast({ title: "Error", description: "No passport image to verify", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('kyc-ai-verify', {
        body: {
          kycDocumentId: docId,
          passportImageUrl: doc.passport_front_url,
          userInput: {
            firstName: doc.first_name,
            lastName: doc.last_name,
            dateOfBirth: doc.date_of_birth,
            passportNumber: doc.passport_number,
          },
        },
      });

      if (error) throw error;

      toast({ title: "AI Verification Complete", description: `Risk level: ${data.result.riskLevel}` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "AI verification failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const toggleRowExpand = (docId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.profile?.phone?.includes(searchQuery) ||
      doc.passport_number?.includes(searchQuery) ||
      doc.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesRisk = riskFilter === "all" || doc.risk_level === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    verified: documents.filter(d => d.status === 'verified').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
    manual_review: documents.filter(d => d.status === 'manual_review').length,
    high_risk: documents.filter(d => d.risk_level === 'high').length,
    auto_verified: documents.filter(d => d.auto_verified).length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.verified}</div>
            <div className="text-xs text-green-600">Verified</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            <div className="text-xs text-red-600">Rejected</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.manual_review}</div>
            <div className="text-xs text-blue-600">Manual</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-700">{stats.high_risk}</div>
            <div className="text-xs text-orange-600">High Risk</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.auto_verified}</div>
            <div className="text-xs text-purple-600">AI Verified</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                KYC Verification Center
              </CardTitle>
              <CardDescription>AI-powered document verification with fraud detection</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDocuments}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, passport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="manual_review">Manual Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>User / Passport Data</TableHead>
                  <TableHead>AI Analysis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const StatusIcon = statusConfig[doc.status].icon;
                  const isExpanded = expandedRows.has(doc.id);
                  
                  return (
                    <>
                      <TableRow key={doc.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleRowExpand(doc.id)}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {doc.first_name || doc.last_name 
                                  ? `${doc.last_name || ''} ${doc.first_name || ''}`.trim()
                                  : doc.profile?.full_name || "Unknown"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {doc.passport_series}{doc.passport_number || "No passport"}
                              </div>
                              <div className="text-xs text-muted-foreground">{doc.profile?.phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {doc.ocr_confidence !== null && (
                              <div className="flex items-center gap-2">
                                <Brain className="w-3 h-3 text-purple-500" />
                                <span className="text-xs">OCR: {Math.round((doc.ocr_confidence || 0) * 100)}%</span>
                              </div>
                            )}
                            {doc.data_match_score !== null && (
                              <div className="text-xs">Match: {Math.round((doc.data_match_score || 0) * 100)}%</div>
                            )}
                            {doc.fraud_score !== null && (
                              <div className="text-xs">Fraud: {doc.fraud_score}/100</div>
                            )}
                            {doc.risk_level && (
                              <Badge className={`text-xs ${riskColors[doc.risk_level as keyof typeof riskColors] || ''}`}>
                                {doc.risk_level}
                              </Badge>
                            )}
                            {doc.auto_verified && (
                              <Badge variant="outline" className="text-xs text-purple-600">
                                <Brain className="w-2 h-2 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[doc.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[doc.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(doc.created_at), "dd.MM.yy HH:mm")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => rerunAIVerification(doc.id)}
                              disabled={processing}
                            >
                              <Brain className="w-4 h-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setSelectedDoc(doc);
                                  setAdminNotes(doc.admin_notes || '');
                                }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>KYC Review - {doc.first_name} {doc.last_name}</DialogTitle>
                                  <DialogDescription>Review documents and AI analysis</DialogDescription>
                                </DialogHeader>
                                
                                <Tabs defaultValue="documents" className="mt-4">
                                  <TabsList>
                                    <TabsTrigger value="documents">Documents</TabsTrigger>
                                    <TabsTrigger value="data">User Data</TabsTrigger>
                                    <TabsTrigger value="ai">AI Analysis</TabsTrigger>
                                    <TabsTrigger value="actions">Actions</TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="documents" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      {doc.passport_front_url && (
                                        <div className="space-y-2">
                                          <Label>Passport Front</Label>
                                          <img src={doc.passport_front_url} alt="Passport" className="rounded-lg border w-full" />
                                          <Button variant="outline" size="sm" className="w-full" asChild>
                                            <a href={doc.passport_front_url} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="w-4 h-4 mr-2" />
                                              Open Full Size
                                            </a>
                                          </Button>
                                        </div>
                                      )}
                                      {doc.passport_back_url && (
                                        <div className="space-y-2">
                                          <Label>Passport Back</Label>
                                          <img src={doc.passport_back_url} alt="Passport Back" className="rounded-lg border w-full" />
                                        </div>
                                      )}
                                      {doc.selfie_url && (
                                        <div className="space-y-2">
                                          <Label>Selfie</Label>
                                          <img src={doc.selfie_url} alt="Selfie" className="rounded-lg border w-full" />
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="data" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                        <h4 className="font-medium">User Input</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="text-muted-foreground">First Name:</div>
                                          <div className="font-medium">{doc.first_name || '-'}</div>
                                          <div className="text-muted-foreground">Last Name:</div>
                                          <div className="font-medium">{doc.last_name || '-'}</div>
                                          <div className="text-muted-foreground">DOB:</div>
                                          <div className="font-medium">{doc.date_of_birth || '-'}</div>
                                          <div className="text-muted-foreground">Passport:</div>
                                          <div className="font-medium flex items-center gap-1">
                                            {doc.passport_series}{doc.passport_number || '-'}
                                            {doc.passport_number && (
                                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(doc.passport_number!)}>
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>
                                          <div className="text-muted-foreground">Country:</div>
                                          <div className="font-medium">{doc.passport_country || '-'}</div>
                                          <div className="text-muted-foreground">Expiry:</div>
                                          <div className="font-medium">{doc.passport_expiry || '-'}</div>
                                          <div className="text-muted-foreground">Address:</div>
                                          <div className="font-medium col-span-1">{doc.address || '-'}</div>
                                        </div>
                                      </div>
                                      <div className="space-y-3 p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg">
                                        <h4 className="font-medium flex items-center gap-2">
                                          <Brain className="w-4 h-4 text-purple-500" />
                                          OCR Extracted
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="text-muted-foreground">Name:</div>
                                          <div className="font-medium">{doc.ocr_extracted_name || '-'}</div>
                                          <div className="text-muted-foreground">Surname:</div>
                                          <div className="font-medium">{doc.ocr_extracted_surname || '-'}</div>
                                          <div className="text-muted-foreground">DOB:</div>
                                          <div className="font-medium">{doc.ocr_extracted_dob || '-'}</div>
                                          <div className="text-muted-foreground">Passport:</div>
                                          <div className="font-medium">{doc.ocr_extracted_passport_number || '-'}</div>
                                          <div className="text-muted-foreground">Country:</div>
                                          <div className="font-medium">{doc.ocr_extracted_country || '-'}</div>
                                          <div className="text-muted-foreground">Expiry:</div>
                                          <div className="font-medium">{doc.ocr_extracted_expiry || '-'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="ai" className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <Card>
                                        <CardContent className="p-4 text-center">
                                          <div className="text-3xl font-bold text-purple-600">
                                            {doc.ocr_confidence ? `${Math.round(doc.ocr_confidence * 100)}%` : '-'}
                                          </div>
                                          <div className="text-sm text-muted-foreground">OCR Confidence</div>
                                          {doc.ocr_confidence && <Progress value={doc.ocr_confidence * 100} className="mt-2 h-1" />}
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-4 text-center">
                                          <div className="text-3xl font-bold text-blue-600">
                                            {doc.data_match_score ? `${Math.round(doc.data_match_score * 100)}%` : '-'}
                                          </div>
                                          <div className="text-sm text-muted-foreground">Data Match</div>
                                          {doc.data_match_score && <Progress value={doc.data_match_score * 100} className="mt-2 h-1" />}
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-4 text-center">
                                          <div className={`text-3xl font-bold ${(doc.fraud_score || 0) > 50 ? 'text-red-600' : 'text-green-600'}`}>
                                            {doc.fraud_score !== null ? doc.fraud_score : '-'}
                                          </div>
                                          <div className="text-sm text-muted-foreground">Fraud Score</div>
                                          {doc.fraud_score !== null && <Progress value={doc.fraud_score} className="mt-2 h-1" />}
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-4 text-center">
                                          <Badge className={`text-lg px-4 py-1 ${riskColors[doc.risk_level as keyof typeof riskColors] || 'bg-gray-100'}`}>
                                            {doc.risk_level || 'N/A'}
                                          </Badge>
                                          <div className="text-sm text-muted-foreground mt-2">Risk Level</div>
                                        </CardContent>
                                      </Card>
                                    </div>

                                    {doc.ocr_raw_data && (
                                      <Card>
                                        <CardHeader className="py-3">
                                          <CardTitle className="text-sm">Raw OCR Data</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                                            {JSON.stringify(doc.ocr_raw_data, null, 2)}
                                          </pre>
                                        </CardContent>
                                      </Card>
                                    )}
                                  </TabsContent>

                                  <TabsContent value="actions" className="space-y-4">
                                    {doc.rejection_reason && (
                                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-sm">
                                        <span className="font-medium">Rejection Reason: </span>
                                        {doc.rejection_reason}
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <Label>Admin Notes</Label>
                                      <Textarea 
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Internal notes about this verification..."
                                        rows={3}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Rejection Reason (if rejecting)</Label>
                                      <Textarea 
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        rows={2}
                                      />
                                    </div>
                                  </TabsContent>
                                </Tabs>

                                <DialogFooter className="mt-4 flex-wrap gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleStatusUpdate(doc.id, 'rejected', rejectionReason)}
                                    disabled={processing}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleStatusUpdate(doc.id, 'manual_review')}
                                    disabled={processing}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Manual Review
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusUpdate(doc.id, 'verified')}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Approve
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded row with quick info */}
                      {isExpanded && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={6}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">DOB: </span>
                                <span className="font-medium">{doc.date_of_birth || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Country: </span>
                                <span className="font-medium">{doc.passport_country || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Expiry: </span>
                                <span className="font-medium">{doc.passport_expiry || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Address: </span>
                                <span className="font-medium">{doc.address || '-'}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {filteredDocuments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No KYC documents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
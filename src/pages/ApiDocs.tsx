import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Code,
  Book,
  Key,
  Zap,
  Shield,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Record<string, string>;
  body?: Record<string, string>;
  response?: Record<string, string> | string;
}

interface ApiDocs {
  name: string;
  version: string;
  baseUrl: string;
  authentication: {
    type: string;
    header: string;
    description: string;
  };
  rateLimit: {
    maxRequests: number;
    windowMs: number;
    description: string;
  };
  endpoints: ApiEndpoint[];
  models: Record<string, Record<string, string>>;
  errors: Record<string, string>;
}

const ApiDocs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docs, setDocs] = useState<ApiDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("partner-api", {
          body: {},
        });

        if (error) throw error;
        setDocs(data);
      } catch (error) {
        console.error("Error fetching docs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Скопировано!" });
  };

  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-yellow-100 text-yellow-700",
    DELETE: "bg-red-100 text-red-700",
  };

  const exampleCode = {
    curl: `curl -X GET "${docs?.baseUrl}/orders" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    javascript: `const response = await fetch("${docs?.baseUrl}/orders", {
  method: "GET",
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  }
});

const data = await response.json();
console.log(data.orders);`,
    python: `import requests

response = requests.get(
    "${docs?.baseUrl}/orders",
    headers={
        "x-api-key": "YOUR_API_KEY",
        "Content-Type": "application/json"
    }
)

data = response.json()
print(data["orders"])`,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка документации...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Book className="w-5 h-5" />
                Partner API Documentation
              </h1>
              <p className="text-sm text-muted-foreground">
                {docs?.version} • REST API для интеграции с CargoConnect
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Аутентификация
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  Все запросы требуют API ключ в заголовке:
                </p>
                <code className="block bg-muted p-2 rounded text-xs">
                  x-api-key: YOUR_API_KEY
                </code>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Rate Limiting
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>{docs?.rateLimit.maxRequests}</strong> запросов в минуту</p>
                <p className="text-muted-foreground text-xs">
                  Заголовки ответа содержат информацию о лимитах:
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>X-RateLimit-Limit</li>
                  <li>X-RateLimit-Remaining</li>
                  <li>X-RateLimit-Reset</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Base URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-xs break-all">{docs?.baseUrl}</code>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Quick Start */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрый старт</CardTitle>
                <CardDescription>
                  Примеры кода для начала работы с API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="curl">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  {Object.entries(exampleCode).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="relative">
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{code}</code>
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 text-slate-400 hover:text-white"
                          onClick={() => copyToClipboard(code, lang)}
                        >
                          {copiedCode === lang ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {docs?.endpoints.map((endpoint, index) => (
                    <AccordionItem key={index} value={`endpoint-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Badge className={methodColors[endpoint.method]}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm">{endpoint.path}</code>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-muted-foreground">{endpoint.description}</p>

                        {endpoint.parameters && (
                          <div>
                            <h4 className="font-medium mb-2">Параметры запроса</h4>
                            <div className="bg-muted rounded-lg p-3 space-y-2">
                              {Object.entries(endpoint.parameters).map(([key, value]) => (
                                <div key={key} className="flex gap-2 text-sm">
                                  <code className="font-medium">{key}</code>
                                  <span className="text-muted-foreground">— {value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {endpoint.body && (
                          <div>
                            <h4 className="font-medium mb-2">Тело запроса (JSON)</h4>
                            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-sm overflow-x-auto">
                              {JSON.stringify(endpoint.body, null, 2)}
                            </pre>
                          </div>
                        )}

                        {endpoint.response && (
                          <div>
                            <h4 className="font-medium mb-2">Ответ</h4>
                            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-sm overflow-x-auto">
                              {typeof endpoint.response === "string"
                                ? endpoint.response
                                : JSON.stringify(endpoint.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Models */}
            <Card>
              <CardHeader>
                <CardTitle>Модели данных</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {docs?.models && Object.entries(docs.models).map(([modelName, fields]) => (
                  <div key={modelName}>
                    <h3 className="font-medium text-lg mb-3">{modelName}</h3>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      {Object.entries(fields).map(([field, type]) => (
                        <div key={field} className="flex gap-3 text-sm">
                          <code className="font-medium min-w-[150px]">{field}</code>
                          <span className="text-muted-foreground">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Errors */}
            <Card>
              <CardHeader>
                <CardTitle>Коды ошибок</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {docs?.errors && Object.entries(docs.errors).map(([code, description]) => (
                    <div key={code} className="flex items-center gap-3 text-sm">
                      <Badge variant={code.startsWith("4") ? "destructive" : "secondary"}>
                        {code}
                      </Badge>
                      <span className="text-muted-foreground">{description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;

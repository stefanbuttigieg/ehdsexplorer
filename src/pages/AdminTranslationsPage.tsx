import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Globe, Languages, Check, X, Edit2, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useLanguages } from '@/hooks/useLanguages';
import TranslationEditor from '@/components/admin/TranslationEditor';
import TranslationStats from '@/components/admin/TranslationStats';

type ContentType = 'article' | 'recital' | 'definition' | 'annex' | 'chapter' | 'section' | 'implementing_act' | 'implementing_act_article' | 'implementing_act_recital' | 'news';

const contentTypeLabels: Record<ContentType, string> = {
  article: 'Articles',
  recital: 'Recitals',
  definition: 'Definitions',
  annex: 'Annexes',
  chapter: 'Chapters',
  section: 'Sections',
  implementing_act: 'Implementing Acts',
  implementing_act_article: 'IA Articles',
  implementing_act_recital: 'IA Recitals',
  news: 'News Summaries',
};

const AdminTranslationsPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { data: languages, isLoading: languagesLoading } = useLanguages();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('article');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

  // Set default language when languages load
  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguage) {
      // Default to first non-English active language
      const nonEnglish = languages.find(l => l.code !== 'en' && l.is_active);
      if (nonEnglish) {
        setSelectedLanguage(nonEnglish.code);
      }
    }
  }, [languages, selectedLanguage]);

  const activeLanguages = languages?.filter(l => l.is_active && l.code !== 'en') || [];

  if (loading || !user || !isEditor) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif flex items-center gap-2">
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Translation Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage translations for all content types across EU languages
            </p>
          </div>
        </div>

        {/* Language Selection */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Select Target Language
            </CardTitle>
            <CardDescription>
              Choose a language to manage translations. English is the source language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {languagesLoading ? (
                <p className="text-muted-foreground">Loading languages...</p>
              ) : activeLanguages.length === 0 ? (
                <p className="text-muted-foreground">No active languages configured. Contact an administrator.</p>
              ) : (
                activeLanguages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={selectedLanguage === lang.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className="gap-1"
                  >
                    {lang.native_name}
                    <span className="text-xs opacity-70">({lang.code.toUpperCase()})</span>
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {selectedLanguage && (
          <>
            {/* Stats Overview */}
            <TranslationStats languageCode={selectedLanguage} />

            {/* Content Type Tabs */}
            <Card className="mt-6">
              <Tabs value={selectedContentType} onValueChange={(v) => setSelectedContentType(v as ContentType)}>
                <CardHeader className="pb-0">
                  <TabsList className="flex flex-wrap h-auto gap-1 justify-start bg-transparent p-0">
                    {Object.entries(contentTypeLabels).map(([type, label]) => (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-6">
                  {Object.keys(contentTypeLabels).map((type) => (
                    <TabsContent key={type} value={type} className="mt-0">
                      <TranslationEditor
                        contentType={type as ContentType}
                        languageCode={selectedLanguage}
                      />
                    </TabsContent>
                  ))}
                </CardContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminTranslationsPage;

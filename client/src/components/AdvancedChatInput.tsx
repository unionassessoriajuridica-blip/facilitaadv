import * as React from "react";
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Loader2, 
  Bot, 
  Search, 
  Globe,
  Zap,
  Paperclip,
  Eye
} from 'lucide-react';
import { FileUpload } from './FileUpload';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

interface AdvancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, mode: 'chat' | 'agent' | 'research' | 'investigate', files: UploadedFile[]) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const AdvancedChatInput: React.FC<AdvancedChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  loading = false
}) => {
  const [mode, setMode] = useState<'chat' | 'agent' | 'research' | 'investigate'>('chat');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() && uploadedFiles.length === 0) return;
    
    onSend(value, mode, uploadedFiles);
    setUploadedFiles([]);
    setShowFileUpload(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleFileRemoved = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const modeConfig = {
    chat: {
      icon: Bot,
      label: 'Chat',
      description: 'Conversa normal com IA',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    },
    agent: {
      icon: Zap,
      label: 'Agente',
      description: 'Modo agente - análise autônoma',
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    },
    research: {
      icon: Search,
      label: 'Pesquisa',
      description: 'Busca informações na web',
      color: 'bg-green-100 text-green-800 hover:bg-green-200'
    },
    investigate: {
      icon: Eye,
      label: 'Investigar',
      description: 'Investigação detalhada com múltiplas fontes',
      color: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    }
  };

  const currentModeConfig = modeConfig[mode];
  const IconComponent = currentModeConfig.icon;

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(modeConfig).map(([modeKey, config]) => {
          const ModeIcon = config.icon;
          const isActive = mode === modeKey;
          
          return (
            <Button
              key={modeKey}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode(modeKey as typeof mode)}
              className={`${isActive ? config.color : 'hover:bg-muted'} transition-colors`}
            >
              <ModeIcon className="w-4 h-4 mr-2" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Current Mode Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconComponent className="w-4 h-4" />
        <span>{currentModeConfig.description}</span>
        {mode === 'research' && (
          <>
            <Globe className="w-4 h-4 ml-2" />
            <span>Com busca na web</span>
          </>
        )}
      </div>

      {/* File Upload Section */}
      {showFileUpload && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <FileUpload
            onFileUploaded={handleFileUploaded}
            onFileRemoved={handleFileRemoved}
            uploadedFiles={uploadedFiles}
            maxFiles={5}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            mode === 'chat' 
              ? "Digite sua pergunta jurídica..."
              : mode === 'agent'
              ? "Descreva o problema para análise autônoma..."
              : mode === 'research'
              ? "O que você gostaria de pesquisar na web?"
              : "Descreva o que você quer investigar em detalhes..."
          }
          disabled={disabled || loading}
          className="min-h-[80px] pr-24 resize-none"
          rows={3}
        />
        
        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="h-8 w-8 p-0"
            title="Anexar arquivos"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            onClick={handleSend}
            disabled={disabled || loading || (!value.trim() && uploadedFiles.length === 0)}
            size="sm"
            className="h-8"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* File Count */}
      {uploadedFiles.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {uploadedFiles.length} arquivo{uploadedFiles.length > 1 ? 's' : ''} anexado{uploadedFiles.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
};
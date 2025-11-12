import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  downloadQuizTemplate,
  uploadQuizFile,
  verifyAdminPassword,
} from "@/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticatedPassword, setAuthenticatedPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef(null);

  const handlePasswordChange = (event) => {
    const nextValue = event.target.value;
    setPassword(nextValue);
    setAuthError("");
    if (isAuthenticated) {
      setIsAuthenticated(false);
      setAuthenticatedPassword("");
    }
  };

  const handleAuthenticate = async (event) => {
    event.preventDefault();
    if (!password.trim()) {
      setAuthError("Password is required.");
      return;
    }

    setAuthenticating(true);
    setAuthError("");
    try {
      await verifyAdminPassword(password);
      setAuthenticatedPassword(password);
      setIsAuthenticated(true);
      toast.success("Access granted.");
    } catch (error) {
      const message = error?.response?.data?.error || "Password didn’t match.";
      setAuthError(message);
      toast.error("Authentication failed.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleDownload = async () => {
    if (!authenticatedPassword) return;
    setIsDownloading(true);
    try {
      const blob = await downloadQuizTemplate(authenticatedPassword);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "quiz-template.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded.");
    } catch (error) {
      const message = error?.response?.data?.error || "Could not download the template.";
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile || !authenticatedPassword) return;
    setUploading(true);
    try {
      const response = await uploadQuizFile(selectedFile, authenticatedPassword, {
        force: forceOverwrite,
      });
      setUploadMessage(response?.message || "Upload completed.");
      toast.success("Quiz file imported.");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const message = error?.response?.data?.error || "Upload failed.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle>Admin access</CardTitle>
          <CardDescription>
            This portal is protected by the password stored in your environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={handleAuthenticate}>
            <div className="space-y-1">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter admin password"
              />
              {authError && <p className="text-xs text-destructive">{authError}</p>}
            </div>
            <Button type="submit" disabled={authenticating}>
              {authenticating ? "Verifying..." : isAuthenticated ? "Re-verify" : "Unlock portal"}
            </Button>
            {isAuthenticated && (
              <p className="text-sm text-muted-foreground">Authenticated and ready.</p>
            )}
          </form>
        </CardContent>
      </Card>

      {isAuthenticated && (
        <div className="space-y-5">
          <Card className="border-border/60 bg-slate-900/40">
            <CardHeader>
              <CardTitle>Download template</CardTitle>
              <CardDescription>Grab the Excel template, fill it out, then upload it below.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                The template contains the required sheets and headers so the importer can validate it.
              </p>
              <Button onClick={handleDownload} disabled={isDownloading} size="lg">
                <Download className="mr-2 size-4" /> Download template
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-slate-900/40">
            <CardHeader>
              <CardTitle>Upload Excel</CardTitle>
              <CardDescription>Upload your completed workbook to add or update quizzes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Excel file</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-border/60 bg-input px-3 py-2 text-sm text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedFile ? selectedFile.name : "Choose a .xlsx file exported from the template."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={forceOverwrite} onCheckedChange={setForceOverwrite} />
                <span className="text-sm font-semibold">Force overwrite existing quiz slugs</span>
              </div>

              <Button
                size="lg"
                variant="outline"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
              >
                <Upload className="mr-2 size-4" /> {uploading ? "Uploading…" : "Upload Excel"}
              </Button>

              {uploadMessage && (
                <CardDescription className="text-foreground/80">{uploadMessage}</CardDescription>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
